import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface StaticPageLayoutProps {
  title: string
  updatedAt?: string
  children: ReactNode
}

// Layout condiviso per le pagine di solo testo (Chi siamo, Privacy, Cookie,
// Note legali, Contatti): colonna singola stretta per la leggibilità, senza
// gli slot pubblicitari usati altrove sul sito.
export default function StaticPageLayout({ title, updatedAt, children }: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[760px] w-full mx-auto px-4 sm:px-8 lg:px-4 pt-[96px] pb-24 flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            {title}
          </h1>
        </div>
        {updatedAt && (
          <p className="font-montserrat text-[11px] text-lc-subtle mb-10">
            Ultimo aggiornamento: {updatedAt}
          </p>
        )}
        <div className="flex flex-col gap-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Helper di testo condivisi, per mantenere coerente la tipografia tra le
// varie pagine statiche senza ripetere le classi ad ogni utilizzo.
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-akira text-[12px] text-white uppercase tracking-widest mb-3">
        {title}
      </h2>
      <div className="font-montserrat text-[14px] text-white/85 leading-relaxed flex flex-col gap-3">
        {children}
      </div>
    </section>
  )
}
