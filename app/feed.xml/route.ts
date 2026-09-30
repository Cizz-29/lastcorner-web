import { getAllArticles } from '@/lib/sanity/articles'

// Feed RSS degli ultimi articoli.
//
// Il sito WordPress ne aveva uno su /feed, e con la migrazione era sparito:
// /feed e /rss.xml rispondevano 404. Il feed serve agli aggregatori, ai
// lettori RSS di chi seguiva gia' il sito e alla funzione "Segui" di Chrome,
// che lo usa per proporre i pezzi nuovi. /feed e /rss.xml rimandano qui con
// un redirect permanente (next.config.js), e ogni pagina lo annuncia nel
// suo <head> (lib/seo.ts).
//
// Si aggiorna quando si pubblica (il webhook di Sanity invalida /feed.xml) e,
// al massimo, una volta l'ora: stessa logica della sitemap news.
export const revalidate = 3600

const SITO = 'https://lastcorner.net'
const QUANTI = 40

/** & < > ' " spezzerebbero l'XML. */
function xml(testo: string): string {
  return testo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Data nel formato che RSS richiede (RFC 822). */
function dataRss(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d.toUTCString()
}

export async function GET() {
  const articoli = (await getAllArticles()).slice(0, QUANTI)

  const voci = articoli
    .map((a) => {
      const link = `${SITO}/${a.slug}`
      const data = dataRss(a.publishedAt)
      return [
        '    <item>',
        `      <title>${xml(a.title)}</title>`,
        `      <link>${xml(link)}</link>`,
        `      <guid isPermaLink="true">${xml(link)}</guid>`,
        data ? `      <pubDate>${data}</pubDate>` : '',
        a.author ? `      <dc:creator>${xml(a.author)}</dc:creator>` : '',
        a.category ? `      <category>${xml(a.category)}</category>` : '',
        a.excerpt ? `      <description>${xml(a.excerpt)}</description>` : '',
        a.imageUrl
          ? `      <media:content url="${xml(a.imageUrl)}" medium="image" width="1200" height="675" />`
          : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const ultimo = dataRss(articoli[0]?.publishedAt) ?? new Date().toUTCString()

  const corpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Lastcorner</title>
    <link>${SITO}</link>
    <description>Notizie di Formula 1 e motorsport: risultati, mercato piloti, analisi tecniche e approfondimenti.</description>
    <language>it-IT</language>
    <lastBuildDate>${ultimo}</lastBuildDate>
    <atom:link href="${SITO}/feed.xml" rel="self" type="application/rss+xml" />
${voci}
  </channel>
</rss>
`

  return new Response(corpo, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
