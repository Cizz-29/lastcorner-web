import Link from 'next/link'
import Image from 'next/image'

export interface Article {
  id: string
  title: string
  slug: string
  category: string
  author: string
  date: string
  imageUrl: string
  excerpt?: string
}

// ── Card piccola: colonna destra hero (orizzontale) ──────────
export function ArticleCardSmall({ article }: { article: Article }) {
  return (
    <Link href={`/${article.slug}`} className="group block">
      <div className="relative h-[94px] w-full bg-lc-card rounded-[21px] overflow-hidden border-t border-b border-r border-white/60 flex items-stretch">
        {/* Immagine a sinistra */}
        <div className="relative w-[130px] shrink-0 overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="130px"
          />
          {/* gradiente da sinistra verso destra */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-lc-card" />
        </div>

        {/* Testo a destra */}
        <div className="flex flex-col justify-between py-2 px-3 flex-1 min-w-0">
          <p className="font-akira font-bold text-[11px] text-white leading-tight line-clamp-3 text-right">
            {article.title}
          </p>
          <div className="flex items-center justify-end gap-2 text-[10px] text-lc-subtle font-montserrat">
            <span>{article.date}</span>
            <span className="opacity-60">|</span>
            <span>{article.author}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Card media: griglia "Le ultime news" ────────────────────
export function ArticleCardGrid({ article }: { article: Article }) {
  return (
    <Link href={`/${article.slug}`} className="group block">
      <div className="relative rounded-card overflow-hidden border-b-2 border-lc-red bg-lc-card flex flex-col">
        {/* Immagine — altezza fissa, no aspect-ratio che causa il bug */}
        <div className="relative h-[230px] w-full overflow-hidden rounded-t-card">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 348px"
          />
          {/* Gradiente lineare dal basso — esatto dal Figma */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(0deg, rgb(5,5,5) 24%, rgba(8,8,8,0) 100%)',
            }}
          />
          {/* Glow radiale rosso dal basso — radialGradient dal Figma */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 100% 40% at 50% 110%, rgba(255,58,58,0.85) 0%, rgba(255,58,58,0) 70%)',
            }}
          />
        </div>

        {/* Testo sotto l'immagine */}
        <div className="px-3 pt-3 pb-4">
          <h3 className="font-akira font-bold text-[12px] text-white leading-tight line-clamp-3 text-center mb-2">
            {article.title}
          </h3>
          <div className="flex items-center justify-center gap-3 text-[9px] text-lc-muted font-montserrat">
            <span>{article.date}</span>
            <span className="opacity-60">|</span>
            <span>{article.author}</span>
            <span className="opacity-60">|</span>
            <span className="text-lc-red">{article.category}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Card hero: articolo principale ─────────────────────────
export function ArticleCardHero({ article }: { article: Article }) {
  return (
    <Link href={`/${article.slug}`} className="group block relative h-[437px] rounded-card overflow-hidden border-b-2 border-lc-red">
      {/* Immagine */}
      <Image
        src={article.imageUrl}
        alt={article.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 647px"
        priority
      />

      {/* Gradiente lineare dal basso */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgb(5,5,5) 24%, rgba(8,8,8,0) 100%)' }}
      />
      {/* Glow radiale rosso — esatto dal Figma (radialGradient centrato in basso) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 35% at 50% 108%, rgba(255,58,58,1) 0%, rgba(255,58,58,0) 65%)',
        }}
      />

      {/* Testo */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h2 className="font-akira font-bold text-[20px] text-white text-center leading-tight mb-3 line-clamp-3">
          {article.title}
        </h2>
        <div className="flex items-center justify-center gap-4 text-[13px] text-lc-muted font-montserrat">
          <span>{article.date}</span>
          <span className="opacity-60">|</span>
          <span>{article.author}</span>
          <span className="opacity-60">|</span>
          <span className="text-lc-red">{article.category}</span>
        </div>
      </div>
    </Link>
  )
}
