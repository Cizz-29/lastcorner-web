'use client'

import { useEffect } from 'react'
import { hasConsent, CONSENT_CHANGED_EVENT } from '@/lib/cookieConsent'

// ID publisher AdSense di Francesco. Questo componente carica lo script
// base adsbygoogle.js; i singoli annunci (components/AdSlot.tsx) usano le
// unità responsive create nel pannello AdSense.
//
// Lo script viene inserito a mano nel DOM invece che con <Script> di
// Next.js: quel componente aggiunge l'attributo data-nscript, che AdSense
// non riconosce ("AdSense head tag doesn't support data-nscript
// attribute") e che impedisce alle unità inserite manualmente di essere
// processate. Con un tag pulito il comportamento torna quello previsto.
const ADSENSE_CLIENT_ID = 'ca-pub-5913363906862738'
const SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`

function injectScript() {
  if (document.querySelector(`script[src="${SRC}"]`)) return
  const el = document.createElement('script')
  el.async = true
  el.src = SRC
  el.crossOrigin = 'anonymous'
  document.head.appendChild(el)
}

// Si carica solo con il consenso marketing, coerentemente con il banner
// cookie. Resta in ascolto di CONSENT_CHANGED_EVENT per attivarsi anche se
// il consenso arriva dopo il primo render, senza ricaricare la pagina.
export default function AdsenseScript() {
  useEffect(() => {
    if (hasConsent('marketing')) injectScript()

    const onChange = () => {
      if (hasConsent('marketing')) injectScript()
    }
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange)
  }, [])

  return null
}
