import Link from 'next/link'
import Image from 'next/image'
import { getTeamColor } from '@/lib/teamColors'
import { getFlagUrl } from '@/lib/nationalityFlags'
import type { RosterDriver } from '@/lib/rosterTypes'

// Card grafica per l'overview piloti: niente foto (l'API non le fornisce),
// l'identità visiva è costruita con numero di gara, colore team e bandiera.
// Posizione/bandiera compaiono solo se il dato è disponibile (F1 live vs.
// roster statico F2/F3).
export default function DriverCard({
  driver,
  categorySlug,
}: {
  driver: RosterDriver
  categorySlug: string
}) {
  const color = getTeamColor(driver.teamName)
  const flagUrl = driver.nationality ? getFlagUrl(driver.nationality) : null

  return (
    <Link
      href={`/${categorySlug}/piloti/${driver.driverId}`}
      className="group relative block bg-lc-card rounded-card border border-white/10 overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />

      <div className="flex items-start justify-between mb-5">
        <span
          className="font-akira font-extrabold text-[38px] leading-none tabular-nums"
          style={{ color }}
        >
          {driver.permanentNumber}
        </span>
        {flagUrl && (
          <Image
            src={flagUrl}
            alt={driver.nationality ?? ''}
            width={26}
            height={18}
            className="rounded-[2px] mt-1 shrink-0"
          />
        )}
      </div>

      {driver.code && (
        <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-widest mb-1">
          {driver.code}
        </p>
      )}
      <h3 className="font-akira font-bold text-[14px] text-white leading-tight mb-4 group-hover:text-lc-red transition-colors duration-200">
        {driver.givenName}
        <br />
        {driver.familyName.toUpperCase()}
      </h3>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="font-montserrat text-[10px] text-lc-subtle truncate pr-2">
          {driver.teamName}
        </span>
        {driver.position && (
          <span className="font-akira font-bold text-[11px] text-white shrink-0">
            P{driver.position}
          </span>
        )}
      </div>
    </Link>
  )
}
