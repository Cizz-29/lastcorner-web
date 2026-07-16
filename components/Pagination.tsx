import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

// Paginazione semplice via query string (?page=n) — nessun JS lato client,
// coerente con il resto delle pagine categoria che sono Server Component.
export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
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

      {pages.map((p) => (
        <Link
          key={p}
          href={p === 1 ? basePath : `${basePath}?page=${p}`}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`${pillBase} w-9 h-9 ${
            p === currentPage
              ? 'bg-lc-red border-lc-red text-white'
              : 'border-white/15 text-lc-subtle hover:border-lc-red/50 hover:text-white'
          }`}
        >
          {p}
        </Link>
      ))}

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
