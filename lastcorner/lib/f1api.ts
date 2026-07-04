// Tutte le chiamate API F1 - Jolpica (gratuita, no API key)
// Cache Next.js: revalidate ogni ora

const BASE = 'https://api.jolpi.ca/ergast/f1'

export async function getNextRace() {
  try {
    const res = await fetch(`${BASE}/current/next.json`, {
      next: { revalidate: 3600 }
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
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.MRData?.RaceTable?.Races ?? []
  } catch {
    return []
  }
}

export async function getDriverStandings() {
  try {
    const res = await fetch(`${BASE}/current/driverStandings.json`, {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
  } catch {
    return []
  }
}

export async function getConstructorStandings() {
  try {
    const res = await fetch(`${BASE}/current/constructorStandings.json`, {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
  } catch {
    return []
  }
}
