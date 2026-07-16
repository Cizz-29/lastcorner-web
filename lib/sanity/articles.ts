import { cache } from 'react'
import { sanityClient } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/image'
import { CATEGORIES } from '@/lib/categories'
import { type Article } from '@/components/ArticleCard'
import { MOCK_ARTICLES, MOCK_OTHER_ARTICLES } from '@/lib/mockData'

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

const ARTICLE_QUERY = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
  _id, title, slug, category, subcategory, author, publishedAt, mainImage, excerpt, breaking, tags, body
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
    imageUrl: doc.mainImage ? urlFor(doc.mainImage).width(1200).height(675).fit('crop').url() : FALLBACK_IMAGE,
    excerpt: doc.excerpt,
    breaking: doc.breaking,
    tags: doc.tags,
    content: doc.body,
  }
}

// Articoli reali da Sanity + mock esistenti, uniti in una sola lista.
// Se Sanity non risponde (non ancora configurato, rete assente, ecc.) si
// procede solo con i mock, così il sito non si rompe mai per questo.
// cache() di React deduplica le chiamate all'interno dello stesso render
// (più pagine/componenti possono richiamarla senza richieste ripetute).
export const getAllArticles = cache(async (): Promise<Article[]> => {
  let sanityArticles: Article[] = []
  try {
    const docs = await sanityClient.fetch<SanityArticleDoc[]>(ARTICLE_QUERY)
    sanityArticles = docs.map(toArticle)
  } catch {
    // Sanity irraggiungibile o non ancora configurato: si passa ai soli mock.
  }

  return [...sanityArticles, ...MOCK_ARTICLES, ...MOCK_OTHER_ARTICLES]
})
