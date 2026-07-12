import Link from 'next/link'
import { type Article } from './ArticleCard'

interface NewsTickerProps {
  articles: Article[]
}

// Barra "ultim'ora" con scorrimento continuo dei titoli contrassegnati come breaking.
// Se non ci sono notizie breaking il componente non renderizza nulla.
export default function NewsTicker({ articles }: NewsTickerProps) {
  const breaking = articles.filter((a) => a.breaking)
  if (breaking.length === 0) return null

  // Duplichiamo la lista per ottenere uno scorrimento continuo senza scatti
  const loop = [...breaking, ...breaking]

  return (
    <div
      className="w-full bg-lc-red/10 border border-lc-red/30 rounded-card-sm mb-8 overflow-hidden flex items-stretch"
      role="region"
      aria-label="Ultime notizie"
    >
      <div className="shrink-0 bg-lc-red px-4 py-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse motion-reduce:animate-none" aria-hidden />
        <span className="font-akira font-bold text-[11px] text-white tracking-wider whitespace-nowrap">
          ULTIM&apos;ORA
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center gap-10 py-2 px-4 whitespace-nowrap animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
          {loop.map((article, i) => (
            <Link
              key={`${article.id}-${i}`}
              href={`/${article.slug}`}
              className="font-montserrat text-[12px] text-white/90 hover:text-white hover:underline shrink-0"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
