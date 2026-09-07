import type { Metadata } from 'next'
import GeneratoreGrafiche from '@/components/grafiche/GeneratoreGrafiche'

// Generatore delle grafiche per i social: strumento di redazione, non una
// pagina per i lettori.
//
// Sta online, al contrario della telemetria, per la ragione per cui esiste:
// serve quando il computer non c'e', per pubblicare una notizia dal telefono
// senza aprire Photoshop. In locale girerebbe sul PC, cioe' proprio nel caso
// in cui non serve. Non costa niente al sito: e' tutto codice di browser
// (canvas), la foto non viene caricata da nessuna parte e l'unico peso e' il
// template da 1,4 MB, scaricato solo da chi apre la pagina.
//
// La password sta nel middleware (variabile GRAFICHE_PASSWORD).

export const metadata: Metadata = {
  title: 'Grafiche',
  robots: { index: false, follow: false },
}

export default function GrafichePage() {
  return <GeneratoreGrafiche />
}
