'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoredConsent, saveConsent, REOPEN_EVENT } from '@/lib/cookieConsent'

// Banner di consenso cookie, mostrato finché l'utente non ha fatto una
// scelta (salvata in localStorage). Riapribile in qualsiasi momento tramite
// il link "Preferenze Cookie" nel footer, che emette REOPEN_EVENT.
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true)

    const reopen = () => {
      const current = getStoredConsent()
      setAnalytics(current?.analytics ?? false)
      setMarketing(current?.marketing ?? false)
      setCustomizing(true)
      setVisible(true)
    }
    window.addEventListener(REOPEN_EVENT, reopen)
    return () => window.removeEventListener(REOPEN_EVENT, reopen)
  }, [])

  function accept(all: boolean) {
    saveConsent({ analytics: all, marketing: all })
    setVisible(false)
    setCustomizing(false)
  }

  function saveCustom() {
    saveConsent({ analytics, marketing })
    setVisible(false)
    setCustomizing(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 sm:px-6 pb-4 sm:pb-6" role="dialog" aria-label="Preferenze cookie">
      <div className="max-w-[640px] mx-auto bg-lc-header border border-white/15 rounded-card-sm shadow-2xl p-5">
        <p className="font-montserrat text-[13px] text-white/85 leading-relaxed mb-4">
          Usiamo cookie tecnici necessari al funzionamento del Sito e, solo previo tuo
          consenso, cookie di analisi e marketing. Puoi accettarli tutti, rifiutarli o
          scegliere le tue preferenze. Per saperne di più leggi la{' '}
          <Link href="/cookie" className="text-white underline hover:text-lc-red transition-colors duration-200">
            Cookie Policy
          </Link>
          .
        </p>

        {customizing && (
          <div className="flex flex-col gap-3 mb-4 border-t border-white/10 pt-4">
            <label className="flex items-center justify-between gap-3 font-montserrat text-[12px] text-white/70">
              <span>Cookie necessari (sempre attivi)</span>
              <input type="checkbox" checked disabled className="accent-lc-red" />
            </label>
            <label className="flex items-center justify-between gap-3 font-montserrat text-[12px] text-white">
              <span>Cookie di analisi</span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="accent-lc-red"
              />
            </label>
            <label className="flex items-center justify-between gap-3 font-montserrat text-[12px] text-white">
              <span>Cookie di marketing</span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="accent-lc-red"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          {customizing ? (
            <button
              onClick={saveCustom}
              className="font-akira text-[11px] uppercase tracking-wide text-white bg-lc-red rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Salva preferenze
            </button>
          ) : (
            <>
              <button
                onClick={() => setCustomizing(true)}
                className="font-akira text-[11px] uppercase tracking-wide text-white/80 border border-white/20 rounded-full px-4 py-2 hover:border-white/40 transition-colors"
              >
                Personalizza
              </button>
              <button
                onClick={() => accept(false)}
                className="font-akira text-[11px] uppercase tracking-wide text-white/80 border border-white/20 rounded-full px-4 py-2 hover:border-white/40 transition-colors"
              >
                Rifiuta tutti
              </button>
              <button
                onClick={() => accept(true)}
                className="font-akira text-[11px] uppercase tracking-wide text-white bg-lc-red rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Accetta tutti
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
