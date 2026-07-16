import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import { ArticleCardGrid, ArticleCardSmall } from '@/components/ArticleCard'
import StandingsToggle from '@/components/StandingsToggle'
import { getAllStandings } from '@/lib/f1api'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'
import { getAllArticles } from '@/lib/sanity/articles'

// Rigenera la pagina al massimo ogni 60s per non restare bloccati sul
// contenuto articoli dell'ultimo deploy (vedi nota in app/page.tsx).
export const revalidate = 60

interface PageProps {
  params: { category: string }
}

// La classifica "ricca" (F1) esiste solo per la F1, dati live. Per le
// altre categorie (tranne "Altro", che non ha sottocategorie) la pagina
// mostra invece gli articoli con sottocategoria "classifiche", scritti a
// mano dopo ogni weekend di gara.
export function generateStaticParams() {
  return CATEGORIES.filter((c) => c.slug !== 'altro').map((c) => ({ category: c.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Classifica non disponibile' }
  return { title: `Classifica ${config.label}` }
}

export default async function ClassificaPage({ params }: PageProps) {
  const config = getCategoryConfig(params.category)
  if (!config || params.category === 'altro') notFound()

  if (params.category === 'formula-1') {
    const { drivers, constructors } = await getAllStandings()
    const season = new Date().getFullYear()

    return (
      <div className="min-h-screen bg-lc-bg flex flex-col">
        <Navbar />
        <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
            <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
              Classifica {config.label} {season}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            <div>
              {drivers.length > 0 || constructors.length > 0 ? (
                <StandingsToggle categorySlug={config.slug} drivers={drivers} constructors={constructors} />
              ) : (
                <div className="pb-16">
                  <p className="font-montserrat text-[14px] text-lc-subtle mb-8 max-w-xl leading-relaxed">
                    La classifica non è disponibile al momento.
                  </p>
                  <AdSlot height={250} label="300×250" />
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <SocialCard />
              <AdSlot height={250} label="300×250" />
              <AdSlot height={600} label="300×600" />
            </aside>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // F2 / F3 / WEC / WRC: nessuna classifica automatica disponibile, la
  // pagina mostra invece gli articoli di recap scritti dopo ogni weekend
  // (categoria = etichetta categoria, sottocategoria = "classifiche").
  const allArticles = await getAllArticles()
  const articles = allArticles.filter(
    (a) => a.category === config.label && a.subcategory?.toLowerCase() === 'classifiche'
  )
  const gridArticles = articles.slice(0, 4)
  const smallArticles = articles.slice(4)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            Classifica {config.label}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            {articles.length === 0 ? (
              <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
                Nessun articolo di classifica disponibile al momento.
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
