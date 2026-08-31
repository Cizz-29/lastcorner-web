import type { Metadata } from 'next'
import AuthorListing from '@/components/AuthorListing'
import { getAllArticles } from '@/lib/sanity/articles'
import { getSchedaAutore } from '@/lib/sanity/authors'
import { authorSlug } from '@/lib/authors'

// Statica: prima leggeva ?page=... e quello bastava a renderla dinamica per
// sempre. Le pagine successive stanno in page/[n] qui accanto.
export const revalidate = false

interface AuthorPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const articles = await getAllArticles()
  const slugs = new Set(articles.map((a) => authorSlug(a.author)))
  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const articles = await getAllArticles()
  const match = articles.find((a) => authorSlug(a.author) === params.slug)
  if (!match) return { title: 'Autore non trovato' }

  const scheda = await getSchedaAutore(params.slug)
  const descrizione = scheda?.ruolo
    ? `${match.author}, ${scheda.ruolo} di Lastcorner.net. Tutti gli articoli firmati.`
    : `Tutti gli articoli di ${match.author} su Lastcorner.net.`

  return {
    title: `${match.author} — Lastcorner.net`,
    description: descrizione,
  }
}

export default function AuthorPage({ params }: AuthorPageProps) {
  return <AuthorListing slug={params.slug} pagina={1} />
}
