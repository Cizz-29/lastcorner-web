import { NextRequest, NextResponse } from 'next/server'

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
  'chi-siamo', 'contatti', 'privacy', 'cookie', 'note-legali',
  'studio', 'api', 'images', 'sitemap.xml', 'robots.txt', '_next', 'favicon.ico',
])

// Vecchie sotto-categorie WordPress (esistevano per formula-1/2/3, f1-academy,
// wrc): sul nuovo sito non hanno una pagina dedicata, si rimanda alla
// categoria principale.
const OLD_SUBCATEGORY_SLUGS = new Set([
  'news', 'editoriali', 'analisi-tecnica', 'guide-approfondimenti', 'rubriche',
])

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

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

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

export const config = {
  matcher: ['/((?!_next/static|_next/image|images/).*)'],
}
