import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryConfig } from '@/lib/categories'
import { CATEGORIES_WITH_FULL_SUBCATEGORIES } from '@/lib/subcategories'
import SubcategoryPage, { conteggioSottocategoria } from '@/components/SubcategoryPage'
import { paginaDaSegmento, paginePerGenerazioneStatica } from '@/lib/paginazione'

export const revalidate = false

// Solo le pagine generate qui sotto esistono: un numero inventato risponde
// 404 senza eseguire nulla, invece di far partire una funzione.
export const dynamicParams = false

interface PageProps {
  params: { category: string; n: string }
}

export async function generateStaticParams() {
  const gruppi = await Promise.all(
    CATEGORIES_WITH_FULL_SUBCATEGORIES.map(async (category) => {
      const quanti = await conteggioSottocategoria(category, 'editoriali')
      return paginePerGenerazioneStatica(quanti).map((n) => ({ category, n: String(n) }))
    })
  )
  return gruppi.flat()
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Sezione non trovata' }
  return {
    title: `Editoriali ${config.label} — pagina ${params.n}`,
    robots: { index: false, follow: true },
  }
}

export default function EditorialiPaginaPage({ params }: PageProps) {
  const pagina = paginaDaSegmento(params.n)
  if (!pagina || !CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(params.category)) notFound()
  return (
    <SubcategoryPage
      categorySlug={params.category}
      subcategoryValue="editoriali"
      title="Editoriali"
      pagina={pagina}
    />
  )
}
