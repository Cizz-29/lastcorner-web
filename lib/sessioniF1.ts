// Sessioni di un weekend di F1, nell'ordine e con i nomi usati sul sito.
// `chiave` è il nome del campo nei dati Jolpica (calendario) ed è anche il
// valore salvato nel campo "Recap di sessione F1" degli articoli.
//
// Niente import da 'sanity' qui: il file serve anche allo Studio.

export type ChiaveSessione =
  | 'FirstPractice'
  | 'SecondPractice'
  | 'ThirdPractice'
  | 'SprintQualifying'
  | 'Sprint'
  | 'Qualifying'
  | 'Race'

export const SESSIONI_F1: { chiave: ChiaveSessione; etichetta: string; titolo: string }[] = [
  { chiave: 'FirstPractice', etichetta: 'PL1', titolo: 'Prove libere 1 (PL1)' },
  { chiave: 'SecondPractice', etichetta: 'PL2', titolo: 'Prove libere 2 (PL2)' },
  { chiave: 'ThirdPractice', etichetta: 'PL3', titolo: 'Prove libere 3 (PL3)' },
  { chiave: 'SprintQualifying', etichetta: 'Quali Sprint', titolo: 'Qualifiche Sprint' },
  { chiave: 'Sprint', etichetta: 'Sprint', titolo: 'Sprint' },
  { chiave: 'Qualifying', etichetta: 'Qualifiche', titolo: 'Qualifiche' },
  { chiave: 'Race', etichetta: 'Gara', titolo: 'Gara' },
]

export const OPZIONI_SESSIONE = SESSIONI_F1.map((s) => ({ title: s.titolo, value: s.chiave }))

export interface SessioneWeekend {
  chiave: ChiaveSessione
  etichetta: string
  inizio: Date
}

/** Le sessioni di un GP (oggetto Jolpica), in ordine di orario. */
export function sessioniDelWeekend(gara: any): SessioneWeekend[] {
  return SESSIONI_F1.map((s) => {
    const dati = s.chiave === 'Race' ? { date: gara?.date, time: gara?.time ?? '13:00:00Z' } : gara?.[s.chiave]
    if (!dati?.date) return null
    const inizio = new Date(`${dati.date}T${dati.time ?? '00:00:00Z'}`)
    return Number.isNaN(inizio.getTime()) ? null : { chiave: s.chiave, etichetta: s.etichetta, inizio }
  })
    .filter((s): s is SessioneWeekend => s !== null)
    .sort((a, b) => a.inizio.getTime() - b.inizio.getTime())
}
