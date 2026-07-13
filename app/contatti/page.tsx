import type { Metadata } from 'next'
import StaticPageLayout, { LegalSection } from '@/components/StaticPageLayout'

export const metadata: Metadata = {
  title: 'Contatti',
  description: 'Come contattare la redazione di Lastcorner.net.',
}

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/lastcorner_net/' },
  { label: 'X (Twitter)', href: 'https://x.com/Lastcorner_F1' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@lastcornernet' },
  { label: 'YouTube', href: 'https://www.youtube.com/@lastcornernet' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61575634843637' },
]

export default function ContattiPage() {
  return (
    <StaticPageLayout title="Contatti">
      <p className="font-montserrat text-[15px] text-white/90 leading-relaxed">
        Per segnalazioni, collaborazioni o qualsiasi altra richiesta puoi scriverci
        all&rsquo;indirizzo email{' '}
        <a href="mailto:info@lastcorner.net" className="text-white hover:text-lc-red transition-colors duration-200">
          info@lastcorner.net
        </a>
        , oppure trovarci sui nostri canali social.
      </p>

      <LegalSection title="Seguici sui social">
        <ul className="flex flex-col gap-2">
          {SOCIAL_LINKS.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-lc-red transition-colors duration-200"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </LegalSection>
    </StaticPageLayout>
  )
}
