import { dimensioniDa } from '@/lib/sanity/image'

// Controlli sulla risoluzione delle immagini caricate nello Studio.
//
// Perche' esistono: Google richiede immagini larghe almeno 1200px per
// considerare un articolo per Discover, e Discover e' l'unico canale dove un
// sito giovane puo' prendere volume senza dover scalare le posizioni della
// ricerca classica. Ad agosto 2026, su 20 articoli controllati, 17 avevano
// l'immagine principale sotto i 1200px (quasi tutte a 768px, la misura con
// cui il vecchio WordPress le ridimensionava). Ingrandirle a valle non serve:
// i pixel veri restano quelli, e in Discover l'immagine occupa tutto lo
// schermo, quindi si vede.
//
// Il controllo gira SOLO nello Studio, in fase di scrittura: non aggiunge
// nulla al sito pubblicato e non tocca ne' i tempi di build ne' quelli di
// caricamento delle pagine.

/** Larghezza minima per l'immagine principale: soglia di Google per Discover. */
export const LARGHEZZA_MINIMA_PRINCIPALE = 1200

/** Larghezza minima per le immagini nel corpo: la colonna di testo e' larga
 *  circa 850px, sotto questa misura l'immagine viene ingrandita e sgrana. */
export const LARGHEZZA_MINIMA_CORPO = 900

function misureGrezze(value: any): { larghezza: number; altezza: number } | null {
  const ref: unknown = value?.asset?._ref
  if (typeof ref !== 'string') return null
  const m = ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i)
  if (!m) return null
  return { larghezza: Number(m[1]), altezza: Number(m[2]) }
}

/**
 * Blocca (o segnala) le immagini troppo piccole.
 *
 * Le misure sono quelle EFFETTIVE, cioe' al netto del ritaglio fatto nello
 * Studio: la stessa funzione usata dal sito per disegnare l'immagine
 * (dimensioniDa). Un 1600px ritagliato a meta' vale 800px, ed e' giusto che il
 * controllo se ne accorga.
 *
 * Restituisce true quando va bene, altrimenti il messaggio da mostrare.
 * Non si esprime sui campi vuoti (se ne occupa Rule.required) ne' sui
 * riferimenti che non sa leggere: meglio lasciar passare che bloccare la
 * redazione per un formato di id inatteso.
 */
export function larghezzaSufficiente(value: any, minima: number): true | string {
  if (!value?.asset?._ref) return true

  const effettive = dimensioniDa(value)
  if (!effettive) return true
  if (effettive.larghezza >= minima) return true

  const grezze = misureGrezze(value)
  const ritagliata = Boolean(grezze) && grezze!.larghezza > effettive.larghezza

  const misura = `${effettive.larghezza}×${effettive.altezza}px`
  if (ritagliata) {
    return `Dopo il ritaglio l'immagine e' ${misura}, sotto i ${minima}px di larghezza richiesti. Allarga il ritaglio, oppure carica un file piu' grande (l'originale e' ${grezze!.larghezza}px).`
  }
  const motivo =
    minima >= LARGHEZZA_MINIMA_PRINCIPALE
      ? 'Sotto questa misura Google non la considera per Discover e l\'anteprima social esce sgranata.'
      : 'Sotto questa misura il sito la ingrandisce per riempire la colonna, quindi sgrana.'
  return `Immagine di ${misura}: servono almeno ${minima}px di larghezza. ${motivo} Cerca il file originale a piena risoluzione — l'ideale e' 1600px o piu'.`
}

/**
 * Segnala le immagini principali verticali o quadrate.
 *
 * L'immagine in cima all'articolo, quella delle card e quella dell'anteprima
 * social sono tutte ritagli orizzontali (3:2 e 16:9) della stessa foto. Una
 * foto verticale ci entra solo perdendo la maggior parte dell'inquadratura.
 * E' un avviso e non un errore: a volte l'unico scatto disponibile e'
 * verticale, e in quel caso basta scegliere bene il punto di interesse.
 */
export function orientamentoOrizzontale(value: any): true | string {
  const dim = dimensioniDa(value)
  if (!dim) return true
  if (dim.larghezza > dim.altezza) return true
  return `Immagine non orizzontale (${dim.larghezza}×${dim.altezza}px). Verra' ritagliata in 3:2 per l'articolo e in 16:9 per l'anteprima social, perdendo buona parte dell'inquadratura: se puoi, usa uno scatto orizzontale, altrimenti sistema il punto di interesse.`
}
