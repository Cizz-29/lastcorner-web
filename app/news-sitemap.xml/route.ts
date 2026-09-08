import { getAllArticles } from '@/lib/sanity/articles'

// Sitemap per Google News: solo gli articoli delle ultime 48 ore.
//
// La sitemap normale (app/sitemap.ts) elenca 693 URL e serve a farsi
// trovare; questa serve a farsi trovare IN FRETTA. Googlebot News la
// ricontrolla spesso proprio perche' sa che contiene poche voci e tutte
// recenti, e senza di lei un pezzo pubblicato di mattina puo' essere
// scoperto quando la notizia non interessa piu' a nessuno. Sugli orari TV
// di un weekend di gara la differenza fra "scoperto il mercoledi'" e
// "scoperto il sabato" e' tutta la ricerca utile.
//
// Le regole sono di Google e sono strette: massimo 1.000 voci, e SOLO
// articoli degli ultimi due giorni. Tenere dentro roba vecchia non e' un
// dettaglio di stile — e' il modo per farsi ignorare la sitemap.
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap

const SITO = 'https://lastcorner.net'
const NOME_TESTATA = 'Lastcorner'
const LINGUA = 'it'
const FINESTRA_ORE = 48
const MASSIMO = 1000

// Due meccanismi, e servono entrambi.
//
// Il webhook di Sanity rifa' questo percorso appena si pubblica un articolo
// (app/api/revalidate/route.ts): e' cosi' che la sitemap e' aggiornata in
// pochi secondi, quando conta.
//
// Ma la finestra delle 48 ore si calcola nel momento in cui la sitemap viene
// generata, non nel momento in cui Google la legge. Con il solo webhook, due
// giorni senza pubblicare basterebbero a lasciarci dentro articoli ormai
// vecchi — proprio la cosa che Google dice di non fare, e il modo per farsi
// ignorare la sitemap. L'ora di scadenza e' quindi un pavimento: garantisce
// che la finestra non invecchi mai di piu' di un'ora anche in agosto.
//
// Costo: al massimo 24 rigenerazioni al giorno. La home, quando aveva
// revalidate = 60, ne faceva 1.440 ed era la voce principale del consumo.
export const revalidate = 3600

/** & < > ' " nei titoli spezzerebbero l'XML. */
function xml(testo: string): string {
  return testo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const articoli = await getAllArticles()
  const limite = Date.now() - FINESTRA_ORE * 60 * 60 * 1000

  const recenti = articoli
    .filter((a) => {
      if (!a.publishedAt) return false
      const quando = Date.parse(a.publishedAt)
      return Number.isFinite(quando) && quando >= limite
    })
    .slice(0, MASSIMO)

  const voci = recenti
    .map(
      (a) => `  <url>
    <loc>${xml(`${SITO}/${a.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${NOME_TESTATA}</news:name>
        <news:language>${LINGUA}</news:language>
      </news:publication>
      <news:publication_date>${xml(a.publishedAt as string)}</news:publication_date>
      <news:title>${xml(a.title)}</news:title>
    </news:news>
  </url>`
    )
    .join('\n')

  const corpo = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${voci}
</urlset>
`

  return new Response(corpo, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // La freschezza la garantisce il webhook, non la scadenza: qui si
      // chiede solo di non farla incartare nelle cache intermedie.
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
