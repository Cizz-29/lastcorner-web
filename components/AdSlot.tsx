'use client'

import { useEffect, useRef } from 'react'

// Stesso publisher ID di components/AdsenseScript.tsx (che carica lo script
// base adsbygoogle.js). Le 3 unità sotto sono tutte "Responsive" create nel
// pannello AdSense di Francesco — la scelta tra le tre avviene in base
// all'altezza richiesta dal chiamante (vedi slotForHeight), così i ~30
// punti del sito che usano <AdSlot height={...} /> non vanno toccati uno
// per uno.
const ADSENSE_CLIENT_ID = 'ca-pub-5913363906862738'
const SLOT_BANNER = '9549799917' // Banner orizzontale (home, cima articoli, bio pilota/team)
const SLOT_MEDIUM = '7198968745' // Riquadro medio sidebar (ex placeholder "300×250")
const SLOT_LARGE = '3768538358' // Riquadro alto sidebar (ex placeholder "300×600")

function slotForHeight(height: number): string {
  if (height <= 150) return SLOT_BANNER
  if (height <= 400) return SLOT_MEDIUM
  return SLOT_LARGE
}

interface AdSlotProps {
  /** Altezza in px dello spazio riservato (usata anche per scegliere l'unità AdSense giusta) */
  height: number
  /** Non più usata: restava dal periodo in cui qui compariva un segnaposto. */
  label?: string
  className?: string
}

// Il consenso non si controlla più qui.
//
// Prima questo componente mostrava un riquadro grigio "Spazio pubblicitario"
// finché il banner di casa non riceveva un "Accetta tutti", e solo dopo
// inseriva l'annuncio. Ma il consenso che conta per la pubblicità lo
// raccoglie la CMP certificata di Google, dentro adsbygoogle.js: vedi la
// nota lunga in AdsenseScript.tsx. Tenere un secondo cancello qui
// significava solo azzerare le impressioni di chiunque non avesse risposto
// al primo banner.
export default function AdSlot({ height, className = '' }: AdSlotProps) {
  const pushedRef = useRef(false)

  // Registra l'annuncio presso adsbygoogle una sola volta. Il push in coda è
  // sicuro anche se lo script base non ha ancora finito di caricarsi: è lui
  // a processarla appena pronto.
  //
  // L'attesa di un frame serve a garantire che il contenitore sia già stato
  // disposto: le unità responsive calcolano il formato dalla larghezza
  // disponibile, e se al momento del push valesse ancora zero l'annuncio
  // non verrebbe riempito.
  useEffect(() => {
    if (pushedRef.current) return
    const id = requestAnimationFrame(() => {
      if (pushedRef.current) return
      try {
        ;(window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []
        ;(window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({})
        pushedRef.current = true
      } catch {
        // Se fallisce (raro), lo spazio resta vuoto e non succede altro.
      }
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ minHeight: height }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotForHeight(height)}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
