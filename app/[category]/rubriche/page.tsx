import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryConfig } from '@/lib/categories'
import { CATEGORIES_WITH_RUBRICHE } from '@/lib/subcategories'
import SubcategoryPage from '@/components/SubcategoryPage'

export const revalidate = 60

interface PageProps {
  params: { category: string }
  searchParams: { page?: string }
}

export function generateStaticParams() {
  return CATEGORIES_WITH_RUBRICHE.map((category) => ({ category }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Sezione non trovata' }
  return { title: `Rubriche ${config.label}` }
}

export default function RubrichePage({ params, searchParams }: PageProps) {
  if (!CATEGORIES_WITH_RUBRICHE.includes(params.category)) notFound()
  return (
    <SubcategoryPage
      categorySlug={params.category}
      subcategoryValue="rubriche"
      title="Rubriche"
      page={searchParams.page}
    />
  )
}
