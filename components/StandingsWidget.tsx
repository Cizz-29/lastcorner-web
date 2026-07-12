// Server Component — fetch diretto, cache 1 ora

interface Driver {
  position: string
  Driver: { familyName: string; givenName: string; nationality: string }
  Constructors: [{ name: string }]
  points: string
  wins: string
}

interface Constructor {
  position: string
  Constructor: { name: string; nationality: string }
  points: string
  wins: string
}

async function getDriverStandings(): Promise<Driver[]> {
  try {
    const res = await fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json', { next: { revalidate: 3600 } })
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
  } catch { return [] }
}

async function getConstructorStandings(): Promise<Constructor[]> {
  try {
    const res = await fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json', { next: { revalidate: 3600 } })
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
  } catch { return [] }
}

const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#3671C6', 'Ferrari': '#E8002D', 'Mercedes': '#27F4D2',
  'McLaren': '#FF8000', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'RB': '#6692FF', 'Haas F1 Team': '#B6BABD', 'Sauber': '#52E252',
}

function getTeamColor(teamName: string): string {
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (teamName.includes(key)) return color
  }
  return '#FF3A3A'
}

async function DriverStandings() {
  const drivers = await getDriverStandings()
  return (
    <div>
      <h3 className="font-akira text-[10px] text-lc-subtle uppercase mb-3 tracking-widest">Piloti</h3>
      <div className="flex flex-col gap-[2px]">
        {drivers.slice(0, 5).map((d) => {
          const color = getTeamColor(d.Constructors[0]?.name ?? '')
          const isFirst = d.position === '1'
          return (
            <div key={d.position} className="flex items-center gap-2 py-[5px] px-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="font-akira text-[11px] w-4 text-center shrink-0"
                style={{ color: isFirst ? '#FFD700' : 'rgba(255,255,255,0.4)' }}>
                {d.position}
              </span>
              <div className="w-[3px] h-[14px] rounded-full shrink-0" style={{ background: color }} />
              {/* font-akira senza bold = variante più leggera */}
              <span className="font-akira text-[11px] text-white flex-1 truncate tracking-wide">
                {d.Driver.familyName.toUpperCase()}
              </span>
              <span className="font-akira font-bold text-[11px] text-lc-red shrink-0">
                {d.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

async function ConstructorStandings() {
  const teams = await getConstructorStandings()
  return (
    <div>
      <h3 className="font-akira text-[10px] text-lc-subtle uppercase mb-3 tracking-widest">Costruttori</h3>
      <div className="flex flex-col gap-[2px]">
        {teams.slice(0, 5).map((t) => {
          const color = getTeamColor(t.Constructor.name)
          const isFirst = t.position === '1'
          return (
            <div key={t.position} className="flex items-center gap-2 py-[5px] px-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="font-akira text-[11px] w-4 text-center shrink-0"
                style={{ color: isFirst ? '#FFD700' : 'rgba(255,255,255,0.4)' }}>
                {t.position}
              </span>
              <div className="w-[3px] h-[14px] rounded-full shrink-0" style={{ background: color }} />
              <span className="font-akira text-[11px] text-white flex-1 truncate tracking-wide">
                {t.Constructor.name.toUpperCase()}
              </span>
              <span className="font-akira font-bold text-[11px] text-lc-red shrink-0">
                {t.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function StandingsWidget() {
  return (
    <div className="bg-lc-card rounded-card p-5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-lc-red rounded-full" />
        <h2 className="font-akira font-bold text-[13px] text-white uppercase tracking-wide">
          Classifica F1 2025
        </h2>
      </div>
      <div className="flex flex-col gap-5">
        <DriverStandings />
        <div className="h-px bg-white/10" />
        <ConstructorStandings />
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
