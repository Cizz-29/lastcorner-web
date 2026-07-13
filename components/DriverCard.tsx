import Link from 'next/link'
import Image from 'next/image'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import type { DriverStanding } from '@/lib/f1api'

// Card grafica per l'overview piloti: niente foto (l'API non le fornisce),
// l'identità visiva è costruita con numero di gara, colore team e bandiera.
export default function DriverCard({
  driver,
  categorySlug,
}: {
  driver: DriverStanding
  categorySlug: string
}) {
  const constructor = driver.Constructors[0]
  const color = getTeamColor(constructor?.name ?? '')
  const flagUrl = getFlagUrl(driver.Driver.nationality)

  return (
    <Link
      href={`/${categorySlug}/piloti/${driver.Driver.driverId}`}
      className="group relative block bg-lc-card rounded-card border border-white/10 overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />

      <div className="flex items-start justify-between mb-5">
        <span
          className="font-akira font-extrabold text-[38px] leading-none tabular-nums"
          style={{ color }}
        >
          {driver.Driver.permanentNumber}
        </span>
        {flagUrl && (
          <Image
            src={flagUrl}
            alt={driver.Driver.nationality}
            width={26}
            height={18}
            className="rounded-[2px] mt-1 shrink-0"
          />
        )}
      </div>

      <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-widest mb-1">
        {driver.Driver.code}
      </p>
      <h3 className="font-akira font-bold text-[14px] text-white leading-tight mb-4 group-hover:text-lc-red transition-colors duration-200">
        {driver.Driver.givenName}
        <br />
        {driver.Driver.familyName.toUpperCase()}
      </h3>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="font-montserrat text-[10px] text-lc-subtle truncate pr-2">
          {constructor?.name}
        </span>
        <span className="font-akira font-bold text-[11px] text-white shrink-0">
          P{driver.position}
        </span>
      </div>
    </Link>
  )
}
