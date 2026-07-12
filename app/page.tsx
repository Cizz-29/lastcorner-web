import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import NewsTicker from '@/components/NewsTicker'
import HeroSection from '@/components/HeroSection'
import LatestNewsSection from '@/components/LatestNewsSection'
import NextEventSection from '@/components/NextEventSection'
import AltreNewsSection from '@/components/AltreNewsSection'
import Footer from '@/components/Footer'
import { NextEventSkeleton } from '@/components/Skeletons'
import { MOCK_ARTICLES, MOCK_OTHER_ARTICLES } from '@/lib/mockData'

export default async function HomePage() {
  const heroArticle = MOCK_ARTICLES[0]
  const sideArticles = MOCK_ARTICLES.slice(1, 5)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-6 pt-[96px] flex-1">

        {/* ── ULTIM'ORA ─────────────────────────────────────── */}
        <NewsTicker articles={MOCK_ARTICLES} />

        {/* ── HERO ──────────────────────────────────────────── */}
        <HeroSection
          heroArticle={heroArticle}
          sideArticles={sideArticles}
        />

        {/* ── LE ULTIME NEWS ────────────────────────────────── */}
        <LatestNewsSection articles={MOCK_ARTICLES} />

        {/* ── BANNER ORIZZONTALE ───────────────────────────── */}
        <div className="w-full h-[100px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center mb-12">
          <span className="font-montserrat text-[11px] text-lc-subtle">Spazio pubblicitario</span>
        </div>

        {/* ── PROSSIMO EVENTO F1 — in streaming, non blocca il resto della pagina ── */}
        <Suspense fallback={<NextEventSkeleton />}>
          <NextEventSection />
        </Suspense>

        {/* ── ALTRE NEWS — articoli non mostrati sopra ────────── */}
        <AltreNewsSection articles={MOCK_OTHER_ARTICLES} />

      </main>

      <Footer />
    </div>
  )
}
