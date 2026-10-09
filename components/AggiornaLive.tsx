'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Durante una diretta la pagina si aggiorna da sola: ogni minuto, se la
// scheda è in vista, chiede al server la versione corrente. La pagina è
// statica e si rigenera a ogni pubblicazione (webhook di Sanity), quindi la
// richiesta costa poco: arriva dalla cache finché non c'è un aggiornamento.
const OGNI = 60_000

export default function AggiornaLive() {
  const router = useRouter()
  useEffect(() => {
    const aggiorna = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const timer = setInterval(aggiorna, OGNI)
    // Tornando sulla scheda dopo un po', subito la versione nuova.
    document.addEventListener('visibilitychange', aggiorna)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', aggiorna)
    }
  }, [router])
  return null
}
