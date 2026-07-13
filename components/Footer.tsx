import Link from 'next/link'
import Image from 'next/image'
import CookiePreferencesButton from './CookiePreferencesButton'

const CATEGORY_LINKS = [
  { label: 'Formula 1', href: '/formula-1' },
  { label: 'Formula 2', href: '/formula-2' },
  { label: 'Formula 3', href: '/formula-3' },
  { label: 'WEC', href: '/wec' },
  { label: 'WRC', href: '/wrc' },
  { label: 'Altro', href: '/altro' },
]

const INFO_LINKS = [
  { label: 'Chi siamo', href: '/chi-siamo' },
  { label: 'Contatti', href: '/contatti' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookie' },
  { label: 'Note Legali', href: '/note-legali' },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/lastcorner_net/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@lastcornernet' },
  { label: 'YouTube', href: 'https://www.youtube.com/@lastcornernet' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61575634843637' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 mt-8 bg-lc-header">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Image
            src="/images/logo.svg"
            alt="Lastcorner"
            width={40}
            height={40}
            className="h-10 w-auto object-contain mb-3"
          />
          <p className="font-akira font-extrabold text-[18px] text-white mb-3">
            LASTCORNER.NET
          </p>
          <p className="font-montserrat text-[12px] text-lc-subtle leading-relaxed">
            News, analisi e approfondimenti su Formula 1 e tutto il motorsport.
          </p>
        </div>

        {/* Categorie */}
        <div>
          <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-4">Categorie</p>
          <ul className="flex flex-col gap-2">
            {CATEGORY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-montserrat text-[12px] text-lc-subtle hover:text-lc-red transition-colors duration-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-4">Informazioni</p>
          <ul className="flex flex-col gap-2">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-montserrat text-[12px] text-lc-subtle hover:text-lc-red transition-colors duration-200">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesButton />
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-4">Seguici</p>
          <ul className="flex flex-col gap-2">
            {SOCIAL_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-montserrat text-[12px] text-lc-subtle hover:text-lc-red transition-colors duration-200">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-montserrat text-[11px] text-lc-subtle text-center sm:text-left">
            © {year} Lastcorner.net — Next Gen Motorsport Coverage
          </p>
          <p className="font-montserrat text-[10px] text-white/30 text-center sm:text-right">
            Dati F1 forniti da Jolpica API. Non affiliato con Formula 1® o FIA.
          </p>
        </div>
      </div>
    </footer>
  )
}
