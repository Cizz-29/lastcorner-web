import type { MetadataRoute } from 'next'

const SITE_URL = 'https://lastcorner.net'

// Crawler che scaricano il sito per addestrare modelli di IA. Non portano
// un solo lettore e, su un sito appena pubblicato, generano da soli una
// quota enorme di traffico: ogni pagina scaricata con tutte le immagini
// pesa sulla banda inclusa nel piano. Google-Extended e Applebot-Extended
// riguardano SOLO l'uso per l'addestramento: bloccarli non toglie nulla
// alla presenza su Google o su Safari.
const BOT_IA = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
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

// Percorsi che non hanno senso nell'indice: il CMS, l'area telemetria
// riservata e le route tecniche.
const PERCORSI_PRIVATI = ['/studio', '/telemetria', '/api/']

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
