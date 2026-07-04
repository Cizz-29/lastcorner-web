import { ArticleCardHero, ArticleCardSmall, type Article } from './ArticleCard'

interface HeroSectionProps {
  heroArticle: Article
  sideArticles: Article[]
}

export default function HeroSection({ heroArticle, sideArticles }: HeroSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-3 mb-10">
      {/* Articolo hero grande */}
      <ArticleCardHero article={heroArticle} />

      {/* Colonna articoli secondari */}
      <div className="flex flex-col gap-[3px]">
        {sideArticles.slice(0, 4).map((article) => (
          <ArticleCardSmall key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
