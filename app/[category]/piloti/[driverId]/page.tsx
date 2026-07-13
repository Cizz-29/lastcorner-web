import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import { ArticleCardSmall, type Article } from '@/components/ArticleCard'
import { getDriverStandings, getDriverPodiums, toRosterDriver } from '@/lib/f1api'
import { getRosterDrivers, getRosterDriver, hasStaticRoster } from '@/lib/rosterData'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import { getDriverBio } from '@/lib/driverBios'
import { getCategoryConfig } from '@/lib/categories'
import { MOCK_ARTICLES, MOCK_OTHER_ARTICLES } from '@/lib/mockData'
import type { RosterDriver } from '@/lib/rosterTypes'

const ALL_ARTICLES: Article[] = [...MOCK_ARTICLES, ...MOCK_OTHER_ARTICLES]

interface DriverPageProps {
  params: { category: string; driverId: string }
}

// Pagine individuali generate per la F1 (dati live) e per F2/F3 (roster
// statico). WEC/WRC/Altro non hanno una fonte affidabile, quindi non
// generano pagine pilota.
export async function generateStaticParams({ params }: { params: { category: string } }) {
  if (params.category === 'formula-1') {
    const drivers = await getDriverStandings()
    return drivers.map((d) => ({ driverId: d.Driver.driverId }))
  }
  if (hasStaticRoster(params.category)) {
    return getRosterDrivers(params.category).map((d) => ({ driverId: d.driverId }))
  }
  return []
}

async function findDriver(category: string, driverId: string): Promise<RosterDriver | undefined> {
  if (category === 'formula-1') {
    const drivers = await getDriverStandings()
    const found = drivers.find((d) => d.Driver.driverId === driverId)
    return found ? toRosterDriver(found) : undefined
  }
  return getRosterDriver(category, driverId)
}

export async function generateMetadata({ params }: DriverPageProps): Promise<Metadata> {
  const driver = await findDriver(params.category, params.driverId)
  if (!driver) return { title: 'Pilota non trovato' }
  return { title: `${driver.givenName} ${driver.familyName}` }
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-lc-card rounded-card-sm border border-white/10 py-4 px-3 text-center">
      <p className="font-akira font-extrabold text-[22px] text-white leading-none mb-2">{value}</p>
      <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-widest">{label}</p>
    </div>
  )
}

export default async function DriverPage({ params }: DriverPageProps) {
  const config = getCategoryConfig(params.category)
  if (!config) notFound()

  const driver = await findDriver(params.category, params.driverId)
  if (!driver) notFound()

  const isLive = params.category === 'formula-1' && driver.position !== undefined
  const podiums = isLive ? await getDriverPodiums(driver.driverId) : null

  const color = getTeamColor(driver.teamName)
  const flagUrl = driver.nationality ? getFlagUrl(driver.nationality) : null
  const fullName = `${driver.givenName} ${driver.familyName}`

  const relatedNews = ALL_ARTICLES.filter(
    (a) => a.tags?.includes(driver.driverId) || a.tags?.includes(driver.teamId)
  ).slice(0, 6)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-20 pt-[96px] flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Percorso" className="font-montserrat text-[11px] text-lc-subtle mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-lc-red transition-colors duration-200">Home</Link>
          <span className="opacity-50">/</span>
          <Link href={`/${config.slug}/piloti`} className="hover:text-lc-red transition-colors duration-200">
            Piloti {config.label}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white/60">{fullName}</span>
        </nav>

        {/* Header */}
        <div className="relative bg-lc-card rounded-card border border-white/10 overflow-hidden p-6 lg:p-8 mb-10">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {flagUrl && (
                  <Image src={flagUrl} alt={driver.nationality ?? ''} width={30} height={21} className="rounded-[2px]" />
                )}
                <span className="font-montserrat text-[11px] text-lc-subtle uppercase tracking-widest">
                  {[driver.nationality, driver.code].filter(Boolean).join(' — ')}
                </span>
              </div>
              <h1 className="font-akira font-extrabold text-[26px] lg:text-[38px] text-white leading-tight mb-2">
                {fullName.toUpperCase()}
              </h1>
              <Link
                href={`/${config.slug}/team/${driver.teamId}`}
                className="font-montserrat text-[13px] text-lc-subtle hover:text-lc-red transition-colors duration-200"
              >
                {driver.teamName} →
              </Link>
            </div>
            <span
              className="font-akira font-extrabold text-[64px] lg:text-[88px] leading-none shrink-0 tabular-nums"
              style={{ color }}
            >
              {driver.permanentNumber}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 mb-16">
          <div>
            {/* Statistiche stagione — solo dove disponibile un dato live (F1) */}
            {isLive && (
              <>
                <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
                  Stagione {new Date().getFullYear()}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                  <StatTile label="Posizione" value={`P${driver.position}`} />
                  <StatTile label="Punti" value={driver.points ?? '—'} />
                  <StatTile label="Vittorie" value={driver.wins ?? '—'} />
                  <StatTile label="Podi" value={podiums ?? '—'} />
                </div>
              </>
            )}

            {/* Overview carriera */}
            <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
              Carriera
            </h2>
            <p className="font-montserrat text-[14px] text-white/85 leading-relaxed mb-10">
              {getDriverBio(driver.driverId)}
            </p>

            <AdSlot height={120} label="Google AdSense" className="mb-10" />

            {/* News correlate */}
            <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
              News relative a {driver.familyName}
            </h2>
            {relatedNews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {relatedNews.map((a) => (
                  <ArticleCardSmall key={a.id} article={a} />
                ))}
              </div>
            ) : (
              <p className="font-montserrat text-[13px] text-lc-subtle italic">
                Nessuna news disponibile al momento.
              </p>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <SocialCard />
            <AdSlot height={250} label="300×250" />
            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
