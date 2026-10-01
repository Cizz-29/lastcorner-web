import Link from 'next/link'
import { jsonLd } from '@/lib/jsonLd'
import { bricioleLd, grafo, type Briciola } from '@/lib/datiStrutturati'

// Le briciole in cima alla pagina (Home / Sezione / Pagina) e, insieme, lo
// stesso percorso in BreadcrumbList per Google. Stanno nello stesso
// componente perche' devono dire la stessa cosa: due copie scritte a mano
// prima o poi divergono.
//
// L'ultima voce e' la pagina corrente: si mostra ma non e' un link.
export default function Briciole({ voci, className = 'mb-6' }: { voci: Briciola[]; className?: string }) {
  const tutte: Briciola[] = [{ nome: 'Home', percorso: '/' }, ...voci]
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(grafo(bricioleLd(tutte))) }}
      />
      <nav
        aria-label="Percorso"
        className={`font-montserrat text-[11px] text-lc-subtle flex items-center gap-2 flex-wrap ${className}`}
      >
        {tutte.map((v, i) => {
          const ultima = i === tutte.length - 1
          return (
            <span key={v.percorso} className="flex items-center gap-2">
              {i > 0 && <span className="opacity-50">/</span>}
              {ultima ? (
                <span className="text-white/60" aria-current="page">
                  {v.nome}
                </span>
              ) : (
                <Link href={v.percorso} className="hover:text-lc-red transition-colors duration-200">
                  {v.nome}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    </>
  )
}
