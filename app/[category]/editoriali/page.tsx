import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryConfig } from '@/lib/categories'
import { CATEGORIES_WITH_FULL_SUBCATEGORIES } from '@/lib/subcategories'
import SubcategoryPage from '@/components/SubcategoryPage'

export const revalidate = false

interface PageProps {
  params: { category: string }
  searchParams: { page?: string }
}

export function generateStaticParams() {
  return CATEGORIES_WITH_FULL_SUBCATEGORIES.map((category) => ({ category }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Sezione non trovata' }
  return { title: `Editoriali ${config.label}` }
}

export default function EditorialiPage({ params, searchParams }: PageProps) {
  if (!CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(params.category)) notFound()
  return (
    <SubcategoryPage
      categorySlug={params.category}
      subcategoryValue="editoriali"
      title="Editoriali"
      page={searchParams.page}
    />
  )
}
