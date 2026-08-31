import { Suspense } from 'react'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import NewsTicker from '@/components/NewsTicker'
import HeroSection from '@/components/HeroSection'
import LatestNewsSection from '@/components/LatestNewsSection'
import NextEventSection from '@/components/NextEventSection'
import AltreNewsSection from '@/components/AltreNewsSection'
import Footer from '@/components/Footer'
import AdSlot from '@/components/AdSlot'
import { NextEventSkeleton } from '@/components/Skeletons'
import { getAllArticles } from '@/lib/sanity/articles'

// Numero di articoli "in evidenza" (hero + ultime news): gli articoli reali
// da Sanity, essendo in testa all'elenco, hanno sempre la priorità qui.
const NEWS_COUNT = 8

// La home e' l'unica pagina il cui canonical e' '/'. Prima stava nel layout ed
// era ereditato da tutto il sito (vedi il commento in app/layout.tsx).
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

// Pagina statica a tempo indeterminato: si aggiorna SOLO su richiesta,
// quando Sanity chiama /api/revalidate alla pubblicazione (quel gestore
// include sempre '/' fra i percorsi che rinfresca).
//
// Prima qui c'era revalidate = 60. Con una finestra di 60 secondi la home
// si rigenerava fino a 1.440 volte al giorno, e ogni rigenerazione scarica
// i metadati di tutti gli articoli per mostrarne poco piu' di venti: era la
// voce principale del consumo di CPU del piano. Il webhook fa lo stesso
// lavoro cinque volte al giorno, quando serve davvero.
export const revalidate = false

export default async function HomePage() {
  const allArticles = await getAllArticles()
  const heroArticle = allArticles[0]
  const sideArticles = allArticles.slice(1, 5)
  const latestNewsArticles = allArticles.slice(0, NEWS_COUNT)
  const altreNewsArticles = allArticles.slice(NEWS_COUNT)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">

        {/* ── ULTIM'ORA ─────────────────────────────────────── */}
        <NewsTicker articles={allArticles} />

        {/* ── HERO ──────────────────────────────────────────── */}
        <HeroSection
          heroArticle={heroArticle}
          sideArticles={sideArticles}
        />

        {/* ── LE ULTIME NEWS ────────────────────────────────── */}
        <LatestNewsSection articles={latestNewsArticles} />

        {/* ── BANNER ORIZZONTALE ───────────────────────────── */}
        <AdSlot height={100} className="mb-12" />

        {/* ── PROSSIMO EVENTO F1 — in streaming, non blocca il resto della pagina ── */}
        <Suspense fallback={<NextEventSkeleton />}>
          <NextEventSection />
        </Suspense>

        {/* ── ALTRE NEWS — articoli non mostrati sopra ────────── */}
        <AltreNewsSection articles={altreNewsArticles} />

      </main>

      <Footer />
    </div>
  )
}
