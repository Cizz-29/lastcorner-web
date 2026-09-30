'use client'

import { useState } from 'react'

// Pulsanti di condivisione dell'articolo.
//
// Fino a settembre 2026 negli articoli non ce n'erano: per mandare un pezzo
// a un amico bisognava copiare l'indirizzo dalla barra del browser, che sul
// telefono e' nascosta. WhatsApp e Telegram vengono per primi perche' e' li'
// che si condivide la F1 in Italia; X e Facebook seguono.
//
// Sono link normali, non script dei social: nessun cookie, nessun peso sulla
// pagina, niente da chiedere nel banner del consenso. L'unica parte che
// richiede JavaScript e' "Copia link", ed e' per questo che il componente
// gira nel browser.

interface Props {
  titolo: string
  url: string
  /** "compatto" sotto il titolo, "esteso" in fondo all'articolo con l'invito. */
  variante?: 'compatto' | 'esteso'
}

const base =
  'inline-flex items-center justify-center gap-2 h-10 min-w-[40px] px-3 rounded-full border border-white/15 text-white/90 font-montserrat text-[13px] font-semibold hover:border-lc-red hover:text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-lc-red focus-visible:outline-offset-2'

function Icona({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d={d} />
    </svg>
  )
}

const ICONE = {
  whatsapp:
    'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z',
  telegram:
    'M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.6 13.2l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3Z',
  x: 'M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.2-8.2L1.9 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z',
  facebook:
    'M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z',
  link: 'M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0ZM8.5 20a4.5 4.5 0 0 1-3.2-7.7l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a2.5 2.5 0 0 0 3.5 3.5l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1A4.5 4.5 0 0 1 8.5 20Zm7.4-6.8a1 1 0 0 1-.7-1.7l2.1-2.1a2.5 2.5 0 0 0-3.5-3.5L11.7 8a1 1 0 1 1-1.4-1.4l2.1-2.1a4.5 4.5 0 1 1 6.4 6.4l-2.1 2.1a1 1 0 0 1-.8.2Z',
}

export default function CondividiArticolo({ titolo, url, variante = 'compatto' }: Props) {
  const [copiato, setCopiato] = useState(false)
  const t = encodeURIComponent(titolo)
  const u = encodeURIComponent(url)

  const link = [
    { nome: 'WhatsApp', icona: ICONE.whatsapp, href: `https://wa.me/?text=${t}%20${u}` },
    { nome: 'Telegram', icona: ICONE.telegram, href: `https://t.me/share/url?url=${u}&text=${t}` },
    { nome: 'X', icona: ICONE.x, href: `https://x.com/intent/post?text=${t}&url=${u}&via=Lastcorner_F1` },
    { nome: 'Facebook', icona: ICONE.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ]

  async function copia() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch {
      // Appunti non disponibili (browser vecchio o permesso negato): non si
      // fa nulla, gli altri pulsanti restano utilizzabili.
    }
  }

  return (
    <div className={variante === 'esteso' ? 'flex flex-col gap-3' : ''}>
      {variante === 'esteso' && (
        <p className="font-akira font-bold text-[12px] text-white tracking-wide">
          TI È PIACIUTO? <span className="text-lc-red">CONDIVIDILO</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {link.map((l, i) => (
          <a
            key={l.nome}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Condividi su ${l.nome}`}
            className={base}
          >
            <Icona d={l.icona} />
            {/* Su mobile il nome solo per WhatsApp, il piu' usato: gli altri
                bastano l'icona, e la riga resta su una linea. */}
            {/* X ha gia' la lettera nell'icona: il nome sarebbe un doppione. */}
            {l.nome !== 'X' && (
              <span className={i === 0 || variante === 'esteso' ? '' : 'hidden sm:inline'}>{l.nome}</span>
            )}
          </a>
        ))}
        <button type="button" onClick={copia} className={base} aria-label="Copia il link dell'articolo">
          <Icona d={ICONE.link} />
          <span className="hidden sm:inline" aria-live="polite">
            {copiato ? 'Copiato' : 'Copia link'}
          </span>
          <span className="sm:hidden" aria-live="polite">
            {copiato ? 'Copiato' : ''}
          </span>
        </button>
      </div>
    </div>
  )
}
