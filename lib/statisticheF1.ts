// Statistiche di carriera di piloti e team di F1 (data/statistiche-f1.json).
//
// Le calcola scripts/statistiche/aggiorna.py dallo storico completo di
// Jolpica, e un workflow di GitHub le aggiorna dopo ogni gara: il sito le
// legge da un file del repository, senza chiedere nulla a Jolpica quando una
// pagina si rigenera.

import dati from '@/data/statistiche-f1.json'

export interface GaraVinta {
  anno: number
  gara: string
  data: string
}

export interface StatisticheCarriera {
  gp: number
  esordio: number | null
  vittorie: number
  podi: number
  pole: number
  /** Anni dei titoli mondiali (piloti o costruttori). */
  mondiali: number[]
  primaVittoria: GaraVinta | null
  ultimaVittoria: GaraVinta | null
  /** Miglior posizione finale nel Mondiale (piloti o costruttori) e in quali anni. */
  migliorPiazzamento?: { posizione: number; anni: number[] }
  /** La stagione in corso: per i riquadri "Stagione" delle schede. */
  stagione?: { vittorie: number; podi: number; pole: number } | null
}

interface FileStatistiche {
  aggiornato: string
  stagione: number
  piloti: Record<string, StatisticheCarriera>
  team: Record<string, StatisticheCarriera>
}

const STATISTICHE = dati as unknown as FileStatistiche

export function statistichePilota(driverId: string): StatisticheCarriera | null {
  return STATISTICHE.piloti[driverId] ?? null
}

export function statisticheTeam(constructorId: string): StatisticheCarriera | null {
  return STATISTICHE.team[constructorId] ?? null
}
