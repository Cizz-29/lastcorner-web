import { Suspense, Fragment } from 'react'
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
import { getCategoryConfig } from '@/lib/categories'
import { ANNUNCIO_OGNI_N_CARD, fettaElenco } from '@/lib/paginazione'

interface CategoryListingProps {
  categorySlug: string
  pagina: number
}

// Elenco articoli di una categoria. Il corpo sta qui e non nella pagina
// perche' lo condividono due route: /{categoria} (pagina 1) e
// /{categoria}/page/{n} (le successive). Vedi il commento in
// components/Pagination.tsx sul perche' la pagina sta nel percorso.
export default async function CategoryListing({ categorySlug, pagina }: CategoryListingProps) {
  const config = getCategoryConfig(categorySlug)
  if (!config) notFound()

  const allArticles = await getAllArticles()
  const categoryArticles = allArticles.filter((a) => a.category === config.label)
  const { paginaCorrente, paginePresenti, grandi, piccoli, vuota } = fettaElenco(categoryArticles, pagina)

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
            {vuota ? (
              <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
                Nessun articolo disponibile in questa categoria per ora.
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
                  <>
                    <AdSlot height={100} className="mb-8" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {piccoli.map((a, i) => {
                        const isLast = i === piccoli.length - 1
                        const showAd = (i + 1) % ANNUNCIO_OGNI_N_CARD === 0 && !isLast
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

            <Pagination currentPage={paginaCorrente} totalPages={paginePresenti} basePath={`/${config.slug}`} />
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
