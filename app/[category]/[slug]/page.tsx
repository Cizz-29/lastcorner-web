import Link from 'next/link'
import Image from 'next/image'
import { Suspense, type ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StandingsWidget from '@/components/StandingsWidget'
import SocialCard from '@/components/SocialCard'
import { StandingsWidgetSkeleton } from '@/components/Skeletons'
import AdSlot from '@/components/AdSlot'
import { ArticleCardSmall, type Article } from '@/components/ArticleCard'
import { MOCK_ARTICLES, MOCK_OTHER_ARTICLES } from '@/lib/mockData'
import { getCategoryConfig } from '@/lib/categories'

const ALL_ARTICLES: Article[] = [...MOCK_ARTICLES, ...MOCK_OTHER_ARTICLES]

// Ogni quanti paragrafi consecutivi inserire uno slot pubblicitario nel corpo
const AD_EVERY_N_PARAGRAPHS = 3
// Quanti articoli mostrare nella sidebar (ridotti rispetto alla vecchia lista)
const OTHER_ARTICLES_COUNT = 5

interface ArticlePageProps {
  params: { category: string; slug: string }
}

function findArticle(category: string, slug: string): Article | undefined {
  return ALL_ARTICLES.find((a) => a.slug === `${category}/${slug}`)
}

// Pre-genera le pagine per tutti gli articoli mock in fase di build
export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => {
    const [category, slug] = a.slug.split('/')
    return { category, slug }
  })
}

export function generateMetadata({ params }: ArticlePageProps): Metadata {
  const article = findArticle(params.category, params.slug)
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

// Trasforma i blocchi di contenuto in JSX, inserendo un AdSlot ogni
// AD_EVERY_N_PARAGRAPHS paragrafi (le immagini non contano ai fini del conteggio).
function renderContent(article: Article): ReactNode[] {
  const blocks = article.content ?? []
  let paragraphCount = 0
  const nodes: ReactNode[] = []

  blocks.forEach((block, i) => {
    if (block.type === 'paragraph') {
      paragraphCount++
      nodes.push(
        <p key={i} className="font-montserrat text-[15px] text-white/90 leading-relaxed mb-5">
          {block.text}
        </p>
      )
      const isLastBlock = i === blocks.length - 1
      if (paragraphCount % AD_EVERY_N_PARAGRAPHS === 0 && !isLastBlock) {
        nodes.push(<AdSlot key={`ad-${i}`} height={120} label="Google AdSense" className="mb-6" />)
      }
    } else {
      nodes.push(
        <figure key={i} className="mb-6">
          <div className="relative w-full h-[280px] lg:h-[360px] rounded-card overflow-hidden">
            <Image src={block.src} alt={block.caption ?? article.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
          </div>
          {block.caption && (
            <figcaption className="font-montserrat italic text-[12px] text-lc-subtle mt-2">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
    }
  })

  return nodes
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = findArticle(params.category, params.slug)
  if (!article) notFound()

  const hasStandings = getCategoryConfig(params.category)?.hasStandings ?? false

  const otherArticles = ALL_ARTICLES
    .filter((a) => a.id !== article.id)
    .slice(0, OTHER_ARTICLES_COUNT)

  const contentNodes = renderContent(article)

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

            {contentNodes.length > 0 ? contentNodes : (
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
