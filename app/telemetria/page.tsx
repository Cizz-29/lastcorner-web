import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { dataWeekend, nomeGp, sessioniDi, weekendTelemetria } from '@/lib/telemetria'
import { metadati } from '@/lib/seo'
import Briciole from '@/components/Briciole'

// Indice della sezione Telemetria: i weekend elaborati, dal piu' recente.
//
// Fino a settembre 2026 era uno strumento di redazione che girava solo sul
// PC. Dal 1° ottobre e' pubblica: i dati sono versionati in
// public/telemetria-data/ (vedi STRUMENTI-LOCALI.md per come si aggiungono).

export async function generateMetadata(): Promise<Metadata> {
  const anno = (await weekendTelemetria())[0]?.year ?? new Date().getFullYear()
  return metadati({
    titolo: `Telemetria F1 ${anno}: confronto giri, delta e passo gara`,
    descrizione: `La telemetria della Formula 1 ${anno} in italiano, GP per GP: confronta i giri di qualifica e delle libere con velocità, acceleratore, freno, marce, delta e microsettori, e il passo gara.`,
    percorso: '/telemetria',
  })
}

const ETICHETTE: Record<string, string> = {
  FP1: 'FP1',
  FP2: 'FP2',
  FP3: 'FP3',
  SQ: 'Sprint Q',
  SPR: 'Sprint',
  Q: 'Qualifica',
  R: 'Gara',
}

export default async function TelemetriaIndexPage() {
  const events = await weekendTelemetria()
  const anno = events[0]?.year ?? new Date().getFullYear()

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <Briciole voci={[{ nome: 'Telemetria', percorso: '/telemetria' }]} />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            Telemetria F1 {anno}
          </h1>
        </div>
        <p className="font-montserrat text-[15px] text-white/85 leading-relaxed max-w-[72ch] mb-3">
          I dati delle monoposto, Gran Premio per Gran Premio. Scegli un weekend e metti a confronto
          i giri di qualifica e delle libere: velocità, acceleratore, freno, marce e delta, con il
          tracciato colorato per chi è stato più veloce in ogni microsettore.
        </p>
        <p className="font-montserrat text-[13px] text-lc-subtle leading-relaxed max-w-[72ch] mb-10">
          Per gara e sprint c&apos;è il passo giro per giro, con gomme e soste, e la telemetria
          di ogni singolo giro. Ogni grafico si può scaricare come immagine.
        </p>

        {events.length === 0 ? (
          <div className="bg-lc-card border border-white/10 rounded-card p-8 mb-16 max-w-xl">
            <p className="font-montserrat text-[14px] text-lc-subtle leading-relaxed">
              Nessun weekend disponibile per ora.
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
                  Round {ev.round} · {dataWeekend(ev.date)}
                </p>
                <p className="font-akira font-bold text-[15px] text-white leading-tight mb-2 group-hover:text-lc-red transition-colors">
                  {nomeGp(ev.name, ev.circuit)}
                </p>
                <p className="font-montserrat text-[12px] text-lc-subtle">{ev.circuit}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {sessioniDi(ev).map((s) => (
                    <span
                      key={s.key}
                      className={`font-montserrat font-semibold text-[10px] rounded-full px-2.5 py-1 ${
                        s.key === 'Q' ? 'bg-lc-red/80 text-white' : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {ETICHETTE[s.key] ?? s.key}
                    </span>
                  ))}
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
