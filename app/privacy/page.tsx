import type { Metadata } from 'next'
import StaticPageLayout, { LegalSection } from '@/components/StaticPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Informativa sul trattamento dei dati personali di Lastcorner.net.',
}

export default function PrivacyPage() {
  return (
    <StaticPageLayout title="Privacy Policy" updatedAt="13 luglio 2026">
      <p className="font-montserrat text-[14px] text-white/85 leading-relaxed">
        La presente informativa descrive le modalità di trattamento dei dati personali degli
        utenti che consultano Lastcorner.net (di seguito, il &ldquo;Sito&rdquo;), in conformità
        al Regolamento (UE) 2016/679 (&ldquo;GDPR&rdquo;) e al Codice Privacy italiano
        (D.Lgs. 196/2003 e successive modifiche).
      </p>

      <LegalSection title="Titolare del trattamento">
        <p>
          Il Titolare del trattamento è il gestore di Lastcorner.net, contattabile
          all&rsquo;indirizzo email{' '}
          <a href="mailto:info@lastcorner.net" className="text-white hover:text-lc-red transition-colors duration-200">
            info@lastcorner.net
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Dati raccolti">
        <p>Il Sito raccoglie le seguenti categorie di dati:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            <strong className="text-white">Dati di navigazione:</strong> nel normale
            funzionamento, i sistemi informatici e le procedure software impiegate per il
            funzionamento del Sito acquisiscono, nel loro normale esercizio, alcuni dati la cui
            trasmissione è implicita nell&rsquo;uso dei protocolli di comunicazione Internet
            (ad es. indirizzo IP, tipo di browser, pagine visitate, orario della richiesta).
            Questi dati sono trattati dal nostro fornitore di hosting (Vercel Inc.) ai soli
            fini tecnici e di sicurezza.
          </li>
          <li>
            <strong className="text-white">Dati forniti volontariamente:</strong> l&rsquo;invio
            facoltativo di email agli indirizzi di contatto del Sito comporta l&rsquo;acquisizione
            dei dati necessari a rispondere, oltre a quelli contenuti nel messaggio.
          </li>
          <li>
            <strong className="text-white">Cookie e tecnologie simili:</strong> per i dettagli si
            rimanda alla{' '}
            <a href="/cookie" className="text-white hover:text-lc-red transition-colors duration-200">
              Cookie Policy
            </a>
            .
          </li>
        </ul>
        <p>
          Al momento il Sito non prevede la creazione di account utente, moduli di iscrizione a
          newsletter, né sistemi di commento pubblici.
        </p>
      </LegalSection>

      <LegalSection title="Finalità e base giuridica del trattamento">
        <p>
          I dati sono trattati per: garantire il corretto funzionamento tecnico del Sito
          (esecuzione di misure precontrattuali/legittimo interesse); rispondere alle richieste
          inviate volontariamente via email (esecuzione di richieste dell&rsquo;interessato);
          adempiere a eventuali obblighi di legge.
        </p>
      </LegalSection>

      <LegalSection title="Conservazione dei dati">
        <p>
          I dati di navigazione sono conservati per il tempo tecnicamente necessario e comunque
          non superiore a quanto previsto dalle policy del fornitore di hosting. I dati forniti
          via email sono conservati per il tempo necessario a gestire la richiesta e, salvo
          diversa necessità, non oltre 24 mesi.
        </p>
      </LegalSection>

      <LegalSection title="Trasferimento dei dati extra-UE">
        <p>
          Il Sito è ospitato su infrastruttura di Vercel Inc., società con sede negli Stati
          Uniti. Il trasferimento dei dati verso paesi extra-UE avviene sulla base delle
          clausole contrattuali standard approvate dalla Commissione Europea o di altre garanzie
          equivalenti previste dal GDPR.
        </p>
      </LegalSection>

      <LegalSection title="Diritti dell'interessato">
        <p>
          In qualità di interessato, hai diritto di richiedere in qualsiasi momento
          l&rsquo;accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del
          trattamento, la portabilità dei dati, nonché di opporti al trattamento (artt. 15-22
          GDPR). Puoi esercitare questi diritti scrivendo a{' '}
          <a href="mailto:info@lastcorner.net" className="text-white hover:text-lc-red transition-colors duration-200">
            info@lastcorner.net
          </a>
          . Hai inoltre diritto di proporre reclamo al Garante per la Protezione dei Dati
          Personali (www.garanteprivacy.it).
        </p>
      </LegalSection>

      <LegalSection title="Modifiche alla presente informativa">
        <p>
          Questa informativa può essere aggiornata nel tempo, ad esempio in seguito
          all&rsquo;introduzione di nuovi servizi (pubblicità, statistiche di utilizzo). La data
          di ultimo aggiornamento è indicata in cima alla pagina.
        </p>
      </LegalSection>
    </StaticPageLayout>
  )
}
