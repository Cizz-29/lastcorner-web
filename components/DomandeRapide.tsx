import { jsonLd } from '@/lib/jsonLd'
import type { DomandaRapida } from '@/lib/domandeRapide'

// Le domande rapide di una scheda pilota o team (vedi lib/domandeRapide.ts),
// in chiaro nella pagina e, per i motori di ricerca, come FAQPage.
//
// Testo sempre visibile, niente fisarmonica: e' la risposta che il lettore
// arrivato da Google sta cercando, e nasconderla dietro un clic la
// renderebbe meno utile e meno leggibile per i motori.
export default function DomandeRapide({ domande }: { domande: DomandaRapida[] }) {
  if (domande.length === 0) return null
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: domande.map((d) => ({
      '@type': 'Question',
      name: d.domanda,
      acceptedAnswer: { '@type': 'Answer', text: d.risposta },
    })),
  }
  return (
    <section aria-labelledby="domande-rapide" className="mb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} />
      <h2 id="domande-rapide" className="font-akira text-[12px] text-white uppercase tracking-widest mb-4">
        Domande rapide
      </h2>
      <div className="flex flex-col gap-3">
        {domande.map((d) => (
          <div key={d.chiave} className="bg-lc-card rounded-card-sm border border-white/10 px-5 py-4">
            <h3 className="font-montserrat font-semibold text-[15px] text-white leading-snug mb-1.5">
              {d.domanda}
            </h3>
            <p className="font-montserrat text-[14px] text-white/80 leading-relaxed">{d.risposta}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
