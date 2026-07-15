import type { Metadata } from 'next'
import StaticPageLayout, { LegalSection } from '@/components/StaticPageLayout'

export const metadata: Metadata = {
  title: 'Note Legali',
  description: 'Informazioni legali su Lastcorner.net: natura del sito, proprietà intellettuale, responsabilità.',
}

export default function NoteLegaliPage() {
  return (
    <StaticPageLayout title="Note Legali" updatedAt="13 luglio 2026">
      <LegalSection title="Natura del sito">
        <p>
          Lastcorner.net non è una testata giornalistica, in quanto viene aggiornato senza
          alcuna periodicità regolare. Non può pertanto considerarsi un prodotto editoriale ai
          sensi della legge n. 62 del 7 marzo 2001.
        </p>
      </LegalSection>

      <LegalSection title="Proprietà intellettuale">
        <p>
          Testi, immagini, grafica e loghi presenti su Lastcorner.net, salvo diversa indicazione,
          sono di proprietà dei rispettivi autori o del Sito e sono tutelati dalle norme sul
          diritto d&rsquo;autore. È vietata la riproduzione, anche parziale, dei contenuti senza
          preventiva autorizzazione, fatte salve le citazioni con indicazione della fonte nei
          limiti previsti dalla legge.
        </p>
      </LegalSection>

      <LegalSection title="Limitazione di responsabilità">
        <p>
          I contenuti pubblicati sono frutto di un lavoro di ricerca e verifica, ma non possiamo
          garantire l&rsquo;assoluta esattezza, completezza o attualità delle informazioni
          riportate. Lastcorner.net non è responsabile per eventuali errori, omissioni o per un
          uso improprio delle informazioni pubblicate.
        </p>
        <p>
          Il Sito può contenere link a siti di terze parti, sui cui contenuti non abbiamo alcun
          controllo e per i quali non ci assumiamo alcuna responsabilità.
        </p>
      </LegalSection>

      <LegalSection title="Non affiliazione">
        <p>
          Lastcorner.net è un progetto editoriale indipendente e non è in alcun modo affiliato,
          sponsorizzato o approvato da Formula 1®, FIA o da altri enti/organizzatori delle
          competizioni motoristiche trattate. Marchi, loghi e nomi citati appartengono ai
          rispettivi proprietari e sono utilizzati a solo scopo informativo/descrittivo.
        </p>
        <p>
          I dati relativi a classifiche e calendario di Formula 1 sono forniti tramite Jolpica
          API, servizio gratuito non ufficiale.
        </p>
      </LegalSection>

      <LegalSection title="Legge applicabile">
        <p>
          Le presenti note legali sono regolate dalla legge italiana. Per qualsiasi controversia
          relativa all&rsquo;uso del Sito è competente il foro del luogo in cui ha domicilio il
          Titolare, salve le norme inderogabili a tutela dei consumatori.
        </p>
      </LegalSection>
    </StaticPageLayout>
  )
}
