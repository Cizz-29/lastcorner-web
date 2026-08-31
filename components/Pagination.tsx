import Link from 'next/link'
import { percorsoPagina } from '@/lib/paginazione'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

const MAX_VISIBLE_PAGES = 9

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// Mostra sempre e solo le prime 9 pagine (1,2,3...9) — sono le più recenti,
// quelle a cui conta arrivare in un clic. Le frecce ‹ › restano comunque
// utilizzabili per scorrere oltre, se serve andare più indietro nel tempo.
function getPaginationItems(totalPages: number): number[] {
  return range(1, Math.min(totalPages, MAX_VISIBLE_PAGES))
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const items = getPaginationItems(totalPages)
  const pillBase = 'font-akira text-[11px] flex items-center justify-center rounded-full border transition-colors duration-200'

  const precedente = Math.max(1, currentPage - 1)
  const successiva = Math.min(totalPages, currentPage + 1)

  return (
    <nav aria-label="Paginazione" className="flex flex-wrap items-center justify-center gap-2 mt-10">
      <Link
        href={percorsoPagina(basePath, precedente)}
        aria-label="Pagina precedente"
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
        className={`${pillBase} w-9 h-9 ${
          currentPage === 1
            ? 'border-white/10 text-white/25 pointer-events-none'
            : 'border-white/15 text-white hover:border-lc-red hover:text-lc-red'
        }`}
      >
        ‹
      </Link>

      {items.map((item) => (
        <Link
          key={item}
          href={percorsoPagina(basePath, item)}
          aria-current={item === currentPage ? 'page' : undefined}
          className={`${pillBase} w-9 h-9 ${
            item === currentPage
              ? 'bg-lc-red border-lc-red text-white'
              : 'border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
          }`}
        >
          {item}
        </Link>
      ))}

      <Link
        href={percorsoPagina(basePath, successiva)}
        aria-label="Pagina successiva"
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
        className={`${pillBase} w-9 h-9 ${
          currentPage === totalPages
            ? 'border-white/10 text-white/25 pointer-events-none'
            : 'border-white/15 text-white hover:border-lc-red hover:text-lc-red'
        }`}
      >
        ›
      </Link>
    </nav>
  )
}
