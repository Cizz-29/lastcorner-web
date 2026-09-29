// Logica dello strumento "Classifica autori": quali date comprende un periodo
// e come si contano gli articoli. Sta separata dall'interfaccia
// (ClassificaAutoriTool.tsx) per poterla provare senza aprire lo Studio.

export type Periodo = 'settimana' | 'mese' | 'anno'

export interface Intervallo {
  /** Inizio compreso. */
  da: Date
  /** Fine esclusa: il primo istante del periodo successivo. */
  a: Date
  etichetta: string
}

const MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

/** Il periodo che contiene `oggi`, spostato di `spostamento` periodi
 *  (-1 = quello precedente). Le date sono nell'ora locale del browser, cioe'
 *  quella italiana per chi usa lo Studio. La settimana va da lunedi' a
 *  domenica. */
export function intervallo(periodo: Periodo, spostamento: number, oggi: Date = new Date()): Intervallo {
  if (periodo === 'anno') {
    const anno = oggi.getFullYear() + spostamento
    return { da: new Date(anno, 0, 1), a: new Date(anno + 1, 0, 1), etichetta: `Anno ${anno}` }
  }

  if (periodo === 'mese') {
    const da = new Date(oggi.getFullYear(), oggi.getMonth() + spostamento, 1)
    const a = new Date(da.getFullYear(), da.getMonth() + 1, 1)
    const nome = MESI[da.getMonth()]
    return { da, a, etichetta: `${nome.charAt(0).toUpperCase()}${nome.slice(1)} ${da.getFullYear()}` }
  }

  // Settimana: getDay() vale 0 la domenica, quindi la si porta in fondo.
  const giornoDellaSettimana = (oggi.getDay() + 6) % 7
  const da = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - giornoDellaSettimana + 7 * spostamento)
  const a = new Date(da.getFullYear(), da.getMonth(), da.getDate() + 7)
  const ultimo = new Date(a.getFullYear(), a.getMonth(), a.getDate() - 1)
  const etichetta =
    da.getMonth() === ultimo.getMonth()
      ? `${da.getDate()}–${ultimo.getDate()} ${MESI[da.getMonth()]} ${ultimo.getFullYear()}`
      : da.getFullYear() === ultimo.getFullYear()
        ? `${da.getDate()} ${MESI[da.getMonth()]} – ${ultimo.getDate()} ${MESI[ultimo.getMonth()]} ${ultimo.getFullYear()}`
        : `${da.getDate()} ${MESI[da.getMonth()]} ${da.getFullYear()} – ${ultimo.getDate()} ${MESI[ultimo.getMonth()]} ${ultimo.getFullYear()}`
  return { da, a, etichetta: `Settimana ${etichetta}` }
}

export interface RigaClassifica {
  posizione: number
  autore: string
  articoli: number
}

/** Classifica per numero di articoli. Il nome si ripulisce dagli spazi in
 *  piu' ("Andrea Di Cesare " e "Andrea Di Cesare" sono la stessa persona:
 *  nel dataset esistono entrambe le forme). A pari numero di articoli, pari
 *  posizione (1, 2, 2, 4) e ordine alfabetico. */
export function classifica(righe: { author?: string | null }[]): RigaClassifica[] {
  const conteggi = new Map<string, number>()
  for (const r of righe) {
    const nome = (r.author ?? '').trim().replace(/\s+/g, ' ') || '(senza autore)'
    conteggi.set(nome, (conteggi.get(nome) ?? 0) + 1)
  }
  const ordinati = Array.from(conteggi, ([autore, articoli]) => ({ autore, articoli })).sort(
    (x, y) => y.articoli - x.articoli || x.autore.localeCompare(y.autore, 'it')
  )
  return ordinati.map((r, i) => ({
    ...r,
    posizione:
      i > 0 && ordinati[i - 1].articoli === r.articoli
        ? ordinati.findIndex((x) => x.articoli === r.articoli) + 1
        : i + 1,
  }))
}

/** La query: solo articoli pubblicati (niente bozze ne' versioni di una
 *  release) con data di pubblicazione dentro il periodo. */
export const QUERY_CLASSIFICA = `*[_type == "article"
  && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
  && defined(publishedAt) && publishedAt >= $da && publishedAt < $a]{ author }`
