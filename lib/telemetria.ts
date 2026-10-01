import { promises as fs } from 'node:fs'
import path from 'node:path'

// Dati della sezione Telemetria: file JSON in public/telemetria-data/,
// prodotti da scripts/telemetry/process_session.py e versionati nel
// repository. Le pagine li leggono dal disco al momento della compilazione;
// la telemetria dei singoli giri invece la scarica il browser, pilota per
// pilota, solo quando serve.

export interface SessioneTelemetria {
  key: string
  label: string
  pace: boolean
  telemetry: boolean
}

export interface WeekendTelemetria {
  year: number
  round: number
  name: string
  circuit: string
  date: string
  sessions: (SessioneTelemetria | string)[]
}

const CARTELLA = path.join(process.cwd(), 'public', 'telemetria-data')

export async function leggiJson<T>(...segmenti: string[]): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(CARTELLA, ...segmenti), 'utf-8')) as T
  } catch {
    return null
  }
}

/** Weekend elaborati, dal piu' recente. */
export async function weekendTelemetria(): Promise<WeekendTelemetria[]> {
  const indice = (await leggiJson<WeekendTelemetria[]>('index.json')) ?? []
  return [...indice].sort((a, b) => b.year - a.year || b.round - a.round)
}

export function sessioniDi(w: WeekendTelemetria): SessioneTelemetria[] {
  return w.sessions.filter((s): s is SessioneTelemetria => typeof s === 'object' && s !== null)
}

// Il nome del Gran Premio in italiano. FastF1 lo da' in inglese
// ("Azerbaijan Grand Prix"): nei titoli e nei risultati di Google serve come
// lo cerca la gente, "GP dell'Azerbaijan".
const NOMI: [string, string][] = [
  ['australian', "GP d'Australia"],
  ['chinese', 'GP di Cina'],
  ['japanese', 'GP del Giappone'],
  ['bahrain', 'GP del Bahrain'],
  ['saudi', "GP dell'Arabia Saudita"],
  ['miami', 'GP di Miami'],
  ['canadian', 'GP del Canada'],
  ['monaco', 'GP di Monaco'],
  ['barcelona', 'GP di Barcellona'],
  ['austrian', "GP d'Austria"],
  ['british', 'GP di Gran Bretagna'],
  ['belgian', 'GP del Belgio'],
  ['hungarian', "GP d'Ungheria"],
  ['dutch', "GP d'Olanda"],
  ['italian', "GP d'Italia"],
  ['emilia', "GP dell'Emilia-Romagna"],
  ['spanish', 'GP di Spagna'],
  ['azerbaijan', "GP dell'Azerbaijan"],
  ['singapore', 'GP di Singapore'],
  ['united states', 'GP degli Stati Uniti'],
  ['mexico', 'GP del Messico'],
  ['paulo', 'GP del Brasile'],
  ['brazil', 'GP del Brasile'],
  ['las vegas', 'GP di Las Vegas'],
  ['qatar', 'GP del Qatar'],
  ['abu dhabi', 'GP di Abu Dhabi'],
  ['malaysia', 'GP della Malesia'],
]

export function nomeGp(nome: string): string {
  const n = nome.toLowerCase()
  return NOMI.find(([chiave]) => n.includes(chiave))?.[1] ?? nome.replace(/ Grand Prix$/i, '').replace(/^/, 'GP ')
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

/** "26 settembre 2026" dalla data del weekend (AAAA-MM-GG). */
export function dataWeekend(iso: string): string {
  const [a, m, g] = iso.split('-').map(Number)
  if (!a || !m || !g) return ''
  return `${g} ${MESI[m - 1]} ${a}`
}
