import { ArticleCardGrid, type Article } from './ArticleCard'
import StandingsWidget from './StandingsWidget'

interface LatestNewsSectionProps {
  articles: Article[]
  adSlot?: React.ReactNode
}

export default function LatestNewsSection({ articles, adSlot }: LatestNewsSectionProps) {
  return (
    <section className="mb-10">
      {/* Titolo sezione */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-akira font-extrabold text-[22px] text-white whitespace-nowrap">
          LE ULTIME <span className="text-lc-red">NEWS</span>
        </h2>
        {/* Linea decorativa rossa */}
        <div className="flex-1 h-[3px] bg-gradient-to-r from-lc-red to-transparent rounded-full" />
      </div>

      {/* Layout griglia + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Griglia articoli 2 colonne */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.slice(0, 4).map((article) => (
            <ArticleCardGrid key={article.id} article={article} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Widget classifica */}
          <StandingsWidget />

          {/* Slot pubblicitario 300x600 */}
          {adSlot ? (
            adSlot
          ) : (
            <div className="w-[300px] h-[250px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center">
              <span className="font-montserrat text-[11px] text-lc-subtle text-center px-4">
                Spazio pubblicitario<br/>300×250
              </span>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
