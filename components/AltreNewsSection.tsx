import { type Article, ArticleCardGrid } from './ArticleCard'
import SocialCard from './SocialCard'

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
        {/* Griglia articoli */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.slice(0, 6).map((article) => (
            <ArticleCardGrid key={article.id} article={article} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <SocialCard />

          <div className="w-full h-[250px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center">
            <span className="font-montserrat text-[11px] text-lc-subtle text-center px-4">
              Spazio pubblicitario<br/>300×250
            </span>
          </div>

          <div className="w-full h-[250px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center">
            <span className="font-montserrat text-[11px] text-lc-subtle text-center px-4">
              Spazio pubblicitario<br/>300×250
            </span>
          </div>
        </aside>
      </div>
    </section>
  )
}
