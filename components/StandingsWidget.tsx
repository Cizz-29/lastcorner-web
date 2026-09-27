'use client'

// Widget classifica F1 in sidebar.
//
// E' un componente del browser, e deve restarlo: se tornasse a leggere i dati
// dal server, la sua cache di un'ora varrebbe per l'intera pagina che lo
// contiene, e ogni articolo di Formula 1 si rigenererebbe ogni ora. Il perche'
// completo sta in app/api/classifica-f1/route.ts.
//
// Mentre i dati arrivano si disegna la stessa struttura con le righe vuote:
// stesse classi, stesse altezze. Il riquadro ha la sua misura definitiva fin
// dal primo istante, e quello che sta sotto in colonna non salta.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTeamColor } from '@/lib/teamColors'
import type { ClassificaF1 } from '@/lib/classificaF1'

type Stato = { tipo: 'attesa' } | { tipo: 'pronta'; dati: ClassificaF1 } | { tipo: 'errore' }

const RIGHE = 5

function RigaVuota() {
  return (
    <div className="flex items-center gap-2 py-[5px] px-2" aria-hidden>
      <span className="font-akira text-[11px] w-4 shrink-0">&nbsp;</span>
      <div className="h-[14px] flex-1 rounded bg-white/5 animate-pulse motion-reduce:animate-none" />
    </div>
  )
}

function Riga({ posizione, colore, href, nome, punti }: {
  posizione: string; colore: string; href: string; nome: string; punti: string
}) {
  return (
    <div className="flex items-center gap-2 py-[5px] px-2 rounded-lg hover:bg-white/5 transition-colors">
      <span className="font-akira text-[11px] w-4 text-center shrink-0 text-white">{posizione}</span>
      <div className="w-[3px] h-[14px] rounded-full shrink-0" style={{ background: colore }} />
      <Link
        href={href}
        className="font-akira text-[11px] text-white flex-1 truncate tracking-wide hover:text-lc-red transition-colors duration-200"
      >
        {nome.toUpperCase()}
      </Link>
      <span className="font-akira font-bold text-[11px] text-white shrink-0">{punti}</span>
    </div>
  )
}

function Blocco({ titolo, etichetta, stato, righe }: {
  titolo: string
  etichetta: string
  stato: Stato['tipo']
  righe: React.ReactNode[]
}) {
  return (
    <div>
      <h3 className="font-akira text-[10px] text-lc-subtle uppercase mb-3 tracking-widest">{titolo}</h3>
      {stato === 'errore' || (stato === 'pronta' && righe.length === 0) ? (
        <p className="font-montserrat text-[11px] text-lc-subtle py-3 text-center">
          Classifica {etichetta} non disponibile al momento.
        </p>
      ) : (
        <div className="flex flex-col gap-[2px]">
          {stato === 'attesa' ? Array.from({ length: RIGHE }, (_, i) => <RigaVuota key={i} />) : righe}
        </div>
      )}
    </div>
  )
}

export default function StandingsWidget() {
  const [stato, setStato] = useState<Stato>({ tipo: 'attesa' })

  useEffect(() => {
    let attivo = true
    fetch('/api/classifica-f1')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((dati: ClassificaF1) => attivo && setStato({ tipo: 'pronta', dati }))
      .catch(() => attivo && setStato({ tipo: 'errore' }))
    return () => {
      attivo = false
    }
  }, [])

  const dati = stato.tipo === 'pronta' ? stato.dati : null

  const piloti = (dati?.piloti ?? []).map((p) => (
    <Riga
      key={p.posizione}
      posizione={p.posizione}
      colore={getTeamColor(p.team)}
      href={`/formula-1/piloti/${p.id}`}
      nome={p.cognome}
      punti={p.punti}
    />
  ))
  const costruttori = (dati?.costruttori ?? []).map((c) => (
    <Riga
      key={c.posizione}
      posizione={c.posizione}
      colore={getTeamColor(c.nome)}
      href={`/formula-1/team/${c.id}`}
      nome={c.nome}
      punti={c.punti}
    />
  ))

  return (
    <div className="bg-lc-card rounded-card p-5 border border-white/10" aria-busy={stato.tipo === 'attesa'}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-lc-red rounded-full" />
        <h2 className="font-akira font-bold text-[13px] text-white uppercase tracking-wide">
          Classifica F1{dati ? ` ${dati.stagione}` : ''}
        </h2>
      </div>
      <div className="flex flex-col gap-5">
        <Blocco titolo="Piloti" etichetta="piloti" stato={stato.tipo} righe={piloti} />
        <div className="h-px bg-white/10" />
        <Blocco titolo="Costruttori" etichetta="costruttori" stato={stato.tipo} righe={costruttori} />
      </div>
      <div className="mt-4 text-center">
        <a
          href="/formula-1/classifica"
          className="font-montserrat text-[10px] text-lc-subtle hover:text-lc-red transition-colors duration-200"
        >
          Classifica completa →
        </a>
      </div>
    </div>
  )
}
