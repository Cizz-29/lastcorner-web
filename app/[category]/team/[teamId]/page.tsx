import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import { ArticleCardSmall } from '@/components/ArticleCard'
import BioBody from '@/components/BioBody'
import { getConstructorStandings, getDriverStandings, getConstructorPodiums, toRosterTeam, toRosterDriver } from '@/lib/f1api'
import { getRosterTeams, getRosterTeam, getRosterTeamDrivers, hasStaticRoster } from '@/lib/rosterData'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import { getTeamBio, getPersonalizzazioniTeam } from '@/lib/teamBios'
import { statisticheTeam } from '@/lib/statisticheF1'
import { domandeTeam, nomeTeam } from '@/lib/domandeRapide'
import DomandeRapide from '@/components/DomandeRapide'
import { getCategoryConfig } from '@/lib/categories'
import { getArticoliConTag } from '@/lib/sanity/articles'
import type { RosterTeam, RosterDriver } from '@/lib/rosterTypes'
import { metadati, sigla, SITE_URL } from '@/lib/seo'
import Briciole from '@/components/Briciole'
import { jsonLd } from '@/lib/jsonLd'
import { grafo } from '@/lib/datiStrutturati'

// Nessuna scadenza dichiarata qui. Per la Formula 1 pero' la pagina si
// rigenera ogni 12 ore (e a ogni deploy, che dopo ogni gara arriva da solo:
// vedi lib/f1api.ts): legge i dati F1 da Jolpica con revalidate 43200, e in
// Next 14 vale la frequenza piu' alta fra quella della pagina e quella dei
// suoi fetch (verificabile in .next/prerender-manifest.json). Per le altre
// categorie, che leggono il roster statico, si aggiorna al deploy o quando
// il webhook di Sanity la invalida.
export const revalidate = false

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
  const config = getCategoryConfig(params.category)
  if (!team || !config) return { title: 'Team non trovato' }
  const anno = new Date().getFullYear()
  const classifica =
    team.position && team.points
      ? ` ${team.position}° nel Mondiale Costruttori ${anno} con ${team.points} punti.`
      : ''
  const stats = params.category === 'formula-1' ? statisticheTeam(team.constructorId) : null
  if (stats) {
    const numeri = [
      stats.mondiali.length > 0
        ? `${stats.mondiali.length} Mondial${stats.mondiali.length === 1 ? 'e' : 'i'} costruttori`
        : null,
      `${stats.vittorie} vittori${stats.vittorie === 1 ? 'a' : 'e'}`,
      `${stats.pole} pole`,
    ]
      .filter(Boolean)
      .join(', ')
    const nome = nomeTeam(team.name, team.constructorId)
    return metadati({
      titolo: `${nome}: statistiche, vittorie e classifica F1 ${anno}`,
      titoloAssoluto: true,
      descrizione: `${nome} in Formula 1: ${numeri}.${classifica} I piloti ${anno}, la storia e le ultime notizie sul team.`,
      percorso: `/${params.category}/team/${params.teamId}`,
    })
  }
  return metadati({
    titolo: `${team.name}: piloti, risultati e news ${sigla(config)}`,
    descrizione: `${team.name} in ${config.label}: la formazione ${anno}, i risultati e tutte le ultime notizie sul team.${classifica}`,
    percorso: `/${params.category}/team/${params.teamId}`,
  })
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-lc-card rounded-card-sm border border-white/10 py-4 px-3 text-center">
      <p className="font-akira font-extrabold text-[22px] text-white leading-none mb-2">{value}</p>
      <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-widest">{label}</p>
    </div>
  )
}

/** SportsTeam: la squadra, lo sport e i suoi piloti (athlete), ciascuno con
 *  il link alla sua pagina. Cosi' Google collega team e piloti fra loro. */
function datiTeam(team: RosterTeam, lineup: RosterDriver[], slug: string, categoria: string) {
  const url = `${SITE_URL}/${slug}/team/${team.constructorId}`
  return grafo({
    '@type': 'SportsTeam',
    '@id': url,
    name: team.name,
    url,
    sport: categoria,
    sameAs: team.wikipedia ? [team.wikipedia] : undefined,
    athlete: lineup.map((d) => ({
      '@type': 'Person',
      name: `${d.givenName} ${d.familyName}`,
      url: `${SITE_URL}/${slug}/piloti/${d.driverId}`,
    })),
  })
}

export default async function TeamPage({ params }: TeamPageProps) {
  const config = getCategoryConfig(params.category)
  if (!config) notFound()

  const team = await findTeam(params.category, params.teamId)
  if (!team) notFound()

  const isLive = params.category === 'formula-1' && team.position !== undefined
  const stats = params.category === 'formula-1' ? statisticheTeam(team.constructorId) : null
  // Podi della stagione dal file delle statistiche (ogni monoposto sul podio
  // conta, come nelle statistiche ufficiali); Jolpica solo se mancano.
  const [podiums, lineup] = await Promise.all([
    isLive
      ? stats?.stagione
        ? Promise.resolve(stats.stagione.podi)
        : getConstructorPodiums(params.teamId)
      : Promise.resolve(null),
    findLineup(params.category, params.teamId),
  ])

  const color = getTeamColor(team.name)
  const flagUrl = team.nationality ? getFlagUrl(team.nationality) : null

  const relatedNews = await getArticoliConTag(params.teamId, 6)
  const bio = await getTeamBio(team.constructorId)

  let domande: ReturnType<typeof domandeTeam> = []
  if (params.category === 'formula-1') {
    const [classifica, personalizzate] = await Promise.all([
      getConstructorStandings(),
      getPersonalizzazioniTeam(team.constructorId),
    ])
    const rif = team.position === '1' ? classifica[1] : classifica[0]
    domande = domandeTeam({
      nome: nomeTeam(team.name, team.constructorId),
      breve: nomeTeam(team.name, team.constructorId),
      stats,
      anno: new Date().getFullYear(),
      personalizzate,
      classifica: {
        posizione: team.position ? Number(team.position) : undefined,
        punti: team.points !== undefined ? Number(team.points) : undefined,
        riferimento:
          rif && rif.Constructor.constructorId !== team.constructorId
            ? { nome: nomeTeam(rif.Constructor.name, rif.Constructor.constructorId), punti: Number(rif.points) }
            : undefined,
      },
    })
  }

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <Briciole
          voci={[
            { nome: `Team ${config.label}`, percorso: `/${config.slug}/team` },
            { nome: team.name, percorso: `/${config.slug}/team/${team.constructorId}` },
          ]}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(datiTeam(team, lineup, config.slug, config.label)) }}
        />

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
          {/* min-w-0: senza, la colonna di una griglia non scende mai sotto la
              larghezza minima del suo contenuto. Un'immagine larga bastava a
              gonfiare la colonna e a spingere la barra laterale fuori dallo
              schermo. Con min-w-0 la colonna vale esattamente lo spazio
              disponibile e il contenuto si adatta a lei. */}
          <div className="min-w-0">
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

            <DomandeRapide domande={domande} />

            {/* Overview storia team */}
            <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
              Il team
            </h2>
            <div className="mb-10">
              <BioBody blocks={bio} />
            </div>

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
