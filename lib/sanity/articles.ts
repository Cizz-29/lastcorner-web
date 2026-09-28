import { cache } from 'react'
import { sanityClient } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/image'
import { CATEGORIES } from '@/lib/categories'
import { type Article } from '@/components/ArticleCard'

// Immagine di riserva se un articolo Sanity fosse senza mainImage
// (in teoria impossibile: il campo è obbligatorio nello schema).
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'

const MESI_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MESI_IT[d.getMonth()]}`
}

function categoryLabelToSlug(label: string): string {
  return CATEGORIES.find((c) => c.label === label)?.slug ?? 'altro'
}

interface SanityArticleDoc {
  _id: string
  title: string
  slug?: { current: string }
  category: string
  subcategory?: string
  author: string
  publishedAt: string
  mainImage?: { asset?: any; alt?: string }
  excerpt?: string
  breaking?: boolean
  tags?: string[]
  body?: any[]
}

// Nota importante sul campo "body": NON va richiesto qui.
//
// Questa query restituisce l'elenco completo degli articoli e viene eseguita
// a ogni generazione di pagina. Includendo il corpo, la risposta pesava 4,2 MB
// e con qualche centinaio di pagine da generare significava gigabyte di banda
// Sanity a ogni build. Senza il corpo la stessa risposta sta in poche
// centinaia di kilobyte. Il testo dell'articolo serve a una pagina sola, e
// quella se lo va a prendere da se' con getArticleBody().
const CAMPI_ELENCO = `_id, title, slug, category, subcategory, author, publishedAt, mainImage, excerpt, breaking, tags`

const ARTICLE_QUERY = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
  ${CAMPI_ELENCO}
}`

function toArticle(doc: SanityArticleDoc): Article {
  return {
    id: doc._id,
    title: doc.title,
    slug: `${categoryLabelToSlug(doc.category)}/${doc.slug!.current}`,
    category: doc.category,
    subcategory: doc.subcategory,
    author: doc.author,
    date: formatDate(doc.publishedAt),
    publishedAt: doc.publishedAt,
    // 16:9 — formato delle card, dell'anteprima social e dei dati strutturati.
    imageUrl: doc.mainImage ? urlFor(doc.mainImage).width(1200).height(675).fit('crop').url() : FALLBACK_IMAGE,
    // 3:2 — solo per l'immagine grande in cima all'articolo, dove il 16:9
    // risultava troppo schiacciato. E' un secondo ritaglio della stessa foto,
    // non un secondo file: la CDN di Sanity lo genera al volo e nessuna query
    // in piu' viene fatta. Il punto di interesse scelto nello Studio (hotspot)
    // vale per entrambi i formati.
    heroImageUrl: doc.mainImage ? urlFor(doc.mainImage).width(1200).height(800).fit('crop').url() : FALLBACK_IMAGE,
    excerpt: doc.excerpt,
    breaking: doc.breaking,
    tags: doc.tags,
    content: doc.body, // presente solo se richiesto esplicitamente
  }
}

// Articoli reali da Sanity. Se Sanity non risponde
// si restituisce una lista vuota invece di rompere il rendering delle pagine.
// cache() di React deduplica le chiamate all'interno dello stesso render
// (più pagine/componenti possono richiamarla senza richieste ripetute).
export const getAllArticles = cache(async (): Promise<Article[]> => {
  try {
    const docs = await sanityClient.fetch<SanityArticleDoc[]>(ARTICLE_QUERY)
    return docs.map(toArticle)
  } catch (errore) {
    // Sanity irraggiungibile: lista vuota, le pagine mostrano gli stati "vuoti".
    //
    // Il motivo va SEMPRE scritto nei log. Inghiottito in silenzio, un
    // problema di rete si presentava trenta righe piu' in la' come
    // "Cannot read properties of undefined (reading 'slug')" dentro una
    // card, che non dice niente su cosa sia successo davvero.
    console.error(
      '[sanity] elenco articoli non recuperato:',
      (errore as Error)?.message ?? errore
    )
    return []
  }
})

// Corpo di un singolo articolo. Tenuto separato dall'elenco per non
// trascinarsi dietro il testo di tutti gli altri: viene richiesto solo dalla
// pagina dell'articolo, una volta, per il pezzo che sta mostrando.
export const getArticleBody = cache(async (id: string): Promise<any[] | undefined> => {
  try {
    const body = await sanityClient.fetch<any[] | null>(`*[_id == $id][0].body`, { id })
    return body ?? undefined
  } catch {
    return undefined
  }
})

// ---------------------------------------------------------------------------
// Query mirate.
//
// getAllArticles() scarica tutto il catalogo — oltre seicento articoli, piu' di
// 400 KB — e resta giusta per gli elenchi e le sitemap, che il catalogo lo
// mostrano davvero. Le pagine che di articoli ne mostrano uno o sei, invece,
// chiedono a Sanity solo quelli: meno dati da scaricare, da interpretare e da
// trasformare a ogni rendering.
// ---------------------------------------------------------------------------

/** Le forme sotto cui uno slug puo' arrivare dall'indirizzo.
 *
 *  Lo slug su Sanity e' scritto in un modo solo, ma quello che arriva nella
 *  richiesta puo' essere ancora codificato (%C3%A0 al posto di "a" accentata)
 *  o in una forma Unicode diversa (la "a" accentata come un carattere solo,
 *  oppure come "a" piu' accento). Si cercano tutte: e' successo con
 *  "penalita" scritto con l'accento, rimasto in 404 pur essendo pubblicato. */
function formeDelloSlug(slug: string): string[] {
  const forme = new Set<string>([slug])
  try {
    forme.add(decodeURIComponent(slug))
  } catch {
    // Codifica malformata: si tiene lo slug com'e'.
  }
  for (const f of Array.from(forme)) {
    forme.add(f.normalize('NFC'))
    forme.add(f.normalize('NFD'))
  }
  return Array.from(forme)
}

/** Un articolo dal suo slug, in qualsiasi categoria stia.
 *
 *  La categoria non entra nella query di proposito: se l'articolo e' stato
 *  spostato, chi arriva dal vecchio indirizzo va reindirizzato, e per farlo
 *  serve sapere dove sta adesso. Lo decide la pagina confrontando la categoria. */
export const getArticleBySlug = cache(async (slug: string): Promise<Article | undefined> => {
  try {
    const doc = await sanityClient.fetch<SanityArticleDoc | null>(
      `*[_type == "article" && slug.current in $forme] | order(publishedAt desc)[0]{ ${CAMPI_ELENCO} }`,
      { forme: formeDelloSlug(slug) }
    )
    return doc ? toArticle(doc) : undefined
  } catch (errore) {
    console.error('[sanity] articolo non recuperato:', (errore as Error)?.message ?? errore)
    return undefined
  }
})

/** Gli ultimi n articoli pubblicati, escluso uno (quello che si sta leggendo). */
export const getUltimiArticoli = cache(async (n: number, escludiId?: string): Promise<Article[]> => {
  try {
    const docs = await sanityClient.fetch<SanityArticleDoc[]>(
      `*[_type == "article" && defined(slug.current) && _id != $escludi] | order(publishedAt desc)[0...$n]{ ${CAMPI_ELENCO} }`,
      { n, escludi: escludiId ?? '' }
    )
    return docs.map(toArticle)
  } catch (errore) {
    console.error('[sanity] ultimi articoli non recuperati:', (errore as Error)?.message ?? errore)
    return []
  }
})

/** Gli ultimi n articoli con un certo tag (pilota o team), senza badare a
 *  maiuscole e minuscole: nello Studio i tag si scrivono a mano. */
export const getArticoliConTag = cache(async (tag: string, n: number): Promise<Article[]> => {
  try {
    const docs = await sanityClient.fetch<SanityArticleDoc[]>(
      `*[_type == "article" && defined(slug.current) && count(tags[lower(@) == $cercato]) > 0] | order(publishedAt desc)[0...$n]{ ${CAMPI_ELENCO} }`,
      { cercato: tag.toLowerCase(), n }
    )
    return docs.map(toArticle)
  } catch (errore) {
    console.error('[sanity] articoli per tag non recuperati:', (errore as Error)?.message ?? errore)
    return []
  }
})

/** Solo categoria e slug di ogni articolo: quanto basta per sapere quali
 *  pagine generare in fase di build, senza scaricare titoli, immagini e tag. */
export async function getPercorsiArticoli(): Promise<{ category: string; slug: string }[]> {
  try {
    const docs = await sanityClient.fetch<{ category: string; slug: string }[]>(
      `*[_type == "article" && defined(slug.current)]{ category, "slug": slug.current }`
    )
    return docs.map((d) => ({ category: categoryLabelToSlug(d.category), slug: d.slug }))
  } catch (errore) {
    console.error('[sanity] percorsi articoli non recuperati:', (errore as Error)?.message ?? errore)
    return []
  }
}
