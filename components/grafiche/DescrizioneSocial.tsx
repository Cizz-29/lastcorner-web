'use client'

import { useState } from 'react'
import { TIPI_POST, type TipoPost } from '@/lib/ai/tipiPost'

// "Genera descrizione": dalla notizia incollata, la descrizione Instagram
// nello stile di @lastcorner_net e la versione per X
// (app/grafiche/descrizione/route.ts). Funziona anche per i post fatti in
// Photoshop: basta incollare la fonte. Il testo resta modificabile prima di
// copiarlo. Quattro tipi di post (lib/ai/tipiPost.ts), ognuno con regole ed
// esempi propri; gli altri tipi la redazione li scrive a mano.

const etichetta = 'font-montserrat text-[11px] uppercase tracking-widest text-lc-subtle'
const campo =
  'w-full bg-lc-card border border-white/10 rounded-card-sm px-3 py-2 font-montserrat text-[14px] text-white focus:outline-none focus:border-lc-red'

function Risultato({ titolo, valore, onChange, limite }: {
  titolo: string
  valore: string
  onChange: (v: string) => void
  limite?: number
}) {
  const [copiato, setCopiato] = useState(false)
  async function copia() {
    try {
      await navigator.clipboard.writeText(valore)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 1500)
    } catch {
      // Appunti non disponibili (pagina non sicura o permesso negato): il
      // testo resta selezionabile a mano nel riquadro.
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className={etichetta}>
          {titolo}
          {limite ? ` — ${valore.length}/${limite}` : ''}
        </label>
        <button
          type="button"
          onClick={copia}
          className="font-akira text-[9px] uppercase tracking-widest text-lc-subtle border border-white/15 rounded-full px-3 py-1 hover:border-lc-red hover:text-lc-red"
        >
          {copiato ? 'copiato' : 'copia'}
        </button>
      </div>
      <textarea
        rows={titolo === 'Instagram' ? 12 : 4}
        value={valore}
        onChange={(e) => onChange(e.target.value)}
        className={`${campo} mt-2 resize-y ${limite && valore.length > limite ? 'border-lc-red' : ''}`}
      />
    </div>
  )
}

export default function DescrizioneSocial() {
  const [tipo, setTipo] = useState<TipoPost>('risultato')
  const [fonte, setFonte] = useState('')
  const [appunti, setAppunti] = useState('')
  const [instagram, setInstagram] = useState('')
  const [x, setX] = useState('')
  const [stato, setStato] = useState<'pronto' | 'attesa' | 'errore'>('pronto')
  const [messaggio, setMessaggio] = useState('')

  async function genera() {
    setStato('attesa')
    setMessaggio('')
    try {
      const r = await fetch('/grafiche/descrizione', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tipo, fonte, appunti }),
      })
      if (r.status === 401) throw new Error('Password scaduta: ricarica la pagina.')
      const dati = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(dati.error ?? `Errore ${r.status}`)
      setInstagram(dati.instagram ?? '')
      setX(dati.x ?? '')
      setStato('pronto')
    } catch (e) {
      setStato('errore')
      setMessaggio((e as Error).message)
    }
  }

  return (
    <section className="mt-10 max-w-[1400px] border-t border-white/10 pt-8">
      <h2 className="font-akira text-[14px] text-white uppercase tracking-widest mb-2">Descrizione social</h2>
      <p className="font-montserrat text-[12px] text-lc-subtle mb-5 max-w-[70ch]">
        Incolla il comunicato, le dichiarazioni o la notizia (anche in inglese): esce la descrizione per Instagram nello
        stile della pagina e una versione corta per X. Controlla sempre fatti e citazioni prima di pubblicare.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div>
            <label className={etichetta}>Tipo di post</label>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo di post">
              {TIPI_POST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tipo === t.id}
                  onClick={() => setTipo(t.id)}
                  className={`font-montserrat text-[13px] px-3 py-1.5 rounded-full border transition-colors ${
                    tipo === t.id
                      ? 'border-lc-red bg-lc-red text-white'
                      : 'border-white/15 text-lc-subtle hover:border-white/40 hover:text-white'
                  }`}
                >
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={etichetta}>Notizia o fonte</label>
            <textarea
              rows={10}
              value={fonte}
              onChange={(e) => setFonte(e.target.value)}
              placeholder={TIPI_POST.find((t) => t.id === tipo)!.aiuto}
              className={`${campo} mt-2 resize-y`}
            />
          </div>
          <div>
            <label className={etichetta}>Indicazioni (facoltative)</label>
            <input
              value={appunti}
              onChange={(e) => setAppunti(e.target.value)}
              placeholder="Es. appuntamento alle 14:00 per le qualifiche, hashtag #BahrainGP, c'è l'articolo sul sito"
              className={`${campo} mt-2`}
            />
          </div>
          <button
            type="button"
            onClick={genera}
            disabled={stato === 'attesa' || !fonte.trim()}
            className="bg-lc-red text-white font-akira text-[12px] uppercase tracking-widest py-3 rounded-card-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {stato === 'attesa' ? 'Scrivo…' : instagram ? 'Rigenera descrizione' : 'Genera descrizione'}
          </button>
          {stato === 'errore' && <p className="font-montserrat text-[12px] text-lc-red">{messaggio}</p>}
        </div>
        {(instagram || x) && (
          <div className="flex flex-col gap-5">
            <Risultato titolo="Instagram" valore={instagram} onChange={setInstagram} />
            <Risultato titolo="X" valore={x} onChange={setX} limite={280} />
          </div>
        )}
      </div>
    </section>
  )
}
