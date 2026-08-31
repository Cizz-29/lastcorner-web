// Regole di paginazione condivise da tutti gli elenchi del sito (categoria,
// sotto-categoria, autore). Erano ripetute identiche in quattro file: qui
// stanno in un posto solo, cosi' cambiarle non significa piu' ricordarsi di
// cambiarle ovunque.

export const ARTICOLI_PER_PAGINA = 14

/** Quante card grandi in cima all'elenco, prima di passare a quelle piccole. */
export const CARD_GRANDI = 4

/** Ogni quante card piccole inserire un annuncio. */
export const ANNUNCIO_OGNI_N_CARD = 5

// Solo le 9 pagine piu' recenti sono navigabili. Gli articoli piu' vecchi
// restano raggiungibili da ricerca, sitemap e link diretti: semplicemente non
// si sfoglia piu' indietro di cosi'.
export const PAGINE_MASSIME = 9

/** Numero di pagine navigabili per un elenco di n articoli. Sempre >= 1. */
export function numeroPagine(totaleArticoli: number): number {
  const necessarie = Math.ceil(totaleArticoli / ARTICOLI_PER_PAGINA)
  return Math.min(Math.max(1, necessarie), PAGINE_MASSIME)
}

/** Gli indici di pagina oltre la prima, per generateStaticParams. */
export function paginePerGenerazioneStatica(totaleArticoli: number): number[] {
  const pagine = numeroPagine(totaleArticoli)
  return Array.from({ length: Math.max(0, pagine - 1) }, (_, i) => i + 2)
}

/** Interpreta il segmento [n] dell'URL. Restituisce null se non e' un numero valido. */
export function paginaDaSegmento(segmento: string): number | null {
  if (!/^[1-9][0-9]*$/.test(segmento)) return null
  const n = Number(segmento)
  return n >= 2 && n <= PAGINE_MASSIME ? n : null
}

export interface FettaElenco<T> {
  paginaCorrente: number
  paginePresenti: number
  grandi: T[]
  piccoli: T[]
  vuota: boolean
}

/** Divide l'elenco nella fetta da mostrare per la pagina richiesta. */
export function fettaElenco<T>(articoli: T[], paginaRichiesta: number): FettaElenco<T> {
  const paginePresenti = numeroPagine(articoli.length)
  const paginaCorrente = Math.min(Math.max(1, paginaRichiesta), paginePresenti)
  const inizio = (paginaCorrente - 1) * ARTICOLI_PER_PAGINA
  const dellaPagina = articoli.slice(inizio, inizio + ARTICOLI_PER_PAGINA)
  return {
    paginaCorrente,
    paginePresenti,
    grandi: dellaPagina.slice(0, CARD_GRANDI),
    piccoli: dellaPagina.slice(CARD_GRANDI),
    vuota: dellaPagina.length === 0,
  }
}

// Indirizzo di una pagina dell'elenco.
//
// La paginazione vive nel percorso (/formula-1/page/2), non piu' in un
// parametro (/formula-1?page=2): in Next.js una pagina che legge i parametri
// dell'URL non puo' mai essere messa in cache, quindi veniva ricalcolata da
// zero a ogni singola visita, scaricando ogni volta l'elenco completo degli
// articoli.
//
// La pagina 1 resta sull'indirizzo base: un solo indirizzo per un solo
// contenuto, senza doppioni da spiegare ai motori di ricerca.
export function percorsoPagina(basePath: string, pagina: number): string {
  return pagina <= 1 ? basePath : `${basePath}/page/${pagina}`
}

/** Sotto-categorie che hanno una pagina di elenco propria (quindi paginabile). */
export const SOTTOCATEGORIE_PAGINABILI = [
  'editoriali',
  'analisi-tecnica',
  'guide-approfondimenti',
  'rubriche',
]
