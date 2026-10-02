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

// Il nome del GP in italiano sta in lib/nomiGp.ts: lo usano anche pagine che
// con la telemetria non c'entrano (calendario, domande rapide).
export { nomeGp } from '@/lib/nomiGp'

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

/** "26 settembre 2026" dalla data del weekend (AAAA-MM-GG). */
export function dataWeekend(iso: string): string {
  const [a, m, g] = iso.split('-').map(Number)
  if (!a || !m || !g) return ''
  return `${g} ${MESI[m - 1]} ${a}`
}
