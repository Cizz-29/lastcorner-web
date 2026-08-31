import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AuthorListing from '@/components/AuthorListing'
import { getAllArticles } from '@/lib/sanity/articles'
import { authorSlug } from '@/lib/authors'
import { paginaDaSegmento, paginePerGenerazioneStatica } from '@/lib/paginazione'

export const revalidate = false

// Solo le pagine generate qui sotto esistono: un numero inventato risponde
// 404 senza eseguire nulla, invece di far partire una funzione.
export const dynamicParams = false

interface PageProps {
  params: { slug: string; n: string }
}

export async function generateStaticParams() {
  const articles = await getAllArticles()
  const perAutore = new Map<string, number>()
  for (const a of articles) {
    const slug = authorSlug(a.author)
    perAutore.set(slug, (perAutore.get(slug) ?? 0) + 1)
  }
  const out: { slug: string; n: string }[] = []
  perAutore.forEach((quanti, slug) => {
    for (const n of paginePerGenerazioneStatica(quanti)) {
      out.push({ slug, n: String(n) })
    }
  })
  return out
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const articles = await getAllArticles()
  const match = articles.find((a) => authorSlug(a.author) === params.slug)
  if (!match) return { title: 'Autore non trovato' }
  return {
    title: `${match.author} — pagina ${params.n}`,
    robots: { index: false, follow: true },
  }
}

export default function AuthorPaginaPage({ params }: PageProps) {
  const pagina = paginaDaSegmento(params.n)
  if (!pagina) notFound()
  return <AuthorListing slug={params.slug} pagina={pagina} />
}
