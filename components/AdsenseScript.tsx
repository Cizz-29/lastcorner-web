'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

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

// Perche' qui NON si aspetta il banner cookie del sito.
//
// Il consenso pubblicitario per Europa, Regno Unito e Svizzera lo raccoglie
// il messaggio "Normative europee" di AdSense, che e' una CMP certificata da
// Google e integrata con lo IAB TCF (CMP ID 300): e' quella che i server di
// Google leggono davvero quando decidono se e come pubblicare. Quel
// messaggio pero' viaggia dentro adsbygoogle.js — se lo script non si
// carica, non compare, e non compare nemmeno la richiesta di consenso.
//
// Prima questo file caricava lo script solo dopo un "Accetta tutti" sul
// banner di casa. Due conseguenze, entrambe misurate: chi rifiutava o
// scorreva via non generava nessuna impressione, e chi accettava si
// ritrovava subito un secondo banner, quello di Google. Nel mese fra il 22
// agosto e il 20 settembre 2026 il messaggio certificato risultava mostrato
// 145 volte a fronte di quasi 5.000 impressioni: lo vedeva solo chi era
// sopravvissuto al primo banner.
//
// Ora lo script parte subito ed e' Google a chiedere il consenso, una volta
// sola e nel modo che conta. Lo script di per se' non installa cookie
// pubblicitari finche' il consenso non c'e': e' esattamente il flusso per
// cui la CMP certificata e' progettata.
//
// Gli embed di X e Instagram restano invece legati al consenso "marketing"
// del banner di casa: quelli sono script di terze parti che il sito carica
// di propria iniziativa, e li' il banner e' l'unico posto dove chiederlo.
//
// Aree interne dove gli annunci non hanno senso e anzi danno fastidio:
// il CMS (dove si scrive), la telemetria e l'editor grafiche, riservati
// allo staff. Gli annunci automatici di Google comparirebbero ovunque lo
// script sia caricato, quindi li' non lo si carica proprio.
const PERCORSI_SENZA_ANNUNCI = ['/studio', '/telemetria', '/grafiche']

export default function AdsenseScript() {
  const pathname = usePathname()
  const areaInterna = PERCORSI_SENZA_ANNUNCI.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    if (areaInterna) return
    injectScript()
  }, [areaInterna])

  return null
}
