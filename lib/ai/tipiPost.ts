// Tipi di post per "Genera descrizione" (editor grafiche). Gli altri tipi
// (analisi, pagelle, amarcord, race week...) la redazione li scrive a mano:
// qui ci sono solo quelli ripetitivi, dove l'aiuto serve davvero.
//
// File senza dipendenze: lo usano sia la pagina (il selettore) sia la route
// (le regole nel prompt).

export const TIPI_POST = [
  {
    id: 'risultato',
    nome: 'Risultato sessione',
    aiuto: 'Libere, qualifiche, sprint, gara: incolla la classifica o i primi nomi con i distacchi.',
  },
  {
    id: 'dichiarazioni',
    nome: 'Dichiarazioni',
    aiuto: 'Incolla le dichiarazioni (anche in inglese) e dove sono state rilasciate.',
  },
  {
    id: 'indiscrezione',
    nome: 'Indiscrezione',
    aiuto: 'Incolla l’articolo o il post, con testata e giornalista.',
  },
  {
    id: 'ufficiale',
    nome: 'Ufficiale',
    aiuto: 'Incolla il comunicato.',
  },
] as const

export type TipoPost = (typeof TIPI_POST)[number]['id']

export function eTipoPost(valore: unknown): valore is TipoPost {
  return TIPI_POST.some((t) => t.id === valore)
}
