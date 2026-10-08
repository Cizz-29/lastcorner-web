// Campo "Fonte e permesso" delle immagini degli articoli, e la sua
// validazione. Regole e crediti stanno in lib/fontiImmagini.ts, condivise col
// sito.
//
// Per ora è un avviso su tutte le immagini (FONTE_BLOCCA_PUBBLICAZIONE =
// false in lib/fontiImmagini.ts). Con true diventa un errore, che blocca la
// pubblicazione, per le immagini caricate dal FONTE_OBBLIGATORIA_DAL in poi;
// per quelle in archivio resta un avviso, così i vecchi articoli restano
// modificabili. La data di caricamento si legge dal documento dell'immagine
// (sanity.imageAsset), una volta per immagine.

import { CampoTestoRitardato } from '../studio/personalizzazioni'
import {
  FONTE_BLOCCA_PUBBLICAZIONE,
  FONTE_OBBLIGATORIA_DAL,
  OPZIONI_FONTE,
  problemiFonte,
  type FonteImmagine,
} from '../../lib/fontiImmagini'

export const campoFonte = {
  name: 'fonte',
  title: 'Fonte e permesso',
  type: 'object',
  description:
    'Da dove viene la foto e con quale permesso. Il sito mostra da solo il credito sotto la foto. Nel dubbio, la foto non si usa.',
  fields: [
    {
      name: 'origine',
      title: 'Da dove viene la foto',
      type: 'string',
      options: { list: OPZIONI_FONTE },
    },
    {
      name: 'fotografo',
      title: 'Fotografo',
      type: 'string',
      description: 'Come compare nella didascalia originale. Obbligatorio per Red Bull Content Pool.',
      components: { input: CampoTestoRitardato },
    },
    {
      name: 'credito',
      title: 'Credito da mostrare',
      type: 'string',
      description:
        'Obbligatorio per permesso scritto e licenza (es. "Nicolas Carpentiers", "Motorsport Images"). Per le altre fonti lascialo vuoto: il credito si compone da solo.',
      components: { input: CampoTestoRitardato },
    },
    {
      name: 'permesso',
      title: 'Permesso o licenza',
      type: 'text',
      rows: 2,
      description:
        'Per permesso scritto e licenza: chi l\'ha concesso, quando e dove (es. "mail di M. Rossi del 9/10/2026"), o il numero d\'ordine. Non compare sul sito.',
    },
  ],
}

type ContestoValidazione = {
  getClient: (o: { apiVersion: string }) => { fetch: (q: string, p: Record<string, unknown>) => Promise<unknown> }
}

const dataCaricamento = new Map<string, Promise<string | null>>()

async function caricataDiRecente(ref: string, contesto: ContestoValidazione): Promise<boolean> {
  if (!dataCaricamento.has(ref)) {
    const client = contesto.getClient({ apiVersion: '2024-01-01' })
    dataCaricamento.set(
      ref,
      (client.fetch('*[_id == $id][0]._createdAt', { id: ref }) as Promise<string | null>).catch(() => null)
    )
  }
  const creata = await dataCaricamento.get(ref)!
  // Data sconosciuta: meglio chiedere la fonte che lasciar passare.
  return !creata || creata >= FONTE_OBBLIGATORIA_DAL
}

type ValoreImmagine = { asset?: { _ref?: string }; fonte?: FonteImmagine } | undefined

/** Solo avviso finché FONTE_BLOCCA_PUBBLICAZIONE è false; poi errore per le
 *  immagini nuove e avviso per quelle in archivio. */
export function regoleFonte(Rule: any) {
  const messaggio = (valore: ValoreImmagine) => {
    const problemi = problemiFonte(valore?.fonte)
    return problemi.length ? `Fonte e permesso: ${problemi.join(' ')}` : null
  }
  if (!FONTE_BLOCCA_PUBBLICAZIONE) {
    return [
      Rule.custom((valore: ValoreImmagine) =>
        valore?.asset?._ref ? (messaggio(valore) ?? true) : true
      ).warning(),
    ]
  }
  return [
    Rule.custom(async (valore: ValoreImmagine, contesto: ContestoValidazione) => {
      const ref = valore?.asset?._ref
      const m = messaggio(valore)
      if (!ref || !m) return true
      return (await caricataDiRecente(ref, contesto)) ? m : true
    }),
    Rule.custom(async (valore: ValoreImmagine, contesto: ContestoValidazione) => {
      const ref = valore?.asset?._ref
      const m = messaggio(valore)
      if (!ref || !m) return true
      return (await caricataDiRecente(ref, contesto)) ? true : `${m} (foto già in archivio: avviso, non blocca)`
    }).warning(),
  ]
}
