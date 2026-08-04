'use client'

import { useEffect, useRef, useState } from 'react'
import { hasConsent, CONSENT_CHANGED_EVENT } from '@/lib/cookieConsent'

// Anteprima di un post X/Twitter dentro l'articolo.
//
// L'anteprima vera richiede lo script di X, che è di terze parti e installa
// cookie di profilazione: per questo si carica solo con il consenso
// marketing, coerentemente con il banner. Senza consenso resta il link
// diretto, che funziona sempre e non traccia nessuno.
//
// Lo script viene scaricato una volta sola per pagina e solo se un embed è
// effettivamente presente: gli articoli senza post di X non ne pagano il peso.

const SRC = 'https://platform.twitter.com/widgets.js'

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } }
  }
}

function caricaScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.twttr?.widgets) return resolve()
    const esistente = document.querySelector(`script[src="${SRC}"]`)
    if (esistente) {
      esistente.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const el = document.createElement('script')
    el.src = SRC
    el.async = true
    el.charset = 'utf-8'
    el.addEventListener('load', () => resolve(), { once: true })
    el.addEventListener('error', () => resolve(), { once: true })
    document.body.appendChild(el)
  })
}

export default function XEmbed({ url }: { url: string }) {
  const contenitore = useRef<HTMLDivElement>(null)
  const [consenso, setConsenso] = useState(false)
  const [caricato, setCaricato] = useState(false)

  useEffect(() => {
    setConsenso(hasConsent('marketing'))
    const onChange = () => setConsenso(hasConsent('marketing'))
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange)
  }, [])

  useEffect(() => {
    if (!consenso) return
    let annullato = false
    caricaScript().then(() => {
      if (annullato) return
      // widgets.load trasforma il <blockquote> nell'anteprima vera.
      window.twttr?.widgets?.load?.(contenitore.current ?? undefined)
      setCaricato(true)
    })
    return () => {
      annullato = true
    }
  }, [consenso, url])

  if (!consenso) {
    return (
      <div className="mb-6 rounded-card border border-white/10 bg-lc-card px-4 py-4">
        <p className="font-montserrat text-[12px] text-lc-subtle mb-2">
          L&apos;anteprima del post richiede i cookie di marketing.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-montserrat text-[13px] text-lc-red hover:underline"
        >
          Guarda il post originale →
        </a>
      </div>
    )
  }

  return (
    <div ref={contenitore} className="mb-6 flex justify-center [&_.twitter-tweet]:!my-0">
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
        <a href={url}>{!caricato && 'Caricamento del post…'}</a>
      </blockquote>
    </div>
  )
}
