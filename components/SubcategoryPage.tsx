import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import Pagination from '@/components/Pagination'
import { ArticleCardGrid, ArticleCardSmall } from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/sanity/articles'
import { getCategoryConfig } from '@/lib/categories'

const ARTICLES_PER_PAGE = 14
const GRID_COUNT = 4
const MAX_PAGES = 9 // stessa regola della pagina categoria: max 9 pagine navigabili

interface SubcategoryPageProps {
  categorySlug: string
  subcategoryValue: string
  title: string
  page?: string
}

// Pagina di una singola sotto-categoria editoriale (es. Editoriali, Analisi
// Tecnica, Rubriche): stessa struttura della pagina categoria principale ma
// filtrata anche per sottocategoria. Usata da app/[category]/{editoriali,
// analisi-tecnica, guide-approfondimenti, rubriche}/page.tsx.
export default async function SubcategoryPage({ categorySlug, subcategoryValue, title, page }: SubcategoryPageProps) {
  const config = getCategoryConfig(categorySlug)
  if (!config) return null

  const allArticles = await getAllArticles()
  const articles = allArticles.filter(
    (a) => a.category === config.label && a.subcategory?.toLowerCase() === subcategoryValue
  )

  const totalPages = Math.min(Math.max(1, Math.ceil(articles.length / ARTICLES_PER_PAGE)), MAX_PAGES)
  const requestedPage = Number(page) || 1
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)

  const start = (currentPage - 1) * ARTICLES_PER_PAGE
  const pageArticles = articles.slice(start, start + ARTICLES_PER_PAGE)
  const gridArticles = pageArticles.slice(0, GRID_COUNT)
  const smallArticles = pageArticles.slice(GRID_COUNT)

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
            {pageArticles.length === 0 ? (
              <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
                Nessun articolo disponibile in questa sezione per ora.
              </p>
            ) : (
              <>
                {gridArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {gridArticles.map((a) => (
                      <ArticleCardGrid key={a.id} article={a} />
                    ))}
                  </div>
                )}
                {smallArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {smallArticles.map((a) => (
                      <ArticleCardSmall key={a.id} article={a} />
                    ))}
                  </div>
                )}
              </>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/${config.slug}/${subcategoryValue}`} />
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
