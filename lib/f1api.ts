// Tutte le chiamate API F1 - Jolpica (gratuita, no API key)
// Cache Next.js: revalidate ogni ora

const BASE = 'https://api.jolpi.ca/ergast/f1'

export async function getNextRace() {
  try {
    const res = await fetch(`${BASE}/current/next.json`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const races = data?.MRData?.RaceTable?.Races
    return races?.[0] ?? null
  } catch {
    return null
  }
}

export async function getCurrentSchedule() {
  try {
    const res = await fetch(`${BASE}/current.json`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.MRData?.RaceTable?.Races ?? []
  } catch {
    return []
  }
}

export interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: {
    driverId: string
    permanentNumber: string
    code: string
    givenName: string
    familyName: string
    nationality: string
  }
  Constructors: [{ constructorId: string; name: string; nationality: string }]
}

export interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: { constructorId: string; name: string; nationality: string }
}

export async function getDriverStandings(): Promise<DriverStanding[]> {
  try {
    const res = await fetch(`${BASE}/current/driverStandings.json`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
  } catch {
    return []
  }
}

export async function getConstructorStandings(): Promise<ConstructorStanding[]> {
  try {
    const res = await fetch(`${BASE}/current/constructorStandings.json`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
  } catch {
    return []
  }
}

// Fetch combinato: le due chiamate partono in parallelo invece che
// una dopo l'altra, riducendo il tempo totale di attesa lato server.
export async function getAllStandings() {
  const [drivers, constructors] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
  ])
  return { drivers, constructors }
}

// Conta i podi (posizione 1-3) di un pilota nella stagione in corso.
// L'API non espone questo dato direttamente nelle standings: viene quindi
// derivato dai risultati gara-per-gara con un'unica chiamata aggiuntiva.
export async function getDriverPodiums(driverId: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/current/drivers/${driverId}/results.json?limit=100`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 0
    const data = await res.json()
    const races = data?.MRData?.RaceTable?.Races ?? []
    return races.filter((race: { Results?: { positionText: string }[] }) => {
      const pos = parseInt(race.Results?.[0]?.positionText ?? '', 10)
      return !isNaN(pos) && pos <= 3
    }).length
  } catch {
    return 0
  }
}

// Conta i podi di un team: una gara conta se almeno uno dei due piloti
// ha chiuso nei primi tre.
export async function getConstructorPodiums(constructorId: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/current/constructors/${constructorId}/results.json?limit=100`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 0
    const data = await res.json()
    const races = data?.MRData?.RaceTable?.Races ?? []
    return races.filter((race: { Results?: { positionText: string }[] }) =>
      (race.Results ?? []).some((r) => {
        const pos = parseInt(r.positionText, 10)
        return !isNaN(pos) && pos <= 3
      })
    ).length
  } catch {
    return 0
  }
}
