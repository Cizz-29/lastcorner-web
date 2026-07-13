import { Suspense } from 'react'
import { type Article } from './ArticleCard'
import NewsGrid from './NewsGrid'
import StandingsWidget from './StandingsWidget'
import InstagramCTA from './InstagramCTA'
import { StandingsWidgetSkeleton } from './Skeletons'
import AdSlot from './AdSlot'

interface LatestNewsSectionProps {
  articles: Article[]
  adSlot?: React.ReactNode
}

export default function LatestNewsSection({ articles, adSlot }: LatestNewsSectionProps) {
  return (
    <section className="mb-10" aria-labelledby="latest-news-heading">
      {/* Titolo sezione */}
      <div className="flex items-center gap-3 mb-6">
        <h2 id="latest-news-heading" className="font-akira font-extrabold text-[22px] text-white whitespace-nowrap">
          LE ULTIME <span className="text-lc-red">NEWS</span>
        </h2>
        {/* Linea decorativa rossa */}
        <div className="flex-1 h-[3px] bg-gradient-to-r from-lc-red to-transparent rounded-full" />
      </div>

      {/* Layout griglia + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Griglia articoli con filtro categoria */}
        <NewsGrid articles={articles} />

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Widget classifica — in streaming, non blocca il resto della pagina */}
          <Suspense fallback={<StandingsWidgetSkeleton />}>
            <StandingsWidget />
          </Suspense>

          {/* CTA Instagram */}
          <InstagramCTA />

          {/* Slot pubblicitario 300x600 */}
          {adSlot ? adSlot : <AdSlot height={250} label="300×250" />}
        </aside>
      </div>
    </section>
  )
}
