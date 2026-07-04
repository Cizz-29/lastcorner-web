// Questo componente è Server Component: fetch direttamente sul server
// Aggiornamento automatico ogni ora via Next.js revalidation

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
    const res = await fetch(
      'https://api.jolpi.ca/ergast/f1/current/driverStandings.json',
      { next: { revalidate: 3600 } } // cache 1 ora
    )
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
  } catch {
    return []
  }
}

async function getConstructorStandings(): Promise<Constructor[]> {
  try {
    const res = await fetch(
      'https://api.jolpi.ca/ergast/f1/current/constructorStandings.json',
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
  } catch {
    return []
  }
}

// Mappa costruttore → colore (le squadre 2025)
const TEAM_COLORS: Record<string, string> = {
  'Red Bull':      '#3671C6',
  'Ferrari':       '#E8002D',
  'Mercedes':      '#27F4D2',
  'McLaren':       '#FF8000',
  'Aston Martin':  '#229971',
  'Alpine':        '#FF87BC',
  'Williams':      '#64C4FF',
  'RB':            '#6692FF',
  'Haas F1 Team':  '#B6BABD',
  'Sauber':        '#52E252',
}

function getTeamColor(teamName: string): string {
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (teamName.includes(key)) return color
  }
  return '#FF3A3A'
}

// ── Componente Piloti ────────────────────────────────────────
async function DriverStandings() {
  const drivers = await getDriverStandings()
  const top5 = drivers.slice(0, 5)

  return (
    <div>
      <h3 className="font-akira font-bold text-[11px] text-lc-subtle uppercase mb-3 tracking-wide">
        Piloti
      </h3>
      <div className="flex flex-col gap-1">
        {top5.map((d) => {
          const teamColor = getTeamColor(d.Constructors[0]?.name ?? '')
          return (
            <div key={d.position} className="flex items-center gap-2 py-1">
              {/* Posizione */}
              <span className="font-akira font-bold text-[11px] w-5 text-center"
                style={{ color: d.position === '1' ? '#FFD700' : '#ffffff88' }}>
                {d.position}
              </span>
              {/* Indicatore team */}
              <div className="w-[3px] h-4 rounded-full shrink-0" style={{ background: teamColor }} />
              {/* Nome */}
              <span className="font-montserrat font-medium text-[12px] text-white flex-1 truncate">
                {d.Driver.familyName.toUpperCase()}
              </span>
              {/* Punti */}
              <span className="font-akira font-bold text-[12px] text-lc-red">
                {d.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente Costruttori ───────────────────────────────────
async function ConstructorStandings() {
  const teams = await getConstructorStandings()
  const top5 = teams.slice(0, 5)

  return (
    <div>
      <h3 className="font-akira font-bold text-[11px] text-lc-subtle uppercase mb-3 tracking-wide">
        Costruttori
      </h3>
      <div className="flex flex-col gap-1">
        {top5.map((t) => {
          const teamColor = getTeamColor(t.Constructor.name)
          return (
            <div key={t.position} className="flex items-center gap-2 py-1">
              <span className="font-akira font-bold text-[11px] w-5 text-center"
                style={{ color: t.position === '1' ? '#FFD700' : '#ffffff88' }}>
                {t.position}
              </span>
              <div className="w-[3px] h-4 rounded-full shrink-0" style={{ background: teamColor }} />
              <span className="font-montserrat font-medium text-[12px] text-white flex-1 truncate">
                {t.Constructor.name.toUpperCase()}
              </span>
              <span className="font-akira font-bold text-[12px] text-lc-red">
                {t.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Widget completo ──────────────────────────────────────────
export default async function StandingsWidget() {
  return (
    <div className="bg-lc-card rounded-card p-5 border border-white/10">
      {/* Header */}
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
