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
// Wikimedia Commons (aggiunta l'8 ottobre 2026): ospita solo licenze libere
// (niente "non commerciale" né "non opere derivate"), che consentono l'uso
// anche su un sito con pubblicità a patto di indicare autore, licenza con il
// suo link e fonte, e di dire se la foto è stata modificata. Il credito segue
// la forma che Commons stesso suggerisce: "Autore, CC BY-SA 4.0, via
// Wikimedia Commons", con licenza e file come link.
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
  | 'wikimedia'
  | 'permesso'
  | 'licenza'

export type ChiaveLicenza =
  | 'cc0'
  | 'pd'
  | 'by-4.0'
  | 'by-3.0'
  | 'by-2.5'
  | 'by-2.0'
  | 'by-sa-4.0'
  | 'by-sa-3.0'
  | 'by-sa-2.5'
  | 'by-sa-2.0'
  | 'altra'

export interface FonteImmagine {
  origine?: ChiaveFonte
  fotografo?: string
  credito?: string
  permesso?: string
  /** Solo Wikimedia Commons. */
  licenza?: ChiaveLicenza
  link?: string
  modificata?: boolean
}

/** Un pezzo del credito: testo semplice o link. */
export interface ParteCredito {
  testo: string
  href?: string
}

// Licenze che si trovano su Commons, con il link alla pagina della licenza
// che il credito deve riportare. Le versioni "nazionali" (es. CC BY-SA 3.0
// DE) si indicano con "Altra".
export const LICENZE: Record<ChiaveLicenza, { nome: string; url?: string }> = {
  cc0: { nome: 'CC0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  pd: { nome: 'pubblico dominio' },
  'by-4.0': { nome: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  'by-3.0': { nome: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/' },
  'by-2.5': { nome: 'CC BY 2.5', url: 'https://creativecommons.org/licenses/by/2.5/' },
  'by-2.0': { nome: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0/' },
  'by-sa-4.0': { nome: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  'by-sa-3.0': { nome: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  'by-sa-2.5': { nome: 'CC BY-SA 2.5', url: 'https://creativecommons.org/licenses/by-sa/2.5/' },
  'by-sa-2.0': { nome: 'CC BY-SA 2.0', url: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  altra: { nome: '' },
}

export const OPZIONI_LICENZA = (Object.keys(LICENZE) as ChiaveLicenza[]).map((value) => ({
  title:
    value === 'altra'
      ? 'Altra (scrivi autore e licenza in "Credito da mostrare")'
      : value === 'pd'
        ? 'Pubblico dominio (Public domain)'
        : LICENZE[value].nome,
  value,
}))

// Pagina del file su Commons o su Wikipedia ("File:…"), non l'immagine
// grezza di upload.wikimedia.org: è la pagina che riporta autore e licenza.
const LINK_FILE_WIKIMEDIA =
  /^https:\/\/([a-z-]+\.)?(m\.)?(wikimedia|wikipedia)\.org\/wiki\/(File|Immagine|Image|Datei|Fichier):/i

interface DefinizioneFonte {
  titolo: string
  // Credito da mostrare; `null` = nessun credito (materiale nostro).
  credito: ((f: FonteImmagine) => string) | null
  richiedeFotografo?: boolean
  richiedeCredito?: boolean
  richiedePermesso?: boolean
  // Credito con i link (licenza, pagina del file). Se c'è, prevale su
  // `credito` per il sito.
  parti?: (f: FonteImmagine) => ParteCredito[]
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
  wikimedia: {
    titolo: 'Wikimedia Commons (licenza libera)',
    credito: (f) => partiWikimedia(f).map((p) => p.testo).join(''),
    parti: (f) => partiWikimedia(f),
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

function partiWikimedia(f: FonteImmagine): ParteCredito[] {
  const parti: ParteCredito[] = []
  const lic = f.licenza ? LICENZE[f.licenza] : undefined
  if (f.licenza === 'altra' || !lic) {
    // Autore e licenza scritti a mano nel credito.
    const scritto = f.credito?.trim() || f.fotografo?.trim()
    if (scritto) parti.push({ testo: `${scritto}, ` })
  } else {
    const autore = f.fotografo?.trim()
    if (autore) parti.push({ testo: `${autore}, ` })
    parti.push({ testo: lic.nome, href: lic.url })
    parti.push({ testo: ', ' })
  }
  parti.push({ testo: 'via ' })
  parti.push({ testo: 'Wikimedia Commons', href: f.link?.trim() || undefined })
  if (f.modificata) parti.push({ testo: ' (modificata)' })
  return parti
}

export const OPZIONI_FONTE = (Object.keys(FONTI) as ChiaveFonte[]).map((value) => ({
  title: FONTI[value].titolo,
  value,
}))

/** Credito da mostrare sotto l'immagine, o null se non serve. Lo compone
 *  la fonte: il "Credito da mostrare" scritto a mano conta solo dove il campo
 *  è visibile (permesso, licenza, Wikimedia con licenza "Altra"), così un
 *  valore rimasto da una fonte scelta prima non passa sul sito. */
export function creditoImmagine(f?: FonteImmagine | null): string | null {
  if (!f?.origine) return null
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
  if (f.origine === 'wikimedia') {
    if (!f.licenza) problemi.push('Scegli la licenza indicata nella pagina del file.')
    else if (f.licenza === 'altra' && !f.credito?.trim())
      problemi.push('Scrivi autore e licenza in "Credito da mostrare" (es. "Mario Rossi, CC BY-SA 3.0 DE").')
    else if (f.licenza !== 'pd' && f.licenza !== 'cc0' && f.licenza !== 'altra' && !f.fotografo?.trim())
      problemi.push("Scrivi l'autore come compare nella pagina del file: la licenza lo chiede.")
    if (!f.link?.trim()) problemi.push('Incolla il link alla pagina del file su Commons.')
    else if (!LINK_FILE_WIKIMEDIA.test(f.link.trim()))
      problemi.push('Il link deve essere la pagina del file (commons.wikimedia.org/wiki/File:…), non l\'immagine.')
  }
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

/** Come testoCredito, ma a pezzi, con i link dove la fonte li chiede
 *  (Wikimedia: licenza e pagina del file). È quello che usa il sito. */
export function partiCredito(f?: FonteImmagine | null): ParteCredito[] | null {
  const testo = testoCredito(f)
  if (!testo) return null
  const def = f?.origine ? FONTI[f.origine] : undefined
  if (!def?.parti) return [{ testo }]
  return [{ testo: 'Foto: ' }, ...def.parti(f!)]
}
