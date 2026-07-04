import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lastcorner | Il motorsport a 360°',
  description: 'News, analisi e approfondimenti su Formula 1, Formula 2, Formula 3, WEC, WRC e tutto il motorsport.',
  keywords: ['Formula 1', 'F1', 'motorsport', 'WEC', 'WRC', 'Formula 2', 'Formula 3'],
  openGraph: {
    title: 'Lastcorner | Il motorsport a 360°',
    description: 'News, analisi e approfondimenti su Formula 1, Formula 2, Formula 3, WEC, WRC e tutto il motorsport.',
    url: 'https://lastcorner.net',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  )
}
