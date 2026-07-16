import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StandingsWidget from '@/components/StandingsWidget'
import SocialCard from '@/components/SocialCard'
import { StandingsWidgetSkeleton } from '@/components/Skeletons'
import AdSlot from '@/components/AdSlot'
import ArticleBody from '@/components/ArticleBody'
import { ArticleCardSmall, type Article } from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/sanity/articles'
import { getCategoryConfig } from '@/lib/categories'

// Quanti articoli mostrare nella sidebar (ridotti rispetto alla vecchia lista)
const OTHER_ARTICLES_COUNT = 5

// Rigenera la pagina al massimo ogni 60s: senza questo, un articolo appena
// pubblicato su Sanity non comparirebbe finché non si rifà il deploy
// (i nuovi slug non presenti in generateStaticParams al momento del build
// vengono comunque generati "on demand" alla prima richiesta grazie a
// dynamicParams, ma la richiesta deve poter leggere dati freschi).
export const revalidate = 60

interface ArticlePageProps {
  params: { category: string; slug: string }
}

async function findArticle(category: string, slug: string): Promise<Article | undefined> {
  const articles = await getAllArticles()
  return articles.find((a) => a.slug === `${category}/${slug}`)
}

// Pre-genera le pagine per tutti gli articoli (Sanity + mock) in fase di build
export async function generateStaticParams() {
  const articles = await getAllArticles()
  return articles.map((a) => {
    const [category, slug] = a.slug.split('/')
    return { category, slug }
  })
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await findArticle(params.category, params.slug)
  if (!article) return { title: 'Articolo non trovato' }

  const description = article.excerpt ?? `${article.title} — Lastcorner.net`
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      images: [article.imageUrl],
      type: 'article',
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await findArticle(params.category, params.slug)
  if (!article) notFound()

  const hasStandings = getCategoryConfig(params.category)?.hasStandings ?? false

  const allArticles = await getAllArticles()
  const otherArticles = allArticles
    .filter((a) => a.id !== article.id)
    .slice(0, OTHER_ARTICLES_COUNT)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      {/* Padding orizzontale: quello della home page (80px) + 8px extra */}
      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-[88px] pt-[96px] flex-1">

        {/* Breadcrumb */}
        <nav aria-label="Percorso" className="font-montserrat text-[11px] text-lc-subtle mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-lc-red transition-colors duration-200">Home</Link>
          <span className="opacity-50">/</span>
          <Link href={`/${params.category}`} className="hover:text-lc-red transition-colors duration-200">
            {article.category}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white/60 truncate max-w-[420px]">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 mb-16">
          <article>
            <span className="inline-block font-akira font-bold text-[11px] text-white bg-lc-red rounded-full px-3 py-1 mb-4 tracking-wide">
              {article.category.toUpperCase()}
            </span>

            {/* Titolo — variante più pesante di Akira (SuperBold, 800) */}
            <h1 className="font-akira font-extrabold text-[28px] lg:text-[38px] text-white leading-[1.1] mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="font-montserrat text-[15px] text-lc-subtle leading-relaxed mb-5">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 text-[12px] font-montserrat text-lc-subtle mb-6">
              <span>{article.date}</span>
              <span className="opacity-60">|</span>
              <span>{article.author}</span>
            </div>

            <div className="relative w-full h-[300px] lg:h-[440px] rounded-card overflow-hidden mb-8 border-b-2 border-lc-red">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>

            {article.content && article.content.length > 0 ? (
              <ArticleBody blocks={article.content} />
            ) : (
              <p className="font-montserrat text-[14px] text-lc-subtle italic">
                Contenuto in arrivo.
              </p>
            )}
          </article>

          {/* Sidebar — il widget social è il primo elemento; il resto (classifica in
              giù) riprende circa all'altezza dell'immagine in evidenza. Lo scarto
              tra i due varia con la lunghezza del titolo, quindi lo spazio è
              colmato con un annuncio invece di un margine fisso "a occhio". */}
          <aside className="flex flex-col gap-4">
            <SocialCard />

            <AdSlot height={200} label="300×250" />

            {hasStandings ? (
              <Suspense fallback={<StandingsWidgetSkeleton />}>
                <StandingsWidget />
              </Suspense>
            ) : (
              <AdSlot height={250} label="300×250" />
            )}

            {otherArticles.length > 0 && (
              <div>
                <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-3">
                  Altri articoli
                </p>
                <div className="flex flex-col gap-[3px]">
                  {otherArticles.map((a) => (
                    <ArticleCardSmall key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
