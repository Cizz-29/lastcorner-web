'use client'

import { useState, type ReactNode } from 'react'

// Doppio selettore: prima la sessione del weekend (libere, qualifiche,
// sprint, gara), poi la vista (telemetria o passo). I pannelli arrivano già
// renderizzati dal server: qui si gestisce solo quale mostrare.

export interface SessionPanel {
  key: string
  label: string
  telemetria: ReactNode
  passo: ReactNode
}

const pill =
  'font-akira text-[11px] uppercase tracking-wider rounded-full px-4 py-2 border transition-colors'

export default function SessionTabs({ panels }: { panels: SessionPanel[] }) {
  const [sessione, setSessione] = useState(() => {
    // Si apre sulla sessione più significativa disponibile: gara, poi
    // qualifica, altrimenti la prima.
    const preferita = ['R', 'Q', 'SPR', 'SQ'].find((k) => panels.some((p) => p.key === k))
    return preferita ?? panels[0]?.key ?? ''
  })
  const [vista, setVista] = useState<'tel' | 'passo'>('tel')

  if (panels.length === 0) {
    return (
      <div className="bg-lc-card border border-white/10 rounded-card p-8 max-w-xl">
        <p className="font-montserrat text-[14px] text-lc-subtle leading-relaxed">
          Dati non ancora disponibili per questo weekend.
        </p>
      </div>
    )
  }

  const attivo = panels.find((p) => p.key === sessione) ?? panels[0]
  const haTel = attivo.telemetria !== null
  const haPasso = attivo.passo !== null
  // Se la vista scelta non esiste per questa sessione si ricade sull'altra.
  const vistaEffettiva = vista === 'tel' && !haTel ? 'passo' : vista === 'passo' && !haPasso ? 'tel' : vista

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {panels.map((p) => (
          <button
            key={p.key}
            onClick={() => setSessione(p.key)}
            className={`${pill} ${
              p.key === attivo.key
                ? 'bg-lc-red border-lc-red text-white'
                : 'border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {haTel && haPasso && (
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setVista('tel')}
            className={`font-montserrat text-[12px] rounded-full px-4 py-1.5 border transition-colors ${
              vistaEffettiva === 'tel'
                ? 'border-white/60 text-white'
                : 'border-white/15 text-lc-subtle hover:text-white'
            }`}
          >
            Telemetria giro
          </button>
          <button
            onClick={() => setVista('passo')}
            className={`font-montserrat text-[12px] rounded-full px-4 py-1.5 border transition-colors ${
              vistaEffettiva === 'passo'
                ? 'border-white/60 text-white'
                : 'border-white/15 text-lc-subtle hover:text-white'
            }`}
          >
            Passo
          </button>
        </div>
      )}
      {(!haTel || !haPasso) && <div className="mb-8" />}

      {/* key sul contenitore: cambiando sessione i componenti si rimontano,
          azzerando selezioni di piloti non presenti in quella sessione. */}
      <div key={attivo.key}>
        {vistaEffettiva === 'tel' ? attivo.telemetria : attivo.passo}
      </div>
    </div>
  )
}
