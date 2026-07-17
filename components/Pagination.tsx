import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

const DOTS = '…'
const SIBLING_COUNT = 2 // pagine vicine a quella corrente mostrate su ogni lato
const MAX_SLOTS = SIBLING_COUNT * 2 + 5 // prima + puntini + (siblings*2+1) + puntini + ultima

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// Limita i numeri di pagina mostrati a un massimo di 9 "caselle" (numeri +
// eventuali puntini "…") invece di elencare sempre tutte le pagine — con
// categorie come F1 che superano le 20 pagine la lista intera non ci stava
// in una riga e sforava la larghezza della pagina.
function getPaginationItems(currentPage: number, totalPages: number): (number | typeof DOTS)[] {
  if (totalPages <= MAX_SLOTS) return range(1, totalPages)

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1)
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 2

  if (!showLeftDots && showRightDots) {
    const leftRange = range(1, 3 + 2 * SIBLING_COUNT)
    return [...leftRange, DOTS, totalPages]
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = range(totalPages - (3 + 2 * SIBLING_COUNT) + 1, totalPages)
    return [1, DOTS, ...rightRange]
  }

  return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, totalPages]
}

// Paginazione semplice via query string (?page=n) — nessun JS lato client,
// coerente con il resto delle pagine categoria che sono Server Component.
export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const items = getPaginationItems(currentPage, totalPages)
  const pillBase = 'font-akira text-[11px] flex items-center justify-center rounded-full border transition-colors duration-200'

  return (
    <nav aria-label="Paginazione" className="flex flex-wrap items-center justify-center gap-2 mt-10">
      <Link
        href={`${basePath}${currentPage > 1 ? `?page=${currentPage - 1}` : ''}`}
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

      {items.map((item, i) =>
        item === DOTS ? (
          <span
            key={`dots-${i}`}
            className="font-akira text-[11px] text-lc-subtle w-9 h-9 flex items-center justify-center select-none"
          >
            {DOTS}
          </span>
        ) : (
          <Link
            key={item}
            href={item === 1 ? basePath : `${basePath}?page=${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`${pillBase} w-9 h-9 ${
              item === currentPage
                ? 'bg-lc-red border-lc-red text-white'
                : 'border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
            }`}
          >
            {item}
          </Link>
        )
      )}

      <Link
        href={`${basePath}?page=${currentPage < totalPages ? currentPage + 1 : totalPages}`}
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
