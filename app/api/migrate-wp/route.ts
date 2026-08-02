import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { sanityWriteClient } from '@/lib/sanity/writeClient'
import { htmlToPortableText } from '@/lib/migration/wpToPortableText'
import { TAG_REDIRECTS } from '@/lib/tagRedirects'

// Route temporanea: importa da WordPress gli articoli pubblicati dopo
// l'ultima migrazione. Va chiamata ripetutamente (POST) finché "restanti"
// non è 0, poi rimossa dal repo.
//
// L'indirizzo di WordPress si passa nel corpo della richiesta ("wpBase"),
// perché il dominio ora punta al nuovo sito e il vecchio è raggiungibile
// solo tramite l'anteprima di Hostinger.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_BATCH = 5

// Categoria WordPress -> categoria del sito.
const CATEGORY_MAP: Record<string, string> = {
  'formula-1': 'Formula 1',
  'formula-2': 'Formula 2',
  'formula-3': 'Formula 3',
  'f1-academy': 'F1 Academy',
  wrc: 'WRC',
  'formula-e': 'Altro',
  altro: 'Altro',
}

const SUBCATEGORIES = new Set([
  'news',
  'editoriali',
  'analisi-tecnica',
  'guide-approfondimenti',
  'rubriche',
  'classifiche',
])
// Fuori da F1 e WRC lo schema ammette solo queste due (vedi article.ts).
const CATEGORIES_FULL = new Set(['Formula 1', 'WRC'])

// Dal tag WordPress all'identificativo pilota/team usato dal sito: si
// riusa la mappa dei reindirizzamenti, prendendo l'ultimo segmento del
// percorso (es. "/formula-1/piloti/leclerc" -> "leclerc").
function tagToId(slug: string): string | null {
  const dest = TAG_REDIRECTS[slug.toLowerCase()]
  if (!dest) return null
  if (!dest.includes('/piloti/') && !dest.includes('/team/')) return null
  return dest.split('/').pop() ?? null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .trim()
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '))
}

async function wpGet(base: string, path: string): Promise<any> {
  const res = await fetch(`${base}/wp-json/wp/v2/${path}`, {
    headers: { 'user-agent': 'LastcornerMigration/1.0' },
  })
  if (!res.ok) throw new Error(`WordPress ${path}: HTTP ${res.status}`)
  return res.json()
}

async function uploadImage(url: string, filename: string): Promise<{ _id: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return await sanityWriteClient.assets.upload('image', buffer, { filename })
  } catch {
    return null
  }
}

export async function GET() {
  const ultimo = await sanityClient.fetch<string | null>(
    `*[_type == "article"]|order(publishedAt desc)[0].publishedAt`
  )
  const totale = await sanityClient.fetch<number>(`count(*[_type == "article"])`)
  return NextResponse.json({ articoliInSanity: totale, ultimoPubblicato: ultimo })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    wpBase?: string
    after?: string
    batchSize?: number
  }

  const wpBase = (body.wpBase ?? '').replace(/\/+$/, '')
  if (!wpBase) {
    return NextResponse.json(
      { error: 'Manca "wpBase": indirizzo del vecchio sito WordPress.' },
      { status: 400 }
    )
  }
  const batchSize = Math.min(body.batchSize ?? DEFAULT_BATCH, 10)

  // Da dove riprendere: l'articolo più recente già presente in Sanity.
  const after =
    body.after ??
    (await sanityClient.fetch<string | null>(
      `*[_type == "article"]|order(publishedAt desc)[0].publishedAt`
    )) ??
    '2026-01-01T00:00:00'

  // Anagrafiche WordPress (una volta per chiamata).
  const [categorie, autori] = await Promise.all([
    wpGet(wpBase, 'categories?per_page=100').catch(() => []),
    wpGet(wpBase, 'users?per_page=100').catch(() => []),
  ])
  const catById = new Map<number, string>(
    (categorie as any[]).map((c) => [c.id, String(c.slug)])
  )
  const autoreById = new Map<number, string>(
    (autori as any[]).map((u) => [u.id, String(u.name)])
  )

  // I più vecchi per primi, così la ripresa è sempre coerente.
  const posts: any[] = await wpGet(
    wpBase,
    `posts?per_page=${batchSize}&order=asc&orderby=date&after=${encodeURIComponent(after)}`
  )

  const risultati: { slug: string; esito: string }[] = []

  for (const post of posts) {
    const slug: string = post.slug
    try {
      const esistente = await sanityClient.fetch<string | null>(
        `*[_type == "article" && slug.current == $slug][0]._id`,
        { slug }
      )
      if (esistente) {
        risultati.push({ slug, esito: 'già presente' })
        continue
      }

      const slugCategorie = (post.categories ?? []).map((id: number) => catById.get(id) ?? '')
      const categoria =
        slugCategorie.map((s: string) => CATEGORY_MAP[s]).find(Boolean) ?? 'Altro'
      const sottoTrovata = slugCategorie.find((s: string) => SUBCATEGORIES.has(s))
      const sottocategoria =
        sottoTrovata && (CATEGORIES_FULL.has(categoria) || sottoTrovata === 'news' || sottoTrovata === 'rubriche')
          ? sottoTrovata
          : 'news'

      // Tag: dai tag WordPress si tengono solo quelli riconducibili a un
      // pilota o a un team, che è ciò che il sito usa per le news correlate.
      const tagSlugs: string[] = (post.class_list ?? [])
        .filter((c: string) => c.startsWith('tag-'))
        .map((c: string) => c.slice(4))
      const tags = [...new Set(tagSlugs.map(tagToId).filter((t): t is string => !!t))]

      // Immagine principale.
      let mainImage: any = undefined
      const imgUrl: string | undefined = post.jetpack_featured_media_url
      if (imgUrl) {
        const asset = await uploadImage(imgUrl, `${slug}-cover.jpg`)
        if (asset) {
          mainImage = {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
            alt: decodeEntities(post.title?.rendered ?? ''),
          }
        }
      }
      if (!mainImage) {
        risultati.push({ slug, esito: 'saltato: immagine non recuperabile' })
        continue
      }

      const body = await htmlToPortableText(
        post.content?.rendered ?? '',
        uploadImage,
        slug
      )

      await sanityWriteClient.create({
        _type: 'article',
        title: decodeEntities(post.title?.rendered ?? slug),
        slug: { _type: 'slug', current: slug },
        category: categoria,
        subcategory: sottocategoria,
        author: autoreById.get(post.author) ?? 'Francesco Di Blasi',
        publishedAt: new Date(post.date_gmt + 'Z').toISOString(),
        excerpt: stripTags(post.excerpt?.rendered ?? '').slice(0, 300) || undefined,
        breaking: false,
        tags: tags.length ? tags : undefined,
        body,
      })
      risultati.push({ slug, esito: 'importato' })
    } catch (err) {
      risultati.push({ slug, esito: `errore: ${(err as Error).message}` })
    }
  }

  const nuovoUltimo = await sanityClient.fetch<string | null>(
    `*[_type == "article"]|order(publishedAt desc)[0].publishedAt`
  )

  return NextResponse.json({
    elaborati: risultati.length,
    completato: posts.length < batchSize,
    ultimoPubblicato: nuovoUltimo,
    risultati,
  })
}
