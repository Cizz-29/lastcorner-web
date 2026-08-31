import { NextRequest, NextResponse } from 'next/server'
import { tagRedirectFor } from '@/lib/tagRedirects'
import { COMING_SOON_HTML, isComingSoonExempt } from '@/lib/comingSoon'
import { CATEGORIES } from '@/lib/categories'
import { PAGINE_MASSIME, SOTTOCATEGORIE_PAGINABILI, percorsoPagina } from '@/lib/paginazione'

// Redirect 301 dal vecchio sito WordPress (URL piatti, senza categoria)
// alla nuova struttura /{categoria}/{slug}. Copre anche i vecchi URL di
// sotto-categoria (es. /formula-1/news/) e un paio di pagine statiche che
// su WordPress vivevano con URL diversi.
//
// Il sito nuovo ha queste route "note": se il primo segmento del path è
// uno di questi, la richiesta prosegue normale (non è un vecchio URL da
// migrare). Tutto il resto, se è un singolo segmento, viene cercato come
// slug articolo su Sanity: se trovato si fa redirect alla nuova posizione,
// altrimenti si lascia proseguire (finirà nel normale 404).
const KNOWN_TOP_LEVEL = new Set([
  'formula-1', 'formula-2', 'formula-3', 'f1-academy', 'wrc', 'altro',
  'chi-siamo', 'contatti', 'privacy', 'cookie', 'note-legali', 'autori',
  'cerca', 'telemetria', 'telemetria-data',
  'studio', 'api', 'images', 'sitemap.xml', 'robots.txt', '_next', 'favicon.ico',
  'ads.txt', 'fonts',
])

// Nota: qui c'era il controllo password per /telemetria e /grafiche, con un
// calcolo SHA-256 a ogni richiesta protetta. Quegli strumenti ora girano solo
// sul PC (vedi lib/strumenti.ts) e online rispondono 404, quindi non c'e' piu'
// niente da proteggere.

// Vecchia sotto-categoria "news" del vecchio sito: sul nuovo sito non ha una
// pagina dedicata (la pagina categoria principale già mostra tutte le news),
// quindi si rimanda lì. Le altre sotto-categorie (editoriali, analisi-tecnica,
// guide-approfondimenti, rubriche) hanno invece ORA una pagina dedicata vera
// e propria (vedi app/[category]/{slug}/page.tsx + lib/subcategories.ts),
// quindi NON vanno più intercettate qui: si lascia che Next.js le risolva
// normalmente.
const OLD_SUBCATEGORY_SLUGS = new Set(['news'])

// "Formula E" esisteva sul vecchio sito ma non è stata portata sul nuovo
// (decisione esplicita): chi arriva da un vecchio link va in "Altro"
// invece che su un 404 secco.
const OLD_CATEGORY_TO_NEW: Record<string, string> = {
  'formula-e': 'altro',
}

const STATIC_PAGE_REDIRECTS: Record<string, string> = {
  '/termini-e-condizioni-di-utilizzo': '/note-legali',
  '/privacy-policy': '/privacy',
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'tg4ypg7t'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

async function findArticleCategorySlug(slug: string): Promise<string | null> {
  const query = encodeURIComponent(
    `*[_type == "article" && slug.current == $slug][0].category`
  )
  const slugParam = encodeURIComponent(JSON.stringify(slug))
  const url = `https://${projectId}.apicdn.sanity.io/v2023-01-01/data/query/${dataset}?query=${query}&$slug=${slugParam}`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const label: string | undefined = data?.result
    if (!label) return null
    const map: Record<string, string> = {
      'Formula 1': 'formula-1',
      'Formula 2': 'formula-2',
      'Formula 3': 'formula-3',
      'F1 Academy': 'f1-academy',
      'WRC': 'wrc',
      'Altro': 'altro',
    }
    return map[label] ?? 'altro'
  } catch {
    return null
  }
}

const ANTEPRIMA_COOKIE = 'lc-anteprima'

// Modalità "prossimamente": con SITE_COMING_SOON=true il pubblico vede solo
// la pagina di attesa. Chi ha la chiave (?anteprima=<ANTEPRIMA_KEY>) riceve
// un cookie e continua a navigare il sito normalmente, per poter rivedere
// tutto prima dell'annuncio.
function comingSoonGate(req: NextRequest, pathname: string): NextResponse | null {
  if (process.env.SITE_COMING_SOON !== 'true') return null
  if (isComingSoonExempt(pathname)) return null

  const chiave = process.env.ANTEPRIMA_KEY
  const richiesta = req.nextUrl.searchParams.get('anteprima')

  // Chiave corretta nell'URL: si sblocca questo browser e si prosegue.
  if (chiave && richiesta === chiave) {
    const url = req.nextUrl.clone()
    url.searchParams.delete('anteprima')
    const res = NextResponse.redirect(url)
    res.cookies.set(ANTEPRIMA_COOKIE, chiave, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  }

  if (chiave && req.cookies.get(ANTEPRIMA_COOKIE)?.value === chiave) return null

  return new NextResponse(COMING_SOON_HTML, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'retry-after': '86400',
      'cache-control': 'no-store',
    },
  })
}

const SLUG_CATEGORIE = new Set(CATEGORIES.map((c) => c.slug))

// La paginazione stava nei parametri (/formula-1?page=2) ed e' passata nel
// percorso (/formula-1/page/2). Qui si riconoscono gli indirizzi che avevano
// quel parametro, per mandarli alla forma nuova con un redirect permanente:
// link salvati, condivisi o gia' indicizzati continuano a funzionare.
//
// Il controllo e' stretto di proposito: solo le tre forme che la paginazione
// l'avevano davvero. Un ?page= su un articolo non e' un elenco, e mandarlo a
// /{categoria}/{slug}/page/2 produrrebbe un 404 al posto della pagina giusta.
function elencoPaginabile(segments: string[]): boolean {
  const [primo, secondo] = segments
  if (segments.length === 1) return SLUG_CATEGORIE.has(primo)
  if (segments.length === 2) {
    if (primo === 'autori') return true
    return SLUG_CATEGORIE.has(primo) && SOTTOCATEGORIE_PAGINABILI.includes(secondo)
  }
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  const attesa = comingSoonGate(req, pathname)
  if (attesa) return attesa

  // Vecchie pagine con query string (?page_id=...)
  const pageId = searchParams.get('page_id')
  if (pageId === '149') return NextResponse.redirect(new URL('/cookie', req.url), 301)
  if (pageId === '153') return NextResponse.redirect(new URL('/contatti', req.url), 301)

  if (pathname === '/' || pathname === '') return NextResponse.next()

  const clean = pathname.replace(/\/+$/, '') // via slash finale
  if (STATIC_PAGE_REDIRECTS[clean]) {
    return NextResponse.redirect(new URL(STATIC_PAGE_REDIRECTS[clean], req.url), 301)
  }

  const segments = clean.split('/').filter(Boolean)
  if (segments.length === 0) return NextResponse.next()

  const [first, second] = segments

  // Vecchia paginazione nei parametri -> nuova paginazione nel percorso.
  const paginaRichiesta = searchParams.get('page')
  if (paginaRichiesta !== null && elencoPaginabile(segments)) {
    const n = Number(paginaRichiesta)
    const destinazione =
      Number.isInteger(n) && n >= 2 ? percorsoPagina(clean, Math.min(n, PAGINE_MASSIME)) : clean
    return NextResponse.redirect(new URL(destinazione, req.url), 301)
  }

  // Vecchie pagine tag di WordPress (/tag/lewis-hamilton): ospitavano le
  // biografie ed erano indicizzate. Si mandano alla scheda corrispondente
  // sul nuovo sito; se il tag non è mappato si ripiega sulla ricerca
  // interna, che resta un approdo sensato invece di un 404.
  if (first === 'tag' && second) {
    const destinazione = tagRedirectFor(second)
    if (destinazione) {
      return NextResponse.redirect(new URL(destinazione, req.url), 301)
    }
    const termine = decodeURIComponent(second).replace(/-/g, ' ')
    return NextResponse.redirect(
      new URL(`/cerca?q=${encodeURIComponent(termine)}`, req.url),
      302
    )
  }

  // Vecchia categoria non più esistente (formula-e) -> mappata alla nuova
  if (OLD_CATEGORY_TO_NEW[first]) {
    return NextResponse.redirect(new URL(`/${OLD_CATEGORY_TO_NEW[first]}`, req.url), 301)
  }

  // Vecchia sotto-categoria (es. /formula-1/news) -> pagina categoria principale
  if (segments.length === 2 && KNOWN_TOP_LEVEL.has(first) && OLD_SUBCATEGORY_SLUGS.has(second)) {
    return NextResponse.redirect(new URL(`/${first}`, req.url), 301)
  }

  // Path a un solo segmento e non riconosciuto: probabile vecchio URL
  // articolo piatto di WordPress. Si cerca lo slug su Sanity.
  if (segments.length === 1 && !KNOWN_TOP_LEVEL.has(first)) {
    const categorySlug = await findArticleCategorySlug(first)
    if (categorySlug) {
      return NextResponse.redirect(new URL(`/${categorySlug}/${first}`, req.url), 301)
    }
  }

  return NextResponse.next()
}

// Su quali indirizzi far girare il middleware.
//
// Prima l'elenco escludeva solo tre cose, quindi il middleware — con dentro
// i redirect WordPress, il controllo password e un calcolo di hash — girava
// anche sui font, su icon.png, su robots.txt e sugli altri file statici, che
// di redirect non hanno alcun bisogno. Era circa un terzo della CPU consumata.
//
// Restano DENTRO, e devono restarci: /api (il 401 sulle route telemetria),
// /telemetria-data e /grafiche (file in public/ protetti dalla password).
// Per questo non si esclude per estensione: /grafiche/template-intervista.webp
// e' un'immagine, ma va protetta.
export const config = {
  matcher: [
    '/((?!_next/|images/|fonts/|favicon\\.ico|icon\\.png|apple-icon|opengraph-image|robots\\.txt|sitemap\\.xml|ads\\.txt|google[0-9a-f]+\\.html).*)',
  ],
}
