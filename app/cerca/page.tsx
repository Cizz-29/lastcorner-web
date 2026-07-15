import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArticleCardGrid } from '@/components/ArticleCard'
import { MOCK_ARTICLES, MOCK_OTHER_ARTICLES } from '@/lib/mockData'

interface SearchPageProps {
  searchParams: { q?: string }
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const q = searchParams.q?.trim()
  return { title: q ? `Risultati per "${q}"` : 'Cerca' }
}

// Ricerca lato server sui titoli degli articoli (mock — in futuro sarà
// una query full-text su Sanity). Nessuna chiamata client necessaria.
export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = (searchParams.q ?? '').trim()
  const allArticles = [...MOCK_ARTICLES, ...MOCK_OTHER_ARTICLES]
  const results = query
    ? allArticles.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-8 mt-4">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight">
            {query ? (
              <>RISULTATI PER &quot;<span className="text-lc-red">{query}</span>&quot;</>
            ) : (
              'CERCA'
            )}
          </h1>
        </div>

        {!query ? (
          <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
            Usa la barra di ricerca in alto per trovare articoli per titolo.
          </p>
        ) : results.length === 0 ? (
          <p className="font-montserrat text-[14px] text-lc-subtle pb-20">
            Spiacenti, non ci sono contenuti relativi a &quot;{query}&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {results.map((article) => (
              <ArticleCardGrid key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
