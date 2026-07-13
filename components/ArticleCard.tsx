import Link from 'next/link'
import Image from 'next/image'

// Blocco di contenuto per il corpo di un articolo. Struttura volutamente
// minimale: quando arriverà il CMS (Sanity) questi blocchi verranno
// popolati dalla query invece che dai mock, senza cambiare i componenti
// che li consumano.
export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; caption?: string }

export interface Article {
  id: string
  title: string
  slug: string
  category: string
  author: string
  date: string
  imageUrl: string
  excerpt?: string
  breaking?: boolean
  /** Corpo dell'articolo a blocchi — assente per gli articoli mock "di contorno" */
  content?: ArticleBlock[]
}

// ── Card piccola: colonna destra hero (orizzontale) ──────────
export function ArticleCardSmall({ article }: { article: Article }) {
  return (
    <Link href={`/${article.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2 rounded-[21px]">
      <div className="relative h-[94px] w-full bg-lc-card rounded-[21px] overflow-hidden border-t border-b border-r border-white/60 flex items-stretch">
        {/* Immagine a sinistra */}
        <div className="relative w-[140px] shrink-0 overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="140px"
          />
          {/* Sfumatura verso il testo: l'immagine resta leggibile più a lungo,
              la dissolvenza comincia solo nell'ultimo terzo */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(20,20,24,0) 55%, rgba(20,20,24,1) 100%)' }}
          />
        </div>

        {/* Testo a destra */}
        <div className="flex flex-col justify-between py-2 px-3 flex-1 min-w-0">
          <p className="font-akira font-bold text-[11px] text-white leading-tight line-clamp-3 text-right">
            {article.title}
          </p>
          {/* Divider sottile vicino al titolo — riga corta allineata a destra */}
          <div className="w-8 h-px bg-white/25 my-1 self-end" />
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

// ── Card griglia: "Le ultime news" ──────────────────────────
// Struttura identica alla card hero, in scala ridotta: immagine a piena
// altezza, sfumatura scura + glow rosso dal basso, titolo sovrapposto.
export function ArticleCardGrid({ article }: { article: Article }) {
  return (
    <Link href={`/${article.slug}`} className="group block relative h-[260px] rounded-card overflow-hidden border-b-2 border-lc-red focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2">
      <Image
        src={article.imageUrl}
        alt={article.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 348px"
      />
      {/* Gradiente lineare dal basso */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgb(5,5,5) 20%, rgba(8,8,8,0) 70%)' }}
      />
      {/* Glow radiale rosso dal basso */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 55% at 50% 115%, rgba(255,58,58,0.95) 0%, rgba(255,58,58,0) 65%)',
        }}
      />
      {/* Testo sovrapposto in basso */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="font-akira font-bold text-[13px] text-white text-center leading-snug line-clamp-3 mb-2">
          {article.title}
        </h3>
        <div className="flex items-center justify-center gap-2 text-[9px] text-lc-muted font-montserrat flex-wrap">
          <span>{article.date}</span>
          <span className="opacity-60">|</span>
          <span>{article.author}</span>
          <span className="opacity-60">|</span>
          <span>{article.category}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Card hero: articolo principale ─────────────────────────
export function ArticleCardHero({ article }: { article: Article }) {
  return (
    <Link href={`/${article.slug}`} className="group block relative h-[437px] rounded-card overflow-hidden border-b-2 border-lc-red focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2">
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
        style={{ background: 'linear-gradient(0deg, rgb(5,5,5) 24%, rgba(8,8,8,0) 75%)' }}
      />
      {/* Glow radiale — radioso verso il centro */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(255,58,58,1) 0%, rgba(255,58,58,0.4) 35%, rgba(255,58,58,0) 70%)',
        }}
      />
      {/* Testo sovrapposto in basso */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h2 className="font-akira font-bold text-[20px] text-white text-center leading-tight mb-3 line-clamp-3">
          {article.title}
        </h2>
        <div className="flex items-center justify-center gap-4 text-[13px] text-lc-muted font-montserrat">
          <span>{article.date}</span>
          <span className="opacity-60">|</span>
          <span>{article.author}</span>
          <span className="opacity-60">|</span>
          <span>{article.category}</span>
        </div>
      </div>
    </Link>
  )
}
