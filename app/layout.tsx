import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

const SITE_URL = 'https://lastcorner.net'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lastcorner | Il motorsport a 360°',
    template: '%s | Lastcorner',
  },
  description: 'News, analisi e approfondimenti su Formula 1, Formula 2, Formula 3, WEC, WRC e tutto il motorsport.',
  keywords: ['Formula 1', 'F1', 'motorsport', 'WEC', 'WRC', 'Formula 2', 'Formula 3'],
  authors: [{ name: 'Lastcorner' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lastcorner | Il motorsport a 360°',
    description: 'News, analisi e approfondimenti su Formula 1, Formula 2, Formula 3, WEC, WRC e tutto il motorsport.',
    url: SITE_URL,
    siteName: 'Lastcorner',
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lastcorner',
    description: 'Il motorsport a 360°',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#131318',
  width: 'device-width',
  initialScale: 1,
}

// Dati strutturati JSON-LD — aiutano Google a capire che si tratta di
// una testata editoriale (Organization + WebSite con SearchAction).
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Lastcorner',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.svg`,
      sameAs: [
        'https://www.instagram.com/lastcorner_net/',
        'https://www.tiktok.com/@lastcornernet',
        'https://www.youtube.com/@lastcornernet',
        'https://www.facebook.com/profile.php?id=61575634843637',
      ],
    },
    {
      '@type': 'WebSite',
      name: 'Lastcorner',
      url: SITE_URL,
      inLanguage: 'it-IT',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={montserrat.variable}>
      <body>
        {/* Skip link per navigazione da tastiera / screen reader */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-lc-red focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-montserrat focus:text-[13px]"
        >
          Vai al contenuto principale
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
