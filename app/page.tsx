import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import LatestNewsSection from '@/components/LatestNewsSection'
import NextEventSection from '@/components/NextEventSection'
import { MOCK_ARTICLES } from '@/lib/mockData'

export default async function HomePage() {
  const heroArticle = MOCK_ARTICLES[0]
  const sideArticles = MOCK_ARTICLES.slice(1, 5)
  const latestArticles = MOCK_ARTICLES.slice(0, 4)

  return (
    <div className="min-h-screen bg-lc-bg">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-6 pt-[96px]">

        {/* ── HERO ──────────────────────────────────────────── */}
        <HeroSection
          heroArticle={heroArticle}
          sideArticles={sideArticles}
        />

        {/* ── LE ULTIME NEWS ────────────────────────────────── */}
        <LatestNewsSection articles={latestArticles} />

        {/* ── BANNER ORIZZONTALE ───────────────────────────── */}
        <div className="w-full h-[100px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center mb-12">
          <span className="font-montserrat text-[11px] text-lc-subtle">Spazio pubblicitario</span>
        </div>

        {/* ── PROSSIMO EVENTO F1 ────────────────────────────── */}
        <NextEventSection />

      </main>

      <footer className="border-t border-white/10 mt-8 py-8">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <p className="font-montserrat text-[12px] text-lc-subtle">
            © 2025 Lastcorner.net — Il motorsport a 360°
          </p>
        </div>
      </footer>
    </div>
  )
}
