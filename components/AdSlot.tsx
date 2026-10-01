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
// Il "Riquadro alto sidebar" (3768538358, ex 300×600) e' spento dal
// 1° ottobre 2026: in 30 giorni 1.002 impressioni, 0,03 € di RPM e un quarto
// soltanto visibile. Gli spazi da piu' di 400px non mostrano piu' nulla.
//
// Il riquadro medio resta, ma solo da desktop: su mobile la barra laterale
// finisce in fondo alla pagina, dove nessuno lo vedeva (visibilita' 29%) e
// costava comunque lavoro al telefono. Il banner orizzontale resta ovunque.
// Insieme all'annuncio ancorato degli annunci automatici, e' tutto.
const ALTEZZA_MASSIMA_MEDIO = 400

function slotForHeight(height: number): string {
  return height <= 150 ? SLOT_BANNER : SLOT_MEDIUM
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
  const contenitoreRef = useRef<HTMLDivElement>(null)
  const soloDesktop = height > 150

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
      // Contenitore nascosto (riquadro da sidebar su mobile): nessuna
      // richiesta ad AdSense. Un'unita' a larghezza zero darebbe solo errore.
      if ((contenitoreRef.current?.getBoundingClientRect().width ?? 0) === 0) return
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

  // Spazio riservato: pieno da desktop in su, al massimo 250px sotto.
  //
  // Riservare l'altezza evita che il testo salti quando l'annuncio arriva.
  // Ma su mobile la barra laterale finisce in fondo alla pagina, e un
  // riquadro "300x600" ci lasciava 250-300px vuoti ogni volta che AdSense lo
  // riempiva con un formato piu' basso. Sotto i 1024px gli annunci
  // responsive restano intorno ai 250px, e quello si riserva.
  if (height > ALTEZZA_MASSIMA_MEDIO) return null

  const stile = {
    '--altezza-mobile': `${Math.min(height, 250)}px`,
    '--altezza-desktop': `${height}px`,
  } as React.CSSProperties

  return (
    <div
      ref={contenitoreRef}
      className={`w-full overflow-hidden min-h-[var(--altezza-mobile)] lg:min-h-[var(--altezza-desktop)] ${soloDesktop ? 'hidden lg:block' : ''} ${className}`}
      style={stile}
    >
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
