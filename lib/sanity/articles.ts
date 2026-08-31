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
const ARTICLE_QUERY = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
  _id, title, slug, category, subcategory, author, publishedAt, mainImage, excerpt, breaking, tags
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

// Articoli reali da Sanity. I mock di sviluppo (lib/mockData.ts) non vengono
// più inclusi: il catalogo reale migrato da WordPress è completo, quindi i
// contenuti fittizi online sarebbero solo fuorvianti. Se Sanity non risponde
// si restituisce una lista vuota invece di rompere il rendering delle pagine.
// cache() di React deduplica le chiamate all'interno dello stesso render
// (più pagine/componenti possono richiamarla senza richieste ripetute).
export const getAllArticles = cache(async (): Promise<Article[]> => {
  try {
    const docs = await sanityClient.fetch<SanityArticleDoc[]>(ARTICLE_QUERY)
    return docs.map(toArticle)
  } catch {
    // Sanity irraggiungibile: lista vuota, le pagine mostrano gli stati "vuoti".
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
