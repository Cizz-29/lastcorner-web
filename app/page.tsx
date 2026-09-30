import { Suspense } from 'react'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import NewsTicker from '@/components/NewsTicker'
import HeroSection from '@/components/HeroSection'
import LatestNewsSection from '@/components/LatestNewsSection'
import NextEventSection from '@/components/NextEventSection'
import AltreNewsSection from '@/components/AltreNewsSection'
import Footer from '@/components/Footer'
import AdSlot from '@/components/AdSlot'
import { NextEventSkeleton } from '@/components/Skeletons'
import { getAllArticles } from '@/lib/sanity/articles'
import { metadati } from '@/lib/seo'

// Come si divide l'elenco degli articoli fra le sezioni della home.
//
// Fino a settembre 2026 "Le ultime news" ripartiva dal primo articolo, e le
// sue prime cinque card erano le stesse cinque storie del blocco in evidenza
// appena sopra: su mobile circa 1.300 pixel ripetuti. Ora ogni sezione
// riprende da dove finisce la precedente.
const IN_EVIDENZA = 5 // l'articolo grande + i quattro della colonna accanto
const ULTIME_NEWS = 6 // quante card mostra la griglia "Le ultime news"
// La griglia ha anche il filtro "F1": le si passa qualche articolo in piu'
// perche' abbia di che riempire le sue sei card anche filtrando.
const RISERVA_FILTRO = 12

// La home e' l'unica pagina il cui canonical e' '/'. Prima stava nel layout ed
// era ereditato da tutto il sito (vedi il commento in app/layout.tsx).
//
// Titolo e description in italiano e con le parole che la gente cerca: prima
// erano "Lastcorner | Next Gen Motorsport Coverage", in inglese e senza
// "Formula 1".
export const metadata: Metadata = metadati({
  titolo: 'Lastcorner | Notizie di Formula 1, risultati e motorsport',
  titoloAssoluto: true,
  descrizione:
    'Notizie di Formula 1 ogni giorno: risultati, mercato piloti, analisi tecniche e approfondimenti, più Formula 2, Formula 3, F1 Academy e WRC.',
  percorso: '/',
})

// Pagina statica a tempo indeterminato: si aggiorna SOLO su richiesta,
// quando Sanity chiama /api/revalidate alla pubblicazione (quel gestore
// include sempre '/' fra i percorsi che rinfresca).
//
// Prima qui c'era revalidate = 60. Con una finestra di 60 secondi la home
// si rigenerava fino a 1.440 volte al giorno, e ogni rigenerazione scarica
// i metadati di tutti gli articoli per mostrarne poco piu' di venti: era la
// voce principale del consumo di CPU del piano. Il webhook fa lo stesso
// lavoro cinque volte al giorno, quando serve davvero.
export const revalidate = false

export default async function HomePage() {
  const allArticles = await getAllArticles()

  // Se Sanity non risponde, getAllArticles restituisce una lista vuota. Qui ci
  // si ferma di proposito, invece di proseguire con heroArticle undefined.
  //
  // E non si mostra nemmeno una home vuota, che sarebbe peggio: questa pagina
  // ha revalidate = false, quindi una versione senza articoli resterebbe
  // pubblicata fino al webhook successivo. Fallendo, il build si interrompe e
  // online resta l'ultima versione buona. Il motivo vero e' nella riga
  // [sanity] stampata subito sopra.
  if (allArticles.length === 0) {
    throw new Error(
      'Nessun articolo restituito da Sanity: la home non viene generata. ' +
        'Il motivo e\' nella riga di log "[sanity] elenco articoli non recuperato".'
    )
  }

  const heroArticle = allArticles[0]
  const sideArticles = allArticles.slice(1, IN_EVIDENZA)
  const latestNewsArticles = allArticles.slice(IN_EVIDENZA, IN_EVIDENZA + RISERVA_FILTRO)
  const altreNewsArticles = allArticles.slice(IN_EVIDENZA + ULTIME_NEWS)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        {/* Il titolo della pagina per Google e per chi usa un lettore di
            schermo. Visivamente la home si apre con le notizie, quindi resta
            nascosto: prima la home non aveva nessun H1. */}
        <h1 className="sr-only">Lastcorner: notizie di Formula 1 e motorsport</h1>

        {/* ── ULTIM'ORA ─────────────────────────────────────── */}
        <NewsTicker articles={allArticles} />

        {/* ── HERO ──────────────────────────────────────────── */}
        <HeroSection
          heroArticle={heroArticle}
          sideArticles={sideArticles}
        />

        {/* ── LE ULTIME NEWS ────────────────────────────────── */}
        <LatestNewsSection articles={latestNewsArticles} />

        {/* ── BANNER ORIZZONTALE ───────────────────────────── */}
        <AdSlot height={100} className="mb-12" />

        {/* ── PROSSIMO EVENTO F1 — in streaming, non blocca il resto della pagina ── */}
        <Suspense fallback={<NextEventSkeleton />}>
          <NextEventSection />
        </Suspense>

        {/* ── ALTRE NEWS — articoli non mostrati sopra ────────── */}
        <AltreNewsSection articles={altreNewsArticles} />

      </main>

      <Footer />
    </div>
  )
}
