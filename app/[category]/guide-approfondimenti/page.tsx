import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryConfig } from '@/lib/categories'
import { CATEGORIES_WITH_FULL_SUBCATEGORIES } from '@/lib/subcategories'
import SubcategoryPage from '@/components/SubcategoryPage'

export const revalidate = 60

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
  return { title: `Guide e Approfondimenti ${config.label}` }
}

export default function GuideApprofondimentiPage({ params, searchParams }: PageProps) {
  if (!CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(params.category)) notFound()
  return (
    <SubcategoryPage
      categorySlug={params.category}
      subcategoryValue="guide-approfondimenti"
      title="Guide e Approfondimenti"
      page={searchParams.page}
    />
  )
}
