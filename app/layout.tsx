import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import CookieConsent from '@/components/CookieConsent'
import AdsenseScript from '@/components/AdsenseScript'
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
    default: 'Lastcorner | Next Gen Motorsport Coverage',
    template: '%s | Lastcorner',
  },
  description: 'Next Gen Motorsport Coverage — news, analisi e approfondimenti su Formula 1, Formula 2, Formula 3, F1 Academy, WRC e tutto il motorsport.',
  keywords: ['Formula 1', 'F1', 'motorsport', 'WEC', 'WRC', 'Formula 2', 'Formula 3'],
  authors: [{ name: 'Lastcorner' }],
  // NIENTE "alternates.canonical" qui.
  //
  // In Next.js i metadati del layout vengono ereditati da OGNI pagina che non
  // li sovrascrive. Un canonical fisso su '/' significava che ogni articolo,
  // ogni categoria e ogni scheda pilota dichiaravano a Google "la versione
  // ufficiale di questa pagina e' la home": un invito esplicito a non
  // indicizzarle. Il canonical va messo pagina per pagina (vedi app/page.tsx
  // per la home e generateMetadata nelle pagine dinamiche). Dove manca, Google
  // usa l'URL stesso, che e' il comportamento corretto.
  openGraph: {
    title: 'Lastcorner | Next Gen Motorsport Coverage',
    description: 'Next Gen Motorsport Coverage — news, analisi e approfondimenti su Formula 1, Formula 2, Formula 3, F1 Academy, WRC e tutto il motorsport.',
    url: SITE_URL,
    siteName: 'Lastcorner',
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lastcorner',
    description: 'Next Gen Motorsport Coverage',
  },
  robots: {
    index: true,
    follow: true,
    // Senza "max-image-preview: large" Google non puo' usare l'anteprima
    // grande, e senza anteprima grande non si entra in Discover: il feed e'
    // fatto di immagini a tutta larghezza. Vale anche per la ricerca, dove
    // il risultato con immagine grande attira piu' clic.
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
        <CookieConsent />
        <AdsenseScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Vercel Web Analytics + Speed Insights: nessun cookie, nessun
            banner di consenso necessario (dati aggregati, non tracciano
            il singolo utente). Servono per capire quante visite arrivano
            una volta online sui domini veri. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
