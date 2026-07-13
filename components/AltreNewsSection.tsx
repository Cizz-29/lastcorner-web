import { type Article, ArticleCardSmall } from './ArticleCard'
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
        {/* Griglia articoli — stessa card orizzontale della colonna hero,
            su 2 colonne così restano compatte invece di stirarsi a piena larghezza.
            Gap verticale ridotto rispetto a quello orizzontale: le righe restano
            più ravvicinate, e mostriamo più articoli per riempire l'altezza della sidebar. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {articles.slice(0, 7).map((article) => (
            <ArticleCardSmall key={article.id} article={article} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <SocialCard />

          {/* Banner verticale unico, dimensione standard AdSense (Half Page) */}
          <div className="w-full h-[600px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center">
            <span className="font-montserrat text-[11px] text-lc-subtle text-center px-4">
              Spazio pubblicitario<br/>300×600
            </span>
          </div>
        </aside>
      </div>
    </section>
  )
}
