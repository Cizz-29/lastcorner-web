'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { esportaPng } from '@/components/telemetria/esportaPng'

// Passo: tempo sul giro di ogni pilota selezionato, giro per giro.
// Si può restringere l'analisi a un intervallo di giri (utile per isolare
// uno stint) e si legge la media di ciascun pilota su quell'intervallo.

export interface RaceLap {
  n: number
  t: number | null
  compound: string | null
  stint: number | null
  pit: boolean
}

export interface RaceDriver {
  number?: number
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
const AXIS_W = 74 // colonna etichette in HTML, fuori dall'SVG
const PAD_V = 18 // margine verticale: evita che i picchi tocchino il bordo
const PAD_B = 24 // spazio per i numeri dei giri

function formatLapTime(s: number): string {
  const m = Math.floor(s / 60)
  const rest = s - m * 60
  return `${m}:${rest.toFixed(3).padStart(6, '0')}`
}

// I compagni di squadra condividono il colore ufficiale: si schiarisce
// progressivamente il secondo (e il terzo) per distinguerli, mantenendo
// però tutte le linee continue.
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

// Stessa regola del confronto qualifica: il secondo pilota di una squadra
// prende il bianco. Schiarire il colore del team non basta — due tracce
// Mercedes, una verde acqua e una verde acqua un po' piu' chiara, su fondo
// nero e per settanta giri sono indistinguibili.
const BIANCO_COMPAGNO = '#FFFFFF'

function buildColors(drivers: RaceDriver[]): Record<string, string> {
  const seen: Record<string, number> = {}
  const out: Record<string, string> = {}
  for (const d of drivers) {
    const key = d.color.toLowerCase()
    const n = seen[key] ?? 0
    seen[key] = n + 1
    out[d.abbr] =
      n === 0
        ? d.color
        : n === 1
          ? BIANCO_COMPAGNO
          : shade(d.color, Math.min(0.3 + 0.25 * (n - 2), 0.75))
  }
  return out
}

export default function RacePace({ drivers }: { drivers: RaceDriver[] }) {
  const sorted = useMemo(
    () => [...drivers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
    [drivers]
  )
  const [selected, setSelected] = useState<string[]>(() => sorted.slice(0, 3).map((d) => d.abbr))
  const [filtra, setFiltra] = useState(true)

  const maxLap = useMemo(
    () => Math.max(1, ...drivers.flatMap((d) => d.laps.map((l) => l.n))),
    [drivers]
  )
  const [range, setRange] = useState<[number, number]>([1, maxLap])

  useEffect(() => {
    setRange([1, maxLap])
  }, [maxLap])

  const picked = sorted.filter((d) => selected.includes(d.abbr))
  const colors = useMemo(() => buildColors(picked), [picked])

  function toggle(abbr: string) {
    setSelected((prev) =>
      prev.includes(abbr) ? prev.filter((a) => a !== abbr) : prev.length < 6 ? [...prev, abbr] : prev
    )
  }

  const [from, to] = range

  const chart = useMemo(() => {
    const inRange = (l: RaceLap) => l.n >= from && l.n <= to && l.t != null
    const times = picked.flatMap((d) => d.laps.filter(inRange).map((l) => l.t as number))
    if (times.length === 0) return null

    // Soglia per i giri anomali: 107% della media. La media viene calcolata
    // in due passate — la prima serve solo a scartare i valori estremi
    // (safety car, soste), che altrimenti la gonfierebbero al punto da
    // lasciar passare proprio i giri che si vogliono nascondere.
    const mediaGrezza = times.reduce((a, b) => a + b, 0) / times.length
    const puliti = times.filter((t) => t <= mediaGrezza * 1.1)
    const media = puliti.length > 0 ? puliti.reduce((a, b) => a + b, 0) / puliti.length : mediaGrezza
    const cutoff = filtra ? media * 1.07 : Math.max(...times)

    const visibili = times.filter((t) => t <= cutoff)
    if (visibili.length === 0) return null
    const lo = Math.min(...visibili)
    const hi = Math.max(...visibili)
    const fastest = Math.min(...times)

    // Media per pilota sull'intervallo, esclusi i giri anomali.
    const medie = picked
      .map((d) => {
        const ts = d.laps.filter(inRange).map((l) => l.t).filter((t): t is number => t != null && t <= cutoff)
        return {
          abbr: d.abbr,
          media: ts.length ? ts.reduce((a, b) => a + b, 0) / ts.length : null,
          giri: ts.length,
        }
      })
      .filter((m) => m.media !== null)
      .sort((a, b) => (a.media as number) - (b.media as number))

    return { lo, hi, cutoff, fastest, medie }
  }, [picked, filtra, from, to])

  function pos(lap: number, time: number) {
    if (!chart) return { x: 0, y: 0 }
    const span = Math.max(to - from, 1)
    const x = ((lap - from) / span) * W
    const usable = H - PAD_V * 2 - PAD_B
    const y = PAD_V + (1 - (time - chart.lo) / (chart.hi - chart.lo || 1)) * usable
    return { x, y }
  }

  const gridTimes = chart
    ? [0, 0.25, 0.5, 0.75, 1].map((f) => chart.lo + f * (chart.hi - chart.lo))
    : []
  const gridLaps = Array.from({ length: 6 }, (_, i) =>
    Math.round(from + (i / 5) * (to - from))
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const titoloRef = useRef<HTMLParagraphElement>(null)
  const assiRef = useRef<HTMLSpanElement>(null)
  const [salvando, setSalvando] = useState(false)

  // Stessa esportazione del confronto qualifica (components/telemetria/
  // esportaPng.ts): cambia solo cosa c'e' sugli assi.
  async function scaricaPng() {
    if (!chart) return
    setSalvando(true)
    try {
      await esportaPng({
        svg: svgRef.current,
        titolo: 'Passo gara',
        unita: `giri ${from}–${to}`,
        etichette: gridTimes.map((t) => ({ testo: formatLapTime(t), y: pos(from, t).y })),
        altezzaGrafico: H,
        legenda: picked.map((d) => ({ abbr: d.abbr, color: colors[d.abbr] ?? d.color })),
        nomeFile: `lastcorner-passo-${picked.map((d) => d.abbr).join('-')}.png`.toLowerCase(),
        fontTitolo: titoloRef.current,
        fontTesto: assiRef.current,
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">
        Piloti <span className="text-lc-subtle normal-case">(max 6)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {sorted.map((d) => {
          const on = selected.includes(d.abbr)
          const c = colors[d.abbr]
          return (
            <button
              key={d.abbr}
              onClick={() => toggle(d.abbr)}
              className={`font-montserrat text-[12px] rounded-full px-3 py-1.5 border transition-colors ${
                on ? 'text-white' : 'text-lc-subtle border-white/15 hover:border-white/40'
              }`}
              style={on && c ? { borderColor: c, backgroundColor: `${c}22` } : undefined}
            >
              <span className="font-semibold">{d.abbr}</span>
              {d.position != null && <span className="opacity-70 ml-2">P{d.position}</span>}
            </button>
          )
        })}
      </div>

      {/* Intervallo di giri */}
      <div className="bg-lc-card border border-white/10 rounded-card-sm p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-akira text-[10px] text-white uppercase tracking-widest">
            Intervallo giri
          </p>
          <p className="font-montserrat text-[12px] text-white">
            {from} – {to}
            <span className="text-lc-subtle ml-2">({to - from + 1} giri)</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label className="flex items-center gap-2 flex-1 w-full">
            <span className="font-montserrat text-[11px] text-lc-subtle w-8">Da</span>
            <input
              type="range"
              min={1}
              max={maxLap}
              value={from}
              onChange={(e) => {
                const v = Number(e.target.value)
                // L'inizio non può superare la fine dell'intervallo.
                setRange(([, b]) => [Math.min(v, b), b])
              }}
              className="flex-1 accent-lc-red"
            />
          </label>
          <label className="flex items-center gap-2 flex-1 w-full">
            <span className="font-montserrat text-[11px] text-lc-subtle w-8">A</span>
            <input
              type="range"
              min={1}
              max={maxLap}
              value={to}
              onChange={(e) => {
                const v = Number(e.target.value)
                setRange(([a]) => [a, Math.max(v, a)])
              }}
              className="flex-1 accent-lc-red"
            />
          </label>
          <button
            onClick={() => setRange([1, maxLap])}
            className="font-montserrat text-[11px] text-lc-subtle hover:text-white border border-white/15 rounded-full px-3 py-1.5 shrink-0"
          >
            Tutta la gara
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-6 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={filtra}
          onChange={(e) => setFiltra(e.target.checked)}
          className="accent-lc-red"
        />
        <span className="font-montserrat text-[12px] text-lc-subtle">
          Nascondi giri anomali (oltre il 107% della media)
        </span>
      </label>

      {!chart ? (
        <p className="font-montserrat text-[13px] text-lc-subtle">
          Nessun dato per la selezione corrente.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p ref={titoloRef} className="font-akira text-[10px] text-white uppercase tracking-widest">
              Passo gara <span className="text-lc-subtle normal-case">(giri {from}–{to})</span>
            </p>
            <button
              type="button"
              onClick={scaricaPng}
              disabled={salvando}
              title="Scarica questo grafico come immagine PNG"
              className="font-akira text-[9px] uppercase tracking-widest text-lc-subtle border border-white/15 rounded-full px-3 py-1 shrink-0 transition-colors duration-200 hover:border-lc-red hover:text-lc-red disabled:opacity-40"
            >
              {salvando ? 'salvo…' : 'png'}
            </button>
          </div>

          <div className="flex mb-3">
            <div className="relative shrink-0" style={{ width: AXIS_W, height: H }} aria-hidden>
              {gridTimes.map((t, i) => {
                const p = pos(from, t)
                return (
                  <span
                    key={i}
                    ref={i === 0 ? assiRef : undefined}
                    className="absolute right-2 font-montserrat text-[9px] text-lc-subtle leading-none"
                    style={{ top: p.y, transform: 'translateY(-50%)' }}
                  >
                    {formatLapTime(t)}
                  </span>
                )
              })}
            </div>

            <div className="flex-1 min-w-0 bg-lc-card border border-white/10 rounded-card-sm overflow-hidden">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full block"
                preserveAspectRatio="none"
                style={{ height: H }}
              >
                {gridTimes.map((t, i) => {
                  const y = pos(from, t).y
                  return (
                    <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  )
                })}
                {gridLaps.map((lap, i) => {
                  const x = pos(lap, chart.lo).x
                  return (
                    <line key={`v${i}`} x1={x} y1={PAD_V} x2={x} y2={H - PAD_B} stroke="rgba(255,255,255,0.05)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  )
                })}

                {picked.map((d) => {
                  const segments: { x: number; y: number }[][] = []
                  let current: { x: number; y: number }[] = []
                  for (const lap of d.laps) {
                    if (lap.n < from || lap.n > to) continue
                    if (lap.t == null || lap.t > chart.cutoff) {
                      if (current.length) segments.push(current)
                      current = []
                      continue
                    }
                    current.push(pos(lap.n, lap.t))
                  }
                  if (current.length) segments.push(current)
                  const c = colors[d.abbr] ?? d.color

                  return (
                    <g key={d.abbr}>
                      {segments.map((seg, i) => (
                        <polyline
                          key={i}
                          points={seg.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                          fill="none"
                          stroke={c}
                          strokeWidth={1.7}
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      {d.laps
                        .filter((l) => l.pit && l.n >= from && l.n <= to && l.t != null && l.t <= chart.cutoff)
                        .map((l) => {
                          const p = pos(l.n, l.t as number)
                          return <circle key={l.n} cx={p.x} cy={p.y} r={3} fill={c} stroke="#131318" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                        })}
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Numeri dei giri sotto al grafico */}
          <div className="flex mb-6">
            <div className="shrink-0" style={{ width: AXIS_W }} />
            <div className="flex-1 flex justify-between font-montserrat text-[9px] text-lc-subtle px-1">
              {gridLaps.map((lap, i) => (
                <span key={i}>{lap}</span>
              ))}
            </div>
          </div>

          {/* Medie sull'intervallo */}
          <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-3">
            Media sull&apos;intervallo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {chart.medie.map((m, i) => {
              const rif = chart.medie[0].media as number
              const gap = (m.media as number) - rif
              return (
                <div
                  key={m.abbr}
                  className="bg-lc-card border border-white/10 rounded-card-sm p-3 border-l-2"
                  style={{ borderLeftColor: colors[m.abbr] }}
                >
                  <p className="font-akira text-[12px] text-white mb-1">{m.abbr}</p>
                  <p className="font-montserrat text-[13px] text-white">
                    {formatLapTime(m.media as number)}
                  </p>
                  <p className="font-montserrat text-[10px] text-lc-subtle mt-1">
                    {i === 0 ? 'riferimento' : `+${gap.toFixed(3)}`} · {m.giri} giri
                  </p>
                </div>
              )
            })}
          </div>

          <p className="font-montserrat text-[11px] text-lc-subtle mb-8">
            I punti indicano i giri di entrata/uscita dai box. Giro più veloce
            nell&apos;intervallo: {formatLapTime(chart.fastest)}.
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
                          backgroundColor: colors[d.abbr] ?? d.color,
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
