'use client'

import { useCallback, useEffect, useState } from 'react'

// Pannello per avviare l'elaborazione dei dati di un weekend direttamente
// dal sito, senza passare dall'interfaccia di GitHub. Mostra anche lo stato
// delle ultime esecuzioni, aggiornandosi da solo mentre una è in corso.

export interface Meeting {
  round: number
  name: string
  circuit: string
  date: string
  done: boolean
}

interface Run {
  id: number
  status: string
  conclusion: string | null
  createdAt: string
  url: string
}

function StatoRun({ run }: { run: Run }) {
  const inCorso = run.status !== 'completed'
  const ok = run.conclusion === 'success'

  const label = inCorso
    ? run.status === 'queued'
      ? 'In coda'
      : 'In corso'
    : ok
      ? 'Completata'
      : 'Fallita'

  const color = inCorso ? 'text-white' : ok ? 'text-emerald-400' : 'text-lc-red'
  const dot = inCorso ? 'bg-white animate-pulse' : ok ? 'bg-emerald-400' : 'bg-lc-red'

  const quando = new Date(run.createdAt).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className={`font-montserrat text-[12px] ${color} w-24 shrink-0`}>{label}</span>
      <span className="font-montserrat text-[11px] text-lc-subtle">{quando}</span>
    </div>
  )
}

export default function RunPanel({ meetings }: { meetings: Meeting[] }) {
  const [round, setRound] = useState<string>('')
  const [runs, setRuns] = useState<Run[]>([])
  const [invio, setInvio] = useState(false)
  const [messaggio, setMessaggio] = useState('')
  const [errore, setErrore] = useState('')

  const caricaRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetria-run', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setRuns(data.runs ?? [])
    } catch {
      // silenzioso: lo stato è un'informazione accessoria
    }
  }, [])

  useEffect(() => {
    caricaRuns()
  }, [caricaRuns])

  // Mentre un'elaborazione è in corso si aggiorna ogni 10 secondi, così la
  // pagina riflette l'avanzamento senza doverla ricaricare a mano.
  useEffect(() => {
    const attiva = runs.some((r) => r.status !== 'completed')
    if (!attiva) return
    const id = setInterval(caricaRuns, 10000)
    return () => clearInterval(id)
  }, [runs, caricaRuns])

  async function avvia() {
    setInvio(true)
    setErrore('')
    setMessaggio('')
    try {
      const res = await fetch('/api/telemetria-run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          round: round ? Number(round) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrore(data.error ?? 'Errore imprevisto.')
      } else {
        setMessaggio(
          'Elaborazione avviata. Richiede qualche minuto; i dati compaiono qui sopra appena pronti.'
        )
        setTimeout(caricaRuns, 3000)
      }
    } catch (err) {
      setErrore((err as Error).message)
    } finally {
      setInvio(false)
    }
  }

  return (
    <div className="bg-lc-card border border-white/10 rounded-card p-6 mb-12">
      <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-1">
        Genera dati
      </p>
      <p className="font-montserrat text-[12px] text-lc-subtle mb-5">
        Scegli un weekend e avvia l&apos;elaborazione. Lasciando &quot;Automatico&quot; viene
        processato l&apos;ultimo weekend concluso non ancora presente.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={round}
          onChange={(e) => setRound(e.target.value)}
          className="flex-1 bg-lc-bg border border-white/15 rounded-card-sm px-4 py-3 font-montserrat text-[13px] text-white focus:outline-none focus:border-lc-red"
        >
          <option value="">Automatico (ultimo weekend concluso)</option>
          {meetings.map((m) => (
            <option key={m.round} value={m.round}>
              {m.round} — {m.name} {m.done ? '✓' : ''}
            </option>
          ))}
        </select>

        <button
          onClick={avvia}
          disabled={invio}
          className="bg-lc-red disabled:opacity-50 rounded-card-sm px-6 py-3 font-akira text-[11px] text-white uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
        >
          {invio ? 'Avvio...' : 'Genera'}
        </button>
      </div>

      {messaggio && (
        <p className="font-montserrat text-[12px] text-emerald-400 mb-3">{messaggio}</p>
      )}
      {errore && <p className="font-montserrat text-[12px] text-lc-red mb-3">{errore}</p>}

      {runs.length > 0 && (
        <div className="border-t border-white/10 pt-3 mt-3">
          <p className="font-akira text-[10px] text-white uppercase tracking-widest mb-1">
            Ultime elaborazioni
          </p>
          {runs.slice(0, 4).map((r) => (
            <StatoRun key={r.id} run={r} />
          ))}
        </div>
      )}
    </div>
  )
}
