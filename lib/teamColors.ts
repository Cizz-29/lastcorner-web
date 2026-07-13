// Colori rappresentativi delle livree — usati come accento grafico su
// card piloti/team e nel widget classifica. Centralizzati qui così tutte
// le sezioni del sito restano coerenti tra loro.
//
// Nota: Audi e Cadillac sono i due team che debuttano in F1 nel 2026, per
// cui non esiste ancora una livrea "storica" consolidata: i colori scelti
// sono un'approssimazione ragionevole (rosso Audi Sport, oro Cadillac) e
// possono essere aggiornati facilmente da qui quando le livree ufficiali
// saranno definitive.
export const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Haas F1 Team': '#B6BABD',
  'Audi': '#BB0A30',
  'Cadillac F1 Team': '#C9A96E',
}

export function getTeamColor(teamName: string): string {
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (teamName.includes(key)) return color
  }
  return '#FF3A3A'
}
