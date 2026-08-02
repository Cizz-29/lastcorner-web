import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QualiCompare, { type QualiDriver } from '@/components/telemetria/QualiCompare'
import RacePace, { type RaceDriver } from '@/components/telemetria/RacePace'
import SessionTabs from '@/components/telemetria/SessionTabs'

// Pagina di un singolo weekend: legge i JSON prodotti dalla pipeline
// (scripts/telemetry) da public/telemetria-data/<anno>/<round>/.
// Area riservata: il middleware blocca l'accesso senza cookie di sessione.

export const metadata: Metadata = {
  title: 'Telemetria',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: { year: string; round: string }
}

interface IndexEntry {
  year: number
  round: number
  name: string
  circuit: string
  date: string
  sessions: string[]
}

const DATA_DIR = path.join(process.cwd(), 'public', 'telemetria-data')

async function readJson<T>(...segments: string[]): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, ...segments), 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  const index = (await readJson<IndexEntry[]>('index.json')) ?? []
  return index.map((e) => ({ year: String(e.year), round: String(e.round) }))
}

export default async function TelemetriaEventPage({ params }: PageProps) {
  const index = (await readJson<IndexEntry[]>('index.json')) ?? []
  const event = index.find(
    (e) => String(e.year) === params.year && String(e.round) === params.round
  )
  if (!event) notFound()

  const [quali, race] = await Promise.all([
    readJson<{ drivers: QualiDriver[] }>(params.year, params.round, 'qualifying.json'),
    readJson<{ drivers: RaceDriver[] }>(params.year, params.round, 'race.json'),
  ])

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <nav aria-label="Percorso" className="font-montserrat text-[11px] text-lc-subtle mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/telemetria" className="hover:text-lc-red transition-colors duration-200">
            Telemetria
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white/60">{event.name}</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            {event.name}
          </h1>
        </div>
        <p className="font-montserrat text-[13px] text-lc-subtle mb-10">
          {event.circuit} — {event.year}, round {event.round}
        </p>

        <SessionTabs
          hasQuali={!!quali}
          hasRace={!!race}
          quali={
            quali ? (
              // I dati generati prima dell'introduzione della scelta del giro
              // non hanno l'elenco "laps": invece di rompersi, la pagina
              // invita a rigenerarli dal pannello in /telemetria.
              Array.isArray(quali.drivers?.[0]?.laps) ? (
                <QualiCompare
                  drivers={quali.drivers}
                  dataPath={`/telemetria-data/${params.year}/${params.round}`}
                />
              ) : (
                <div className="bg-lc-card border border-white/10 rounded-card p-6 max-w-xl">
                  <p className="font-montserrat text-[14px] text-lc-subtle leading-relaxed">
                    Questi dati sono in un formato precedente e non permettono di scegliere il
                    giro. Rigenerali dal pannello &quot;Genera dati&quot; nella pagina Telemetria
                    per abilitare il confronto completo.
                  </p>
                </div>
              )
            ) : null
          }
          race={race ? <RacePace drivers={race.drivers} /> : null}
        />

        <div className="h-16" />
      </main>
      <Footer />
    </div>
  )
}
