import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GeneratoreGrafiche from '@/components/grafiche/GeneratoreGrafiche'
import { STRUMENTI_LOCALI } from '@/lib/strumenti'

// Generatore delle grafiche per i social: strumento di redazione, non una
// pagina per i lettori. Gira solo in locale (vedi lib/strumenti.ts).

export const metadata: Metadata = {
  title: 'Grafiche',
  robots: { index: false, follow: false },
}

export default function GrafichePage() {
  if (!STRUMENTI_LOCALI) notFound()
  return <GeneratoreGrafiche />
}
