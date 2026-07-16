'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import type { DriverStanding, ConstructorStanding } from '@/lib/f1api'

// Selettore Piloti/Costruttori per la pagina classifica F1: prima le due
// classifiche erano mostrate una sotto l'altra, ora un toggle ne mostra
// una alla volta. La larghezza fissa (con whitespace-nowrap) della colonna
// punti evita che i punteggi a 3 cifre (es. "179 pt") vadano a capo e
// rendano quelle righe più alte delle altre.
export default function StandingsToggle({
  categorySlug,
  drivers,
  constructors,
}: {
  categorySlug: string
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
}) {
  const [tab, setTab] = useState<'piloti' | 'costruttori'>('piloti')

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setTab('piloti')}
          className={`font-akira text-[12px] uppercase tracking-widest px-5 py-2 rounded-lg transition-colors ${
            tab === 'piloti' ? 'bg-lc-red text-white' : 'bg-white/5 text-lc-subtle hover:bg-white/10'
          }`}
        >
          Piloti
        </button>
        <button
          type="button"
          onClick={() => setTab('costruttori')}
          className={`font-akira text-[12px] uppercase tracking-widest px-5 py-2 rounded-lg transition-colors ${
            tab === 'costruttori' ? 'bg-lc-red text-white' : 'bg-white/5 text-lc-subtle hover:bg-white/10'
          }`}
        >
          Costruttori
        </button>
      </div>

      {tab === 'piloti' ? (
        <div className="flex flex-col gap-[2px]">
          {drivers.map((d) => {
            const color = getTeamColor(d.Constructors[0]?.name ?? '')
            const flagUrl = getFlagUrl(d.Driver.nationality)
            return (
              <Link
                key={d.Driver.driverId}
                href={`/${categorySlug}/piloti/${d.Driver.driverId}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <span className="font-akira font-bold text-[13px] w-6 text-center shrink-0 text-white">
                  {d.position}
                </span>
                <div className="w-[3px] h-[18px] rounded-full shrink-0" style={{ background: color }} />
                {flagUrl && (
                  <Image src={flagUrl} alt={d.Driver.nationality} width={22} height={15} className="rounded-[2px] shrink-0" />
                )}
                <span className="font-akira text-[13px] text-white flex-1 truncate">
                  {d.Driver.givenName} {d.Driver.familyName.toUpperCase()}
                </span>
                <span className="font-montserrat text-[11px] text-lc-subtle w-28 truncate hidden sm:block">
                  {d.Constructors[0]?.name}
                </span>
                <span className="font-montserrat text-[10px] text-lc-subtle w-10 text-center shrink-0">
                  {d.wins}V
                </span>
                <span className="font-akira font-bold text-[13px] text-white w-16 text-right shrink-0 whitespace-nowrap">
                  {d.points} pt
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-[2px]">
          {constructors.map((t) => {
            const color = getTeamColor(t.Constructor.name)
            const flagUrl = getFlagUrl(t.Constructor.nationality)
            return (
              <Link
                key={t.Constructor.constructorId}
                href={`/${categorySlug}/team/${t.Constructor.constructorId}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <span className="font-akira font-bold text-[13px] w-6 text-center shrink-0 text-white">
                  {t.position}
                </span>
                <div className="w-[3px] h-[18px] rounded-full shrink-0" style={{ background: color }} />
                {flagUrl && (
                  <Image src={flagUrl} alt={t.Constructor.nationality} width={22} height={15} className="rounded-[2px] shrink-0" />
                )}
                <span className="font-akira text-[13px] text-white flex-1 truncate">
                  {t.Constructor.name}
                </span>
                <span className="font-montserrat text-[10px] text-lc-subtle w-10 text-center shrink-0">
                  {t.wins}V
                </span>
                <span className="font-akira font-bold text-[13px] text-white w-16 text-right shrink-0 whitespace-nowrap">
                  {t.points} pt
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
