'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { esportaPng, type VoceLegenda } from '@/components/telemetria/esportaPng'

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
// I compagni di squadra condividono il colore del team: per distinguerli si
// schiarisce progressivamente il colore e si cambia il tratto della linea.

function shade(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(num)) return hex
  const adjust = (v: number) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)))
  const r = adjust((num >> 16) & 0xff)
  const g = adjust((num >> 8) & 0xff)
  const b = adjust(num & 0xff)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

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
// Piloti di squadre diverse: il colore del team, che basta.
//
// Due piloti della STESSA squadra: prima si schiariva il colore, ma fra una
// Ferrari e una Ferrari poco piu' chiara, sovrapposte su fondo scuro, non si
// capiva quale fosse quale. Il secondo prende il bianco.
//
// Piu' giri dello STESSO pilota: stesso colore — e' sempre lui — ma tratto
// diverso. Cambiargli colore direbbe "altro pilota", che e' falso.
const BIANCO_COMPAGNO = '#FFFFFF'
const TRATTI: (string | undefined)[] = [undefined, '10 6', '2 5', '14 5 2 5']

function buildStyles(tracce: Traccia[], perNumero: Record<number, QualiDriver>): Style[] {
  const contaTeam: Record<string, number> = {}
  const coloreDi: Record<number, string> = {}
  const contaGiri: Record<number, number> = {}

  return tracce.map((t) => {
    const d = perNumero[t.num]
    if (!d) return { color: BIANCO_COMPAGNO }

    if (!(t.num in coloreDi)) {
      const key = d.color.toLowerCase()
      const n = contaTeam[key] ?? 0
      contaTeam[key] = n + 1
      coloreDi[t.num] =
        n === 0
          ? d.color
          : n === 1
            ? BIANCO_COMPAGNO
            : shade(d.color, Math.min(0.3 + 0.25 * (n - 2), 0.75))
    }

    const g = contaGiri[t.num] ?? 0
    contaGiri[t.num] = g + 1
    return { color: coloreDi[t.num], dash: TRATTI[Math.min(g, TRATTI.length - 1)] }
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

// --- Grafico ----------------------------------------------------------------

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

  async function scarica() {
    setSalvando(true)
    try {
      await esportaPng({
        svg: svgRef.current,
        titolo: title,
        unita: unit,
        etichette: values.map((v) => ({ testo: format(v), y: yOf(v, height, lo, hi) })),
        altezzaGrafico: height,
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

        <div className="flex-1 min-w-0 bg-lc-card border border-white/10 rounded-card-sm overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${height}`}
            className="w-full block"
            preserveAspectRatio="none"
            style={{ height }}
          >
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
          </svg>
        </div>
      </div>
    </div>
  )
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

export default function QualiCompare({
  drivers,
  dataPath,
}: {
  drivers: QualiDriver[]
  dataPath: string
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

  const styles = useMemo(() => buildStyles(tracce, perNumero), [tracce, perNumero])
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
      const libero = d.laps.find((l) => !gia.has(l.lap))
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
  // Il confronto avviene alla stessa FRAZIONE di giro, non alla stessa
  // distanza in metri. La distanza non e' un dato di OpenF1: si ricava
  // integrando la velocita', e due giri dello stesso tracciato finiscono con
  // lunghezze che differiscono di qualche decina di metri. Confrontandoli a
  // metri uguali si mettevano a confronto punti diversi della pista, e a 300
  // km/h quaranta metri di disallineamento valgono mezzo secondo di delta
  // inventato, con picchi assurdi nelle staccate dove la velocita' cambia in
  // fretta.
  //
  // A frazioni uguali i due giri sono allineati per costruzione all'inizio e
  // al traguardo, quindi il delta finale coincide con il distacco
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
                    {d.laps.map((l, k) => (
                      <option key={l.lap} value={l.lap}>
                        {formatLapTime(l.time)}
                        {k === 0 ? ' — migliore' : ''}
                        {l.compound ? ` · ${l.compound.slice(0, 4)}` : ''}
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

          <p className="font-montserrat text-[11px] text-lc-subtle mb-8">
            {tracce.length >= MAX_TRACCE
              ? `Massimo ${MAX_TRACCE} giri a confronto: togline uno per aggiungerne un altro.`
              : 'Si possono confrontare anche più giri dello stesso pilota: stesso colore, tratto diverso.'}
          </p>

          {caricamento && attivi.length === 0 ? (
            <p className="font-montserrat text-[13px] text-lc-subtle">Carico la telemetria…</p>
          ) : attivi.length === 0 ? (
            <p className="font-montserrat text-[13px] text-lc-subtle">
              Telemetria non disponibile per la selezione corrente.
            </p>
          ) : (
            <>
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
                  />
                  <p className="font-montserrat text-[11px] text-lc-subtle -mt-4 mb-6 ml-[52px]">
                    Sopra lo zero: più lento di {delta.refAbbr}. Sotto: più veloce.
                  </p>
                </>
              )}

              <Chart title="Velocità" unit="km/h" height={alto(ALTEZZE.velocita)} series={serieDa((t) => t.speed)} ticks={5} legenda={legenda} nomeFile={nomeFileDi('velocita')} />
              <Chart title="Acceleratore" unit="%" height={alto(ALTEZZE.acceleratore)} series={serieDa((t) => t.throttle)} yMin={0} yMax={100} ticks={3} legenda={legenda} nomeFile={nomeFileDi('acceleratore')} />
              <Chart title="Freno" unit="on/off" height={alto(ALTEZZE.freno)} series={serieDa((t) => t.brake.map((b) => b * 100))} yMin={0} yMax={100} ticks={2} format={(v) => (v > 50 ? 'ON' : 'OFF')} legenda={legenda} nomeFile={nomeFileDi('freno')} />
              <Chart title="Marcia" unit="n" height={alto(ALTEZZE.marcia)} series={serieDa((t) => t.gear)} yMin={1} yMax={8} ticks={4} legenda={legenda} nomeFile={nomeFileDi('marcia')} />

              <p className="font-montserrat text-[11px] text-lc-subtle ml-[52px]">
                Asse orizzontale: distanza percorsa sul giro, dalla linea del traguardo.
                Il compagno di squadra ha la linea bianca; piu&apos; giri dello stesso pilota
                hanno lo stesso colore ma tratto diverso.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
