import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import Pagination from '@/components/Pagination'
import { ArticleCardGrid, ArticleCardSmall } from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/sanity/articles'
import { getCategoryConfig } from '@/lib/categories'
import { fettaElenco } from '@/lib/paginazione'

interface SubcategoryPageProps {
  categorySlug: string
  subcategoryValue: string
  title: string
  pagina: number
}

// Pagina di una singola sotto-categoria editoriale (es. Editoriali, Analisi
// Tecnica, Rubriche): stessa struttura della pagina categoria principale ma
// filtrata anche per sottocategoria. Usata da app/[category]/{editoriali,
// analisi-tecnica, guide-approfondimenti, rubriche}/{page.tsx, page/[n]/page.tsx}.
export default async function SubcategoryPage({ categorySlug, subcategoryValue, title, pagina }: SubcategoryPageProps) {
  const config = getCategoryConfig(categorySlug)
  if (!config) return null

  const allArticles = await getAllArticles()
  const articles = allArticles.filter(
    (a) => a.category === config.label && a.subcategory?.toLowerCase() === subcategoryValue
  )

  const { paginaCorrente, paginePresenti, grandi, piccoli, vuota } = fettaElenco(articles, pagina)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            {config.label} — {title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div className="min-w-0">
            {vuota ? (
              <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
                Nessun articolo disponibile in questa sezione per ora.
              </p>
            ) : (
              <>
                {grandi.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {grandi.map((a) => (
                      <ArticleCardGrid key={a.id} article={a} />
                    ))}
                  </div>
                )}
                {piccoli.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {piccoli.map((a) => (
                      <ArticleCardSmall key={a.id} article={a} />
                    ))}
                  </div>
                )}
              </>
            )}

            <Pagination currentPage={paginaCorrente} totalPages={paginePresenti} basePath={`/${config.slug}/${subcategoryValue}`} />
          </div>

          <aside className="flex flex-col gap-4">
            <SocialCard />
            <AdSlot height={600} label="300×600" />
            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/** Quanti articoli ha una sotto-categoria: serve a generateStaticParams delle pagine. */
export async function conteggioSottocategoria(categorySlug: string, subcategoryValue: string): Promise<number> {
  const config = getCategoryConfig(categorySlug)
  if (!config) return 0
  const articoli = await getAllArticles()
  return articoli.filter(
    (a) => a.category === config.label && a.subcategory?.toLowerCase() === subcategoryValue
  ).length
}
