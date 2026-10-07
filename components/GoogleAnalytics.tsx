'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { CONSENT_CHANGED_EVENT, hasConsent } from '@/lib/cookieConsent'

// Google Analytics 4 (proprieta' "lastcorner.net", account "Lastcorner.net").
//
// Si carica SOLO dopo il consenso "Statistiche" dato sul banner del sito:
// senza consenso lo script non viene scaricato, non parte nessuna richiesta
// verso Google e non si installa nessun cookie. Niente Consent Mode con
// richieste "senza cookie" prima del consenso: meno dati (si contano solo i
// visitatori che accettano), ma nessun dubbio con il Garante e nessun peso
// sulla pagina per chi rifiuta.
//
// Perche' non il messaggio di Google (quello di AdSense): viaggia dentro
// adsbygoogle.js, che su telemetria, Studio ed editor grafiche non si carica
// (vedi AdsenseScript.tsx). La telemetria e' proprio una delle sezioni da
// misurare, quindi il consenso deve poterlo chiedere il sito ovunque.
//
// Le visite fra una pagina e l'altra (navigazione di Next senza ricaricare)
// le conta GA da solo: nello stream e' attiva la misurazione avanzata, che
// registra i cambi di indirizzo della cronologia del browser.
//
// Funzioni pubblicitarie spente (Google Signals e personalizzazione): ai
// fini di questo sito Analytics serve solo a contare e capire le visite.
const ID_MISURAZIONE = 'G-TGWBTQBBSH'
const SRC = `https://www.googletagmanager.com/gtag/js?id=${ID_MISURAZIONE}`

// Aree dello staff: non sono visite di lettori.
const PERCORSI_ESCLUSI = ['/studio', '/grafiche']

type FinestraConGtag = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
} & Record<string, unknown>

function avviaAnalytics() {
  const w = window as unknown as FinestraConGtag
  w[`ga-disable-${ID_MISURAZIONE}`] = false
  if (document.querySelector(`script[src="${SRC}"]`)) return
  w.dataLayer = w.dataLayer || []
  // gtag deve spingere l'oggetto `arguments`, non un array: e' il formato
  // che gtag.js riconosce.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', ID_MISURAZIONE, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  const el = document.createElement('script')
  el.async = true
  el.src = SRC
  document.head.appendChild(el)
}

// Revoca: GA smette di inviare dati nella pagina aperta e si cancellano i
// suoi cookie (_ga e _ga_<id>), sia sul dominio sia sul sottodominio.
function fermaAnalytics() {
  const w = window as unknown as FinestraConGtag
  w[`ga-disable-${ID_MISURAZIONE}`] = true
  const host = window.location.hostname
  const domini = ['', host, `.${host}`, `.${host.replace(/^www\./, '')}`]
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((nome) => nome === '_ga' || nome.startsWith('_ga_'))
    .forEach((nome) => {
      domini.forEach((d) => {
        document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`
      })
    })
}

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const escluso = PERCORSI_ESCLUSI.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    if (escluso) return
    const w = window as unknown as FinestraConGtag

    // Come AdSense: a pagina caricata e con il browser libero, per non
    // pesare sul primo caricamento.
    const quandoLibero = (fn: () => void) => {
      const via = () => {
        if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2000 })
        else setTimeout(fn, 200)
      }
      if (document.readyState === 'complete') via()
      else window.addEventListener('load', via, { once: true })
    }

    if (hasConsent('statistiche')) quandoLibero(avviaAnalytics)

    const suCambio = () => {
      if (hasConsent('statistiche')) avviaAnalytics()
      else fermaAnalytics()
    }
    window.addEventListener(CONSENT_CHANGED_EVENT, suCambio)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, suCambio)
  }, [escluso])

  return null
}
