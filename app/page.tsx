import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import LatestNewsSection from '@/components/LatestNewsSection'
import CountdownWidget from '@/components/CountdownWidget'
import { MOCK_ARTICLES } from '@/lib/mockData'
import { getNextRace } from '@/lib/f1api'

export default async function HomePage() {
  // Fetch dati F1 in parallelo (Server Component = zero JS lato client per questa parte)
  const nextRace = await getNextRace()

  // Articoli: in sviluppo usa mock, in produzione sostituiremo con Sanity
  const heroArticle = MOCK_ARTICLES[0]
  const sideArticles = MOCK_ARTICLES.slice(1, 5)
  const latestArticles = MOCK_ARTICLES.slice(0, 4)

  return (
    <div className="min-h-screen bg-lc-bg">
      <Navbar />

      {/* Contenuto principale — padding top per compensare la navbar fixed */}
      <main className="max-w-[1280px] mx-auto px-6 pt-[96px]">

        {/* ── SEZIONE HERO ─────────────────────────────────────── */}
        <HeroSection
          heroArticle={heroArticle}
          sideArticles={sideArticles}
        />

        {/* ── LE ULTIME NEWS ────────────────────────────────────── */}
        <LatestNewsSection
          articles={latestArticles}
        />

        {/* ── BANNER ORIZZONTALE ───────────────────────────────── */}
        <div className="w-full h-[130px] bg-lc-card rounded-card border border-white/10 flex items-center justify-center mb-10">
          <span className="font-montserrat text-[11px] text-lc-subtle">
            Spazio pubblicitario 1280×130
          </span>
        </div>

        {/* ── COUNTDOWN PROSSIMO EVENTO ────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="font-akira font-extrabold text-[32px] md:text-[48px] whitespace-nowrap">
              <span className="text-lc-red">F1:</span>{' '}
              <span className="text-white">PROSSIMO EVENTO</span>
            </h2>
          </div>
          <div className="max-w-sm">
            <CountdownWidget initialRace={nextRace} />
          </div>
        </section>

      </main>

      {/* ── FOOTER PLACEHOLDER ──────────────────────────────────── */}
      <footer className="border-t border-white/10 mt-16 py-8">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <p className="font-montserrat text-[12px] text-lc-subtle">
            © 2025 Lastcorner.net — Il motorsport a 360°
          </p>
        </div>
      </footer>
    </div>
  )
}
