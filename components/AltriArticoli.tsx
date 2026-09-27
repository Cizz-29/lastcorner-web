'use client'

// Colonna "Altri articoli" della pagina articolo.
//
// La lista arriva gia' scritta nell'HTML dal server: la vedono subito i
// lettori e la vedono i motori di ricerca, per cui restano link interni veri
// verso i pezzi recenti. Ma la pagina e' statica, quindi quella lista e'
// ferma all'ultima volta che la pagina e' stata generata. Appena la pagina e'
// caricata, il browser chiede gli ultimi articoli aggiornati e, se sono
// cambiati, li sostituisce.
//
// Le card hanno altezza fissa e sono sempre lo stesso numero: la
// sostituzione cambia il contenuto, non l'ingombro, e non fa saltare niente.

import { useEffect, useState } from 'react'
import { ArticleCardSmall, type Article } from '@/components/ArticleCard'
import { ALTRI_ARTICOLI } from '@/lib/altriArticoli'

export default function AltriArticoli({ iniziali, escludiId }: { iniziali: Article[]; escludiId: string }) {
  const [articoli, setArticoli] = useState(iniziali)

  useEffect(() => {
    let attivo = true
    fetch('/api/ultimi-articoli')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((ultimi: Article[]) => {
        const aggiornati = ultimi.filter((a) => a.id !== escludiId).slice(0, ALTRI_ARTICOLI)
        // Se la richiesta fallisce o torna vuota resta la lista del server.
        if (attivo && aggiornati.length === ALTRI_ARTICOLI) setArticoli(aggiornati)
      })
      .catch(() => {})
    return () => {
      attivo = false
    }
  }, [escludiId])

  if (articoli.length === 0) return null

  return (
    <div>
      <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-3">
        Altri articoli
      </p>
      <div className="flex flex-col gap-[3px]">
        {articoli.map((a) => (
          <ArticleCardSmall key={a.id} article={a} />
        ))}
      </div>
    </div>
  )
}
