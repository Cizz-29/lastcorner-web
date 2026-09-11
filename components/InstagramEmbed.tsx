'use client'

import { useEffect, useRef, useState } from 'react'
import { hasConsent, CONSENT_CHANGED_EVENT } from '@/lib/cookieConsent'

// Anteprima di un post Instagram dentro l'articolo.
//
// Stessa impostazione di XEmbed: lo script e' di terze parti e installa
// cookie di profilazione, quindi si carica solo con il consenso marketing.
// Senza consenso resta il link diretto, che funziona sempre e non traccia
// nessuno.
//
// Nota storica, perche' spiega perche' si puo' fare oggi e non ieri: dal
// 2020 Meta chiedeva un token d'accesso e la revisione dell'app per gli
// embed. A giugno 2026 ha fatto marcia indietro — i post singoli si
// incorporano di nuovo senza autenticazione. I feed di un profilo, invece,
// richiedono ancora le API con token: qui si incorpora un post per volta.

const SRC = 'https://www.instagram.com/embed.js'

declare global {
  interface Window {
    instgrm?: { Embeds?: { process?: () => void } }
  }
}

/** Instagram appiccica alla fine dei link condivisi dall'app dei parametri
 *  di tracciamento (?igsh=...). Il permalink dell'embed li rifiuta, quindi
 *  si tiene solo la parte pulita e la barra finale che Instagram si aspetta. */
export function permalinkPulito(url: string): string {
  try {
    const u = new URL(url)
    const percorso = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`
    return `https://www.instagram.com${percorso}`
  } catch {
    return url
  }
}

function caricaScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.instgrm?.Embeds) return resolve()
    const esistente = document.querySelector(`script[src="${SRC}"]`)
    if (esistente) {
      esistente.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const el = document.createElement('script')
    el.src = SRC
    el.async = true
    el.addEventListener('load', () => resolve(), { once: true })
    el.addEventListener('error', () => resolve(), { once: true })
    document.body.appendChild(el)
  })
}

export default function InstagramEmbed({ url }: { url: string }) {
  const contenitore = useRef<HTMLDivElement>(null)
  const [consenso, setConsenso] = useState(false)
  const permalink = permalinkPulito(url)

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
      // process() trasforma i <blockquote> presenti nell'anteprima vera.
      // A differenza di X non accetta un elemento: lavora su tutta la
      // pagina, ed e' innocuo perche' salta quelli gia' elaborati.
      window.instgrm?.Embeds?.process?.()
    })
    return () => {
      annullato = true
    }
  }, [consenso, permalink])

  if (!consenso) {
    return (
      <div className="mb-6 rounded-card border border-white/10 bg-lc-card px-4 py-4">
        <p className="font-montserrat text-[12px] text-lc-subtle mb-2">
          L&apos;anteprima del post richiede i cookie di marketing.
        </p>
        <a
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-montserrat text-[13px] text-lc-red hover:underline"
        >
          Guarda il post su Instagram →
        </a>
      </div>
    )
  }

  return (
    <div ref={contenitore} className="mb-6 flex justify-center [&_.instagram-media]:!my-0">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{ background: '#FFF', border: 0, margin: 0, maxWidth: 540, width: '100%' }}
      >
        <a href={permalink}>Caricamento del post…</a>
      </blockquote>
    </div>
  )
}
