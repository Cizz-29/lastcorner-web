import type { MetadataRoute } from 'next'

const SITE_URL = 'https://lastcorner.net'

// Crawler che scaricano il sito per addestrare modelli di IA. Non portano
// un solo lettore e, su un sito appena pubblicato, generano da soli una
// quota enorme di traffico: ogni pagina scaricata con tutte le immagini
// pesa sulla banda inclusa nel piano. Google-Extended e Applebot-Extended
// riguardano SOLO l'uso per l'addestramento: bloccarli non toglie nulla
// alla presenza su Google o su Safari.
//
// NON stanno in questa lista, di proposito, i bot con cui gli assistenti
// cercano le pagine da citare nelle risposte: OAI-SearchBot e ChatGPT-User
// (ChatGPT), PerplexityBot, Claude-Web. Non addestrano niente: leggono una
// pagina quando qualcuno fa una domanda e la citano con il link. Bloccarli
// toglieva il sito dalle fonti di quelle ricerche (decisione di Francesco,
// 28 settembre 2026).
const BOT_IA = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'Meta-ExternalAgent',
  'FacebookBot',
  'cohere-ai',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'YouBot',
  'Timpibot',
]

// Crawler commerciali di analisi SEO: servono ai loro clienti per spiare i
// concorrenti, a noi solo a consumare banda. Nessun effetto sul
// posizionamento reale.
const BOT_SEO = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'DataForSeoBot',
  'BLEXBot',
  'Barkrowler',
  'PetalBot',
  'SeekportBot',
  'serpstatbot',
  'ZoominfoBot',
  'magpie-crawler',
]

// Percorsi che non hanno senso nell'indice: il CMS e le route tecniche.
// La telemetria non c'e' piu': dal 1° ottobre 2026 e' una sezione pubblica e
// deve farsi trovare.
// /cerca e' esclusa per una ragione di costo, non di riservatezza: legge i
// parametri dell'URL, quindi e' dinamica per costruzione e ogni visita
// scarica l'elenco completo degli articoli. Il middleware ci manda i vecchi
// /tag/ non mappati, e senza questa riga ogni crawler che passa su un vecchio
// tag finisce dritto nella pagina piu' costosa del sito.
const PERCORSI_PRIVATI = ['/studio', '/api/', '/cerca']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Tutti gli altri — Google, Bing, e i bot delle anteprime social
        // (WhatsApp, Telegram, X, Facebook, LinkedIn) — restano liberi.
        userAgent: '*',
        allow: '/',
        disallow: PERCORSI_PRIVATI,
      },
      {
        userAgent: [...BOT_IA, ...BOT_SEO],
        disallow: '/',
      },
    ],
    // Due sitemap: quella normale con tutto il sito, e quella news con i
    // soli articoli delle ultime 48 ore, che Googlebot News ricontrolla
    // molto piu' spesso (vedi app/news-sitemap.xml/route.ts).
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  }
}
