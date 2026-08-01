'use client'

import { useMemo, useState } from 'react'

// Passo gara: tempo sul giro di ogni pilota selezionato, giro per giro.
// I giri di pit (in/out lap) sono marcati con un punto, così si distinguono
// dai giri "puliti" senza falsare la lettura del passo.

export interface RaceLap {
  n: number
  t: number | null
  compound: string | null
  stint: number | null
  pit: boolean
}

export interface RaceDriver {
  abbr: string
  name: string
  team: string
  color: string
  position: number | null
  status: string
  laps: RaceLap[]
}

const W = 1000
const H = 380
const PAD_L = 52
const PAD_R = 12
const PAD_T = 10
const PAD_B = 24

function formatLapTime(s: number): string {
  const m = Math.floor(s / 60)
  const rest = s - m * 60
  return `${m}:${rest.toFixed(3).padStart(6, '0')}`
}

export default function RacePace({ drivers }: { drivers: RaceDriver[] }) {
  const sorted = useMemo(
    () => [...drivers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
    [drivers]
  )
  const [selected, setSelected] = useState<string[]>(() => sorted.slice(0, 3).map((d) => d.abbr))
  // Nasconde i giri anomali (safety car, pit, errori) oltre una soglia sopra
  // il giro più veloce: senza questo filtro la scala verticale viene
  // schiacciata da pochi giri lentissimi e il passo diventa illeggibile.
  const [filtra, setFiltra] = useState(true)

  const picked = sorted.filter((d) => selected.includes(d.abbr))

  function toggle(abbr: string) {
    setSelected((prev) =>
      prev.includes(abbr) ? prev.filter((a) => a !== abbr) : prev.length < 6 ? [...prev, abbr] : prev
    )
  }

  const chart = useMemo(() => {
    const times = picked.flatMap((d) => d.laps.map((l) => l.t).filter((t): t is number => t != null))
    if (times.length === 0) return null
    const fastest = Math.min(...times)
    const cutoff = filtra ? fastest * 1.12 : Math.max(...times)
    const visible = times.filter((t) => t <= cutoff)
    const lo = Math.min(...visible)
    const hi = Math.max(...visible)
    const maxLap = Math.max(...picked.flatMap((d) => d.laps.map((l) => l.n)))
    return { lo, hi, maxLap, cutoff, fastest }
  }, [picked, filtra])

  function pos(lap: number, time: number) {
    if (!chart) return { x: 0, y: 0 }
    const x = PAD_L + ((lap - 1) / Math.max(chart.maxLap - 1, 1)) * (W - PAD_L - PAD_R)
    const y =
      PAD_T + (1 - (time - chart.lo) / (chart.hi - chart.lo || 1)) * (H - PAD_T - PAD_B)
    return { x, y }
  }

  return (
    <div>
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">
        Piloti <span className="text-lc-subtle normal-case">(max 6)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
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
              {d.position != null && <span className="opacity-70 ml-2">P{d.position}</span>}
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-2 mb-6 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={filtra}
          onChange={(e) => setFiltra(e.target.checked)}
          className="accent-lc-red"
        />
        <span className="font-montserrat text-[12px] text-lc-subtle">
          Nascondi giri anomali (safety car, pit, errori)
        </span>
      </label>

      {!chart ? (
        <p className="font-montserrat text-[13px] text-lc-subtle">Seleziona almeno un pilota.</p>
      ) : (
        <>
          <div className="bg-lc-card border border-white/10 rounded-card-sm overflow-hidden mb-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height: H }}>
              {/* Griglia orizzontale (tempi) */}
              {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                const t = chart.lo + f * (chart.hi - chart.lo)
                const y = PAD_T + (1 - f) * (H - PAD_T - PAD_B)
                return (
                  <g key={i}>
                    <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                    <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="#C3C3C3" fontSize={9} fontFamily="Montserrat, sans-serif">
                      {formatLapTime(t)}
                    </text>
                  </g>
                )
              })}
              {/* Griglia verticale (giri) */}
              {Array.from({ length: 6 }, (_, i) => {
                const lap = Math.round(1 + (i / 5) * (chart.maxLap - 1))
                const { x } = pos(lap, chart.lo)
                return (
                  <g key={`v${i}`}>
                    <line x1={x} y1={PAD_T} x2={x} y2={H - PAD_B} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                    <text x={x} y={H - 8} textAnchor="middle" fill="#C3C3C3" fontSize={9} fontFamily="Montserrat, sans-serif">
                      {lap}
                    </text>
                  </g>
                )
              })}

              {/* Serie per pilota, spezzate sui giri nascosti/mancanti */}
              {picked.map((d) => {
                const segments: { x: number; y: number }[][] = []
                let current: { x: number; y: number }[] = []
                for (const lap of d.laps) {
                  if (lap.t == null || lap.t > chart.cutoff) {
                    if (current.length) segments.push(current)
                    current = []
                    continue
                  }
                  current.push(pos(lap.n, lap.t))
                }
                if (current.length) segments.push(current)

                return (
                  <g key={d.abbr}>
                    {segments.map((seg, i) => (
                      <polyline
                        key={i}
                        points={seg.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                        fill="none"
                        stroke={d.color}
                        strokeWidth={1.6}
                        strokeLinejoin="round"
                      />
                    ))}
                    {d.laps
                      .filter((l) => l.pit && l.t != null && l.t <= chart.cutoff)
                      .map((l) => {
                        const p = pos(l.n, l.t as number)
                        return <circle key={l.n} cx={p.x} cy={p.y} r={2.6} fill={d.color} stroke="#131318" strokeWidth={1} />
                      })}
                  </g>
                )
              })}
            </svg>
          </div>

          <p className="font-montserrat text-[11px] text-lc-subtle mb-8">
            Asse orizzontale: numero del giro. I punti indicano i giri di entrata/uscita dai box.
            Giro più veloce tra i selezionati: {formatLapTime(chart.fastest)}.
          </p>

          {/* Stint e mescole */}
          <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">Stint</p>
          <div className="flex flex-col gap-2">
            {picked.map((d) => {
              const stints: { compound: string | null; from: number; to: number }[] = []
              for (const lap of d.laps) {
                const last = stints[stints.length - 1]
                if (last && last.compound === lap.compound) last.to = lap.n
                else stints.push({ compound: lap.compound, from: lap.n, to: lap.n })
              }
              const total = Math.max(...d.laps.map((l) => l.n), 1)
              return (
                <div key={d.abbr} className="flex items-center gap-3">
                  <span className="font-montserrat text-[11px] text-white w-10 shrink-0">{d.abbr}</span>
                  <div className="flex-1 flex h-5 rounded-full overflow-hidden border border-white/10">
                    {stints.map((s, i) => (
                      <div
                        key={i}
                        title={`${s.compound ?? '—'} · giri ${s.from}-${s.to}`}
                        style={{
                          width: `${((s.to - s.from + 1) / total) * 100}%`,
                          backgroundColor: d.color,
                          opacity: 0.35 + (i % 3) * 0.25,
                        }}
                        className="flex items-center justify-center"
                      >
                        <span className="font-montserrat text-[9px] text-white/90 uppercase truncate px-1">
                          {s.compound ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
