'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoredConsent, saveConsent, REOPEN_EVENT } from '@/lib/cookieConsent'

// Banner di consenso, mostrato finché l'utente non ha fatto una scelta
// (salvata in localStorage). Riapribile in qualsiasi momento tramite il
// link "Preferenze Cookie" nel footer, che emette REOPEN_EVENT.
//
// Non parla più di pubblicità, perché non la governa più: il consenso
// pubblicitario lo chiede la CMP certificata di Google, dentro lo script
// AdSense. Qui resta un solo caso, gli embed di X e Instagram, e con una
// categoria sola il pannello "Personalizza" non aveva più niente da
// personalizzare — due bottoni dicono la stessa cosa in meno passaggi.
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true)
    const reopen = () => setVisible(true)
    window.addEventListener(REOPEN_EVENT, reopen)
    return () => window.removeEventListener(REOPEN_EVENT, reopen)
  }, [])

  function scegli(marketing: boolean) {
    saveConsent({ marketing })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] px-4 sm:px-6 pb-4 sm:pb-6"
      role="dialog"
      aria-label="Preferenze cookie"
    >
      <div className="max-w-[640px] mx-auto bg-lc-header border border-white/15 rounded-card-sm shadow-2xl p-5">
        <p className="font-montserrat text-[13px] text-white/85 leading-relaxed mb-4">
          Usiamo cookie tecnici, necessari al funzionamento del Sito. Solo con il tuo
          consenso carichiamo i contenuti incorporati da X e Instagram, che installano
          cookie propri. Per la pubblicità il consenso ti viene chiesto separatamente da
          Google. Per saperne di più leggi la{' '}
          <Link
            href="/cookie"
            className="text-white underline hover:text-lc-red transition-colors duration-200"
          >
            Cookie Policy
          </Link>
          .
        </p>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => scegli(false)}
            className="font-akira text-[11px] uppercase tracking-wide text-white/80 border border-white/20 rounded-full px-4 py-2 hover:border-white/40 transition-colors"
          >
            Rifiuta
          </button>
          <button
            onClick={() => scegli(true)}
            className="font-akira text-[11px] uppercase tracking-wide text-white bg-lc-red rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  )
}
