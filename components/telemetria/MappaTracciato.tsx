'use client'

import { useMemo, useRef } from 'react'

// Il tracciato visto dall'alto, colorato microsettore per microsettore col
// colore del pilota piu' veloce in quel tratto.
//
// I dati vengono da track.json (scripts/telemetry/process_session.py): le
// coordinate del giro piu' veloce della sessione, ruotate come nelle mappe
// ufficiali e campionate a frazioni uguali di giro. La frazione di giro e' la
// stessa scala dei grafici, quindi un microsettore e' lo stesso tratto qui e
// la'. Passando col cursore sulla pista si muove anche il cursore dei grafici,
// e viceversa.

export interface Tracciato {
  lunghezza: number
  x: number[]
  y: number[]
  curve: { n: string; f: number; x: number; y: number; lx: number; ly: number }[]
}

export interface Microsettore {
  da: number
  a: number
  /** Colore del pilota piu' veloce nel tratto; assente se pari. */
  colore?: string
}

export interface RigaCursore {
  etichetta: string
  colore: string
  testo: string
}

interface Props {
  tracciato: Tracciato
  microsettori: Microsettore[]
  cursore: number | null
  onCursore: (f: number | null) => void
  righe: RigaCursore[]
  /** Colore del pallino che segue il cursore: quello del pilota di riferimento. */
  colorePallino: string
}

const MARGINE = 70

export default function MappaTracciato({ tracciato, microsettori, cursore, onCursore, righe, colorePallino }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const n = tracciato.x.length

  // Nel sistema di FastF1 la Y cresce verso l'alto, in SVG verso il basso:
  // si ribalta qui una volta per tutte.
  const punti = useMemo(
    () => tracciato.x.map((x, i) => [x, -tracciato.y[i]] as const),
    [tracciato]
  )

  const vista = useMemo(() => {
    const tutteX = [...punti.map((p) => p[0]), ...tracciato.curve.map((c) => c.lx)]
    const tutteY = [...punti.map((p) => p[1]), ...tracciato.curve.map((c) => -c.ly)]
    const minX = Math.min(...tutteX) - MARGINE
    const maxX = Math.max(...tutteX) + MARGINE
    const minY = Math.min(...tutteY) - MARGINE
    const maxY = Math.max(...tutteY) + MARGINE
    return { minX, minY, w: maxX - minX, h: maxY - minY }
  }, [punti, tracciato])

  // Spessori in proporzione alla grandezza del disegno: un tracciato lungo
  // come Spa e uno corto come Monaco devono avere la stessa linea a schermo.
  const scala = Math.max(vista.w, vista.h) / 100

  const indiceDi = (f: number) => Math.max(0, Math.min(n - 1, Math.round(f * (n - 1))))
  const percorso = (da: number, a: number) => {
    const i0 = indiceDi(da)
    const i1 = indiceDi(a)
    let d = ''
    for (let i = i0; i <= i1; i++) d += `${i === i0 ? 'M' : 'L'}${punti[i][0]},${punti[i][1]}`
    return d
  }
  const intero = useMemo(() => percorso(0, 1) + 'Z', [punti]) // eslint-disable-line react-hooks/exhaustive-deps

  function daPuntatore(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    let migliore = 0
    let distanza = Infinity
    for (let i = 0; i < n; i++) {
      const dx = punti[i][0] - p.x
      const dy = punti[i][1] - p.y
      const d = dx * dx + dy * dy
      if (d < distanza) {
        distanza = d
        migliore = i
      }
    }
    // Lontano dalla pista non si mostra nulla: il cursore resta dov'e' utile.
    if (Math.sqrt(distanza) > scala * 8) {
      onCursore(null)
      return
    }
    onCursore(migliore / (n - 1))
  }

  const pallino = cursore != null ? punti[indiceDi(cursore)] : null
  // La curva piu' vicina al cursore, per dire "dove" si e' sulla pista.
  const curvaVicina =
    cursore != null && tracciato.curve.length > 0
      ? tracciato.curve.reduce((a, b) => (Math.abs(b.f - cursore) < Math.abs(a.f - cursore) ? b : a))
      : null

  return (
    <div className="relative bg-lc-card border border-white/10 rounded-card-sm p-3 h-full">
      <svg
        ref={svgRef}
        viewBox={`${vista.minX} ${vista.minY} ${vista.w} ${vista.h}`}
        className="w-full h-auto block touch-none"
        role="img"
        aria-label="Tracciato colorato per microsettore secondo il pilota più veloce"
        onPointerMove={daPuntatore}
        onPointerDown={daPuntatore}
        onPointerLeave={() => onCursore(null)}
      >
        <path
          d={intero}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={scala * 3.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {microsettori.map((m, i) => (
          <path
            key={i}
            d={percorso(m.da, m.a)}
            fill="none"
            stroke={m.colore ?? 'rgba(255,255,255,0.45)'}
            strokeWidth={scala * 1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {/* Traguardo: un trattino bianco nel punto zero del giro. */}
        <circle cx={punti[0][0]} cy={punti[0][1]} r={scala * 1.4} fill="#fff" />
        {tracciato.curve.map((c) => (
          <g key={c.n}>
            <circle cx={c.lx} cy={-c.ly} r={scala * 2.1} fill="#131318" stroke="rgba(255,255,255,0.35)" strokeWidth={scala * 0.25} />
            <text
              x={c.lx}
              y={-c.ly}
              fill="#fff"
              fontSize={scala * 2.2}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-montserrat), Montserrat, sans-serif"
            >
              {c.n}
            </text>
          </g>
        ))}
        {pallino && (
          <circle
            cx={pallino[0]}
            cy={pallino[1]}
            r={scala * 1.9}
            fill={colorePallino}
            stroke="#fff"
            strokeWidth={scala * 0.5}
          />
        )}
      </svg>

      {cursore != null && righe.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 bg-black/75 border border-white/15 rounded-lg px-3 py-2">
          {curvaVicina && (
            <p className="font-montserrat text-[10px] uppercase tracking-widest text-lc-subtle mb-1">
              vicino a curva {curvaVicina.n}
            </p>
          )}
          {righe.map((r) => (
            <p key={r.etichetta} className="font-montserrat text-[12px] font-semibold tabular-nums" style={{ color: r.colore }}>
              {r.etichetta} <span className="text-white">{r.testo}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
