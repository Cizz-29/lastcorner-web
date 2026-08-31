import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { STRUMENTI_LOCALI } from '@/lib/strumenti'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SessionTabs, { type SessionPanel } from '@/components/telemetria/SessionTabs'
import QualiCompare, { type QualiDriver } from '@/components/telemetria/QualiCompare'
import RacePace, { type RaceDriver } from '@/components/telemetria/RacePace'

// Pagina di un weekend: una scheda per ogni sessione disponibile (libere,
// qualifiche, sprint, gara). Per ciascuna si mostra il passo e, dove la
// pipeline l'ha raccolta, il confronto telemetrico dei giri.

// Solo i weekend generati qui sotto esistono: senza questa riga un indirizzo
// inventato farebbe partire una funzione per poi rispondere 404.
export const dynamicParams = false

export const metadata: Metadata = {
  title: 'Telemetria',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: { year: string; round: string }
}

interface SessionInfo {
  key: string
  label: string
  pace: boolean
  telemetry: boolean
}

interface IndexEntry {
  year: number
  round: number
  name: string
  circuit: string
  date: string
  sessions: (SessionInfo | string)[]
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
  if (!STRUMENTI_LOCALI) return []
  const index = (await readJson<IndexEntry[]>('index.json')) ?? []
  return index.map((e) => ({ year: String(e.year), round: String(e.round) }))
}

export default async function TelemetriaEventPage({ params }: PageProps) {
  if (!STRUMENTI_LOCALI) notFound()
  const index = (await readJson<IndexEntry[]>('index.json')) ?? []
  const event = index.find(
    (e) => String(e.year) === params.year && String(e.round) === params.round
  )
  if (!event) notFound()

  // I dati generati prima del supporto multi-sessione hanno "sessions" come
  // elenco di stringhe: in quel caso si invita a rigenerare invece di
  // mostrare una pagina a metà.
  const sessionInfos = event.sessions.filter(
    (s): s is SessionInfo => typeof s === 'object' && s !== null
  )
  const formatoVecchio = sessionInfos.length === 0 && event.sessions.length > 0

  const panels: SessionPanel[] = []
  for (const info of sessionInfos) {
    const basePath = `/telemetria-data/${params.year}/${params.round}/${info.key}`
    const [pace, laps] = await Promise.all([
      info.pace
        ? readJson<{ drivers: RaceDriver[] }>(params.year, params.round, info.key, 'pace.json')
        : Promise.resolve(null),
      info.telemetry
        ? readJson<{ drivers: QualiDriver[] }>(params.year, params.round, info.key, 'laps.json')
        : Promise.resolve(null),
    ])

    panels.push({
      key: info.key,
      label: info.label,
      telemetria: laps ? (
        <QualiCompare drivers={laps.drivers} dataPath={`${basePath}/tel`} />
      ) : null,
      passo: pace ? <RacePace drivers={pace.drivers} /> : null,
    })
  }

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

        {formatoVecchio ? (
          <div className="bg-lc-card border border-white/10 rounded-card p-6 max-w-xl">
            <p className="font-montserrat text-[14px] text-lc-subtle leading-relaxed">
              Questi dati sono in un formato precedente, che copriva solo qualifica e gara.
              Rigenerali dal pannello &quot;Genera dati&quot; nella pagina Telemetria per avere
              tutte le sessioni del weekend e la scelta del giro.
            </p>
          </div>
        ) : (
          <SessionTabs panels={panels} />
        )}

        <div className="h-16" />
      </main>
      <Footer />
    </div>
  )
}
