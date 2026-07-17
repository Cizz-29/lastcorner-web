import { Suspense, Fragment } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import StandingsWidget from '@/components/StandingsWidget'
import { StandingsWidgetSkeleton } from '@/components/Skeletons'
import AdSlot from '@/components/AdSlot'
import Pagination from '@/components/Pagination'
import { ArticleCardGrid, ArticleCardSmall } from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/sanity/articles'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'

// Rigenera la pagina al massimo ogni 60s: senza questo la pagina resta
// statica al contenuto dell'ultimo deploy e i nuovi articoli Sanity non
// comparirebbero finché non si ricarica manualmente.
export const revalidate = 60

const ARTICLES_PER_PAGE = 14
const GRID_COUNT = 4              // le più recenti, stile card "Le ultime news"
const AD_EVERY_N_SMALL_CARDS = 5  // cadenza annunci tra le card piccole
const MAX_PAGES = 9               // solo le 9 pagine più recenti sono navigabili

interface CategoryPageProps {
  params: { category: string }
  searchParams: { page?: string }
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }))
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Categoria non trovata' }
  return { title: config.label }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const config = getCategoryConfig(params.category)
  if (!config) notFound()

  const allArticles = await getAllArticles()
  const categoryArticles = allArticles.filter((a) => a.category === config.label)

  // totalPages è già limitato a MAX_PAGES: le pagine oltre la 9ª (le più
  // vecchie) restano fuori dalla navigazione — gli articoli restano
  // raggiungibili via ricerca/link diretto, semplicemente non si sfoglia
  // più indietro di così.
  const totalPages = Math.min(Math.max(1, Math.ceil(categoryArticles.length / ARTICLES_PER_PAGE)), MAX_PAGES)
  const requestedPage = Number(searchParams.page) || 1
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)

  const start = (currentPage - 1) * ARTICLES_PER_PAGE
  const pageArticles = categoryArticles.slice(start, start + ARTICLES_PER_PAGE)
  const gridArticles = pageArticles.slice(0, GRID_COUNT)
  const smallArticles = pageArticles.slice(GRID_COUNT)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            {config.label}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Colonna principale */}
          {/* min-w-0: senza, una colonna grid non si restringe mai sotto la
              larghezza minima del proprio contenuto (es. la paginazione con
              tante pagine, come su F1); questo forzava tutta la griglia a
              sforare la larghezza della pagina, tagliando la sidebar. */}
          <div className="min-w-0">
            {pageArticles.length === 0 ? (
              <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
                Nessun articolo disponibile in questa categoria per ora.
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
                  <>
                    <AdSlot height={100} className="mb-8" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {smallArticles.map((a, i) => {
                        const isLast = i === smallArticles.length - 1
                        const showAd = (i + 1) % AD_EVERY_N_SMALL_CARDS === 0 && !isLast
                        return (
                          <Fragment key={a.id}>
                            <ArticleCardSmall article={a} />
                            {showAd && <div className="sm:col-span-2"><AdSlot height={100} className="my-2" /></div>}
                          </Fragment>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/${config.slug}`} />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            {config.hasStandings && (
              <Suspense fallback={<StandingsWidgetSkeleton />}>
                <StandingsWidget />
              </Suspense>
            )}

            <SocialCard />

            {/* Senza classifica c'è più spazio libero in colonna: un annuncio
                verticale in più per riempirlo, invece di lasciarlo vuoto. */}
            <AdSlot height={600} label="300×600" />
            {!config.hasStandings && <AdSlot height={600} label="300×600" />}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
