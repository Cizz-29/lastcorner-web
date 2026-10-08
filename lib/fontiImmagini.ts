// Fonte e permesso delle immagini (campo "Fonte e permesso" nello Studio).
//
// Nato l'8 ottobre 2026, dopo un pagamento a un autore per quattro foto
// tecniche pubblicate senza permesso. Ogni immagine caricata da allora deve
// dire da dove viene; il sito ne ricava il credito da mostrare sotto la foto,
// nella forma che la fonte chiede.
//
// Le condizioni d'uso sono state lette l'8 ottobre 2026 (dettagli e link nel
// documento "Fonti delle immagini" e in PASSAGGIO-CONSEGNE.md). Nell'elenco ci
// sono le aree stampa a cui la redazione ha accesso: Pirelli, Red Bull Content
// Pool, Mercedes, Audi e Haas concedono l'uso editoriale per iscritto; per
// Ferrari e Aston Martin il testo non si e' trovato (Aston Martin e' dietro
// login), quindi vanno confermate con l'ufficio stampa. Le fonti che l'uso non
// lo concedono (Alpine, Williams, siti dei team F2/F3, FIA, altre testate,
// social) passano da "Permesso scritto" o "Licenza acquistata".
//
// Niente import da 'sanity' qui: il file serve anche al sito.

export type ChiaveFonte =
  | 'propria'
  | 'pirelli'
  | 'redbull'
  | 'ferrari'
  | 'mercedes'
  | 'audi'
  | 'haas'
  | 'astonmartin'
  | 'permesso'
  | 'licenza'

export interface FonteImmagine {
  origine?: ChiaveFonte
  fotografo?: string
  credito?: string
  permesso?: string
}

interface DefinizioneFonte {
  titolo: string
  // Credito da mostrare; `null` = nessun credito (materiale nostro).
  credito: ((f: FonteImmagine) => string) | null
  richiedeFotografo?: boolean
  richiedeCredito?: boolean
  richiedePermesso?: boolean
}

const conFotografo = (base: string) => (f: FonteImmagine) =>
  f.fotografo?.trim() ? `${f.fotografo.trim()} / ${base}` : base

export const FONTI: Record<ChiaveFonte, DefinizioneFonte> = {
  propria: {
    titolo: 'Nostra (foto, grafica o screenshot fatti dalla redazione)',
    credito: null,
  },
  pirelli: {
    // "...always in association with the written statement 'BY COURTESY OF
    // PIRELLI'" (condizioni dell'area stampa F1 Pirelli).
    titolo: 'Pirelli F1 Press Area',
    credito: () => 'By courtesy of Pirelli',
  },
  redbull: {
    // Clausola 4.6: "[Photographer Name]/Red Bull Content Pool". Licenza
    // Editorial Use di 6 mesi dal download, News Use di 7 giorni dall'evento.
    titolo: 'Red Bull Content Pool (Red Bull, Racing Bulls, WRC…)',
    credito: (f) => `${f.fotografo?.trim() || 'Getty Images'} / Red Bull Content Pool`,
    richiedeFotografo: true,
  },
  ferrari: {
    titolo: 'Ferrari Media Centre',
    credito: conFotografo('Scuderia Ferrari'),
  },
  mercedes: {
    // GTC del sito media: il simbolo di copyright deve essere visibile.
    titolo: 'Mercedes-AMG F1 media site',
    credito: (f) =>
      f.fotografo?.trim()
        ? `© Mercedes-AMG PETRONAS F1 Team / ${f.fotografo.trim()}`
        : '© Mercedes-AMG PETRONAS F1 Team',
  },
  audi: {
    // "must be credited to Audi Motorsport AG, unless otherwise specified".
    titolo: 'Audi F1 Content Hub',
    credito: conFotografo('Audi Motorsport AG'),
  },
  haas: {
    // "limited to valid news-reporting purposes only".
    titolo: 'Haas F1 Team media site (solo cronaca)',
    credito: conFotografo('Haas F1 Team'),
  },
  astonmartin: {
    titolo: 'Aston Martin F1 media portal',
    credito: conFotografo('Aston Martin Aramco F1 Team'),
  },
  permesso: {
    titolo: "Permesso scritto dell'autore o del team",
    credito: (f) => f.credito?.trim() ?? '',
    richiedeCredito: true,
    richiedePermesso: true,
  },
  licenza: {
    titolo: 'Licenza acquistata (Getty, Motorsport Images…)',
    credito: (f) => f.credito?.trim() ?? '',
    richiedeCredito: true,
    richiedePermesso: true,
  },
}

export const OPZIONI_FONTE = (Object.keys(FONTI) as ChiaveFonte[]).map((value) => ({
  title: FONTI[value].titolo,
  value,
}))

/** Credito da mostrare sotto l'immagine, o null se non serve. Un credito
 *  scritto a mano nel campo "Credito" prevale sempre su quello automatico. */
export function creditoImmagine(f?: FonteImmagine | null): string | null {
  if (!f?.origine) return null
  const scritto = f.credito?.trim()
  if (scritto) return scritto
  const def = FONTI[f.origine]
  if (!def?.credito) return null
  return def.credito(f) || null
}

/** Cosa manca perché la fonte sia completa (vuoto = a posto). */
export function problemiFonte(f?: FonteImmagine | null): string[] {
  if (!f?.origine) return ['Indica da dove viene la foto.']
  const def = FONTI[f.origine]
  if (!def) return ['Fonte non riconosciuta: sceglila di nuovo.']
  const problemi: string[] = []
  if (def.richiedeFotografo && !f.fotografo?.trim())
    problemi.push('Scrivi il nome del fotografo: Red Bull lo chiede nel credito.')
  if (def.richiedeCredito && !f.credito?.trim())
    problemi.push('Scrivi il credito da mostrare sotto la foto.')
  if (def.richiedePermesso && !f.permesso?.trim())
    problemi.push('Annota il permesso o la licenza: chi, quando, dove (mail, numero d\'ordine).')
  return problemi
}

// Per ora il campo dà solo un avviso, su tutte le immagini: Francesco lo
// spiega prima alla redazione (decisione dell'8 ottobre 2026). Per renderlo
// obbligatorio basta mettere true qui sotto: da quel momento le immagini
// caricate dal FONTE_OBBLIGATORIA_DAL senza fonte bloccano la pubblicazione,
// quelle già in archivio restano un avviso (altrimenti ogni modifica a un
// vecchio articolo resterebbe bloccata finché non si ricostruisce la
// provenienza di tutte le sue foto).
export const FONTE_BLOCCA_PUBBLICAZIONE = false
export const FONTE_OBBLIGATORIA_DAL = '2026-10-08T00:00:00Z'

/** Il credito come si legge sotto la foto: "Foto: …", salvo le formule che
 *  la fonte vuole scritte in un modo preciso ("By courtesy of Pirelli",
 *  "© Mercedes-AMG PETRONAS F1 Team"). */
export function testoCredito(f?: FonteImmagine | null): string | null {
  const c = creditoImmagine(f)
  if (!c) return null
  return /^(©|by courtesy|foto:|photo:)/i.test(c) ? c : `Foto: ${c}`
}
