import Image from 'next/image'
import BioBody from '@/components/BioBody'
import { urlFor } from '@/lib/sanity/image'
import type { SchedaAutore } from '@/lib/sanity/authors'

// Icone delle piattaforme. Stesse forme usate in SocialCard, cosi' la pagina
// autore non introduce un secondo stile di icone accanto a quello del sito.
const ICONE: Record<string, { etichetta: string; path: string }> = {
  email: {
    etichetta: 'Email',
    path: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.24l-8 4.99-8-4.99V6l8 4.99L20 6v2.24z',
  },
  instagram: {
    etichetta: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  x: {
    etichetta: 'X',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  facebook: {
    etichetta: 'Facebook',
    path: 'M15.5 21v-8h2.7l.4-3.3h-3.1V7.7c0-1 .3-1.7 1.7-1.7h1.6V3.1c-.3 0-1.3-.1-2.5-.1-2.6 0-4.4 1.6-4.4 4.4v2.3H9v3.3h2.9v8h3.6z',
  },
  tiktok: {
    etichetta: 'TikTok',
    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z',
  },
  youtube: {
    etichetta: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  linkedin: {
    etichetta: 'LinkedIn',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  sito: {
    etichetta: 'Sito web',
    path: 'M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14A7.94 7.94 0 014 12c0-.69.1-1.36.26-2h3.38a16.6 16.6 0 000 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 015.07 16zm2.95-8H5.07a7.99 7.99 0 014.33-3.56A15.65 15.65 0 008.02 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.9 14.9 0 010-4h4.68a14.9 14.9 0 010 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a7.99 7.99 0 01-4.33 3.56zM16.36 14a16.6 16.6 0 000-4h3.38c.16.64.26 1.31.26 2 0 .69-.1 1.36-.26 2h-3.38z',
  },
}

// Scheda autore in cima a /autori/{slug}. Se su Sanity non esiste ancora una
// bio per questo autore il componente non mostra nulla: la pagina resta quella
// di prima, con il solo elenco degli articoli.
export default function AuthorHeader({ scheda }: { scheda: SchedaAutore | null }) {
  if (!scheda) return null

  const haFoto = Boolean(scheda.foto?.asset?._ref)
  const social = scheda.social ?? []
  const haContatti = social.length > 0 || Boolean(scheda.email)
  const haTesto = Boolean(scheda.bio && scheda.bio.length > 0)
  if (!haFoto && !haTesto && !haContatti && !scheda.ruolo) return null

  return (
    <section className="bg-lc-card rounded-card border border-white/10 p-5 lg:p-6 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        {haFoto && (
          <Image
            src={urlFor(scheda.foto).width(320).height(320).fit('crop').url()}
            alt={scheda.foto?.alt || scheda.nome}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover shrink-0 border-2 border-lc-red/40"
          />
        )}

        <div className="min-w-0 flex-1">
          {scheda.ruolo && (
            <p className="font-akira text-[11px] uppercase tracking-wide text-lc-red mb-2">
              {scheda.ruolo}
            </p>
          )}

          {haTesto && <BioBody blocks={scheda.bio} />}

          {haContatti && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
              {social.map((p) => {
                const icona = ICONE[p.piattaforma]
                if (!icona) return null
                return (
                  <a
                    key={`${p.piattaforma}-${p.url}`}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={`${scheda.nome} su ${icona.etichetta}`}
                    title={icona.etichetta}
                    className="w-10 h-10 rounded-full bg-lc-red/15 flex items-center justify-center text-lc-red shrink-0 transition-colors duration-200 hover:bg-lc-red hover:text-white focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={icona.path} />
                    </svg>
                  </a>
                )
              })}

              {scheda.email && (
                <a
                  href={`mailto:${scheda.email}`}
                  aria-label={`Scrivi a ${scheda.nome}`}
                  title={scheda.email}
                  className="w-10 h-10 rounded-full bg-lc-red/15 flex items-center justify-center text-lc-red shrink-0 transition-colors duration-200 hover:bg-lc-red hover:text-white focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={ICONE.email.path} />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
