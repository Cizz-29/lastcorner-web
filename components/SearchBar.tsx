'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// Barra di ricerca: su desktop è un'icona che si espande in un campo di
// testo, su mobile è un campo sempre visibile dentro il menu. In
// entrambi i casi porta alla pagina risultati /cerca?q=...
export default function SearchBar({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const router = useRouter()
  const [open, setOpen] = useState(variant === 'mobile')
  const [query, setQuery] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    router.push(`/cerca?q=${encodeURIComponent(term)}`)
  }

  if (variant === 'mobile') {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-2 mt-4">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca articoli..."
          aria-label="Cerca articoli"
          className="bg-transparent flex-1 text-[12px] text-white placeholder:text-white/40 font-montserrat focus:outline-none"
        />
      </form>
    )
  }

  return (
    <div className="flex items-center">
      {open ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-3 pr-1 py-1">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => { if (!query) setOpen(false) }}
            placeholder="Cerca..."
            aria-label="Cerca articoli"
            className="bg-transparent w-28 lg:w-36 text-[12px] text-white placeholder:text-white/40 font-montserrat focus:outline-none"
          />
          <button type="submit" aria-label="Cerca" className="text-white/70 hover:text-lc-red transition-colors duration-200 p-1">
            <SearchIcon />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri ricerca"
          className="text-white/80 hover:text-lc-red transition-colors duration-200"
        >
          <SearchIcon />
        </button>
      )}
    </div>
  )
}
