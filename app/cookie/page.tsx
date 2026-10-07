import type { Metadata } from 'next'
import StaticPageLayout, { LegalSection } from '@/components/StaticPageLayout'
import { metadati } from '@/lib/seo'

export const metadata: Metadata = metadati({
  titolo: 'Cookie Policy',
  descrizione: 'Informativa sui cookie utilizzati da Lastcorner.net.',
  percorso: '/cookie',
})

export default function CookiePage() {
  return (
    <StaticPageLayout percorso="/cookie" title="Cookie Policy" updatedAt="7 ottobre 2026">
      <p className="font-montserrat text-[14px] text-white/85 leading-relaxed">
        Questa pagina descrive i cookie e le tecnologie simili utilizzate da Lastcorner.net
        (il &ldquo;Sito&rdquo;) e le opzioni a disposizione degli utenti per gestirli, in
        conformità alle Linee guida cookie del Garante per la Protezione dei Dati Personali e
        alla normativa ePrivacy.
      </p>

      <LegalSection title="Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo che i siti visitati inviano al terminale
          dell&rsquo;utente, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti
          alla visita successiva. Accanto ai cookie, il Sito utilizza tecnologie equivalenti come
          l&rsquo;archiviazione locale del browser (<em>localStorage</em>), a cui si applicano le
          stesse regole.
        </p>
      </LegalSection>

      <LegalSection title="Cookie tecnici">
        <p>
          Il Sito utilizza cookie e tecnologie tecniche necessarie al suo funzionamento di base,
          fra cui la memorizzazione nel browser della scelta espressa tramite il banner. Questi
          non richiedono consenso ai sensi della normativa vigente.
        </p>
      </LegalSection>

      <LegalSection title="Pubblicità (Google AdSense)">
        <p>
          Il Sito ospita annunci pubblicitari erogati tramite{' '}
          <strong className="text-white">Google AdSense</strong>. Il servizio è fornito da Google
          Ireland Limited e utilizza cookie e identificatori per mostrare gli annunci, misurarne
          il rendimento e, in presenza di consenso, personalizzarli.
        </p>
        <p>
          Il consenso per queste finalità <strong className="text-white">non</strong> viene
          raccolto dal banner del Sito, ma direttamente da Google attraverso il proprio messaggio
          sulle normative europee: si tratta di una piattaforma di gestione del consenso
          certificata da Google e integrata con il Transparency &amp; Consent Framework di IAB
          Europe. Il messaggio compare alla prima visita e la scelta può essere modificata in
          qualsiasi momento tramite il link presente nel messaggio stesso.
        </p>
        <p>
          Maggiori informazioni su come Google utilizza i dati sono disponibili alla pagina{' '}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-lc-red transition-colors duration-200"
          >
            Come Google utilizza i dati quando utilizzi siti o app dei nostri partner
          </a>
          . Le preferenze sugli annunci personalizzati si gestiscono da{' '}
          <a
            href="https://myadcenter.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-lc-red transition-colors duration-200"
          >
            My Ad Center
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Contenuti incorporati da X e Instagram">
        <p>
          Alcuni articoli incorporano post pubblicati su X (già Twitter) o su Instagram. Per
          mostrarli il browser deve caricare uno script del rispettivo fornitore, che installa
          cookie propri, anche di profilazione.
        </p>
        <p>
          Questi contenuti vengono caricati{' '}
          <strong className="text-white">solo dopo il tuo consenso</strong>, espresso tramite il
          banner del Sito. In assenza di consenso, al loro posto compare un semplice collegamento
          al post originale, che non carica nulla e non traccia nessuno.
        </p>
      </LegalSection>

      <LegalSection title="Statistiche di utilizzo (Google Analytics)">
        <p>
          Con il tuo consenso il Sito utilizza{' '}
          <strong className="text-white">Google Analytics 4</strong>, servizio di analisi fornito
          da Google Ireland Limited, per sapere quante persone leggono il Sito, da dove arrivano
          (motori di ricerca, social, link diretti) e quali pagine visitano. I dati servono
          esclusivamente a migliorare i contenuti.
        </p>
        <p>
          Senza il tuo consenso Google Analytics{' '}
          <strong className="text-white">non viene caricato</strong>: nessuna richiesta parte
          verso Google e nessun cookie viene installato. Con il consenso vengono installati i
          cookie <code>_ga</code> e <code>_ga_&lt;ID&gt;</code>, che distinguono un visitatore
          dall&rsquo;altro e durano fino a 2 anni. Google Analytics 4 non registra né conserva
          l&rsquo;indirizzo IP completo; le funzioni pubblicitarie (Google Signals e
          personalizzazione degli annunci) sono disattivate e i dati restano nei rapporti del
          Sito per 14 mesi. Google tratta i dati in qualità di responsabile del trattamento.
        </p>
        <p>
          Maggiori informazioni sono disponibili alla pagina{' '}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-lc-red transition-colors duration-200"
          >
            Come Google utilizza i dati quando utilizzi siti o app dei nostri partner
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Statistiche aggregate (Vercel)">
        <p>
          Il Sito utilizza inoltre Vercel Web Analytics e Vercel Speed Insights per contare le
          visite e misurare i tempi di caricamento delle pagine. Questi strumenti{' '}
          <strong className="text-white">non installano cookie</strong>, non creano un
          identificatore persistente del visitatore e producono solo dati aggregati: per questo
          non richiedono consenso.
        </p>
      </LegalSection>

      <LegalSection title="Come gestire le preferenze">
        <p>
          Il consenso alla pubblicità si gestisce dal messaggio di Google, tramite il link per
          modificare le impostazioni che compare nel messaggio stesso.
        </p>
        <p>
          Il consenso a Google Analytics e ai contenuti incorporati da X e Instagram si gestisce
          dal banner del Sito, separatamente per ciascuna finalità con il pulsante
          &ldquo;Personalizza&rdquo;. Il banner si riapre in qualsiasi momento dal link
          &ldquo;Preferenze Cookie&rdquo; nel footer; se revochi il consenso a Google Analytics,
          il Sito smette subito di inviare dati e cancella i cookie <code>_ga</code>.
        </p>
        <p>
          Puoi inoltre gestire o disabilitare i cookie direttamente dalle impostazioni del tuo
          browser; tieni presente che disabilitare i cookie tecnici potrebbe compromettere alcune
          funzionalità del Sito.
        </p>
      </LegalSection>

      <LegalSection title="Modifiche alla presente Cookie Policy">
        <p>
          Questa informativa potrà essere aggiornata in seguito a variazioni normative o
          all&rsquo;introduzione di nuovi servizi sul Sito. La data di ultimo aggiornamento è
          indicata in cima alla pagina.
        </p>
      </LegalSection>
    </StaticPageLayout>
  )
}
