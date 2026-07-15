import type { Metadata } from 'next'
import StaticPageLayout, { LegalSection } from '@/components/StaticPageLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Informativa sui cookie utilizzati da Lastcorner.net.',
}

export default function CookiePage() {
  return (
    <StaticPageLayout title="Cookie Policy" updatedAt="13 luglio 2026">
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
          alla visita successiva.
        </p>
      </LegalSection>

      <LegalSection title="Cookie utilizzati dal Sito">
        <p>
          Al momento Lastcorner.net utilizza esclusivamente cookie tecnici necessari al
          funzionamento di base del Sito (ad esempio per ricordare le preferenze espresse tramite
          il banner cookie). Questi cookie non richiedono consenso ai sensi della normativa
          vigente.
        </p>
        <p>
          Il Sito non installa attualmente cookie di analisi (es. Google Analytics) né cookie di
          profilazione/marketing (es. Google AdSense). Gli spazi pubblicitari attualmente
          visibili sono segnaposto statici e non caricano script di terze parti.
        </p>
        <p>
          Qualora in futuro venissero attivati servizi di analisi statistica o pubblicità di
          terze parti, questi verranno caricati solo previo consenso esplicito, raccolto tramite
          il banner cookie, e questa pagina sarà aggiornata con l&rsquo;elenco dettagliato dei
          cookie installati, la relativa finalità e durata.
        </p>
      </LegalSection>

      <LegalSection title="Come gestire le preferenze">
        <p>
          Al primo accesso al Sito viene mostrato un banner che permette di accettare, rifiutare
          o personalizzare i cookie non necessari. Puoi modificare la tua scelta in qualsiasi
          momento tramite il link &ldquo;Preferenze Cookie&rdquo; nel footer del Sito.
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
