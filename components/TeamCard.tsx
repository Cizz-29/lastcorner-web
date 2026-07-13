import Link from 'next/link'
import Image from 'next/image'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import type { ConstructorStanding } from '@/lib/f1api'

// Card grafica per l'overview team: barra colore squadra, bandiera di
// nazionalità del team e punti/posizione in evidenza in stile "numero gara".
export default function TeamCard({
  team,
  categorySlug,
}: {
  team: ConstructorStanding
  categorySlug: string
}) {
  const color = getTeamColor(team.Constructor.name)
  const flagUrl = getFlagUrl(team.Constructor.nationality)

  return (
    <Link
      href={`/${categorySlug}/team/${team.Constructor.constructorId}`}
      className="group relative block bg-lc-card rounded-card border border-white/10 overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />

      <div className="flex items-start justify-between mb-6">
        <span
          className="font-akira font-extrabold text-[30px] leading-none tabular-nums"
          style={{ color }}
        >
          P{team.position}
        </span>
        {flagUrl && (
          <Image
            src={flagUrl}
            alt={team.Constructor.nationality}
            width={26}
            height={18}
            className="rounded-[2px] mt-1 shrink-0"
          />
        )}
      </div>

      <h3 className="font-akira font-bold text-[16px] text-white leading-tight mb-5 group-hover:text-lc-red transition-colors duration-200">
        {team.Constructor.name.toUpperCase()}
      </h3>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="font-montserrat text-[10px] text-lc-subtle">
          {team.wins} {team.wins === '1' ? 'vittoria' : 'vittorie'}
        </span>
        <span className="font-akira font-bold text-[13px] text-white shrink-0">
          {team.points} pt
        </span>
      </div>
    </Link>
  )
}
