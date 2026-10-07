'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoredConsent, saveConsent, sceltaDaChiedere, REOPEN_EVENT } from '@/lib/cookieConsent'

// Banner di consenso, mostrato finché l'utente non ha fatto una scelta
// (salvata in localStorage) o quando si aggiunge una finalità nuova (vedi
// VERSIONE_CONSENSO). Riapribile in qualsiasi momento tramite il link
// "Preferenze Cookie" nel footer, che emette REOPEN_EVENT.
//
// Governa le due cose che il sito carica di propria iniziativa: gli embed di
// X e Instagram e Google Analytics. La pubblicità no: il consenso
// pubblicitario lo chiede la CMP certificata di Google, dentro lo script
// AdSense.
//
// Con due finalità torna "Personalizza": il Garante chiede che si possa
// scegliere per finalità, non solo tutto o niente. "Rifiuta" resta allo
// stesso livello di "Accetta", come richiesto dalle linee guida.
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [dettaglio, setDettaglio] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [statistiche, setStatistiche] = useState(false)

  useEffect(() => {
    const apri = () => {
      // Le caselle partono dalla scelta già fatta, se c'è; una finalità
      // nuova parte spenta (sceltaDaChiedere/hasConsent non la danno per
      // accettata).
      const salvato = getStoredConsent()
      setMarketing(salvato?.marketing ?? false)
      setStatistiche(salvato && !sceltaDaChiedere() ? salvato.statistiche : false)
      setDettaglio(false)
      setVisible(true)
    }
    if (sceltaDaChiedere()) apri()
    window.addEventListener(REOPEN_EVENT, apri)
    return () => window.removeEventListener(REOPEN_EVENT, apri)
  }, [])

  function scegli(scelta: { marketing: boolean; statistiche: boolean }) {
    saveConsent(scelta)
    setVisible(false)
  }

  if (!visible) return null

  const bottone =
    'font-akira text-[11px] uppercase tracking-wide rounded-full px-4 py-2 transition-colors'
  const secondario = `${bottone} text-white/80 border border-white/20 hover:border-white/40`
  const primario = `${bottone} text-white bg-lc-red hover:opacity-90 transition-opacity`

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] px-4 sm:px-6 pb-4 sm:pb-6"
      role="dialog"
      aria-label="Preferenze cookie"
    >
      <div className="max-w-[640px] mx-auto bg-lc-header border border-white/15 rounded-card-sm shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
        <p className="font-montserrat text-[13px] text-white/85 leading-relaxed mb-4">
          Usiamo cookie tecnici, necessari al funzionamento del Sito. Solo con il tuo
          consenso carichiamo i contenuti incorporati da X e Instagram e Google Analytics, che
          ci aiuta a capire quali articoli leggete: entrambi installano cookie propri. Per la
          pubblicità il consenso ti viene chiesto separatamente da Google. Per saperne di più
          leggi la{' '}
          <Link
            href="/cookie"
            className="text-white underline hover:text-lc-red transition-colors duration-200"
          >
            Cookie Policy
          </Link>
          .
        </p>

        {dettaglio && (
          <fieldset className="mb-4 flex flex-col gap-3 border-t border-white/10 pt-4">
            <legend className="sr-only">Scegli per finalità</legend>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={statistiche}
                onChange={(e) => setStatistiche(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#FF3A3A]"
              />
              <span className="font-montserrat text-[13px] text-white/85 leading-relaxed">
                <strong className="text-white">Statistiche</strong> — Google Analytics: quante
                persone leggono il Sito, da dove arrivano e quali pagine aprono.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#FF3A3A]"
              />
              <span className="font-montserrat text-[13px] text-white/85 leading-relaxed">
                <strong className="text-white">Contenuti di X e Instagram</strong> — i post
                incorporati negli articoli. Senza consenso vedi un link al post originale.
              </span>
            </label>
          </fieldset>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          {dettaglio ? (
            <button onClick={() => scegli({ marketing, statistiche })} className={primario}>
              Salva le scelte
            </button>
          ) : (
            <>
              <button onClick={() => scegli({ marketing: false, statistiche: false })} className={secondario}>
                Rifiuta
              </button>
              <button onClick={() => setDettaglio(true)} className={secondario}>
                Personalizza
              </button>
              <button onClick={() => scegli({ marketing: true, statistiche: true })} className={primario}>
                Accetta
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
