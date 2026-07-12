'use client'

import { useMemo, useState } from 'react'
import { ArticleCardGrid, type Article } from './ArticleCard'

interface NewsGridProps {
  articles: Article[]
}

// Griglia "Le ultime news" con filtro per categoria lato client.
// Riceve tutti gli articoli disponibili e mostra solo quelli della
// categoria selezionata (default: tutte).
export default function NewsGrid({ articles }: NewsGridProps) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(articles.map((a) => a.category)))
    return ['Tutte', ...unique]
  }, [articles])

  const [active, setActive] = useState('Tutte')

  const filtered = useMemo(() => {
    const list = active === 'Tutte' ? articles : articles.filter((a) => a.category === active)
    return list.slice(0, 6)
  }, [articles, active])

  return (
    <div>
      {/* Tab categorie */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filtra per categoria">
        {categories.map((cat) => {
          const isActive = cat === active
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(cat)}
              className={`font-akira text-[10px] uppercase tracking-wide whitespace-nowrap px-3 py-2 rounded-full border transition-colors duration-200 ${
                isActive
                  ? 'bg-lc-red border-lc-red text-white'
                  : 'bg-transparent border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Griglia articoli */}
      {filtered.length === 0 ? (
        <p className="font-montserrat text-[13px] text-lc-subtle py-8 text-center">
          Nessun articolo disponibile in questa categoria per ora.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((article) => (
            <ArticleCardGrid key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
