import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { STRUMENTI_LOCALI } from '@/lib/strumenti'

// Indice dell'area Telemetria: elenca i weekend gia' elaborati. I dati sono
// JSON su disco in public/telemetria-data/ (non piu' versionati), prodotti
// dallo script Python. Questa pagina legge solo l'indice.
//
// Strumento di redazione: esiste solo in locale (vedi lib/strumenti.ts).

export const metadata: Metadata = {
  title: 'Telemetria',
  robots: { index: false, follow: false },
}

interface IndexEntry {
  year: number
  round: number
  name: string
  circuit: string
  date: string
  sessions: string[] // es. ["Q", "R"]
}

async function readIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'public', 'telemetria-data', 'index.json'),
      'utf-8'
    )
    const parsed = JSON.parse(raw) as IndexEntry[]
    return parsed.sort((a, b) => b.year - a.year || b.round - a.round)
  } catch {
    return []
  }
}

export default async function TelemetriaIndexPage() {
  if (!STRUMENTI_LOCALI) notFound()
  const events = await readIndex()

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            Telemetria
          </h1>
        </div>
        <p className="font-montserrat text-[13px] text-lc-subtle mb-10">
          Area interna — confronto giri di qualifica e passo gara, weekend per weekend.
        </p>

        <div className="bg-lc-card border border-white/10 rounded-card p-6 mb-10 max-w-2xl">
          <p className="font-akira font-bold text-[13px] text-white mb-3">Elaborare un weekend</p>
          <p className="font-montserrat text-[13px] text-lc-subtle leading-relaxed mb-3">
            Dalla cartella <code className="text-white">lastcorner</code>, con il numero del round:
          </p>
          <pre className="font-mono text-[12px] text-white bg-black/40 rounded-lg p-3 overflow-x-auto">python scripts\telemetry\process_session.py 2026 13</pre>
          <p className="font-montserrat text-[12px] text-lc-subtle leading-relaxed mt-3">
            Oppure <code className="text-white">--auto</code> al posto di anno e round per l&apos;ultimo
            weekend concluso. Finito lo script, ricarica questa pagina.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="bg-lc-card border border-white/10 rounded-card p-8 mb-16 max-w-xl">
            <p className="font-montserrat text-[14px] text-lc-subtle leading-relaxed">
              Nessun weekend elaborato ancora. Lancia il comando qui sopra e ricarica.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {events.map((ev) => (
              <Link
                key={`${ev.year}-${ev.round}`}
                href={`/telemetria/${ev.year}/${ev.round}`}
                className="bg-lc-card border border-white/10 rounded-card p-6 hover:border-lc-red/60 transition-colors group"
              >
                <p className="font-montserrat text-[11px] text-lc-subtle mb-1">
                  {ev.year} — Round {ev.round}
                </p>
                <p className="font-akira font-bold text-[15px] text-white leading-tight mb-2 group-hover:text-lc-red transition-colors">
                  {ev.name}
                </p>
                <p className="font-montserrat text-[12px] text-lc-subtle">
                  {ev.circuit}
                </p>
                <div className="flex gap-2 mt-4">
                  {ev.sessions.includes('Q') && (
                    <span className="font-akira text-[10px] text-white bg-lc-red/80 rounded-full px-3 py-1">QUALIFICA</span>
                  )}
                  {ev.sessions.includes('R') && (
                    <span className="font-akira text-[10px] text-white bg-white/10 rounded-full px-3 py-1">GARA</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
