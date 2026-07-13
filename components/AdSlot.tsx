interface AdSlotProps {
  /** Altezza in px dello slot */
  height: number
  /** Etichetta dimensione mostrata sotto "Spazio pubblicitario" (es. "300×250") */
  label?: string
  className?: string
}

// Placeholder generico per gli spazi pubblicitari (Google AdSense).
// Centralizza lo stile così tutti gli slot del sito restano coerenti
// e la sostituzione con i tag reali richiederà una sola modifica.
export default function AdSlot({ height, label, className = '' }: AdSlotProps) {
  return (
    <div
      className={`w-full bg-lc-card rounded-card border border-white/10 flex items-center justify-center ${className}`}
      style={{ height }}
    >
      <span className="font-montserrat text-[11px] text-lc-subtle text-center px-4">
        Spazio pubblicitario
        {label && <><br />{label}</>}
      </span>
    </div>
  )
}
