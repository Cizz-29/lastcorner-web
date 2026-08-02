'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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
}

// Le linee restano tutte continue: a distinguere i compagni di squadra è
// solo la tonalità, progressivamente più chiara a parità di colore team.
function buildStyles(drivers: QualiDriver[]): Record<number, Style> {
  const seen: Record<string, number> = {}
  const styles: Record<number, Style> = {}
  for (const d of drivers) {
    const key = d.color.toLowerCase()
    const n = seen[key] ?? 0
    seen[key] = n + 1
    styles[d.number] = {
      color: n === 0 ? d.color : shade(d.color, Math.min(0.3 + 0.25 * (n - 1), 0.75)),
    }
  }
  return styles
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
}) {
  const all = series.flatMap((s) => s.y)
  if (all.length === 0) return null
  const lo = yMin ?? Math.min(...all)
  const hi = yMax ?? Math.max(...all)
  const n = ticks ?? 3
  const values = Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1))

  return (
    <div className="mb-6">
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-2">
        {title} <span className="text-lc-subtle normal-case">({unit})</span>
      </p>
      <div className="flex">
        <div
          className="relative shrink-0 text-right pr-2"
          style={{ width: AXIS_W, height }}
          aria-hidden
        >
          {values.map((v, i) => (
            <span
              key={i}
              className="absolute right-2 font-montserrat text-[9px] text-lc-subtle leading-none"
              style={{ top: yOf(v, height, lo, hi), transform: 'translateY(-50%)' }}
            >
              {format(v)}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0 bg-lc-card border border-white/10 rounded-card-sm overflow-hidden">
          <svg
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

  const [selected, setSelected] = useState<number[]>(() => sorted.slice(0, 2).map((d) => d.number))
  const [lapChoice, setLapChoice] = useState<Record<number, number>>({})
  const [cache, setCache] = useState<Record<number, Record<string, Telemetry>>>({})
  const [caricamento, setCaricamento] = useState(false)

  const picked = sorted.filter((d) => selected.includes(d.number))
  const styles = useMemo(() => buildStyles(picked), [picked])

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
              const res = await fetch(`${dataPath}/qualifying/${n}.json`)
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
    load(selected)
  }, [selected, load])

  function toggle(num: number) {
    setSelected((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : prev.length < 4 ? [...prev, num] : prev
    )
  }

  function lapFor(d: QualiDriver): number {
    return lapChoice[d.number] ?? d.bestLap
  }

  function telemetryFor(d: QualiDriver): Telemetry | null {
    return cache[d.number]?.[String(lapFor(d))] ?? null
  }

  const attivi = picked
    .map((d) => ({ driver: d, tel: telemetryFor(d) }))
    .filter((x): x is { driver: QualiDriver; tel: Telemetry } => x.tel !== null)

  function serieDa(getter: (t: Telemetry) => number[]): Serie[] {
    return attivi.map(({ driver, tel }) => ({
      key: driver.number,
      style: styles[driver.number],
      x: tel.distance,
      y: getter(tel),
    }))
  }

  // Delta cumulato rispetto al primo pilota selezionato.
  const delta = useMemo(() => {
    if (attivi.length < 2) return null
    const ref = attivi[0]
    const maxDist = Math.min(...attivi.map((a) => a.tel.distance[a.tel.distance.length - 1]))
    const steps = 400
    const dists = Array.from({ length: steps }, (_, i) => (i / (steps - 1)) * maxDist)
    const series: Serie[] = attivi.slice(1).map(({ driver, tel }) => ({
      key: driver.number,
      style: styles[driver.number],
      x: dists,
      y: dists.map((d) => timeAtDistance(tel, d) - timeAtDistance(ref.tel, d)),
    }))
    return { refAbbr: ref.driver.abbr, series }
  }, [attivi, styles])

  return (
    <div>
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">
        Piloti a confronto <span className="text-lc-subtle normal-case">(max 4)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-8">
        {sorted.map((d) => {
          const on = selected.includes(d.number)
          const st = styles[d.number]
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

      {picked.length === 0 ? (
        <p className="font-montserrat text-[13px] text-lc-subtle">Seleziona almeno un pilota.</p>
      ) : (
        <>
          {/* Scheda per pilota con selettore del giro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {picked.map((d) => {
              const st = styles[d.number]
              const scelto = lapFor(d)
              return (
                <div
                  key={d.number}
                  className="bg-lc-card border border-white/10 rounded-card-sm p-4 border-l-2"
                  style={{ borderLeftColor: st?.color }}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="font-akira text-[13px] text-white">{d.abbr}</p>
                    <svg width="26" height="6" aria-hidden>
                      <line x1="0" y1="3" x2="26" y2="3" stroke={st?.color} strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="font-montserrat text-[11px] text-lc-subtle mb-3 truncate">{d.team}</p>

                  <label className="block font-montserrat text-[10px] text-lc-subtle mb-1">
                    Giro
                  </label>
                  <select
                    value={scelto}
                    onChange={(e) =>
                      setLapChoice((prev) => ({ ...prev, [d.number]: Number(e.target.value) }))
                    }
                    className="w-full bg-lc-bg border border-white/15 rounded px-2 py-1.5 font-montserrat text-[12px] text-white focus:outline-none focus:border-lc-red"
                  >
                    {d.laps.map((l, i) => (
                      <option key={l.lap} value={l.lap}>
                        {formatLapTime(l.time)}
                        {i === 0 ? ' — migliore' : ''}
                        {l.compound ? ` · ${l.compound.slice(0, 4)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          {caricamento && attivi.length === 0 ? (
            <p className="font-montserrat text-[13px] text-lc-subtle">Carico la telemetria…</p>
          ) : attivi.length === 0 ? (
            <p className="font-montserrat text-[13px] text-lc-subtle">
              Telemetria non disponibile per la selezione corrente.
            </p>
          ) : (
            <>
              {delta && (
                <>
                  <Chart
                    title="Delta"
                    unit={`secondi vs ${delta.refAbbr}`}
                    height={120}
                    series={delta.series}
                    ticks={5}
                    zeroLine
                    format={(v) => v.toFixed(2)}
                  />
                  <p className="font-montserrat text-[11px] text-lc-subtle -mt-4 mb-6 ml-[52px]">
                    Sopra lo zero: più lento di {delta.refAbbr}. Sotto: più veloce.
                  </p>
                </>
              )}

              <Chart title="Velocità" unit="km/h" height={180} series={serieDa((t) => t.speed)} ticks={5} />
              <Chart title="Acceleratore" unit="%" height={90} series={serieDa((t) => t.throttle)} yMin={0} yMax={100} ticks={3} />
              <Chart title="Freno" unit="on/off" height={60} series={serieDa((t) => t.brake.map((b) => b * 100))} yMin={0} yMax={100} ticks={2} format={(v) => (v > 50 ? 'ON' : 'OFF')} />
              <Chart title="Marcia" unit="n" height={90} series={serieDa((t) => t.gear)} yMin={1} yMax={8} ticks={4} />

              <p className="font-montserrat text-[11px] text-lc-subtle ml-[52px]">
                Asse orizzontale: distanza percorsa sul giro, dalla linea del traguardo.
                I compagni di squadra si distinguono per tonalità del colore.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
