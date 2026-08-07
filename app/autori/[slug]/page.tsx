import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import Pagination from '@/components/Pagination'
import { ArticleCardGrid, ArticleCardSmall } from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/sanity/articles'
import { authorSlug } from '@/lib/authors'

// Rigenera la pagina al massimo ogni 60s, come le pagine categoria: un nuovo
// articolo pubblicato su Sanity deve comparire qui senza aspettare un deploy.
export const revalidate = false

const ARTICLES_PER_PAGE = 14
const GRID_COUNT = 4
const AD_EVERY_N_SMALL_CARDS = 5
const MAX_PAGES = 9

interface AuthorPageProps {
  params: { slug: string }
  searchParams: { page?: string }
}

export async function generateStaticParams() {
  const articles = await getAllArticles()
  const slugs = new Set(articles.map((a) => authorSlug(a.author)))
  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const articles = await getAllArticles()
  const match = articles.find((a) => authorSlug(a.author) === params.slug)
  if (!match) return { title: 'Autore non trovato' }
  return { title: `${match.author} — Lastcorner.net` }
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const allArticles = await getAllArticles()
  const authorArticles = allArticles.filter((a) => authorSlug(a.author) === params.slug)
  if (authorArticles.length === 0) notFound()

  const authorName = authorArticles[0].author

  const totalPages = Math.min(Math.max(1, Math.ceil(authorArticles.length / ARTICLES_PER_PAGE)), MAX_PAGES)
  const requestedPage = Number(searchParams.page) || 1
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)

  const start = (currentPage - 1) * ARTICLES_PER_PAGE
  const pageArticles = authorArticles.slice(start, start + ARTICLES_PER_PAGE)
  const gridArticles = pageArticles.slice(0, GRID_COUNT)
  const smallArticles = pageArticles.slice(GRID_COUNT)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            {authorName}
          </h1>
        </div>
        <p className="font-montserrat text-[13px] text-lc-subtle mb-8">
          {authorArticles.length} articol{authorArticles.length === 1 ? 'o' : 'i'} pubblicat
          {authorArticles.length === 1 ? 'o' : 'i'} su Lastcorner.net
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div className="min-w-0">
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
                      <div key={a.id} className="contents">
                        <ArticleCardSmall article={a} />
                        {showAd && (
                          <div className="sm:col-span-2">
                            <AdSlot height={100} className="my-2" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/autori/${params.slug}`} />
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
