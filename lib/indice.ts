// Indice dei contenuti degli articoli.
//
// Il blocco "Indice" (schema `indice` nel corpo articolo) non contiene testo:
// l'elenco si ricava dai titoli H2 (e, se scelto, H3) del corpo stesso, cosi'
// se un titolo cambia l'indice si aggiorna da solo e non resta mai sfasato.
//
// Le funzioni stanno qui e non dentro ArticleBody perche' servono anche allo
// Studio (avviso "servono almeno due titoli") e devono dare lo stesso
// risultato in entrambi i posti.

export type LivelloIndice = 'h2' | 'h2h3'

export interface VoceIndice {
  key: string
  id: string
  testo: string
  livello: 2 | 3
}

// Sotto questa soglia l'indice non si mostra: con un solo titolo non indica
// niente e ruba spazio in cima al pezzo.
export const MINIMO_VOCI_INDICE = 2

interface BloccoTesto {
  _type?: string
  _key?: string
  style?: string
  children?: { text?: string }[]
}

export function testoDelBlocco(blocco: BloccoTesto): string {
  return (blocco.children ?? [])
    .map((c) => c.text ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

// "Perché non è semplice" -> "perche-non-e-semplice". Stessa forma delle ancore
// del vecchio sito WordPress: Google ha ancora in archivio indirizzi come
// /velocita-massima-in-formula-1-2026-ferrari-mercedes/#come-viene-misurata-...,
// e dopo il redirect l'ancora torna a puntare al titolo giusto.
export function ancoraDa(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

// Tutti i titoli H2 e H3 del corpo, ciascuno con un id unico. Gli id servono
// sempre (anche senza indice, per poter linkare un paragrafo); l'indice poi
// filtra i livelli che gli interessano.
export function titoliDelCorpo(blocchi: BloccoTesto[]): VoceIndice[] {
  const usati = new Map<string, number>()
  const voci: VoceIndice[] = []
  blocchi.forEach((b, i) => {
    if (b?._type !== 'block' || (b.style !== 'h2' && b.style !== 'h3')) return
    const testo = testoDelBlocco(b)
    if (!testo) return
    const base = ancoraDa(testo) || `sezione-${i + 1}`
    const volte = (usati.get(base) ?? 0) + 1
    usati.set(base, volte)
    voci.push({
      key: b._key ?? `titolo-${i}`,
      id: volte === 1 ? base : `${base}-${volte}`,
      testo,
      livello: b.style === 'h3' ? 3 : 2,
    })
  })
  return voci
}

// Un titolo "Indice" o "Tabella dei contenuti" scritto a mano (ce n'e' uno
// rimasto dalla migrazione WordPress nell'evergreen sulla velocita' massima)
// non deve comparire come voce dell'indice stesso.
const TITOLO_DI_INDICE = /^(indice( dei contenuti)?|tabella dei contenuti|sommario|in questo articolo)$/i

export function vociIndice(titoli: VoceIndice[], livelli?: LivelloIndice): VoceIndice[] {
  return titoli.filter(
    (t) => (livelli === 'h2h3' || t.livello === 2) && !TITOLO_DI_INDICE.test(t.testo.replace(/[:.]$/, ''))
  )
}
