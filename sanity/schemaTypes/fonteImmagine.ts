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
  OPZIONI_LICENZA,
  problemiFonte,
  type FonteImmagine,
} from '../../lib/fontiImmagini'

// Ogni campo compare solo per le fonti che lo usano, con l'indicazione di
// cosa scriverci: meno da leggere per chi carica una foto.
type Genitore = { parent?: FonteImmagine }
const origineDi = (g: Genitore) => g.parent?.origine
const PER_PERMESSO = ['permesso', 'licenza']

export const campoFonte = {
  name: 'fonte',
  title: 'Fonte e permesso',
  type: 'object',
  description:
    'Da dove viene la foto e con quale permesso. Il credito sotto la foto lo scrive il sito da solo: non metterlo nella didascalia. Nel dubbio, la foto non si usa.',
  fields: [
    {
      name: 'origine',
      title: 'Da dove viene la foto',
      type: 'string',
      description:
        'Se la fonte non è in elenco, la foto si usa solo con un permesso scritto o una licenza comprata. Social, altre testate e Google Immagini non vanno bene.',
      options: { list: OPZIONI_FONTE },
    },
    {
      name: 'fotografo',
      title: 'Fotografo o autore',
      type: 'string',
      description:
        'Come compare nella didascalia originale (es. "Mark Thompson / Getty Images"). Obbligatorio per Red Bull Content Pool. Per Wikimedia: la riga "Autore" (Author) della pagina del file, così com\'è.',
      hidden: (g: Genitore) => !origineDi(g) || origineDi(g) === 'propria' || PER_PERMESSO.includes(origineDi(g)!),
      components: { input: CampoTestoRitardato },
    },
    {
      name: 'licenza',
      title: 'Licenza',
      type: 'string',
      description:
        'Quella indicata nella pagina del file, alla voce "Licenza" (Licensing). Se ce ne sono più di una, scegline una qualsiasi.',
      options: { list: OPZIONI_LICENZA },
      hidden: (g: Genitore) => origineDi(g) !== 'wikimedia',
    },
    {
      name: 'link',
      title: 'Link alla pagina del file',
      type: 'url',
      description:
        'L\'indirizzo della pagina del file su Commons, che inizia con https://commons.wikimedia.org/wiki/File: (non quello dell\'immagine che si apre a schermo intero).',
      hidden: (g: Genitore) => origineDi(g) !== 'wikimedia',
    },
    {
      name: 'modificata',
      title: 'Ho modificato la foto',
      type: 'boolean',
      description:
        'Spunta se l\'hai ritagliata, ritoccata o ci hai aggiunto scritte prima di caricarla: la licenza chiede di dirlo, e il sito aggiunge "(modificata)" al credito.',
      hidden: (g: Genitore) => origineDi(g) !== 'wikimedia',
    },
    {
      name: 'credito',
      title: 'Credito da mostrare',
      type: 'string',
      description:
        'Il nome da mostrare sotto la foto, come concordato (es. "Nicolas Carpentiers", "Motorsport Images"). Per Wikimedia con licenza "Altra": autore e licenza (es. "Mario Rossi, CC BY-SA 3.0 DE").',
      hidden: (g: Genitore) =>
        !PER_PERMESSO.includes(origineDi(g) ?? '') &&
        !(origineDi(g) === 'wikimedia' && g.parent?.licenza === 'altra'),
      components: { input: CampoTestoRitardato },
    },
    {
      name: 'permesso',
      title: 'Permesso o licenza',
      type: 'text',
      rows: 2,
      description:
        'Chi l\'ha concesso, quando e dove (es. "mail di M. Rossi del 9/10/2026"), o il numero d\'ordine della licenza. Non compare sul sito: serve a noi se qualcuno contesta la foto.',
      hidden: (g: Genitore) => !PER_PERMESSO.includes(origineDi(g) ?? ''),
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
