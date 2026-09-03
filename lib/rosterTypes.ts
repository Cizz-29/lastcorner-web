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
  /** Solo F1 Academy: il team di Formula 1 che sostiene la pilota, con
   *  l'id della sua pagina sul sito per poterlo collegare. Non tutte ne
   *  hanno uno, quindi entrambi i campi sono opzionali. */
  supportingTeamName?: string
  supportingTeamId?: string
}

export interface RosterTeam {
  constructorId: string
  name: string
  nationality?: string
  position?: string
  points?: string
  wins?: string
}
