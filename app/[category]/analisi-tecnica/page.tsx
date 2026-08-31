import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryConfig } from '@/lib/categories'
import { CATEGORIES_WITH_FULL_SUBCATEGORIES } from '@/lib/subcategories'
import SubcategoryPage from '@/components/SubcategoryPage'

// Statica: prima leggeva ?page=... e quello bastava a renderla dinamica per
// sempre. Le pagine successive stanno in page/[n] qui accanto.
export const revalidate = false

interface PageProps {
  params: { category: string }
}

export function generateStaticParams() {
  return CATEGORIES_WITH_FULL_SUBCATEGORIES.map((category) => ({ category }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Sezione non trovata' }
  return { title: `Analisi Tecnica ${config.label}` }
}

export default function AnalisiTecnicaPage({ params }: PageProps) {
  if (!CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(params.category)) notFound()
  return (
    <SubcategoryPage
      categorySlug={params.category}
      subcategoryValue="analisi-tecnica"
      title="Analisi Tecnica"
      pagina={1}
    />
  )
}
