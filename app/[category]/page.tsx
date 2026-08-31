import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CategoryListing from '@/components/CategoryListing'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'

// Pagina statica: si aggiorna solo quando Sanity chiama /api/revalidate.
//
// Prima questa pagina leggeva ?page=... e per Next.js questo basta a renderla
// dinamica per sempre: veniva ricalcolata a ogni visita, e generateStaticParams
// qui sotto non serviva a nulla. Ora la pagina della paginazione sta nel
// percorso (/{categoria}/page/{n}, cartella accanto) e questa e' davvero
// statica.
export const revalidate = false

interface CategoryPageProps {
  params: { category: string }
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }))
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Categoria non trovata' }
  return { title: config.label }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  if (!getCategoryConfig(params.category)) notFound()
  return <CategoryListing categorySlug={params.category} pagina={1} />
}
