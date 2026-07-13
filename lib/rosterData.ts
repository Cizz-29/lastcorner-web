// Roster piloti/team di Formula 2 e Formula 3 — stagione 2026.
// Fonte: siti ufficiali FIA F2/F3 (fiaformula2.com, fiaformula3.com) e
// Wikipedia (per l'elenco completo team/piloti). Nessuna nazionalità o dato
// di classifica: non esiste un'API gratuita per queste categorie, quindi
// questi campi restano assenti piuttosto che essere stimati/inventati.
// Da aggiornare manualmente in caso di cambi di line-up in corso di stagione.
import type { RosterDriver, RosterTeam } from './rosterTypes'

interface RosterTeamEntry {
  id: string
  name: string
  drivers: { number: string; givenName: string; familyName: string }[]
}

const F2_TEAMS: RosterTeamEntry[] = [
  { id: 'invicta-racing', name: 'Invicta Racing', drivers: [
    { number: '1', givenName: 'Rafael', familyName: 'Câmara' },
    { number: '2', givenName: 'Joshua', familyName: 'Dürksen' },
  ]},
  { id: 'hitech', name: 'Hitech', drivers: [
    { number: '3', givenName: 'Ritomo', familyName: 'Miyata' },
    { number: '4', givenName: 'Colton', familyName: 'Herta' },
  ]},
  { id: 'campos-racing', name: 'Campos Racing', drivers: [
    { number: '5', givenName: 'Noel', familyName: 'León' },
    { number: '6', givenName: 'Nikola', familyName: 'Tsolov' },
  ]},
  { id: 'dams-lucas-oil', name: 'DAMS Lucas Oil', drivers: [
    { number: '7', givenName: 'Dino', familyName: 'Beganovic' },
    { number: '8', givenName: 'Roman', familyName: 'Bilinski' },
  ]},
  { id: 'mp-motorsport', name: 'MP Motorsport', drivers: [
    { number: '9', givenName: 'Gabriele', familyName: 'Minì' },
    { number: '10', givenName: 'Oliver', familyName: 'Goethe' },
  ]},
  { id: 'prema-racing', name: 'PREMA Racing', drivers: [
    { number: '11', givenName: 'Sebastián', familyName: 'Montoya' },
    { number: '12', givenName: 'Mari', familyName: 'Boya' },
  ]},
  { id: 'rodin-motorsport', name: 'Rodin Motorsport', drivers: [
    { number: '14', givenName: 'Martinius', familyName: 'Stenshorne' },
    { number: '15', givenName: 'Alex', familyName: 'Dunne' },
  ]},
  { id: 'art-grand-prix', name: 'ART Grand Prix', drivers: [
    { number: '16', givenName: 'Kush', familyName: 'Maini' },
    { number: '17', givenName: 'Tasanapol', familyName: 'Inthraphuvasak' },
  ]},
  { id: 'aix-racing', name: 'AIX Racing', drivers: [
    { number: '20', givenName: 'Emerson', familyName: 'Fittipaldi Jr.' },
    { number: '21', givenName: 'Cian', familyName: 'Shields' },
  ]},
  { id: 'van-amersfoort-racing', name: 'Van Amersfoort Racing', drivers: [
    { number: '22', givenName: 'Nico', familyName: 'Varrone' },
    { number: '23', givenName: 'Rafael', familyName: 'Villagómez' },
  ]},
  { id: 'trident', name: 'Trident', drivers: [
    { number: '24', givenName: 'Laurens', familyName: 'van Hoepen' },
    { number: '25', givenName: 'John', familyName: 'Bennett' },
  ]},
]

const F3_TEAMS: RosterTeamEntry[] = [
  { id: 'campos-racing', name: 'Campos Racing', drivers: [
    { number: '1', givenName: 'Théophile', familyName: 'Naël' },
    { number: '2', givenName: 'Ugo', familyName: 'Ugochukwu' },
    { number: '3', givenName: 'Patrick', familyName: 'Heuzenroeder' },
  ]},
  { id: 'trident', name: 'Trident', drivers: [
    { number: '4', givenName: 'Noah', familyName: 'Strømsted' },
    { number: '5', givenName: 'Freddie', familyName: 'Slater' },
    { number: '6', givenName: 'Matteo', familyName: 'De Palo' },
  ]},
  { id: 'mp-motorsport', name: 'MP Motorsport', drivers: [
    { number: '7', givenName: 'Mattia', familyName: 'Colnaghi' },
    { number: '8', givenName: 'Tuukka', familyName: 'Taponen' },
    { number: '9', givenName: 'Alessandro', familyName: 'Giusti' },
  ]},
  { id: 'art-grand-prix', name: 'ART Grand Prix', drivers: [
    { number: '10', givenName: 'Taito', familyName: 'Kato' },
    { number: '11', givenName: 'Maciej', familyName: 'Gładysz' },
    { number: '12', givenName: 'Kanato', familyName: 'Le' },
  ]},
  { id: 'van-amersfoort-racing', name: 'Van Amersfoort Racing', drivers: [
    { number: '14', givenName: 'Hiyu', familyName: 'Yamakoshi' },
    { number: '15', givenName: 'Enzo', familyName: 'Deligny' },
    { number: '16', givenName: 'Bruno', familyName: 'del Pino' },
  ]},
  { id: 'rodin-motorsport', name: 'Rodin Motorsport', drivers: [
    { number: '17', givenName: 'Pedro', familyName: 'Clerot' },
    { number: '18', givenName: 'Brando', familyName: 'Badoer' },
    { number: '19', givenName: 'Christian', familyName: 'Ho' },
  ]},
  { id: 'prema-racing', name: 'PREMA Racing', drivers: [
    { number: '20', givenName: 'Louis', familyName: 'Sharp' },
    { number: '21', givenName: 'James', familyName: 'Wharton' },
    { number: '22', givenName: 'José', familyName: 'Garfias' },
  ]},
  { id: 'hitech', name: 'Hitech', drivers: [
    { number: '23', givenName: 'Michael', familyName: 'Shin' },
    { number: '24', givenName: 'Fionn', familyName: 'McLaughlin' },
    { number: '25', givenName: 'Jin', familyName: 'Nakamura' },
  ]},
  { id: 'aix-racing', name: 'AIX Racing', drivers: [
    { number: '26', givenName: 'Brad', familyName: 'Benavides' },
    { number: '27', givenName: 'Yevan', familyName: 'David' },
    { number: '28', givenName: 'Fernando', familyName: 'Barrichello' },
  ]},
  { id: 'dams-lucas-oil', name: 'DAMS Lucas Oil', drivers: [
    { number: '29', givenName: 'Nicola', familyName: 'Lacorte' },
    { number: '30', givenName: 'Nandhavud', familyName: 'Bhirombhakdi' },
    { number: '31', givenName: 'Gerrard', familyName: 'Xie' },
  ]},
]

function slugify(s: string): string {
  return s
    .replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .replace(/ø/g, 'o').replace(/Ø/g, 'O')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildRoster(teamEntries: RosterTeamEntry[]): { drivers: RosterDriver[]; teams: RosterTeam[] } {
  const drivers: RosterDriver[] = []
  const teams: RosterTeam[] = []

  for (const t of teamEntries) {
    teams.push({ constructorId: t.id, name: t.name })
    for (const d of t.drivers) {
      drivers.push({
        driverId: slugify(`${d.givenName}-${d.familyName}`),
        permanentNumber: d.number,
        givenName: d.givenName,
        familyName: d.familyName,
        teamId: t.id,
        teamName: t.name,
      })
    }
  }

  return { drivers, teams }
}

const ROSTERS: Record<string, { drivers: RosterDriver[]; teams: RosterTeam[] }> = {
  'formula-2': buildRoster(F2_TEAMS),
  'formula-3': buildRoster(F3_TEAMS),
}

export function getRosterDrivers(categorySlug: string): RosterDriver[] {
  return ROSTERS[categorySlug]?.drivers ?? []
}

export function getRosterTeams(categorySlug: string): RosterTeam[] {
  return ROSTERS[categorySlug]?.teams ?? []
}

export function getRosterDriver(categorySlug: string, driverId: string): RosterDriver | undefined {
  return getRosterDrivers(categorySlug).find((d) => d.driverId === driverId)
}

export function getRosterTeam(categorySlug: string, teamId: string): RosterTeam | undefined {
  return getRosterTeams(categorySlug).find((t) => t.constructorId === teamId)
}

export function getRosterTeamDrivers(categorySlug: string, teamId: string): RosterDriver[] {
  return getRosterDrivers(categorySlug).filter((d) => d.teamId === teamId)
}

// Categorie che hanno un roster statico F2/F3 (piloti/team con pagine
// individuali, ma senza statistiche live).
export function hasStaticRoster(categorySlug: string): boolean {
  return categorySlug in ROSTERS
}
