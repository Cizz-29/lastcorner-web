import type { Metadata } from 'next'
import StaticPageLayout, { LegalSection } from '@/components/StaticPageLayout'

export const metadata: Metadata = {
  title: 'Chi siamo',
  description: 'La storia di Lastcorner.net: da pagina Instagram nata nel 2019 a risorsa di news e analisi sul motorsport.',
}

const SOCIAL_LINKS = [
  { label: 'Instagram', handle: '@lastcorner_net', href: 'https://www.instagram.com/lastcorner_net/' },
  { label: 'X (Twitter)', handle: '@Lastcorner_F1', href: 'https://x.com/Lastcorner_F1' },
  { label: 'TikTok', handle: '@lastcornernet', href: 'https://www.tiktok.com/@lastcornernet' },
  { label: 'YouTube', handle: '@lastcornernet', href: 'https://www.youtube.com/@lastcornernet' },
  { label: 'Facebook', handle: 'Lastcorner', href: 'https://www.facebook.com/profile.php?id=61575634843637' },
]

export default function ChiSiamoPage() {
  return (
    <StaticPageLayout title="Chi siamo">
      <p className="font-montserrat text-[15px] text-white/90 leading-relaxed">
        Lastcorner.net nasce nel 2019 come pagina Instagram, fondata da due giovani amici
        appassionati di motori. La nostra missione è semplice: vogliamo essere la risorsa
        definitiva di news, curiosità e statistiche per tutti coloro che amano il motorsport.
      </p>

      <LegalSection title="La nostra storia">
        <p>
          Inizialmente conosciuta con il nickname &ldquo;la_f1_che_ci_piace&rdquo;, la nostra
          pagina Instagram è tra le più longeve ancora attive, nonché una delle più presenti,
          storicamente, nella community social dei motori.
        </p>
        <p>
          Dedicati in un primo momento a contenuti informali e divertenti, abbiamo col tempo
          spostato il nostro focus su format sempre più analitici e qualitativi, con
          l&rsquo;obiettivo di fornire alla nostra audience una visione oggettiva e imparziale
          del motorsport. Ci impegniamo a mantenere standard di qualità elevati: ogni articolo
          qui pubblicato è il risultato di un lavoro di ricerca accurato, di una valutazione
          imparziale delle informazioni e del nostro impegno costante nell&rsquo;offrire
          contenuti che siano non solo di interesse, ma anche precisi e veritieri.
        </p>
      </LegalSection>

      <LegalSection title="Entra a far parte della nostra community">
        <p>
          Oltre che qui su Lastcorner.net, ci trovi anche su tutte le principali piattaforme
          social: Instagram, X, TikTok, YouTube e Facebook. Entra a far parte della nostra
          community per vivere al massimo la passione per i motori!
        </p>
      </LegalSection>

      <LegalSection title="Link social e contatti">
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
              <span className="text-lc-subtle"> — {s.handle}</span>
            </li>
          ))}
          <li>
            Email:{' '}
            <a href="mailto:info@lastcorner.net" className="text-white hover:text-lc-red transition-colors duration-200">
              info@lastcorner.net
            </a>
          </li>
        </ul>
      </LegalSection>

      <p className="font-montserrat text-[12px] text-lc-subtle leading-relaxed border-t border-white/10 pt-6">
        Lastcorner.net non è una testata giornalistica, in quanto viene aggiornato senza
        alcuna periodicità regolare. Non può pertanto considerarsi un prodotto editoriale ai
        sensi della legge n. 62 del 7 marzo 2001.
      </p>
    </StaticPageLayout>
  )
}
