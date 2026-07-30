import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity/writeClient'
import { getDriverStandings, getConstructorStandings } from '@/lib/f1api'
import { htmlToPortableText } from '@/lib/migration/wpToPortableText'

// Route temporanea (una tantum): sul vecchio sito WordPress (lastcorner.net)
// esistono già le bio di tutti i piloti/team F1, scritte come "descrizione"
// del tag WordPress corrispondente (es. wp-json/wp/v2/tags?slug=liam-lawson).
// Questo endpoint le recupera via REST API di WordPress, le converte in
// Portable Text (stesso formato del corpo articolo, immagini incluse) e
// crea/aggiorna il documento driverBio/teamBio in Sanity con lo stesso
// contenuto. Copre solo la F1 (F2/F3 li sta scrivendo Francesco a mano).
// Da chiamare ripetutamente (POST con offset/limit) finché "done" non è
// true, poi va rimossa dal repo.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WP_BASE = 'https://lastcorner.net/wp-json/wp/v2'
const DEFAULT_LIMIT = 4

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Rimuove il wrapper <p> attorno a un'immagine "nuda" (formato tipico delle
// descrizioni-tag WP, diverso dal wp-block-image usato nel corpo articoli),
// così htmlToPortableText la riconosce come blocco immagine invece di
// scartarla come paragrafo vuoto.
function unwrapBareImages(html: string): string {
  return html.replace(/<p[^>]*>\s*(<img[^>]*\/?>)\s*<\/p>/gi, '$1')
}

async function findTagDescription(name: string): Promise<string | null> {
  const slug = slugify(name)
  try {
    let res = await fetch(`${WP_BASE}/tags?slug=${encodeURIComponent(slug)}`)
    let list = res.ok ? await res.json() : []
    if (!Array.isArray(list) || list.length === 0) {
      res = await fetch(`${WP_BASE}/tags?search=${encodeURIComponent(name)}&per_page=5`)
      list = res.ok ? await res.json() : []
    }
    const match = Array.isArray(list) ? list.find((t: { description?: string }) => t.description?.trim()) : null
    return match?.description ?? null
  } catch {
    return null
  }
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

interface Item {
  kind: 'driver' | 'team'
  id: string
  name: string
}

export async function POST(req: Request) {
  let body: { only?: 'drivers' | 'teams'; offset?: number; limit?: number } = {}
  try {
    body = await req.json()
  } catch {
    // nessun body: default
  }
  const offset = body.offset ?? 0
  const limit = Math.min(body.limit ?? DEFAULT_LIMIT, 10)

  const [drivers, constructors] = await Promise.all([getDriverStandings(), getConstructorStandings()])

  const allItems: Item[] = [
    ...drivers.map((d) => ({ kind: 'driver' as const, id: d.Driver.driverId, name: `${d.Driver.givenName} ${d.Driver.familyName}` })),
    ...constructors.map((c) => ({ kind: 'team' as const, id: c.Constructor.constructorId, name: c.Constructor.name })),
  ]

  const items = body.only
    ? allItems.filter((i) => (body.only === 'drivers' ? i.kind === 'driver' : i.kind === 'team'))
    : allItems

  const batch = items.slice(offset, offset + limit)
  const results: { id: string; name: string; status: string; blocks?: number }[] = []

  for (const item of batch) {
    const html = await findTagDescription(item.name)
    if (!html) {
      results.push({ id: item.id, name: item.name, status: 'tag-non-trovato' })
      continue
    }
    const blocks = await htmlToPortableText(unwrapBareImages(html), uploadImage, item.id)
    if (item.kind === 'driver') {
      await sanityWriteClient.createOrReplace({
        _id: `driverBio-${item.id}`,
        _type: 'driverBio',
        driverId: item.id,
        fullName: item.name,
        bio: blocks,
      })
    } else {
      await sanityWriteClient.createOrReplace({
        _id: `teamBio-${item.id}`,
        _type: 'teamBio',
        constructorId: item.id,
        name: item.name,
        bio: blocks,
      })
    }
    results.push({ id: item.id, name: item.name, status: 'ok', blocks: blocks.length })
  }

  const nextOffset = offset + batch.length
  const done = nextOffset >= items.length

  return NextResponse.json({ total: items.length, processed: results.length, nextOffset, done, results })
}
