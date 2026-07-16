// Roster piloti/team di Formula 2 e Formula 3 — stagione 2026.
// Fonte: siti ufficiali FIA F2/F3 (fiaformula2.com, fiaformula3.com) e
// Wikipedia (per l'elenco completo team/piloti/nazionalità). Nessun dato
// di classifica: non esiste un'API gratuita per queste categorie, quindi
// posizione/punti restano assenti piuttosto che essere stimati/inventati.
// Da aggiornare manualmente in caso di cambi di line-up in corso di stagione.
import type { RosterDriver, RosterTeam } from './rosterTypes'

interface RosterTeamEntry {
  id: string
  name: string
  drivers: { number: string; givenName: string; familyName: string; nationality: string }[]
}

const F2_TEAMS: RosterTeamEntry[] = [
  { id: 'invicta-racing', name: 'Invicta Racing', drivers: [
    { number: '1', givenName: 'Rafael', familyName: 'Câmara', nationality: 'Brazilian' },
    { number: '2', givenName: 'Joshua', familyName: 'Dürksen', nationality: 'Paraguayan' },
  ]},
  { id: 'hitech', name: 'Hitech', drivers: [
    { number: '3', givenName: 'Ritomo', familyName: 'Miyata', nationality: 'Japanese' },
    { number: '4', givenName: 'Colton', familyName: 'Herta', nationality: 'American' },
  ]},
  { id: 'campos-racing', name: 'Campos Racing', drivers: [
    { number: '5', givenName: 'Noel', familyName: 'León', nationality: 'Mexican' },
    { number: '6', givenName: 'Nikola', familyName: 'Tsolov', nationality: 'Bulgarian' },
  ]},
  { id: 'dams-lucas-oil', name: 'DAMS Lucas Oil', drivers: [
    { number: '7', givenName: 'Dino', familyName: 'Beganovic', nationality: 'Swedish' },
    { number: '8', givenName: 'Roman', familyName: 'Bilinski', nationality: 'Polish' },
  ]},
  { id: 'mp-motorsport', name: 'MP Motorsport', drivers: [
    { number: '9', givenName: 'Gabriele', familyName: 'Minì', nationality: 'Italian' },
    { number: '10', givenName: 'Oliver', familyName: 'Goethe', nationality: 'German' },
  ]},
  { id: 'prema-racing', name: 'PREMA Racing', drivers: [
    { number: '11', givenName: 'Sebastián', familyName: 'Montoya', nationality: 'Colombian' },
    { number: '12', givenName: 'Mari', familyName: 'Boya', nationality: 'Spanish' },
  ]},
  { id: 'rodin-motorsport', name: 'Rodin Motorsport', drivers: [
    { number: '14', givenName: 'Martinius', familyName: 'Stenshorne', nationality: 'Norwegian' },
    { number: '15', givenName: 'Alex', familyName: 'Dunne', nationality: 'Irish' },
  ]},
  { id: 'art-grand-prix', name: 'ART Grand Prix', drivers: [
    { number: '16', givenName: 'Kush', familyName: 'Maini', nationality: 'Indian' },
    { number: '17', givenName: 'Tasanapol', familyName: 'Inthraphuvasak', nationality: 'Thai' },
  ]},
  { id: 'aix-racing', name: 'AIX Racing', drivers: [
    { number: '20', givenName: 'Emerson', familyName: 'Fittipaldi Jr.', nationality: 'Brazilian' },
    { number: '21', givenName: 'Cian', familyName: 'Shields', nationality: 'British' },
  ]},
  { id: 'van-amersfoort-racing', name: 'Van Amersfoort Racing', drivers: [
    { number: '22', givenName: 'Nicolás', familyName: 'Varrone', nationality: 'Argentine' },
    { number: '23', givenName: 'Rafael', familyName: 'Villagómez', nationality: 'Mexican' },
  ]},
  { id: 'trident', name: 'Trident', drivers: [
    { number: '24', givenName: 'Laurens', familyName: 'van Hoepen', nationality: 'Dutch' },
    { number: '25', givenName: 'John', familyName: 'Bennett', nationality: 'British' },
  ]},
]

const F3_TEAMS: RosterTeamEntry[] = [
  { id: 'campos-racing', name: 'Campos Racing', drivers: [
    { number: '1', givenName: 'Théophile', familyName: 'Naël', nationality: 'French' },
    { number: '2', givenName: 'Ugo', familyName: 'Ugochukwu', nationality: 'American' },
    { number: '3', givenName: 'Ernesto', familyName: 'Rivera', nationality: 'Mexican' },
  ]},
  { id: 'trident', name: 'Trident', drivers: [
    { number: '4', givenName: 'Noah', familyName: 'Strømsted', nationality: 'Danish' },
    { number: '5', givenName: 'Freddie', familyName: 'Slater', nationality: 'British' },
    { number: '6', givenName: 'Matteo', familyName: 'De Palo', nationality: 'Italian' },
  ]},
  { id: 'mp-motorsport', name: 'MP Motorsport', drivers: [
    { number: '7', givenName: 'Mattia', familyName: 'Colnaghi', nationality: 'Argentine' },
    { number: '8', givenName: 'Tuukka', familyName: 'Taponen', nationality: 'Finnish' },
    { number: '9', givenName: 'Alessandro', familyName: 'Giusti', nationality: 'Italian' },
  ]},
  { id: 'art-grand-prix', name: 'ART Grand Prix', drivers: [
    { number: '10', givenName: 'Taito', familyName: 'Kato', nationality: 'Japanese' },
    { number: '11', givenName: 'Maciej', familyName: 'Gładysz', nationality: 'Polish' },
    { number: '12', givenName: 'Kanato', familyName: 'Le', nationality: 'Japanese' },
  ]},
  { id: 'van-amersfoort-racing', name: 'Van Amersfoort Racing', drivers: [
    { number: '14', givenName: 'Hiyu', familyName: 'Yamakoshi', nationality: 'Japanese' },
    { number: '15', givenName: 'Enzo', familyName: 'Deligny', nationality: 'French' },
    { number: '16', givenName: 'Bruno', familyName: 'del Pino', nationality: 'Spanish' },
  ]},
  { id: 'rodin-motorsport', name: 'Rodin Motorsport', drivers: [
    { number: '17', givenName: 'Pedro', familyName: 'Clerot', nationality: 'Brazilian' },
    { number: '18', givenName: 'Brando', familyName: 'Badoer', nationality: 'Italian' },
    { number: '19', givenName: 'Christian', familyName: 'Ho', nationality: 'Singaporean' },
  ]},
  { id: 'prema-racing', name: 'PREMA Racing', drivers: [
    { number: '20', givenName: 'Louis', familyName: 'Sharp', nationality: 'Australian' },
    { number: '21', givenName: 'James', familyName: 'Wharton', nationality: 'Australian' },
    { number: '22', givenName: 'José', familyName: 'Garfias', nationality: 'Mexican' },
  ]},
  { id: 'hitech', name: 'Hitech', drivers: [
    { number: '23', givenName: 'Michael', familyName: 'Shin', nationality: 'South Korean' },
    { number: '24', givenName: 'Fionn', familyName: 'McLaughlin', nationality: 'Irish' },
    { number: '25', givenName: 'Jin', familyName: 'Nakamura', nationality: 'Japanese' },
  ]},
  { id: 'aix-racing', name: 'AIX Racing', drivers: [
    { number: '26', givenName: 'Brad', familyName: 'Benavides', nationality: 'American' },
    { number: '27', givenName: 'Yevan', familyName: 'David', nationality: 'Emirati' },
    { number: '28', givenName: 'Fernando', familyName: 'Barrichello', nationality: 'Brazilian' },
  ]},
  { id: 'dams-lucas-oil', name: 'DAMS Lucas Oil', drivers: [
    { number: '29', givenName: 'Nicola', familyName: 'Lacorte', nationality: 'Italian' },
    { number: '30', givenName: 'Nandhavud', familyName: 'Bhirombhakdi', nationality: 'Thai' },
    { number: '31', givenName: 'Gerrard', familyName: 'Xie', nationality: 'Chinese' },
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
        nationality: d.nationality,
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
