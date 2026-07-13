import { type Article, ArticleCardSmall } from './ArticleCard'
import SocialCard from './SocialCard'
import AdSlot from './AdSlot'

interface AltreNewsSectionProps {
  articles: Article[]
}

// Sezione secondaria con altri articoli recenti, non mostrati nelle
// sezioni sopra (hero + "Le ultime news"). Sidebar con spazio ADV e
// card social multi-piattaforma.
export default function AltreNewsSection({ articles }: AltreNewsSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="mb-12" aria-labelledby="altre-news-heading">
      <div className="flex items-center gap-3 mb-6">
        <h2 id="altre-news-heading" className="font-akira font-extrabold text-[22px] text-white whitespace-nowrap">
          ALTRE <span className="text-lc-red">NEWS</span>
        </h2>
        <div className="flex-1 h-[3px] bg-gradient-to-r from-lc-red to-transparent rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Griglia articoli — stessa card orizzontale della colonna hero,
            su 2 colonne così restano compatte invece di stirarsi a piena larghezza.
            Gap verticale minimo: le righe restano molto ravvicinate, e mostriamo
            fino a 9 righe (18 articoli) per riempire lo spazio disponibile. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {articles.slice(0, 18).map((article) => (
            <ArticleCardSmall key={article.id} article={article} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <SocialCard />

          {/* Banner verticale unico, dimensione standard AdSense (Half Page) */}
          <AdSlot height={600} label="300×600" />
        </aside>
      </div>
    </section>
  )
}
