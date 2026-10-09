// Articoli live: aggiornamenti in diretta di una sessione (campi "Articolo
// live" e "Aggiornamenti live" nello Studio).
//
// Per Google un articolo live è un LiveBlogPosting (schema.org): stessa
// pagina, con l'inizio e la fine della copertura e l'elenco degli
// aggiornamenti, ognuno con orario e indirizzo proprio (#agg-…). Google non
// ha una documentazione pubblica per questo tipo, ma il bollino rosso LIVE
// nelle Notizie principali passa da qui: senza questi dati non arriva.
//
// Niente import da 'sanity' qui: il file serve anche allo Studio.

export interface AggiornamentoLive {
  _key: string
  orario?: string
  titolo?: string
  testo?: any[]
}

export interface DatiLive {
  inCorso?: boolean
  inizio?: string
  finePrevista?: string
}

/** Senza "Fine prevista", quanto si dà per scontato che duri una diretta
 *  ancora in corso: una sessione con pre e post. */
const DURATA_STIMATA = 4 * 3600 * 1000

export const idAggiornamento = (a: AggiornamentoLive) => `agg-${a._key}`

/** Dal più recente al più vecchio; quelli senza orario in fondo. */
export function ordinaAggiornamenti(lista?: AggiornamentoLive[] | null): AggiornamentoLive[] {
  return [...(lista ?? [])]
    .filter((a) => a?._key)
    .sort((a, b) => (b.orario ?? '').localeCompare(a.orario ?? ''))
}

/** Testo semplice da Portable Text, per i dati strutturati e le anteprime. */
export function testoSemplice(blocchi?: any[]): string {
  return (blocchi ?? [])
    .filter((b) => b?._type === 'block')
    .map((b) => (b.children ?? []).map((c: any) => c?.text ?? '').join(''))
    .join('\n')
    .trim()
}

export function eLive(live?: DatiLive | null, aggiornamenti?: AggiornamentoLive[] | null): boolean {
  return Boolean(live?.inCorso || aggiornamenti?.length)
}

/** Inizio e fine della copertura, come li vuole schema.org. */
export function periodoCopertura(
  live: DatiLive | null | undefined,
  ordinati: AggiornamentoLive[],
  pubblicato?: string,
  adesso = new Date()
): { inizio?: string; fine?: string } {
  const primo = ordinati[ordinati.length - 1]?.orario
  const ultimo = ordinati[0]?.orario
  const inizio = live?.inizio ?? primo ?? pubblicato
  if (!live?.inCorso) return { inizio, fine: ultimo ?? inizio }
  // In corso: la fine prevista, se è ancora nel futuro; altrimenti una stima.
  const prevista = live.finePrevista ? new Date(live.finePrevista) : null
  if (prevista && prevista > adesso) return { inizio, fine: prevista.toISOString() }
  const base = inizio ? new Date(inizio).getTime() : adesso.getTime()
  const fine = new Date(Math.max(base + DURATA_STIMATA, adesso.getTime() + 3600 * 1000))
  return { inizio, fine: fine.toISOString() }
}

export function orarioBreve(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
}
