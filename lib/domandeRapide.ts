// Domande rapide delle schede pilota e team di F1: "Quanti Mondiali ha vinto
// Hamilton?", "In che posizione e' Leclerc nella classifica 2026?".
//
// Perche' esistono: la gente cerca cosi' (le schede pilota avevano 1.572
// impressioni su Google con 0 clic, e il titolo era solo il nome), e una
// risposta diretta, con il numero giusto, e' cio' che fa scegliere un
// risultato. Google non mostra piu' le FAQ come riquadro nei risultati (dal
// 2023 solo per siti governativi e sanitari): il valore e' il testo in pagina.
//
// Le domande si scrivono da sole, con regole: una domanda che non ha senso
// per quel pilota non compare (niente "quanti Mondiali ha vinto" per chi non
// ne ha vinti: diventa "qual e' il suo miglior risultato nel Mondiale").
// Dallo Studio, nella scheda bio del pilota o del team, ogni domanda si puo'
// spegnere o riscrivere, con i segnaposto {vittorie}, {podi} e cosi' via.

import type { StatisticheCarriera, GaraVinta } from '@/lib/statisticheF1'
import { nomeGp } from '@/lib/nomiGp'

export const CHIAVI_DOMANDE = ['classifica', 'mondiali', 'vittorie', 'podi', 'pole', 'carriera'] as const
export type ChiaveDomanda = (typeof CHIAVI_DOMANDE)[number]

export interface Personalizzazione {
  /** false = la domanda non compare. */
  mostra?: boolean
  /** Risposta scritta a mano, con i segnaposto fra graffe. */
  risposta?: string
}
export type Personalizzazioni = Partial<Record<ChiaveDomanda, Personalizzazione>> & {
  /** Domande scritte a mano nello Studio, mostrate dopo quelle automatiche. */
  altre?: { _key?: string; domanda?: string; risposta?: string; mostra?: boolean }[]
}

export interface DomandaRapida {
  /** Una delle domande automatiche, o "altra-<n>" per quelle scritte a mano. */
  chiave: string
  domanda: string
  risposta: string
}

/** "2008, 2014 e 2015" */
function elenco(valori: (string | number)[]): string {
  const v = valori.map(String)
  if (v.length <= 1) return v.join('')
  return `${v.slice(0, -1).join(', ')} e ${v[v.length - 1]}`
}

/** "al GP di Germania 2008" — con la preposizione giusta davanti a "GP"/"500 Miglia". */
function allaGara(g: GaraVinta): string {
  const nome = nomeGp(g.gara)
  return `${nome.startsWith('GP') ? 'al' : 'alla'} ${nome} ${g.anno}`
}

/** "al 5° posto", ma "all'8° posto" e "all'11° posto": si legge "ottavo",
 *  "undicesimo", con la vocale davanti. */
function alPosto(n: number): string {
  const vocale = n === 8 || n === 11 || (n >= 80 && n <= 89)
  return `${vocale ? "all'" : 'al '}${n}° posto`
}

/** Il nome del team come lo si scrive in italiano: Jolpica aggiunge "F1
 *  Team" a meta' griglia ("Haas F1 Team") e chiama "RB" la Racing Bulls. */
export function nomeTeam(nome: string, constructorId?: string): string {
  if (constructorId === 'rb') return 'Racing Bulls'
  return nome.replace(/\s+F1 Team$/i, '').trim()
}

function numero(n: number, singolare: string, plurale: string): string {
  return n === 1 ? `un${singolare.startsWith('pole') ? 'a' : ''} ${singolare}` : `${n} ${plurale}`
}

interface Classifica {
  posizione?: number
  punti?: number
  /** Il primo in classifica (per il distacco), o il secondo se il soggetto e' primo. */
  riferimento?: { nome: string; punti: number }
}

interface Soggetto {
  /** "Charles Leclerc", "la Ferrari" a inizio frase va maiuscolo: lo gestisce chi chiama. */
  nome: string
  /** Forma breve per le domande: "Leclerc". */
  breve: string
  stats: StatisticheCarriera | null
  classifica: Classifica
  anno: number
  personalizzate?: Personalizzazioni
}

function segnaposti(s: Soggetto): Record<string, string> {
  const st = s.stats
  return {
    nome: s.nome,
    cognome: s.breve,
    anno: String(s.anno),
    posizione: s.classifica.posizione ? `${s.classifica.posizione}°` : '',
    punti: s.classifica.punti !== undefined ? String(s.classifica.punti) : '',
    mondiali: String(st?.mondiali.length ?? 0),
    anniMondiali: elenco(st?.mondiali ?? []),
    vittorie: String(st?.vittorie ?? 0),
    podi: String(st?.podi ?? 0),
    pole: String(st?.pole ?? 0),
    gp: String(st?.gp ?? 0),
    esordio: st?.esordio ? String(st.esordio) : '',
  }
}

function riempi(testo: string, valori: Record<string, string>): string {
  return testo.replace(/\{(\w+)\}/g, (tutto, chiave) => valori[chiave] ?? tutto)
}

type Generatore = (s: Soggetto) => { domanda: string; risposta: string | null }

function componi(s: Soggetto, generatori: Record<ChiaveDomanda, Generatore>): DomandaRapida[] {
  const valori = segnaposti(s)
  const fuori: DomandaRapida[] = []
  for (const chiave of CHIAVI_DOMANDE) {
    const p = s.personalizzate?.[chiave]
    if (p?.mostra === false) continue
    const { domanda, risposta } = generatori[chiave](s)
    const testo = p?.risposta?.trim() ? riempi(p.risposta.trim(), valori) : risposta
    if (testo) fuori.push({ chiave, domanda, risposta: testo })
  }
  // Le domande aggiunte a mano: stessi segnaposto, cosi' anche una domanda
  // sulla stagione ("Quanti punti ha fatto Leclerc nel {anno}?") resta vera.
  ;(s.personalizzate?.altre ?? []).forEach((a, i) => {
    if (a.mostra === false || !a.domanda?.trim() || !a.risposta?.trim()) return
    fuori.push({
      chiave: `altra-${a._key ?? i}`,
      domanda: riempi(a.domanda.trim(), valori),
      risposta: riempi(a.risposta.trim(), valori),
    })
  })
  return fuori
}

// --- Piloti ------------------------------------------------------------------

const DOMANDE_PILOTA: Record<ChiaveDomanda, Generatore> = {
  classifica: (s) => {
    const c = s.classifica
    const domanda = `In che posizione è ${s.breve} nella classifica piloti ${s.anno}?`
    if (!c.posizione || c.punti === undefined) return { domanda, risposta: null }
    let coda = '.'
    if (c.riferimento) {
      const distacco = Math.abs(c.punti - c.riferimento.punti)
      coda =
        c.posizione === 1
          ? distacco > 0
            ? `: guida il Mondiale con ${distacco} punti di vantaggio su ${c.riferimento.nome}.`
            : `: guida il Mondiale a pari punti con ${c.riferimento.nome}.`
          : `, a ${distacco} punti dal leader ${c.riferimento.nome}.`
    }
    return {
      domanda,
      risposta: `${s.nome} è ${alPosto(c.posizione)} nella classifica piloti di Formula 1 ${s.anno} con ${c.punti} punti${coda}`,
    }
  },
  mondiali: (s) => {
    const st = s.stats
    if (st && st.mondiali.length > 0) {
      const n = st.mondiali.length
      return {
        domanda: `Quanti Mondiali ha vinto ${s.breve}?`,
        risposta:
          n === 1
            ? `${s.nome} ha vinto un Mondiale di Formula 1, nel ${st.mondiali[0]}.`
            : `${s.nome} ha vinto ${n} Mondiali di Formula 1: ${elenco(st.mondiali)}.`,
      }
    }
    const m = st?.migliorPiazzamento
    return {
      domanda: `Qual è il miglior risultato di ${s.breve} nel Mondiale?`,
      risposta: m
        ? `Il miglior piazzamento di ${s.nome} nel Mondiale piloti di Formula 1 è il ${m.posizione}° posto, ottenuto nel ${elenco(m.anni)}.`
        : null,
    }
  },
  vittorie: (s) => {
    const st = s.stats
    const domanda = `Quante gare ha vinto ${s.breve} in Formula 1?`
    if (!st || st.vittorie === 0 || !st.primaVittoria || !st.ultimaVittoria) return { domanda, risposta: null }
    if (st.vittorie === 1) {
      return { domanda, risposta: `${s.nome} ha vinto un Gran Premio in Formula 1, ${allaGara(st.primaVittoria).replace(/^al(la)? /, 'il ')}.` }
    }
    return {
      domanda,
      risposta: `${s.nome} ha vinto ${st.vittorie} Gran Premi in Formula 1. La prima vittoria è arrivata ${allaGara(st.primaVittoria)}, l'ultima ${allaGara(st.ultimaVittoria)}.`,
    }
  },
  podi: (s) => {
    const st = s.stats
    return {
      domanda: `Quanti podi ha ottenuto ${s.breve} in Formula 1?`,
      risposta:
        st && st.podi > 0
          ? `${s.nome} è salito sul podio ${st.podi === 1 ? 'una volta' : `${st.podi} volte`} in Formula 1, in ${st.gp} Gran Premi disputati.`
          : null,
    }
  },
  pole: (s) => {
    const st = s.stats
    return {
      domanda: `Quante pole position ha ${s.breve} in Formula 1?`,
      risposta:
        st && st.pole > 0 ? `${s.nome} ha conquistato ${numero(st.pole, 'pole position', 'pole position')} in Formula 1.` : null,
    }
  },
  carriera: (s) => {
    const st = s.stats
    return {
      domanda: `Quando ha esordito ${s.breve} in Formula 1?`,
      risposta:
        st?.esordio && st.gp > 0
          ? `${s.nome} ha esordito in Formula 1 nel ${st.esordio} e ha disputato ${st.gp === 1 ? 'un Gran Premio' : `${st.gp} Gran Premi`}.`
          : null,
    }
  },
}

export function domandePilota(s: Soggetto): DomandaRapida[] {
  return componi(s, DOMANDE_PILOTA)
}

// --- Team ----------------------------------------------------------------------

const DOMANDE_TEAM: Record<ChiaveDomanda, Generatore> = {
  classifica: (s) => {
    const c = s.classifica
    const domanda = `In che posizione è ${s.breve} nella classifica costruttori ${s.anno}?`
    if (!c.posizione || c.punti === undefined) return { domanda, risposta: null }
    let coda = '.'
    if (c.riferimento) {
      const distacco = Math.abs(c.punti - c.riferimento.punti)
      coda =
        c.posizione === 1
          ? distacco > 0
            ? `: guida il Mondiale costruttori con ${distacco} punti di vantaggio su ${c.riferimento.nome}.`
            : `: guida il Mondiale costruttori a pari punti con ${c.riferimento.nome}.`
          : `, a ${distacco} punti da ${c.riferimento.nome}, in testa.`
    }
    return {
      domanda,
      risposta: `${s.nome} è ${alPosto(c.posizione)} nella classifica costruttori di Formula 1 ${s.anno} con ${c.punti} punti${coda}`,
    }
  },
  mondiali: (s) => {
    const st = s.stats
    if (st && st.mondiali.length > 0) {
      const n = st.mondiali.length
      return {
        domanda: `Quanti Mondiali costruttori ha vinto ${s.breve}?`,
        risposta:
          n === 1
            ? `${s.nome} ha vinto un Mondiale costruttori di Formula 1, nel ${st.mondiali[0]}.`
            : `${s.nome} ha vinto ${n} Mondiali costruttori di Formula 1: ${elenco(st.mondiali)}.`,
      }
    }
    const m = st?.migliorPiazzamento
    return {
      domanda: `Qual è il miglior risultato di ${s.breve} nel Mondiale costruttori?`,
      risposta: m
        ? `Il miglior piazzamento di ${s.nome} nel Mondiale costruttori di Formula 1 è il ${m.posizione}° posto, ottenuto nel ${elenco(m.anni)}.`
        : null,
    }
  },
  vittorie: (s) => {
    const st = s.stats
    const domanda = `Quante gare ha vinto ${s.breve} in Formula 1?`
    if (!st || st.vittorie === 0 || !st.primaVittoria || !st.ultimaVittoria) return { domanda, risposta: null }
    if (st.vittorie === 1) {
      return { domanda, risposta: `${s.nome} ha vinto un Gran Premio in Formula 1, ${allaGara(st.primaVittoria).replace(/^al(la)? /, 'il ')}.` }
    }
    return {
      domanda,
      risposta: `${s.nome} ha vinto ${st.vittorie} Gran Premi in Formula 1. La prima vittoria è arrivata ${allaGara(st.primaVittoria)}, l'ultima ${allaGara(st.ultimaVittoria)}.`,
    }
  },
  podi: (s) => {
    const st = s.stats
    return {
      domanda: `Quanti podi ha ottenuto ${s.breve} in Formula 1?`,
      risposta:
        st && st.podi > 0
          ? `Le monoposto di ${s.breve} sono salite sul podio ${st.podi === 1 ? 'una volta' : `${st.podi} volte`} in Formula 1, in ${st.gp} Gran Premi disputati.`
          : null,
    }
  },
  pole: (s) => {
    const st = s.stats
    return {
      domanda: `Quante pole position ha ${s.breve} in Formula 1?`,
      risposta:
        st && st.pole > 0 ? `${s.nome} ha conquistato ${numero(st.pole, 'pole position', 'pole position')} in Formula 1.` : null,
    }
  },
  carriera: (s) => {
    const st = s.stats
    return {
      domanda: `Da quando corre ${s.breve} in Formula 1?`,
      risposta:
        st?.esordio && st.gp > 0
          ? `${s.nome} ha esordito in Formula 1 nel ${st.esordio} e ha disputato ${st.gp === 1 ? 'un Gran Premio' : `${st.gp} Gran Premi`}.`
          : null,
    }
  },
}

export function domandeTeam(s: Soggetto): DomandaRapida[] {
  return componi(s, DOMANDE_TEAM)
}
