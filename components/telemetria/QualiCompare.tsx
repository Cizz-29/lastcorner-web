'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { esportaPng, type Annotazione, type VoceLegenda } from '@/components/telemetria/esportaPng'
import { puntiNotevoli } from '@/components/telemetria/puntiNotevoli'
import { assegnaColori, leggiColori, salvaColori } from '@/components/telemetria/colori'
import MappaTracciato, {
  type Microsettore,
  type RigaCursore,
  type Tracciato,
} from '@/components/telemetria/MappaTracciato'

// Confronto giri di qualifica: si scelgono fino a 4 piloti, per ciascuno si
// sceglie quale tentativo confrontare, e si sovrappongono le tracce
// telemetriche (velocità, gas, freno, marce) più il delta cumulato.
//
// La telemetria non è dentro qualifying.json: sta in un file per pilota,
// caricato solo quando serve. Così la pagina si apre subito anche con molti
// giri disponibili.

export interface QualiLap {
  lap: number
  time: number
  compound: string | null
  // Tempi dei tre settori, dal cronometro. Sono l'unico riferimento esatto
  // che abbiamo: il delta calcolato dalla telemetria si puo' verificare
  // contro di loro. Assenti nei dati generati prima del passaggio a FastF1.
  settori?: (number | null)[]
  /** Solo in gara: giro di ingresso o di uscita dai box. */
  pit?: boolean
}

export interface QualiDriver {
  number: number
  abbr: string
  name: string
  team: string
  color: string
  position: number | null
  lapTime: number | null
  compound: string | null
  bestLap: number
  laps: QualiLap[]
}

export interface Telemetry {
  distance: number[]
  speed: number[]
  throttle: number[]
  brake: number[]
  gear: number[]
  time: number[]
}

const W = 1000
const AXIS_W = 52 // colonna etichette, in HTML fuori dall'SVG
// Margine verticale interno: senza, i picchi delle tracce toccano
// esattamente il bordo del riquadro e sembrano tagliati.
const PAD_V = 12

function formatLapTime(s: number | null): string {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const rest = s - m * 60
  return `${m}:${rest.toFixed(3).padStart(6, '0')}`
}

// --- Colori -----------------------------------------------------------------

interface Style {
  color: string
  /** Tratteggio SVG: distingue piu' giri dello stesso pilota. */
  dash?: string
}

/** Un giro da confrontare: un pilota e uno dei suoi giri. */
export interface Traccia {
  num: number
  lap: number
}

// Come si distinguono le tracce fra loro.
//
// Piloti diversi: un colore ciascuno, deciso da assegnaColori() (vedi
// colori.ts): quello del team, oppure il secondario della livrea quando il
// primo e' gia' in uso o troppo simile a un altro a schermo. Il lettore puo'
// sceglierne uno suo per ogni pilota.
//
// Piu' giri dello STESSO pilota: stesso colore, perche' e' sempre lui, ma
// tratto diverso. Cambiargli colore direbbe "altro pilota", che e' falso.
const TRATTI: (string | undefined)[] = [undefined, '10 6', '2 5', '14 5 2 5']

function buildStyles(
  tracce: Traccia[],
  perNumero: Record<number, QualiDriver>,
  scelti: Record<string, string>
): Style[] {
  const piloti = Array.from(new Set(tracce.map((t) => t.num)))
    .map((n) => perNumero[n])
    .filter(Boolean)
    .map((d) => ({ chiave: d.abbr, team: d.team, colore: d.color }))
  const colori = assegnaColori(piloti, scelti)
  const contaGiri: Record<number, number> = {}

  return tracce.map((t) => {
    const d = perNumero[t.num]
    const g = contaGiri[t.num] ?? 0
    contaGiri[t.num] = g + 1
    return {
      color: (d && colori[d.abbr]) ?? '#FFFFFF',
      dash: TRATTI[Math.min(g, TRATTI.length - 1)],
    }
  })
}

// --- Grafico ----------------------------------------------------------------

// Converte un valore nella coordinata verticale, lasciando PAD_V di respiro
// sopra e sotto l'area disegnabile.
function yOf(value: number, h: number, yMin: number, yMax: number): number {
  const span = yMax - yMin || 1
  const usable = h - PAD_V * 2
  return PAD_V + (1 - (value - yMin) / span) * usable
}

function buildPath(xs: number[], ys: number[], h: number, yMin: number, yMax: number): string {
  const xMax = xs[xs.length - 1] || 1
  let d = ''
  for (let i = 0; i < xs.length; i++) {
    const x = (xs[i] / xMax) * W
    const y = yOf(ys[i], h, yMin, yMax)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

interface Serie {
  key: string | number
  style: Style
  x: number[]
  y: number[]
}

// Un traguardo di settore: una riga verticale nel punto del giro in cui il
// cronometro chiude il settore, e su di essa il distacco esatto letto dai
// tempi di settore. E' l'unico riferimento certo che abbiamo: la curva del
// delta e' ricostruita dalla telemetria, questi tre numeri no.
export interface Traguardo {
  /** Posizione lungo il giro, da 0 (traguardo) a 1. */
  frazione: number
  /** Etichetta del settore, es. "S1". */
  etichetta: string
  punti: { valore: number; testo: string; colore: string }[]
}

// --- Grafico ----------------------------------------------------------------

/** Etichette delle curve su due righe: nelle sezioni lente e fitte (il
 *  castello di Baku, la chicane di Monaco) su una riga sola si
 *  sovrapporrebbero. Una curva troppo vicina alla precedente scende alla
 *  seconda riga; se e' occupata anche quella, l'etichetta si salta. */
function righeEtichette(curve: { n: string; f: number }[]) {
  const ultima = [-1, -1]
  const fuori: { c: { n: string; f: number }; riga: number }[] = []
  for (const c of [...curve].sort((a, b) => a.f - b.f)) {
    const riga = c.f - ultima[0] >= 0.025 ? 0 : c.f - ultima[1] >= 0.025 ? 1 : -1
    if (riga < 0) continue
    ultima[riga] = c.f
    fuori.push({ c, riga })
  }
  return fuori
}

// Le etichette dell'asse Y sono HTML accanto all'SVG, non testo dentro di
// esso: l'SVG viene stirato in orizzontale (preserveAspectRatio="none") e
// il testo ne uscirebbe deformato e tagliato ai bordi.
function Chart({
  title,
  unit,
  height,
  series,
  yMin,
  yMax,
  ticks,
  format = (v: number) => String(Math.round(v)),
  zeroLine = false,
  legenda = [],
  nomeFile,
  annotazioni = [],
  traguardi = [],
  bande = [],
  cursore = null,
  onCursore,
  righeCursore,
  curve = [],
}: {
  title: string
  unit: string
  height: number
  series: Serie[]
  yMin?: number
  yMax?: number
  ticks?: number
  format?: (v: number) => string
  zeroLine?: boolean
  legenda?: VoceLegenda[]
  nomeFile: string
  annotazioni?: Annotazione[]
  traguardi?: Traguardo[]
  /** Microsettori: sfondo col colore del pilota piu' veloce in quel tratto. */
  bande?: Microsettore[]
  /** Punto del giro sotto il cursore, da 0 a 1; condiviso fra tutti i grafici. */
  cursore?: number | null
  onCursore?: (f: number | null) => void
  /** Valori dei piloti nel punto del cursore, per il riquadro che lo segue. */
  righeCursore?: (f: number) => RigaCursore[]
  /** Curve del circuito, come riferimento sull'asse orizzontale. */
  curve?: { n: string; f: number }[]
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const titoloRef = useRef<HTMLParagraphElement>(null)
  const assiRef = useRef<HTMLSpanElement>(null)
  const [salvando, setSalvando] = useState(false)

  const all = series.flatMap((s) => s.y)
  if (all.length === 0) return null
  const lo = yMin ?? Math.min(...all)
  const hi = yMax ?? Math.max(...all)
  const n = ticks ?? 3
  const values = Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1))

  // Le etichette dei traguardi diventano annotazioni come le altre: cosi'
  // finiscono nel PNG senza che l'esportazione debba sapere cosa sono. La
  // conversione sta qui e non nel chiamante perche' serve la scala verticale,
  // che e' nota solo dentro il grafico.
  const etichetteTraguardi: Annotazione[] = traguardi.map((t) => {
    // L'etichetta si appoggia al pallino piu' esterno, non alla media dei
    // pallini: ancorandola in mezzo finirebbe sopra quelli piu' alti e li
    // coprirebbe proprio mentre serve vederli.
    const ys = t.punti.map((p) => yOf(p.valore, height, lo, hi))
    const alto = ys.length ? Math.min(...ys) : height / 2
    const basso = ys.length ? Math.max(...ys) : height / 2
    // Stessa regola delle velocita': l'etichetta va sopra, ma se sopra non ci
    // sta si ribalta sotto invece di uscire dal riquadro.
    const ingombro = (t.punti.length + 1) * 11 + 10
    const sopra = alto >= ingombro
    const y = sopra ? alto : basso
    return {
      frazione: t.frazione,
      y,
      sopra,
      righe: [
        { testo: t.etichetta, colore: 'rgba(255,255,255,0.55)' },
        ...t.punti.map((p) => ({ testo: p.testo, colore: p.colore })),
      ],
    }
  })
  const tutteLeAnnotazioni = [...annotazioni, ...etichetteTraguardi]

  async function scarica() {
    setSalvando(true)
    try {
      await esportaPng({
        svg: svgRef.current,
        titolo: title,
        unita: unit,
        etichette: values.map((v) => ({ testo: format(v), y: yOf(v, height, lo, hi) })),
        altezzaGrafico: height,
        comeSulloSchermo: true,
        annotazioni: tutteLeAnnotazioni,
        legenda,
        nomeFile,
        fontTitolo: titoloRef.current,
        fontTesto: assiRef.current,
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p ref={titoloRef} className="font-akira text-[10px] text-white uppercase tracking-widest">
          {title} <span className="text-lc-subtle normal-case">({unit})</span>
        </p>
        <button
          type="button"
          onClick={scarica}
          disabled={salvando}
          title="Scarica questo grafico come immagine PNG"
          className="font-akira text-[9px] uppercase tracking-widest text-lc-subtle border border-white/15 rounded-full px-3 py-1 shrink-0 transition-colors duration-200 hover:border-lc-red hover:text-lc-red disabled:opacity-40"
        >
          {salvando ? 'salvo…' : 'png'}
        </button>
      </div>
      <div className="flex">
        <div
          className="relative shrink-0 text-right pr-2"
          style={{ width: AXIS_W, height }}
          aria-hidden
        >
          {values.map((v, i) => (
            <span
              key={i}
              ref={i === 0 ? assiRef : undefined}
              className="absolute right-2 font-montserrat text-[9px] text-lc-subtle leading-none"
              style={{ top: yOf(v, height, lo, hi), transform: 'translateY(-50%)' }}
            >
              {format(v)}
            </span>
          ))}
        </div>

        <div className="relative flex-1 min-w-0 bg-lc-card border border-white/10 rounded-card-sm overflow-hidden">
          {/* Etichette delle velocita': HTML sovrapposto, non testo dentro
              l'SVG, che verrebbe stirato da preserveAspectRatio="none". */}
          {tutteLeAnnotazioni.map((a, i) => (
            <div
              key={i}
              className="pointer-events-none absolute z-10 flex flex-col items-center leading-none"
              style={{
                left: `${a.frazione * 100}%`,
                top: a.y,
                transform: a.sopra ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                paddingBottom: a.sopra ? 6 : 0,
                paddingTop: a.sopra ? 0 : 6,
              }}
            >
              {a.righe.map((r, k) => (
                <span
                  key={k}
                  className="font-montserrat text-[9px] font-bold whitespace-nowrap"
                  style={{ color: r.colore, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                >
                  {r.testo}
                </span>
              ))}
            </div>
          ))}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${height}`}
            className="w-full block"
            preserveAspectRatio="none"
            style={{ height }}
          >
            {/* Microsettori: un velo del colore di chi e' stato piu' veloce.
                Sta nell'SVG e non nell'HTML di proposito, cosi' finisce
                anche nel PNG scaricato. */}
            {bande.map((b, i) =>
              b.colore ? (
                <rect
                  key={`b${i}`}
                  x={b.da * W}
                  y={0}
                  width={(b.a - b.da) * W}
                  height={height}
                  fill={b.colore}
                  fillOpacity={0.13}
                />
              ) : null
            )}
            {curve.map((c) => (
              <line
                key={`c${c.n}`}
                x1={c.f * W}
                y1={0}
                x2={c.f * W}
                y2={height}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {values.map((v, i) => {
              const y = yOf(v, height, lo, hi)
              return (
                <line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={W}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {zeroLine && lo < 0 && hi > 0 && (
              <line
                x1={0}
                y1={yOf(0, height, lo, hi)}
                x2={W}
                y2={yOf(0, height, lo, hi)}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {traguardi.map((t, i) => (
              <line
                key={`tg${i}`}
                x1={t.frazione * W}
                y1={PAD_V}
                x2={t.frazione * W}
                y2={height - PAD_V}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {series.map((s) => (
              <path
                key={s.key}
                d={buildPath(s.x, s.y, height, lo, hi)}
                fill="none"
                stroke={s.style.color}
                strokeWidth={1.7}
                strokeDasharray={s.style.dash}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* Il distacco esatto da cronometro, sopra la curva ricostruita:
                se il pallino e' lontano dalla linea, la curva sta sbagliando. */}
            {traguardi.map((t, i) =>
              t.punti.map((p, k) => (
                <circle
                  key={`tp${i}-${k}`}
                  cx={t.frazione * W}
                  cy={yOf(p.valore, height, lo, hi)}
                  r={3}
                  fill={p.colore}
                  stroke="#131318"
                  strokeWidth={1.2}
                  vectorEffect="non-scaling-stroke"
                />
              ))
            )}
          </svg>

          {/* Cursore: linea verticale condivisa da tutti i grafici e riquadro
              con i valori esatti dei piloti in quel punto. */}
          {onCursore && (
            <div
              className="absolute inset-0 z-20 cursor-crosshair"
              style={{ touchAction: 'pan-y' }}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                onCursore(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
              }}
              onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                onCursore(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
              }}
              onPointerLeave={() => onCursore(null)}
            />
          )}
          {cursore != null && (
            <>
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-white/70"
                style={{ left: `${cursore * 100}%` }}
              />
              {righeCursore && (
                <div
                  className="pointer-events-none absolute top-2 z-30 bg-black/80 border border-white/15 rounded-lg px-2.5 py-1.5"
                  style={{
                    left: `${cursore * 100}%`,
                    transform: cursore > 0.6 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
                  }}
                >
                  {righeCursore(cursore).map((r) => (
                    <p
                      key={r.etichetta}
                      className="font-montserrat text-[11px] font-semibold whitespace-nowrap tabular-nums leading-snug"
                      style={{ color: r.colore }}
                    >
                      {r.etichetta} <span className="text-white">{r.testo}</span>
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {curve.length > 0 && (
        <div className="relative h-7 mt-1" style={{ marginLeft: AXIS_W }} aria-hidden>
          {righeEtichette(curve).map(({ c, riga }) => (
            <span
              key={c.n}
              className="absolute font-montserrat text-[9px] font-semibold text-lc-subtle"
              style={{ left: `${c.f * 100}%`, top: riga * 12, transform: 'translateX(-50%)' }}
            >
              T{c.n}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Valore di una qualsiasi serie a una data distanza, per interpolazione
// lineare fra i due campioni che la contengono.
function valoreAllaDistanza(distance: number[], valori: number[], dist: number): number {
  if (dist <= distance[0]) return valori[0]
  if (dist >= distance[distance.length - 1]) return valori[valori.length - 1]
  let lo = 0
  let hi = distance.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (distance[mid] > dist) hi = mid
    else lo = mid
  }
  const span = distance[hi] - distance[lo] || 1
  const f = (dist - distance[lo]) / span
  return valori[lo] + f * (valori[hi] - valori[lo])
}

// Interpola il tempo a una data distanza: i giri hanno campionamenti diversi.
function timeAtDistance(tel: Telemetry, dist: number): number {
  const { distance, time } = tel
  if (dist <= distance[0]) return time[0]
  if (dist >= distance[distance.length - 1]) return time[time.length - 1]
  let lo = 0
  let hi = distance.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (distance[mid] > dist) hi = mid
    else lo = mid
  }
  const span = distance[hi] - distance[lo] || 1
  const f = (dist - distance[lo]) / span
  return time[lo] + f * (time[hi] - time[lo])
}

// L'inverso: a che punto del giro si trovava il pilota a un dato istante.
// Serve per i traguardi di settore, che il cronometro da' in secondi mentre
// il grafico e' in metri.
function distanzaAlTempo(tel: Telemetry, istante: number): number {
  const { distance, time } = tel
  if (istante <= time[0]) return distance[0]
  if (istante >= time[time.length - 1]) return distance[distance.length - 1]
  let lo = 0
  let hi = time.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (time[mid] > istante) hi = mid
    else lo = mid
  }
  const span = time[hi] - time[lo] || 1
  const f = (istante - time[lo]) / span
  return distance[lo] + f * (distance[hi] - distance[lo])
}

export default function QualiCompare({
  drivers,
  dataPath,
  tracciato = null,
  gara = false,
}: {
  drivers: QualiDriver[]
  dataPath: string
  /** Disegno della pista con le curve (track.json): assente nei round vecchi. */
  tracciato?: Tracciato | null
  /** Gara o sprint: i giri sono tutti, in ordine, e nell'elenco serve il
   *  numero del giro per orientarsi. */
  gara?: boolean
}) {
  const sorted = useMemo(
    () => [...drivers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
    [drivers]
  )

  const perNumero = useMemo(
    () => Object.fromEntries(drivers.map((d) => [d.number, d])) as Record<number, QualiDriver>,
    [drivers]
  )

  // Si confrontano tracce, non piloti: una traccia e' "questo pilota, questo
  // giro". Cosi' lo stesso pilota puo' comparire piu' volte con giri diversi,
  // che e' il confronto piu' utile quando si studia un tentativo mancato.
  const [tracce, setTracce] = useState<Traccia[]>(() =>
    sorted.slice(0, 2).map((d) => ({ num: d.number, lap: d.bestLap }))
  )
  const [cache, setCache] = useState<Record<number, Record<string, Telemetry>>>({})
  const [caricamento, setCaricamento] = useState(false)
  // Quanto sono alti i grafici. 1 e' l'altezza di riferimento; il cursore
  // arriva al doppio, utile quando si guarda una singola staccata.
  const [ingrandimento, setIngrandimento] = useState(1)

  // Colori scelti a mano dal lettore, per sigla del pilota. Si leggono dal
  // browser dopo il primo disegno: letti durante il rendering, server e
  // browser produrrebbero due pagine diverse.
  const [coloriScelti, setColoriScelti] = useState<Record<string, string>>({})
  useEffect(() => setColoriScelti(leggiColori()), [])
  function scegliColore(abbr: string, colore: string | null) {
    setColoriScelti((prev) => {
      const next = { ...prev }
      if (colore) next[abbr] = colore
      else delete next[abbr]
      salvaColori(next)
      return next
    })
  }

  // Punto del giro sotto il cursore (0-1), condiviso da grafici e mappa.
  const [cursore, setCursore] = useState<number | null>(null)

  const styles = useMemo(
    () => buildStyles(tracce, perNumero, coloriScelti),
    [tracce, perNumero, coloriScelti]
  )
  const numeriScelti = useMemo(() => Array.from(new Set(tracce.map((t) => t.num))), [tracce])

  // Carica la telemetria dei piloti selezionati non ancora in cache.
  const load = useCallback(
    async (numbers: number[]) => {
      const mancanti = numbers.filter((n) => !(n in cache))
      if (mancanti.length === 0) return
      setCaricamento(true)
      try {
        const risultati = await Promise.all(
          mancanti.map(async (n) => {
            try {
              // dataPath arriva dalla pagina gia' completo di /tel (vedi
              // app/telemetria/[year]/[round]/page.tsx): qui va aggiunto solo
              // il file del pilota. Prima si aggiungeva anche /qualifying,
              // rimasto da un vecchio formato dei dati, e il risultato era un
              // 404 su ogni pilota di ogni weekend — cioe' il pannello di
              // confronto sempre vuoto.
              const res = await fetch(`${dataPath}/${n}.json`)
              if (!res.ok) return [n, {}] as const
              return [n, (await res.json()) as Record<string, Telemetry>] as const
            } catch {
              return [n, {}] as const
            }
          })
        )
        setCache((prev) => {
          const next = { ...prev }
          for (const [n, data] of risultati) next[n] = data
          return next
        })
      } finally {
        setCaricamento(false)
      }
    },
    [cache, dataPath]
  )

  useEffect(() => {
    load(numeriScelti)
  }, [numeriScelti, load])

  const MAX_TRACCE = 4

  /** Clic sulla pastiglia: aggiunge il pilota col suo giro migliore, oppure lo
   *  toglie del tutto, con tutti i suoi giri. */
  function toggle(num: number) {
    setTracce((prev) => {
      if (prev.some((t) => t.num === num)) return prev.filter((t) => t.num !== num)
      if (prev.length >= MAX_TRACCE) return prev
      const d = perNumero[num]
      return d ? [...prev, { num, lap: d.bestLap }] : prev
    })
  }

  /** Aggiunge un altro giro dello stesso pilota, scegliendo il primo non gia'
   *  in confronto: cosi' il tasto non produce due tracce identiche. */
  function aggiungiGiro(num: number) {
    setTracce((prev) => {
      if (prev.length >= MAX_TRACCE) return prev
      const d = perNumero[num]
      if (!d) return prev
      const gia = new Set(prev.filter((t) => t.num === num).map((t) => t.lap))
      // Il piu' veloce fra quelli liberi: in qualifica i giri sono gia' in
      // ordine di tempo, in gara in ordine di giro e il primo sarebbe la
      // partenza.
      const libero = d.laps
        .filter((l) => !gia.has(l.lap))
        .sort((a, b) => a.time - b.time)[0]
      return libero ? [...prev, { num, lap: libero.lap }] : prev
    })
  }

  function rimuoviTraccia(i: number) {
    setTracce((prev) => prev.filter((_, k) => k !== i))
  }

  function cambiaGiro(i: number, lap: number) {
    setTracce((prev) => prev.map((t, k) => (k === i ? { ...t, lap } : t)))
  }

  function telemetriaDi(t: Traccia): Telemetry | null {
    return cache[t.num]?.[String(t.lap)] ?? null
  }

  // Altezze di riferimento dei grafici, moltiplicate dal cursore. La velocita'
  // e' il grafico su cui si legge davvero la differenza fra due giri, quindi e'
  // il piu' alto; freno e marcia sono segnali a gradini e non guadagnano nulla
  // dall'altezza.
  const ALTEZZE = { delta: 150, velocita: 260, acceleratore: 130, freno: 80, marcia: 130 }
  const alto = (base: number) => Math.round(base * ingrandimento)

  // Quante volte compare ciascun pilota: serve a decidere se nell'etichetta va
  // indicato anche il numero del giro.
  const quanteVolte = tracce.reduce<Record<number, number>>((acc, t) => {
    acc[t.num] = (acc[t.num] ?? 0) + 1
    return acc
  }, {})

  const attivi = tracce
    .map((t, i) => ({ traccia: t, driver: perNumero[t.num], tel: telemetriaDi(t), style: styles[i] }))
    .filter(
      (x): x is { traccia: Traccia; driver: QualiDriver; tel: Telemetry; style: Style } =>
        x.tel !== null && Boolean(x.driver)
    )

  const etichettaDi = (x: { traccia: Traccia; driver: QualiDriver }) =>
    quanteVolte[x.traccia.num] > 1 ? `${x.driver.abbr} g.${x.traccia.lap}` : x.driver.abbr

  // Sigla e colore dei piloti a schermo: servono alla legenda del PNG, che
  // altrimenti sarebbe un grafico senza indicazione di chi e' chi.
  const legenda: VoceLegenda[] = attivi.map((x) => ({
    abbr: etichettaDi(x),
    color: x.style?.color ?? x.driver.color,
  }))

  // Nome del file scaricato: sessione, grafico e piloti confrontati, cosi' in
  // cartella Download non ci si ritrova dieci "grafico.png".
  const sessione = dataPath.split('/').filter(Boolean).slice(-2, -1)[0] ?? 'telemetria'
  const nomeFileDi = (grafico: string) =>
    `lastcorner-${sessione}-${grafico}-${attivi
      .map((a) => etichettaDi(a).replace(/[^A-Za-z0-9]+/g, ''))
      .join('-')}.png`.toLowerCase()

  function serieDa(getter: (t: Telemetry) => number[]): Serie[] {
    return attivi.map(({ traccia, tel, style }, i) => ({
      key: `${traccia.num}-${traccia.lap}-${i}`,
      style,
      x: tel.distance,
      y: getter(tel),
    }))
  }

  // Delta cumulato rispetto alla prima traccia.
  //
  // Il confronto avviene alla stessa FRAZIONE di giro. La distanza arriva gia'
  // pronta dalla pipeline (scripts/telemetry/process_session.py): velocita'
  // integrata, corretta con la posizione GPS e ancorata ai traguardi di
  // settore, con la stessa lunghezza per tutti i giri della sessione. Qui la
  // frazione serve solo a non dipendere da quella lunghezza: i dati generati
  // prima del 2 ottobre 2026 (solo velocita' integrata) hanno lunghezze
  // diverse da giro a giro, e a frazioni uguali restano comunque allineati
  // al via e al traguardo, quindi il delta finale coincide con il distacco
  // cronometrato. L'asse resta etichettato in metri, con la lunghezza della
  // traccia di riferimento.
  const delta = useMemo(() => {
    if (attivi.length < 2) return null
    const rif = attivi[0]
    const lunghezzaRif = rif.tel.distance[rif.tel.distance.length - 1] || 1
    const passi = 400
    const frazioni = Array.from({ length: passi }, (_, i) => i / (passi - 1))
    const xs = frazioni.map((f) => f * lunghezzaRif)

    const tempoA = (tel: Telemetry, f: number) =>
      timeAtDistance(tel, f * (tel.distance[tel.distance.length - 1] || 1))

    const series: Serie[] = attivi.slice(1).map((x, i) => ({
      key: `${x.traccia.num}-${x.traccia.lap}-${i}`,
      style: x.style,
      x: xs,
      y: frazioni.map((f) => tempoA(x.tel, f) - tempoA(rif.tel, f)),
    }))
    return { refAbbr: etichettaDi(rif), series }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivi])

  // Traguardi di settore sul grafico del delta.
  //
  // La curva del delta e' ricostruita dalla telemetria: la distanza non e' un
  // dato misurato e alle curve lente conserva un'incertezza di un decimo
  // abbondante. I tempi di settore invece vengono dal cronometro e sono
  // esatti. Segnandoli sul grafico si legge la curva sapendo dove deve
  // passare: se il pallino e' lontano dalla linea, li' la curva sbaglia.
  //
  // Il terzo settore non si disegna: cade sul traguardo, dove il delta e' gia'
  // il distacco finale e la riga verticale coinciderebbe col bordo.
  const traguardiSettore = useMemo<Traguardo[]>(() => {
    if (attivi.length < 2) return []
    const rif = attivi[0]
    const settoriDi = (x: (typeof attivi)[number]) =>
      x.driver.laps.find((l) => l.lap === x.traccia.lap)?.settori
    const sRif = settoriDi(rif)
    if (!sRif) return []

    const cumulato = (s: (number | null)[] | undefined, fino: number) => {
      if (!s || s.length < fino + 1) return null
      let somma = 0
      for (let i = 0; i <= fino; i++) {
        const v = s[i]
        if (v == null) return null
        somma += v
      }
      return somma
    }

    const lunghezzaRif = rif.tel.distance[rif.tel.distance.length - 1] || 1
    const fuori: Traguardo[] = []
    for (const i of [0, 1]) {
      const cumRif = cumulato(sRif, i)
      if (cumRif == null) continue
      const frazione = distanzaAlTempo(rif.tel, cumRif) / lunghezzaRif
      if (!(frazione > 0.02) || !(frazione < 0.98)) continue
      const punti = attivi.slice(1).flatMap((x) => {
        const cum = cumulato(settoriDi(x), i)
        if (cum == null) return []
        const valore = cum - cumRif
        return [{
          valore,
          testo: `${valore >= 0 ? '+' : ''}${valore.toFixed(3)}`,
          colore: x.style.color,
        }]
      })
      if (punti.length === 0) continue
      fuori.push({ frazione, etichetta: `S${i + 1}`, punti })
    }
    return fuori
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivi])

  // Velocita' di punta sui rettilinei e minime in curva, sul grafico della
  // velocita'. I punti si cercano sulla PRIMA traccia (il riferimento) e per
  // le altre si legge la velocita' nello stesso punto del giro: cosi' le
  // etichette restano incolonnate invece di sfalsarsi pilota per pilota.
  const annotazioniVelocita = useMemo<Annotazione[]>(() => {
    if (attivi.length === 0) return []
    const rif = attivi[0]
    const Lrif = rif.tel.distance[rif.tel.distance.length - 1] || 1
    const tutte = attivi.flatMap((a) => a.tel.speed)
    const lo = Math.min(...tutte)
    const hi = Math.max(...tutte)
    const altezza = alto(ALTEZZE.velocita)

    return puntiNotevoli(rif.tel.speed, rif.tel.distance).map((p) => {
      const frazione = p.distanza / Lrif
      const righe = attivi.map((a, i) => {
        const L = a.tel.distance[a.tel.distance.length - 1] || 1
        const v = valoreAllaDistanza(a.tel.distance, a.tel.speed, frazione * L)
        const testo =
          i === 0
            ? `${etichettaDi(a)} ${Math.round(v)}`
            : `${etichettaDi(a)} ${v - p.velocita >= 0 ? '+' : ''}${Math.round(v - p.velocita)}`
        return { testo, colore: a.style?.color ?? a.driver.color }
      })
      // Il massimo di un rettilineo ha spazio sopra, l'apice di una curva
      // sotto: cosi' l'etichetta non copre mai la linea. Ma il punto piu'
      // veloce e quello piu' lento di tutto il giro toccano i bordi del
      // grafico, e li' l'etichetta uscirebbe dal riquadro: in quel caso si
      // ribalta dall'altro lato.
      const y = yOf(p.velocita, altezza, lo, hi)
      const ingombro = righe.length * 11 + 8
      let sopra = p.tipo === 'rettilineo'
      if (sopra && y < ingombro) sopra = false
      else if (!sopra && y > altezza - ingombro) sopra = true

      return { frazione, y, sopra, righe }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivi, ingrandimento])

  // Microsettori: il giro diviso in tratti di circa 250 metri, e per ognuno
  // il pilota che ci ha messo meno. Il tempo nel tratto si legge alla stessa
  // frazione di giro usata dal delta, quindi colori e curva del delta
  // raccontano la stessa storia: dove la curva sale, il tratto e' dell'altro.
  // Sotto il millesimo e mezzo il tratto resta neutro: e' sotto la precisione
  // con cui la telemetria ricostruisce la distanza.
  const microsettori = useMemo<(Microsettore & { vincitore?: number })[]>(() => {
    if (attivi.length < 2) return []
    const L = attivi[0].tel.distance[attivi[0].tel.distance.length - 1] || 5000
    const quanti = Math.max(16, Math.min(32, Math.round(L / 250)))
    const tempoA = (tel: Telemetry, f: number) =>
      timeAtDistance(tel, f * (tel.distance[tel.distance.length - 1] || 1))
    return Array.from({ length: quanti }, (_, i) => {
      const da = i / quanti
      const a = (i + 1) / quanti
      const tempi = attivi.map((x) => tempoA(x.tel, a) - tempoA(x.tel, da))
      const ordinati = [...tempi].sort((p, q) => p - q)
      const migliore = tempi.indexOf(ordinati[0])
      if (ordinati[1] - ordinati[0] < 0.0015) return { da, a }
      return { da, a, colore: attivi[migliore].style.color, vincitore: migliore }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivi])

  // Valori esatti dei piloti nel punto del cursore, per i riquadri che lo
  // seguono. Ogni grafico mostra il suo canale.
  const valoriAl = (getter: (t: Telemetry) => number[], formato: (v: number) => string) =>
    (f: number): RigaCursore[] =>
      attivi.map((x) => {
        const L = x.tel.distance[x.tel.distance.length - 1] || 1
        return {
          etichetta: etichettaDi(x),
          colore: x.style.color,
          testo: formato(valoreAllaDistanza(x.tel.distance, getter(x.tel), f * L)),
        }
      })
  const righeDelta = (f: number): RigaCursore[] => {
    if (attivi.length < 2) return []
    const tempoA = (tel: Telemetry) => timeAtDistance(tel, f * (tel.distance[tel.distance.length - 1] || 1))
    const rif = tempoA(attivi[0].tel)
    return attivi.slice(1).map((x) => {
      const d = tempoA(x.tel) - rif
      return { etichetta: etichettaDi(x), colore: x.style.color, testo: `${d >= 0 ? '+' : ''}${d.toFixed(3)} s` }
    })
  }
  const righeMappa = (f: number): RigaCursore[] =>
    attivi.map((x) => {
      const L = x.tel.distance[x.tel.distance.length - 1] || 1
      const v = valoreAllaDistanza(x.tel.distance, x.tel.speed, f * L)
      const m = valoreAllaDistanza(x.tel.distance, x.tel.gear, f * L)
      return { etichetta: etichettaDi(x), colore: x.style.color, testo: `${Math.round(v)} km/h · ${Math.round(m)}ª` }
    })

  const curveAsse = tracciato?.curve.map((c) => ({ n: c.n, f: c.f })) ?? []
  const comuniGrafico = { bande: microsettori, cursore, onCursore: setCursore, curve: curveAsse }

  // Il riepilogo accanto alla mappa: tempo, distacco, velocita' massima e
  // microsettori vinti da ciascuno.
  const riepilogo = attivi.map((x, i) => {
    const giro = x.driver.laps.find((l) => l.lap === x.traccia.lap)
    return {
      chiave: `${x.traccia.num}-${x.traccia.lap}-${i}`,
      etichetta: etichettaDi(x),
      nome: x.driver.name,
      team: x.driver.team,
      colore: x.style.color,
      tempo: giro?.time ?? null,
      vmax: Math.max(...x.tel.speed),
      vinti: microsettori.filter((m) => m.vincitore === i).length,
    }
  })
  const tempoRif = riepilogo[0]?.tempo ?? null

  return (
    <div>
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">
        Piloti a confronto <span className="text-lc-subtle normal-case">(max 4)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-8">
        {sorted.map((d) => {
          const idx = tracce.findIndex((t) => t.num === d.number)
          const on = idx >= 0
          const st = on ? styles[idx] : undefined
          return (
            <button
              key={d.number}
              onClick={() => toggle(d.number)}
              className={`font-montserrat text-[12px] rounded-full px-3 py-1.5 border transition-colors ${
                on ? 'text-white' : 'text-lc-subtle border-white/15 hover:border-white/40'
              }`}
              style={on && st ? { borderColor: st.color, backgroundColor: `${st.color}22` } : undefined}
            >
              <span className="font-semibold">{d.abbr}</span>
              <span className="opacity-70 ml-2">{formatLapTime(d.lapTime)}</span>
            </button>
          )
        })}
      </div>

      {tracce.length === 0 ? (
        <p className="font-montserrat text-[13px] text-lc-subtle">Seleziona almeno un pilota.</p>
      ) : (
        <>
          {/* Una scheda per traccia: pilota, giro scelto, e i tasti per
              aggiungere un altro giro dello stesso pilota o togliere questa. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {tracce.map((t, i) => {
              const d = perNumero[t.num]
              if (!d) return null
              const st = styles[i]
              return (
                <div
                  key={`${t.num}-${t.lap}-${i}`}
                  className="bg-lc-card border border-white/10 rounded-card-sm p-4 border-l-2"
                  style={{ borderLeftColor: st?.color }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="font-akira text-[13px] text-white truncate">{d.abbr}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Colore del pilota, modificabile: il quadratino apre il
                          selettore del sistema. Vale per tutti i suoi giri. */}
                      <label
                        className="relative w-5 h-5 rounded border border-white/30 cursor-pointer overflow-hidden"
                        style={{ backgroundColor: st?.color }}
                        title={`Cambia il colore di ${d.abbr}`}
                      >
                        <span className="sr-only">Colore di {d.abbr}</span>
                        <input
                          type="color"
                          value={(st?.color ?? '#ffffff').toLowerCase()}
                          onChange={(e) => scegliColore(d.abbr, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      {coloriScelti[d.abbr] && (
                        <button
                          type="button"
                          onClick={() => scegliColore(d.abbr, null)}
                          title="Torna al colore predefinito"
                          className="font-montserrat text-[10px] text-lc-subtle underline hover:text-white"
                        >
                          predefinito
                        </button>
                      )}
                      <svg width="26" height="6" aria-hidden>
                        <line
                          x1="0"
                          y1="3"
                          x2="26"
                          y2="3"
                          stroke={st?.color}
                          strokeWidth="2"
                          strokeDasharray={st?.dash}
                        />
                      </svg>
                      {tracce.length > 1 && (
                        <button
                          type="button"
                          onClick={() => rimuoviTraccia(i)}
                          aria-label={`Togli ${d.abbr}, giro ${t.lap}`}
                          title="Togli questo giro dal confronto"
                          className="font-montserrat text-[15px] leading-none text-lc-subtle hover:text-lc-red"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-montserrat text-[11px] text-lc-subtle mb-3 truncate">{d.team}</p>

                  <label className="block font-montserrat text-[10px] text-lc-subtle mb-1">
                    Giro
                  </label>
                  <select
                    value={t.lap}
                    onChange={(e) => cambiaGiro(i, Number(e.target.value))}
                    className="w-full bg-lc-bg border border-white/15 rounded px-2 py-1.5 font-montserrat text-[12px] text-white focus:outline-none focus:border-lc-red"
                  >
                    {d.laps.map((l) => (
                      <option key={l.lap} value={l.lap}>
                        {gara ? `G${l.lap} · ` : ''}
                        {formatLapTime(l.time)}
                        {l.lap === d.bestLap ? ' — migliore' : ''}
                        {l.compound ? ` · ${l.compound.slice(0, 4)}` : ''}
                        {l.pit ? ' · box' : ''}
                      </option>
                    ))}
                  </select>

                  {d.laps.length > 1 && tracce.length < MAX_TRACCE && (
                    <button
                      type="button"
                      onClick={() => aggiungiGiro(t.num)}
                      className="mt-3 w-full font-montserrat text-[11px] text-lc-subtle border border-dashed border-white/20 rounded px-2 py-1 hover:border-lc-red hover:text-lc-red transition-colors"
                    >
                      + un altro giro di {d.abbr}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {tracce.length >= MAX_TRACCE ? (
            <p className="font-montserrat text-[11px] text-lc-subtle mb-8">
              Massimo {MAX_TRACCE} giri a confronto: togline uno per aggiungerne un altro.
            </p>
          ) : (
            <div className="mb-8" />
          )}

          {caricamento && attivi.length === 0 ? (
            <p className="font-montserrat text-[13px] text-lc-subtle">Carico la telemetria…</p>
          ) : attivi.length === 0 ? (
            <p className="font-montserrat text-[13px] text-lc-subtle">
              Telemetria non disponibile per la selezione corrente.
            </p>
          ) : (
            <>
              {(tracciato || attivi.length > 1) && (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 mb-8">
                  {tracciato && (
                    <MappaTracciato
                      tracciato={tracciato}
                      microsettori={microsettori}
                      cursore={cursore}
                      onCursore={setCursore}
                      righe={cursore != null ? righeMappa(cursore) : []}
                      colorePallino={attivi[0].style.color}
                    />
                  )}
                  <div className="flex flex-col gap-3">
                    {riepilogo.map((r, i) => (
                      <div
                        key={r.chiave}
                        className="bg-lc-card border border-white/10 rounded-card-sm p-4 border-l-4"
                        style={{ borderLeftColor: r.colore }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-akira text-[14px] text-white truncate">
                            {r.etichetta}{' '}
                            <span className="font-montserrat text-[11px] text-lc-subtle normal-case">{r.team}</span>
                          </p>
                          <p className="font-montserrat text-[16px] font-bold text-white tabular-nums shrink-0">
                            {formatLapTime(r.tempo)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 font-montserrat text-[12px] text-lc-subtle tabular-nums">
                          <span>
                            Distacco{' '}
                            <span className="text-white font-semibold">
                              {i === 0 || r.tempo == null || tempoRif == null
                                ? '—'
                                : `${r.tempo - tempoRif >= 0 ? '+' : ''}${(r.tempo - tempoRif).toFixed(3)}`}
                            </span>
                          </span>
                          <span>
                            Vel. max <span className="text-white font-semibold">{r.vmax} km/h</span>
                          </span>
                          {microsettori.length > 0 && (
                            <span>
                              Microsettori{' '}
                              <span className="font-semibold" style={{ color: r.colore }}>
                                {r.vinti}/{microsettori.length}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {microsettori.length > 0 && (
                      <p className="font-montserrat text-[11px] text-lc-subtle leading-relaxed">
                        Il giro è diviso in {microsettori.length} microsettori di circa{' '}
                        {Math.round((attivi[0].tel.distance[attivi[0].tel.distance.length - 1] || 0) / microsettori.length)} metri.
                        Grigio vuol dire pari.
                        {tracciato ? ' Passa o tocca la pista e i grafici per leggere i valori esatti.' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-5 ml-[52px]">
                <label
                  htmlFor="altezza-grafici"
                  className="font-akira text-[9px] uppercase tracking-widest text-lc-subtle shrink-0"
                >
                  Altezza grafici
                </label>
                <input
                  id="altezza-grafici"
                  type="range"
                  min={0.8}
                  max={2}
                  step={0.1}
                  value={ingrandimento}
                  onChange={(e) => setIngrandimento(Number(e.target.value))}
                  className="w-40 accent-lc-red cursor-pointer"
                />
                <span className="font-montserrat text-[11px] text-lc-subtle tabular-nums w-10">
                  {Math.round(ingrandimento * 100)}%
                </span>
                {ingrandimento !== 1 && (
                  <button
                    type="button"
                    onClick={() => setIngrandimento(1)}
                    className="font-montserrat text-[11px] text-lc-subtle underline hover:text-white"
                  >
                    reimposta
                  </button>
                )}
              </div>

              {delta && (
                <>
                  <Chart
                    title="Delta"
                    unit={`secondi vs ${delta.refAbbr}`}
                    height={alto(ALTEZZE.delta)}
                    series={delta.series}
                    ticks={5}
                    zeroLine
                    format={(v) => v.toFixed(2)}
                    legenda={legenda}
                    nomeFile={nomeFileDi('delta')}
                    traguardi={traguardiSettore}
                    {...comuniGrafico}
                    righeCursore={righeDelta}
                  />
                  <p className="font-montserrat text-[11px] text-lc-subtle -mt-4 mb-6 ml-[52px]">
                    Sopra lo zero: più lento di {delta.refAbbr}. Sotto: più veloce.
                  </p>
                </>
              )}

              <Chart title="Velocità" unit="km/h" height={alto(ALTEZZE.velocita)} series={serieDa((t) => t.speed)} ticks={5} legenda={legenda} nomeFile={nomeFileDi('velocita')} annotazioni={annotazioniVelocita} {...comuniGrafico} righeCursore={valoriAl((t) => t.speed, (v) => `${Math.round(v)} km/h`)} />
              <Chart title="Acceleratore" unit="%" height={alto(ALTEZZE.acceleratore)} series={serieDa((t) => t.throttle)} yMin={0} yMax={100} ticks={3} legenda={legenda} nomeFile={nomeFileDi('acceleratore')} {...comuniGrafico} righeCursore={valoriAl((t) => t.throttle, (v) => `${Math.round(v)}%`)} />
              <Chart title="Freno" unit="on/off" height={alto(ALTEZZE.freno)} series={serieDa((t) => t.brake.map((b) => b * 100))} yMin={0} yMax={100} ticks={2} format={(v) => (v > 50 ? 'ON' : 'OFF')} legenda={legenda} nomeFile={nomeFileDi('freno')} {...comuniGrafico} righeCursore={valoriAl((t) => t.brake, (v) => (v >= 0.5 ? 'in frenata' : 'no'))} />
              <Chart title="Marcia" unit="n" height={alto(ALTEZZE.marcia)} series={serieDa((t) => t.gear)} yMin={1} yMax={8} ticks={4} legenda={legenda} nomeFile={nomeFileDi('marcia')} {...comuniGrafico} righeCursore={valoriAl((t) => t.gear, (v) => `${Math.round(v)}ª`)} />

              <p className="font-montserrat text-[11px] text-lc-subtle ml-[52px]">
                Asse orizzontale: distanza percorsa sul giro, dalla linea del traguardo.
                Ogni pilota ha un colore suo (il compagno di squadra prende il secondo colore
                della livrea) e si può cambiare dalla sua scheda; più giri dello stesso pilota
                hanno lo stesso colore ma tratto diverso.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
