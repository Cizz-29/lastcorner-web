import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CATEGORIES } from '@/lib/categories'

// Pagina mostrata per ogni indirizzo che non esiste, e da ogni notFound()
// del sito (articolo cancellato, pilota uscito da un roster, pagina di
// elenco oltre l'ultima).
//
// Una regola sola, ed e' la ragione per cui qui non si interroga Sanity:
// i 404 li generano soprattutto i bot, a ripetizione e su indirizzi
// inventati. Mettere qui "gli ultimi articoli" significherebbe pagare una
// query per ogni tentativo di scansione — la pagina piu' inutile del sito
// diventerebbe la piu' cara. I collegamenti qui sotto arrivano tutti da
// lib/categories.ts, che e' codice: questa pagina e' statica e non costa
// nulla per quante volte la si colpisca.
//
// Next restituisce da solo lo stato HTTP 404, che e' cio' che conta per
// Google: una pagina d'errore che risponde "200 va tutto bene" e' il
// classico soft 404 e finisce per essere indicizzata.

// Il robots qui non e' ridondante: il layout del sito dichiara
// "index: true" per tutte le pagine, e senza questo override il 404 si
// porterebbe dietro proprio quello. Con "follow: true" i motori continuano
// comunque a seguire i collegamenti alle categorie qui sotto.
export const metadata: Metadata = {
  title: 'Pagina non trovata',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      <main className="max-w-[760px] w-full mx-auto px-4 sm:px-8 lg:px-4 pt-[96px] pb-24 flex-1">
        <p className="font-akira font-extrabold text-[72px] lg:text-[110px] leading-none text-lc-red/20 select-none">
          404
        </p>

        <div className="flex items-center gap-3 -mt-4 mb-4">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            Sei finito fuori pista
          </h1>
        </div>

        <p className="font-montserrat text-[15px] text-white/90 leading-relaxed">
          Il link che hai seguito non corrisponde a nessuna pagina del sito.
          Può capitare con un indirizzo vecchio, un link copiato a metà o un
          refuso.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href="/"
            className="bg-lc-red text-white font-akira text-[11px] uppercase tracking-widest px-5 py-3 rounded-card-sm hover:opacity-90 transition-opacity"
          >
            Torna alla home
          </Link>
          <Link
            href="/cerca"
            className="border border-white/15 text-white font-akira text-[11px] uppercase tracking-widest px-5 py-3 rounded-card-sm hover:border-white/40 transition-colors"
          >
            Cerca un articolo
          </Link>
        </div>

        <section className="mt-12 pt-8 border-t border-white/10">
          <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
            Oppure riparti da qui
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="font-montserrat text-[13px] text-white/80 bg-lc-card border border-white/10 rounded-card-sm px-4 py-2 hover:border-lc-red hover:text-white transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
