import type { ParteCredito } from '@/lib/fontiImmagini'

// Credito di una foto (campo "Fonte e permesso"), con i link che alcune
// licenze chiedono: per Wikimedia Commons la pagina della licenza e quella
// del file. I link sono `nofollow`: sono attribuzioni, non segnalazioni.
export default function CreditoFoto({ parti }: { parti: ParteCredito[] }) {
  return (
    <>
      {parti.map((p, i) =>
        p.href ? (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-lc-red"
          >
            {p.testo}
          </a>
        ) : (
          <span key={i}>{p.testo}</span>
        )
      )}
    </>
  )
}
