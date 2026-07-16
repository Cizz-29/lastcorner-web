import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import { ArticleCardSmall, type Article } from '@/components/ArticleCard'
import { getConstructorStandings, getDriverStandings, getConstructorPodiums, toRosterTeam, toRosterDriver } from '@/lib/f1api'
import { getRosterTeams, getRosterTeam, getRosterTeamDrivers, hasStaticRoster } from '@/lib/rosterData'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import { getTeamBio } from '@/lib/teamBios'
import { getCategoryConfig } from '@/lib/categories'
import { MOCK_ARTICLES, MOCK_OTHER_ARTICLES } from '@/lib/mockData'
import type { RosterTeam, RosterDriver } from '@/lib/rosterTypes'

const ALL_ARTICLES: Article[] = [...MOCK_ARTICLES, ...MOCK_OTHER_ARTICLES]

interface TeamPageProps {
  params: { category: string; teamId: string }
}

// Pagine individuali generate per la F1 (dati live) e per F2/F3 (roster
// statico). WEC/WRC/Altro non hanno una fonte affidabile.
export async function generateStaticParams({ params }: { params: { category: string } }) {
  if (params.category === 'formula-1') {
    const teams = await getConstructorStandings()
    return teams.map((t) => ({ teamId: t.Constructor.constructorId }))
  }
  if (hasStaticRoster(params.category)) {
    return getRosterTeams(params.category).map((t) => ({ teamId: t.constructorId }))
  }
  return []
}

async function findTeam(category: string, teamId: string): Promise<RosterTeam | undefined> {
  if (category === 'formula-1') {
    const teams = await getConstructorStandings()
    const found = teams.find((t) => t.Constructor.constructorId === teamId)
    return found ? toRosterTeam(found) : undefined
  }
  return getRosterTeam(category, teamId)
}

async function findLineup(category: string, teamId: string): Promise<RosterDriver[]> {
  if (category === 'formula-1') {
    const drivers = await getDriverStandings()
    return drivers.filter((d) => d.Constructors[0]?.constructorId === teamId).map(toRosterDriver)
  }
  return getRosterTeamDrivers(category, teamId)
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const team = await findTeam(params.category, params.teamId)
  if (!team) return { title: 'Team non trovato' }
  return { title: team.name }
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-lc-card rounded-card-sm border border-white/10 py-4 px-3 text-center">
      <p className="font-akira font-extrabold text-[22px] text-white leading-none mb-2">{value}</p>
      <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-widest">{label}</p>
    </div>
  )
}

export default async function TeamPage({ params }: TeamPageProps) {
  const config = getCategoryConfig(params.category)
  if (!config) notFound()

  const team = await findTeam(params.category, params.teamId)
  if (!team) notFound()

  const isLive = params.category === 'formula-1' && team.position !== undefined
  const [podiums, lineup] = await Promise.all([
    isLive ? getConstructorPodiums(params.teamId) : Promise.resolve(null),
    findLineup(params.category, params.teamId),
  ])

  const color = getTeamColor(team.name)
  const flagUrl = team.nationality ? getFlagUrl(team.nationality) : null

    const relatedNews = ALL_ARTICLES.filter((a) =>
          a.tags?.some((t) => t.toLowerCase() === params.teamId.toLowerCase())
        ).slice(0, 6)
  
  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Percorso" className="font-montserrat text-[11px] text-lc-subtle mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-lc-red transition-colors duration-200">Home</Link>
          <span className="opacity-50">/</span>
          <Link href={`/${config.slug}/team`} className="hover:text-lc-red transition-colors duration-200">
            Team {config.label}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white/60">{team.name}</span>
        </nav>

        {/* Header */}
        <div className="relative bg-lc-card rounded-card border border-white/10 overflow-hidden p-6 lg:p-8 mb-10">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
          {(flagUrl || team.nationality) && (
            <div className="flex items-center gap-3 mb-3">
              {flagUrl && (
                <Image src={flagUrl} alt={team.nationality ?? ''} width={30} height={21} className="rounded-[2px]" />
              )}
              <span className="font-montserrat text-[11px] text-lc-subtle uppercase tracking-widest">
                {team.nationality}
              </span>
            </div>
          )}
          <h1 className="font-akira font-extrabold text-[26px] lg:text-[38px] text-white leading-tight mb-4">
            {team.name.toUpperCase()}
          </h1>
          <div className="flex flex-wrap gap-3">
            {lineup.map((d) => (
              <Link
                key={d.driverId}
                href={`/${config.slug}/piloti/${d.driverId}`}
                className="font-montserrat text-[12px] text-lc-subtle hover:text-lc-red transition-colors duration-200 bg-white/5 rounded-full px-3 py-1"
              >
                #{d.permanentNumber} {d.familyName} →
              </Link>
            ))}
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
                  <StatTile label="Posizione" value={`P${team.position}`} />
                  <StatTile label="Punti" value={team.points ?? '—'} />
                  <StatTile label="Vittorie" value={team.wins ?? '—'} />
                  <StatTile label="Podi" value={podiums ?? '—'} />
                </div>
              </>
            )}

            {/* Overview storia team */}
            <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
              Il team
            </h2>
            <p className="font-montserrat text-[14px] text-white/85 leading-relaxed mb-10">
              {getTeamBio(team.constructorId)}
            </p>

            <AdSlot height={120} label="Google AdSense" className="mb-10" />

            {/* News correlate */}
            <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
              News relative a {team.name}
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
