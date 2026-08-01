'use client'

import { useMemo, useState } from 'react'

// Confronto giri di qualifica: si scelgono 2+ piloti e si sovrappongono le
// tracce telemetriche del loro giro veloce (velocità, gas, freno, marce) più
// il delta cumulato rispetto al primo pilota selezionato.
//
// I grafici sono SVG scritti a mano invece di una libreria: nessun peso
// aggiunto al bundle e pieno controllo sullo stile (stessa palette del sito).

export interface QualiDriver {
  abbr: string
  name: string
  team: string
  color: string
  position: number | null
  lapTime: number | null
  compound: string | null
  telemetry: {
    distance: number[]
    speed: number[]
    throttle: number[]
    brake: number[]
    gear: number[]
    time: number[]
  }
}

const W = 1000
const PAD_L = 44
const PAD_R = 12

function formatLapTime(s: number | null): string {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const rest = s - m * 60
  return `${m}:${rest.toFixed(3).padStart(6, '0')}`
}

function buildPath(xs: number[], ys: number[], w: number, h: number, yMin: number, yMax: number): string {
  const xMax = xs[xs.length - 1] || 1
  const span = yMax - yMin || 1
  let d = ''
  for (let i = 0; i < xs.length; i++) {
    const x = PAD_L + (xs[i] / xMax) * (w - PAD_L - PAD_R)
    const y = h - ((ys[i] - yMin) / span) * h
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

// Interpola il tempo del pilota a una data distanza: serve per il delta,
// visto che i due giri hanno campionamenti diversi.
function timeAtDistance(tel: QualiDriver['telemetry'], dist: number): number {
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

interface TraceProps {
  title: string
  unit: string
  height: number
  drivers: QualiDriver[]
  values: (d: QualiDriver) => number[]
  yMin?: number
  yMax?: number
  step?: boolean
}

function Trace({ title, unit, height, drivers, values, yMin, yMax }: TraceProps) {
  const all = drivers.flatMap(values)
  const lo = yMin ?? Math.min(...all)
  const hi = yMax ?? Math.max(...all)
  const ticks = [lo, (lo + hi) / 2, hi]

  return (
    <div className="mb-6">
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-2">
        {title} <span className="text-lc-subtle normal-case">({unit})</span>
      </p>
      <div className="bg-lc-card border border-white/10 rounded-card-sm overflow-hidden">
        <svg viewBox={`0 0 ${W} ${height}`} className="w-full block" preserveAspectRatio="none" style={{ height }}>
          {ticks.map((t, i) => {
            const y = height - ((t - lo) / (hi - lo || 1)) * height
            return (
              <g key={i}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="#C3C3C3" fontSize={9} fontFamily="Montserrat, sans-serif">
                  {Math.round(t)}
                </text>
              </g>
            )
          })}
          {drivers.map((d) => (
            <path
              key={d.abbr}
              d={buildPath(d.telemetry.distance, values(d), W, height, lo, hi)}
              fill="none"
              stroke={d.color}
              strokeWidth={1.6}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

export default function QualiCompare({ drivers }: { drivers: QualiDriver[] }) {
  const sorted = useMemo(
    () => [...drivers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
    [drivers]
  )
  const [selected, setSelected] = useState<string[]>(() => sorted.slice(0, 2).map((d) => d.abbr))

  const picked = sorted.filter((d) => selected.includes(d.abbr))

  function toggle(abbr: string) {
    setSelected((prev) =>
      prev.includes(abbr) ? prev.filter((a) => a !== abbr) : prev.length < 4 ? [...prev, abbr] : prev
    )
  }

  // Delta cumulato rispetto al primo pilota selezionato.
  const delta = useMemo(() => {
    if (picked.length < 2) return null
    const ref = picked[0]
    const others = picked.slice(1)
    const maxDist = Math.min(...picked.map((d) => d.telemetry.distance[d.telemetry.distance.length - 1]))
    const steps = 400
    const dists = Array.from({ length: steps }, (_, i) => (i / (steps - 1)) * maxDist)
    const series = others.map((d) => ({
      driver: d,
      values: dists.map((dist) => timeAtDistance(d.telemetry, dist) - timeAtDistance(ref.telemetry, dist)),
    }))
    const flat = series.flatMap((s) => s.values)
    return { ref, dists, series, lo: Math.min(...flat, 0), hi: Math.max(...flat, 0) }
  }, [picked])

  return (
    <div>
      {/* Selettore piloti */}
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">
        Piloti a confronto <span className="text-lc-subtle normal-case">(max 4)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-8">
        {sorted.map((d) => {
          const on = selected.includes(d.abbr)
          return (
            <button
              key={d.abbr}
              onClick={() => toggle(d.abbr)}
              className={`font-montserrat text-[12px] rounded-full px-3 py-1.5 border transition-colors ${
                on ? 'text-white' : 'text-lc-subtle border-white/15 hover:border-white/40'
              }`}
              style={on ? { borderColor: d.color, backgroundColor: `${d.color}22` } : undefined}
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
          {/* Riepilogo selezionati */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {picked.map((d) => (
              <div key={d.abbr} className="bg-lc-card border border-white/10 rounded-card-sm p-4 border-l-2" style={{ borderLeftColor: d.color }}>
                <p className="font-akira text-[13px] text-white">{d.abbr}</p>
                <p className="font-montserrat text-[11px] text-lc-subtle mb-2 truncate">{d.team}</p>
                <p className="font-montserrat text-[14px] text-white">{formatLapTime(d.lapTime)}</p>
                {d.compound && (
                  <p className="font-montserrat text-[10px] text-lc-subtle mt-1 uppercase">{d.compound}</p>
                )}
              </div>
            ))}
          </div>

          {delta && (
            <div className="mb-6">
              <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-2">
                Delta <span className="text-lc-subtle normal-case">(secondi vs {delta.ref.abbr})</span>
              </p>
              <div className="bg-lc-card border border-white/10 rounded-card-sm overflow-hidden">
                <svg viewBox={`0 0 ${W} 120`} className="w-full block" preserveAspectRatio="none" style={{ height: 120 }}>
                  {[delta.hi, 0, delta.lo].map((t, i) => {
                    const y = 120 - ((t - delta.lo) / (delta.hi - delta.lo || 1)) * 120
                    return (
                      <g key={i}>
                        <line
                          x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                          stroke={t === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}
                          strokeWidth={1}
                        />
                        <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="#C3C3C3" fontSize={9} fontFamily="Montserrat, sans-serif">
                          {t.toFixed(2)}
                        </text>
                      </g>
                    )
                  })}
                  {delta.series.map((s) => (
                    <path
                      key={s.driver.abbr}
                      d={buildPath(delta.dists, s.values, W, 120, delta.lo, delta.hi)}
                      fill="none"
                      stroke={s.driver.color}
                      strokeWidth={1.6}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
              </div>
              <p className="font-montserrat text-[11px] text-lc-subtle mt-2">
                Sopra lo zero: più lento di {delta.ref.abbr}. Sotto: più veloce.
              </p>
            </div>
          )}

          <Trace title="Velocità" unit="km/h" height={180} drivers={picked} values={(d) => d.telemetry.speed} />
          <Trace title="Acceleratore" unit="%" height={90} drivers={picked} values={(d) => d.telemetry.throttle} yMin={0} yMax={100} />
          <Trace title="Freno" unit="on/off" height={60} drivers={picked} values={(d) => d.telemetry.brake.map((b) => b * 100)} yMin={0} yMax={100} />
          <Trace title="Marcia" unit="n" height={90} drivers={picked} values={(d) => d.telemetry.gear} yMin={1} yMax={8} />

          <p className="font-montserrat text-[11px] text-lc-subtle">
            Asse orizzontale: distanza percorsa sul giro, dalla linea del traguardo.
          </p>
        </>
      )}
    </div>
  )
}
