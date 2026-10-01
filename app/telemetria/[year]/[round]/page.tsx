import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SessionTabs, { type SessionPanel } from '@/components/telemetria/SessionTabs'
import QualiCompare, { type QualiDriver } from '@/components/telemetria/QualiCompare'
import RacePace, { type RaceDriver } from '@/components/telemetria/RacePace'
import type { Tracciato } from '@/components/telemetria/MappaTracciato'
import { dataWeekend, leggiJson, nomeGp, sessioniDi, weekendTelemetria } from '@/lib/telemetria'
import { metadati } from '@/lib/seo'

// Pagina di un weekend: una scheda per ogni sessione disponibile (libere,
// qualifiche, sprint, gara). Per ciascuna si mostra il passo e, dove la
// pipeline l'ha raccolta, il confronto telemetrico dei giri.
//
// Pubblica dal 1° ottobre 2026: prima era uno strumento di redazione che
// girava solo sul PC.

// Solo i weekend elaborati esistono: un indirizzo inventato risponde 404
// senza eseguire nulla.
export const dynamicParams = false

interface PageProps {
  params: { year: string; round: string }
}

async function trovaWeekend(params: PageProps['params']) {
  const indice = await weekendTelemetria()
  return indice.find((e) => String(e.year) === params.year && String(e.round) === params.round)
}

export async function generateStaticParams() {
  return (await weekendTelemetria()).map((e) => ({ year: String(e.year), round: String(e.round) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const w = await trovaWeekend(params)
  if (!w) return { title: 'Telemetria non trovata' }
  const gp = nomeGp(w.name)
  return metadati({
    titolo: `Telemetria F1 ${gp} ${w.year}: qualifica e passo`,
    descrizione: `La telemetria del ${gp} ${w.year} a ${w.circuit}: confronta i giri dei piloti con velocità, acceleratore, freno, marce, delta e microsettori sul tracciato, e il passo di libere e gara.`,
    percorso: `/telemetria/${w.year}/${w.round}`,
  })
}

/** Una frase sulla qualifica per chi arriva da Google (e per Google): chi ha
 *  fatto la pole e con quali distacchi. I grafici si disegnano nel browser,
 *  quindi senza questo la pagina avrebbe ben poco testo da indicizzare. */
function sintesiQualifica(piloti: QualiDriver[]): string | null {
  const primi = [...piloti]
    .filter((d) => d.lapTime != null && d.position != null)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .slice(0, 3)
  if (primi.length < 2) return null
  const tempo = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${(s - m * 60).toFixed(3).padStart(6, '0')}`
  }
  const [p, ...altri] = primi
  const resto = altri
    .map((d) => `${d.name} (+${((d.lapTime ?? 0) - (p.lapTime ?? 0)).toFixed(3)})`)
    .join(' e ')
  return `Il giro più veloce della qualifica è di ${p.name} (${p.team}) in ${tempo(p.lapTime ?? 0)}, davanti a ${resto}.`
}

export default async function TelemetriaEventPage({ params }: PageProps) {
  const event = await trovaWeekend(params)
  if (!event) notFound()

  const sessionInfos = sessioniDi(event)
  const tracciato = await leggiJson<Tracciato>(params.year, params.round, 'track.json')

  const panels: SessionPanel[] = []
  let sintesi: string | null = null
  for (const info of sessionInfos) {
    const basePath = `/telemetria-data/${params.year}/${params.round}/${info.key}`
    const [pace, laps] = await Promise.all([
      info.pace
        ? leggiJson<{ drivers: RaceDriver[] }>(params.year, params.round, info.key, 'pace.json')
        : Promise.resolve(null),
      info.telemetry
        ? leggiJson<{ drivers: QualiDriver[] }>(params.year, params.round, info.key, 'laps.json')
        : Promise.resolve(null),
    ])
    if (info.key === 'Q' && laps) sintesi = sintesiQualifica(laps.drivers)

    panels.push({
      key: info.key,
      label: info.label,
      telemetria: laps ? (
        <QualiCompare drivers={laps.drivers} dataPath={`${basePath}/tel`} tracciato={tracciato} />
      ) : null,
      passo: pace ? <RacePace drivers={pace.drivers} /> : null,
    })
  }

  const gp = nomeGp(event.name)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <nav aria-label="Percorso" className="font-montserrat text-[11px] text-lc-subtle mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-lc-red transition-colors duration-200">Home</Link>
          <span className="opacity-50">/</span>
          <Link href="/telemetria" className="hover:text-lc-red transition-colors duration-200">
            Telemetria
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white/60">{gp} {event.year}</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[20px] lg:text-[28px] text-white leading-tight uppercase">
            Telemetria {gp} {event.year}
          </h1>
        </div>
        <p className="font-montserrat text-[13px] text-lc-subtle mb-4">
          {event.circuit} · {dataWeekend(event.date)} · round {event.round}
        </p>
        <p className="font-montserrat text-[15px] text-white/85 leading-relaxed max-w-[72ch] mb-10">
          {sintesi ? `${sintesi} ` : ''}
          Scegli fino a quattro giri e confrontali curva per curva: velocità, acceleratore, freno,
          marce e delta, con i microsettori colorati per chi è stato più veloce.
        </p>

        <SessionTabs panels={panels} />

        <div className="h-16" />
      </main>
      <Footer />
    </div>
  )
}
