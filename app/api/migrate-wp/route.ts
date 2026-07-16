import { NextRequest, NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity/writeClient'
import { htmlToPortableText } from '@/lib/migration/wpToPortableText'

// Route temporanea di migrazione WordPress -> Sanity. Protetta da
// MIGRATION_SECRET (env Vercel): senza il secret corretto risponde 401.
// Processa un batch alla volta (parametri offset/limit) per restare sotto
// i limiti di durata delle funzioni serverless; va richiamata ripetutamente
// aumentando offset finche' la risposta non riporta "done": true.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WP_BASE = 'https://lastcorner.net/wp-json/wp/v2'
const AFTER = '2025-12-31T23:59:59'
const DEFAULT_LIMIT = 3
const MAX_LIMIT = 8

// Mappa: ID categoria WordPress -> etichetta categoria del sito nuovo
// (deve corrispondere esattamente a CATEGORY_OPTIONS in sanity/schemaTypes/article.ts)
const CATEGORY_MAP: Record<number, string> = {
  1: 'Altro', // Altro
  153: 'Formula 1', // Analisi Tecniche
  195: 'WRC', // Analisi Tecniche WRC
  191: 'Formula 1', // Editoriali
  193: 'WRC', // Editoriali WRC
  35: 'Altro', // F1 Academy (nessuna categoria dedicata sul nuovo sito)
  7: 'Formula 1',
  8: 'Formula 2',
  9: 'Formula 3',
  192: 'Altro', // Formula E
  154: 'Formula 1', // Guide ed Approfondimenti
  197: 'WRC', // Guide ed Approfondimenti WRC
  159: 'Formula 3', // News (Formula 3)
  198: 'Altro', // News Formula E
  156: 'Formula 1', // News
  194: 'WRC', // News WRC
  162: 'Altro', // News F1 Academy
  158: 'Formula 2', // News Formula 2
  196: 'WRC', // Rubriche WRC
  160: 'Formula 3', // Rubriche Formula 3
  155: 'Formula 1', // Rubriche
  161: 'Altro', // Rubriche F1 Academy
  157: 'Formula 2', // Rubriche Formula 2
  166: 'WRC', // WRC
}

function resolveCategory(catIds: number[] = []): string {
  for (const id of catIds) {
    if (CATEGORY_MAP[id]) return CATEGORY_MAP[id]
  }
  return 'Altro'
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

async function uploadImage(url: string, filename: string): Promise<{ _id: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const asset = await sanityWriteClient.assets.upload('image', buffer, { filename, contentType })
    return asset
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (!process.env.MIGRATION_SECRET || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const offset = Math.max(0, Number(searchParams.get('offset') ?? '0') || 0)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT))

  const wpUrl = `${WP_BASE}/posts?after=${AFTER}&order=asc&orderby=date&per_page=${limit}&offset=${offset}&_embed=1&status=publish`

  let posts: any[]
  try {
    const wpRes = await fetch(wpUrl, { cache: 'no-store' })
    if (!wpRes.ok) {
      return NextResponse.json({ error: `WordPress fetch fallita: ${wpRes.status}` }, { status: 502 })
    }
    posts = await wpRes.json()
  } catch (err: any) {
    return NextResponse.json({ error: `WordPress non raggiungibile: ${err?.message ?? err}` }, { status: 502 })
  }

  const results: any[] = []

  for (const post of posts) {
    const slug: string = post.slug
    try {
      const existingId = await sanityWriteClient.fetch<string | null>(
        `*[_type == "article" && slug.current == $slug][0]._id`,
        { slug }
      )
      if (existingId) {
        results.push({ slug, status: 'skipped-exists', id: existingId })
        continue
      }

      const title = decodeEntities(stripHtml(post.title?.rendered ?? '')).trim() || slug
      const category = resolveCategory(post.categories)
      const authorName: string = post._embedded?.author?.[0]?.name?.trim() || 'Redazione'
      const excerpt = decodeEntities(stripHtml(post.excerpt?.rendered ?? '')).slice(0, 300)

      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
      const featuredUrl: string | undefined =
        featuredMedia?.media_details?.sizes?.large?.source_url ||
        featuredMedia?.media_details?.sizes?.medium_large?.source_url ||
        featuredMedia?.source_url

      const body = await htmlToPortableText(post.content?.rendered ?? '', uploadImage, slug)

      let mainImageAsset: { _id: string } | null = null
      if (featuredUrl) {
        mainImageAsset = await uploadImage(featuredUrl, `${slug}-main.jpg`)
      }
      // Se non c'e' immagine in evidenza, riusa la prima immagine trovata nel corpo
      if (!mainImageAsset) {
        const firstBodyImage = body.find((b) => b._type === 'image')
        if (firstBodyImage) {
          mainImageAsset = { _id: firstBodyImage.asset._ref }
        }
      }

      if (!mainImageAsset) {
        results.push({ slug, status: 'skipped-no-image' })
        continue
      }

      const doc = {
        _type: 'article',
        title,
        slug: { _type: 'slug', current: slug },
        category,
        author: authorName,
        publishedAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
        mainImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: mainImageAsset._id },
          alt: featuredMedia?.alt_text || title,
        },
        excerpt,
        breaking: false,
        tags: [] as string[],
        body,
      }

      const created = await sanityWriteClient.create(doc)
      results.push({ slug, status: 'created', id: created._id, category })
    } catch (err: any) {
      results.push({ slug, status: 'error', message: err?.message ?? String(err) })
    }
  }

  return NextResponse.json({
    offset,
    limit,
    fetched: posts.length,
    done: posts.length < limit,
    results,
  })
}
