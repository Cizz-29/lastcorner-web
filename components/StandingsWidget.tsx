// Server Component — fetch diretto (parallelo), cache 1 ora

import {
  getAllStandings,
  type DriverStanding,
  type ConstructorStanding,
} from '@/lib/f1api'
import { getTeamColor } from '@/lib/teamColors'

function EmptyState({ label }: { label: string }) {
  return (
    <p className="font-montserrat text-[11px] text-lc-subtle py-3 text-center">
      Classifica {label} non disponibile al momento.
    </p>
  )
}

function DriverStandings({ drivers }: { drivers: DriverStanding[] }) {
  return (
    <div>
      <h3 className="font-akira text-[10px] text-lc-subtle uppercase mb-3 tracking-widest">Piloti</h3>
      {drivers.length === 0 ? (
        <EmptyState label="piloti" />
      ) : (
        <div className="flex flex-col gap-[2px]">
          {drivers.slice(0, 5).map((d) => {
            const color = getTeamColor(d.Constructors[0]?.name ?? '')
            return (
              <div key={d.position} className="flex items-center gap-2 py-[5px] px-2 rounded-lg hover:bg-white/5 transition-colors">
                <span className="font-akira text-[11px] w-4 text-center shrink-0 text-white">
                  {d.position}
                </span>
                <div className="w-[3px] h-[14px] rounded-full shrink-0" style={{ background: color }} />
                <span className="font-akira text-[11px] text-white flex-1 truncate tracking-wide">
                  {d.Driver.familyName.toUpperCase()}
                </span>
                <span className="font-akira font-bold text-[11px] text-white shrink-0">
                  {d.points}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ConstructorStandings({ teams }: { teams: ConstructorStanding[] }) {
  return (
    <div>
      <h3 className="font-akira text-[10px] text-lc-subtle uppercase mb-3 tracking-widest">Costruttori</h3>
      {teams.length === 0 ? (
        <EmptyState label="costruttori" />
      ) : (
        <div className="flex flex-col gap-[2px]">
          {teams.slice(0, 5).map((t) => {
            const color = getTeamColor(t.Constructor.name)
            return (
              <div key={t.position} className="flex items-center gap-2 py-[5px] px-2 rounded-lg hover:bg-white/5 transition-colors">
                <span className="font-akira text-[11px] w-4 text-center shrink-0 text-white">
                  {t.position}
                </span>
                <div className="w-[3px] h-[14px] rounded-full shrink-0" style={{ background: color }} />
                <span className="font-akira text-[11px] text-white flex-1 truncate tracking-wide">
                  {t.Constructor.name.toUpperCase()}
                </span>
                <span className="font-akira font-bold text-[11px] text-white shrink-0">
                  {t.points}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default async function StandingsWidget() {
  const { drivers, constructors } = await getAllStandings()
  const season = new Date().getFullYear()

  return (
    <div className="bg-lc-card rounded-card p-5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-lc-red rounded-full" />
        <h2 className="font-akira font-bold text-[13px] text-white uppercase tracking-wide">
          Classifica F1 {season}
        </h2>
      </div>
      <div className="flex flex-col gap-5">
        <DriverStandings drivers={drivers} />
        <div className="h-px bg-white/10" />
        <ConstructorStandings teams={constructors} />
      </div>
      <div className="mt-4 text-center">
        <a href="/formula-1/classifica"
          className="font-montserrat text-[10px] text-lc-subtle hover:text-lc-red transition-colors duration-200">
          Classifica completa →
        </a>
      </div>
    </div>
  )
}
