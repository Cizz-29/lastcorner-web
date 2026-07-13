// Forma comune per piloti/team, condivisa tra i dati live F1 (Jolpica) e i
// roster statici di F2/F3 (raccolti manualmente, nessuna API gratuita
// disponibile per queste categorie). I campi legati alle classifiche
// (position, points, wins) e alla nazionalità sono opzionali: le card e le
// pagine semplicemente non li mostrano quando mancano, invece di inventare
// un dato che diventerebbe subito obsoleto.
export interface RosterDriver {
  driverId: string
  permanentNumber: string
  code?: string
  givenName: string
  familyName: string
  nationality?: string
  teamId: string
  teamName: string
  position?: string
  points?: string
  wins?: string
}

export interface RosterTeam {
  constructorId: string
  name: string
  nationality?: string
  position?: string
  points?: string
  wins?: string
}
