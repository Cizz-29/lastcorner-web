// Colori dei piloti nel confronto telemetrico.
//
// Il colore del team da solo non basta. Due compagni di squadra hanno lo
// stesso colore, e anche fra squadre diverse alcuni colori quasi coincidono:
// nel 2026 Ferrari (#ED1131) e Audi (#F50537) sono due rossi, Haas e
// Cadillac due grigi, Alpine, Williams, Red Bull e Racing Bulls quattro blu.
// Prima il secondo pilota di una squadra prendeva il bianco: con quattro
// piloti di due squadre si avevano due linee bianche indistinguibili.
//
// Ora ogni pilota prende, nell'ordine:
//   1. il colore scelto a mano dal lettore, se c'e';
//   2. il colore del team, se e' abbastanza diverso da quelli gia' in uso;
//   3. il colore "secondario" del team, preso dalla livrea (il giallo Ferrari
//      di Hamilton, il papaya e azzurro McLaren...), se e' diverso dagli altri;
//   4. altrimenti il colore piu' distante da tutti quelli gia' in uso, fra
//      una tavolozza di riserva pensata per il fondo scuro.

/** Colore secondario di ogni squadra, dalla livrea. La chiave e' una parte
 *  del nome del team come lo scrive FastF1, in minuscolo. */
const SECONDARI: [string, string][] = [
  ['ferrari', '#FFD12E'], // giallo del logo e dei dettagli
  ['mercedes', '#C6CDD4'], // argento
  ['mclaren', '#3EC6FF'], // azzurro degli sponsor
  ['red bull', '#FFC20E'], // giallo del logo
  ['racing bulls', '#F5F5F5'], // bianco della livrea
  ['alpine', '#FF87BC'], // rosa
  ['williams', '#E8EEF7'], // bianco
  ['haas', '#DA291C'], // rosso
  ['audi', '#C3C7CC'], // titanio
  ['aston martin', '#CEDC00'], // lime
  ['cadillac', '#F2C94C'], // oro
]

/** Tavolozza di riserva: colori saturi e leggibili su fondo scuro, lontani
 *  fra loro. Si usano solo quando colore e secondario del team sono gia'
 *  troppo vicini a qualcosa che e' a schermo. */
const RISERVA = ['#FFD12E', '#FFFFFF', '#FF4FD8', '#B6FF3B', '#3BE8FF', '#A77BFF', '#FF9E7A', '#5CFF9D']

/** Sotto questa distanza due colori si confondono sovrapposti a 1,7 px. */
const SOGLIA = 140

function rgb(hex: string): [number, number, number] | null {
  const pulito = hex.replace('#', '').trim()
  const pieno = pulito.length === 3 ? pulito.split('').map((c) => c + c).join('') : pulito
  const n = parseInt(pieno, 16)
  if (pieno.length !== 6 || Number.isNaN(n)) return null
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/** Distanza percepita fra due colori ("redmean"): piu' fedele all'occhio
 *  della distanza RGB semplice, senza la complessita' di CIELAB. */
export function distanzaColori(a: string, b: string): number {
  const x = rgb(a)
  const y = rgb(b)
  if (!x || !y) return 0
  const r = (x[0] + y[0]) / 2
  const dr = x[0] - y[0]
  const dg = x[1] - y[1]
  const db = x[2] - y[2]
  return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db)
}

export function secondarioDelTeam(team: string): string | undefined {
  const t = team.toLowerCase()
  // "racing bulls" prima di "red bull": il primo contiene "bull" ma non e'
  // la Red Bull, e l'ordine dell'elenco decide chi vince.
  const ordinati = [...SECONDARI].sort((a, b) => b[0].length - a[0].length)
  return ordinati.find(([chiave]) => t.includes(chiave))?.[1]
}

function lontanoDa(colore: string, usati: string[]): number {
  return usati.length === 0 ? Infinity : Math.min(...usati.map((u) => distanzaColori(colore, u)))
}

export interface PilotaPerColore {
  /** Chiave stabile del pilota: la sigla, es. "LEC". */
  chiave: string
  team: string
  colore: string
}

/** Un colore per pilota, nell'ordine in cui compaiono nel confronto. */
export function assegnaColori(
  piloti: PilotaPerColore[],
  scelti: Record<string, string> = {}
): Record<string, string> {
  const fuori: Record<string, string> = {}
  const usati: string[] = []

  // Prima i colori scelti a mano: sono vincoli, gli altri si adattano a loro.
  for (const p of piloti) {
    const scelto = scelti[p.chiave]
    if (scelto && !(p.chiave in fuori)) {
      fuori[p.chiave] = scelto
      usati.push(scelto)
    }
  }

  for (const p of piloti) {
    if (p.chiave in fuori) continue
    const candidati = [p.colore, secondarioDelTeam(p.team)].filter(Boolean) as string[]
    let scelto = candidati.find((c) => lontanoDa(c, usati) >= SOGLIA)
    if (!scelto) {
      scelto =
        RISERVA.find((c) => lontanoDa(c, usati) >= SOGLIA) ??
        [...RISERVA].sort((a, b) => lontanoDa(b, usati) - lontanoDa(a, usati))[0]
    }
    fuori[p.chiave] = scelto
    usati.push(scelto)
  }
  return fuori
}

// Dove salvare i colori scelti dal lettore: nel suo browser, cosi' li ritrova
// la volta dopo. Se il browser non lo permette (navigazione privata) si
// lavora senza, e i colori valgono finche' la pagina resta aperta.
const CHIAVE_COLORI = 'lc-telemetria-colori'

export function leggiColori(): Record<string, string> {
  try {
    const grezzo = window.localStorage.getItem(CHIAVE_COLORI)
    return grezzo ? (JSON.parse(grezzo) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function salvaColori(colori: Record<string, string>) {
  try {
    window.localStorage.setItem(CHIAVE_COLORI, JSON.stringify(colori))
  } catch {
    // Spazio del browser non disponibile: pazienza.
  }
}
