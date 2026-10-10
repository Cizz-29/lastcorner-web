'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { projectId, dataset } from '@/lib/sanity/env'

// Durante una diretta la pagina si aggiorna da sola.
//
// Prima chiedeva a Vercel la pagina intera ogni minuto, per ogni lettore,
// anche quando non era cambiato niente: decine di chilobyte a richiesta, e
// tutte contavano sui limiti del piano gratuito.
//
// Ora ogni minuto chiede alla CDN di Sanity una cosa sola: l'ora dell'ultima
// pubblicazione dell'articolo (poche decine di byte, fuori da Vercel). Solo se
// e' piu' recente della versione che il lettore ha davanti, si scarica la
// pagina nuova. Se Sanity non risponde, si ripiega sul vecchio sistema, ma
// ogni tre minuti.
const OGNI = 60_000
const RIPIEGO = 3 * 60_000

const QUERY = '*[_id == $id][0]._updatedAt'

function indirizzo(id: string): string {
  const q = new URLSearchParams({
    query: QUERY,
    $id: JSON.stringify(id),
    perspective: 'published',
  })
  return `https://${projectId}.apicdn.sanity.io/v2025-02-19/data/query/${dataset}?${q}`
}

export default function AggiornaLive({ id, versione }: { id: string; versione?: string }) {
  const router = useRouter()
  // La versione cambia a ogni refresh riuscito: la si legge da qui, senza
  // far ripartire il timer.
  const attuale = useRef(versione)
  attuale.current = versione
  const ultimoRipiego = useRef(0)

  useEffect(() => {
    let inCorso = false
    const controlla = async () => {
      if (document.visibilityState !== 'visible' || inCorso) return
      inCorso = true
      try {
        const r = await fetch(indirizzo(id), { cache: 'no-store' })
        if (!r.ok) throw new Error(String(r.status))
        const { result } = (await r.json()) as { result?: string | null }
        // Confronto fra date ISO: come testo l'ordine e' quello giusto. Se la
        // CDN e' indietro rispetto alla pagina, non si fa nulla.
        if (result && (!attuale.current || result > attuale.current)) router.refresh()
      } catch {
        const adesso = Date.now()
        if (adesso - ultimoRipiego.current >= RIPIEGO) {
          ultimoRipiego.current = adesso
          router.refresh()
        }
      } finally {
        inCorso = false
      }
    }
    const timer = setInterval(controlla, OGNI)
    // Tornando sulla scheda dopo un po', subito il controllo.
    document.addEventListener('visibilitychange', controlla)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', controlla)
    }
  }, [id, router])
  return null
}
