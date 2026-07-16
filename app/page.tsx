import { Suspense } from 'react'
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
