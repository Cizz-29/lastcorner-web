'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { hasConsent, CONSENT_CHANGED_EVENT } from '@/lib/cookieConsent'

// ID publisher AdSense di Francesco (pub-5913363906862738). Questo script
// base carica adsbygoogle.js; i singoli annunci (vedi components/AdSlot.tsx)
// usano le 3 unità responsive create nel pannello AdSense.
const ADSENSE_CLIENT_ID = 'ca-pub-5913363906862738'

// Si carica solo se l'utente ha dato consenso marketing (coerente con
// l'infrastruttura cookie già presente). Ascolta CONSENT_CHANGED_EVENT
// per attivarsi anche se il consenso arriva dopo il primo render, senza
// bisogno di ricaricare la pagina.
export default function AdsenseScript() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(hasConsent('marketing'))
    const onChange = () => setAllowed(hasConsent('marketing'))
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange)
  }, [])

  if (!allowed) return null

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
