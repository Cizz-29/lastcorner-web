'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import SearchBar from './SearchBar'

const NAV_LINKS = [
  { label: 'FORMULA 1', href: '/formula-1' },
  { label: 'FORMULA 2', href: '/formula-2' },
  { label: 'FORMULA 3', href: '/formula-3' },
  { label: 'WEC',       href: '/wec' },
  { label: 'WRC',       href: '/wrc' },
  { label: 'ALTRO',     href: '/altro' },
]

// Voci del sottomenu, uguali per ogni categoria, nell'ordine richiesto
const SUBMENU_ITEMS = [
  { label: 'News',        slug: '' },
  { label: 'Piloti',      slug: 'piloti' },
  { label: 'Team',        slug: 'team' },
  { label: 'Classifica',  slug: 'classifica' },
  { label: 'Calendario',  slug: 'calendario' },
]

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/lastcorner_net/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@lastcornernet',
    icon: (
      <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@lastcornernet',
    icon: (
      <svg width="26" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61575634843637',
    icon: (
      <svg width="10" height="20" viewBox="0 0 10 20" fill="currentColor" aria-hidden="true">
        <path d="M6.5 20V11H9.3l.4-3.3H6.5V5.7c0-1 .3-1.7 1.7-1.7H9.8V1.1C9.5 1.1 8.5 1 7.3 1 4.7 1 2.9 2.6 2.9 5.4v2.3H0V11h2.9v9h3.6z"/>
      </svg>
    ),
  },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Chiude il menu mobile con Esc e blocca lo scroll del body quando aperto
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-lc-header">
      {/* Striscia decorativa rossa in cima */}
      <div className="h-[3px] bg-lc-red w-full" />

      <div className="max-w-[1280px] mx-auto px-10 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-4 rounded">
            <Image
            src="/images/logo.svg"
            alt="Lastcorner"
            width={120}
            height={52}
            className="h-[52px] w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav desktop con dropdown al hover/focus */}
        <nav className="hidden lg:flex items-center gap-10" aria-label="Navigazione principale">
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="relative group">
              <Link
                href={link.href}
                className="font-akira font-bold text-[14px] text-white/84 hover:text-lc-red focus-visible:text-lc-red transition-colors duration-200 tracking-[-0.08px] whitespace-nowrap py-2 block"
              >
                {link.label}
              </Link>

              {/* Sottomenu: news, piloti, team, classifica, calendario */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-150 z-50"
              >
                <div className="bg-lc-header border border-white/10 rounded-xl shadow-xl py-2 min-w-[170px]">
                  {SUBMENU_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.slug ? `${link.href}/${item.slug}` : link.href}
                      className="block px-4 py-2 font-akira font-bold text-[11px] tracking-wide text-white/75 hover:text-lc-red hover:bg-white/5 transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Ricerca + Social icons */}
        <div className="hidden lg:flex items-center gap-5">
          <SearchBar variant="desktop" />
          <div className="w-px h-5 bg-white/15" />
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-white/80 hover:text-lc-red focus-visible:text-lc-red transition-colors duration-200"
            >
              {s.icon}
            </a>
          ))}
        </div>

        {/* Hamburger mobile */}
        <button
          className="lg:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <span className={`block w-6 h-[2px] bg-white transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-6 h-[2px] bg-white transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-[2px] bg-white transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`lg:hidden bg-lc-header border-t border-white/10 px-10 overflow-y-auto overflow-x-hidden transition-[max-height,padding] duration-300 ${
          mobileOpen ? 'max-h-[80vh] pb-6' : 'max-h-0 pb-0'
        }`}
      >
        <SearchBar variant="mobile" />

        <nav className="flex flex-col gap-1 pt-4" aria-label="Navigazione mobile">
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="mb-2">
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-akira font-bold text-[13px] text-white/84 hover:text-lc-red transition-colors duration-200 block py-1"
              >
                {link.label}
              </Link>
              <div className="flex flex-wrap gap-x-3 gap-y-1 pl-3 mt-1">
                {SUBMENU_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.slug ? `${link.href}/${item.slug}` : link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-akira font-bold text-[9px] tracking-wide text-white/50 hover:text-lc-red transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-5 mt-4">
          {SOCIAL_LINKS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              aria-label={s.label} className="text-white/70 hover:text-lc-red transition-colors duration-200">
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
