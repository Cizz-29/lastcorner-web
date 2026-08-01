'use client'

import { useState, type ReactNode } from 'react'

// Selettore Qualifica / Gara. I due pannelli arrivano già renderizzati dal
// server component: qui si gestisce solo quale mostrare.
export default function SessionTabs({
  hasQuali,
  hasRace,
  quali,
  race,
}: {
  hasQuali: boolean
  hasRace: boolean
  quali: ReactNode
  race: ReactNode
}) {
  const [tab, setTab] = useState<'Q' | 'R'>(hasQuali ? 'Q' : 'R')

  if (!hasQuali && !hasRace) {
    return (
      <div className="bg-lc-card border border-white/10 rounded-card p-8 max-w-xl">
        <p className="font-montserrat text-[14px] text-lc-subtle leading-relaxed">
          Dati non ancora disponibili per questo weekend.
        </p>
      </div>
    )
  }

  const pill = 'font-akira text-[11px] uppercase tracking-wider rounded-full px-5 py-2 border transition-colors'

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {hasQuali && (
          <button
            onClick={() => setTab('Q')}
            className={`${pill} ${
              tab === 'Q'
                ? 'bg-lc-red border-lc-red text-white'
                : 'border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
            }`}
          >
            Qualifica
          </button>
        )}
        {hasRace && (
          <button
            onClick={() => setTab('R')}
            className={`${pill} ${
              tab === 'R'
                ? 'bg-lc-red border-lc-red text-white'
                : 'border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
            }`}
          >
            Gara
          </button>
        )}
      </div>

      <div hidden={tab !== 'Q'}>{quali}</div>
      <div hidden={tab !== 'R'}>{race}</div>
    </div>
  )
}
