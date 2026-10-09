/** Da telefono le etichette dell'asse Y stanno dentro il grafico, in alto a
 *  sinistra di ogni linea della griglia: la colonna a parte toglieva quasi un
 *  sesto della larghezza. Solo CSS (sm:hidden), nessun calcolo in piu'. */
export function EtichetteYInterne({ valori }: { valori: { testo: string; y: number }[] }) {
  return (
    <div className="sm:hidden pointer-events-none absolute inset-0 z-10" aria-hidden>
      {valori.map((v, i) => (
        <span
          key={i}
          className="absolute left-1.5 font-montserrat text-[9px] font-semibold text-white/55 leading-none tabular-nums"
          style={{
            top: v.y,
            // Sopra la sua linea; la prima in alto, se non ci sta, sotto.
            transform: v.y < 12 ? 'translateY(2px)' : 'translateY(calc(-100% - 2px))',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          }}
        >
          {v.testo}
        </span>
      ))}
    </div>
  )
}
