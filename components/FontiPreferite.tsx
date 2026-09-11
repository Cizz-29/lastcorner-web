// Invito ad aggiungere Lastcorner alle fonti preferite di Google.
//
// A cosa serve: chi sceglie un sito come fonte preferita se lo ritrova piu'
// spesso nelle Top Stories, cioe' nel carosello di notizie in cima ai
// risultati. Per noi e' lo spazio che conta davvero — sugli orari TV di un
// weekend di gara e' l'unica posizione realisticamente contendibile a siti
// con molta piu' autorita' di dominio, perche' li' pesa la freschezza e non
// solo l'autorevolezza accumulata.
//
// Il collegamento e' quello ufficiale documentato da Google
// (developers.google.com/search/docs/appearance/preferred-sources): apre la
// pagina delle preferenze gia' impostata sul nostro dominio. Funziona solo
// a livello di dominio o sottodominio, mai su una sottocartella.
//
// Sta nella sola sidebar dell'articolo, una volta per pagina. Ripeterlo in
// piu' punti lo renderebbe invisibile a forza di ripetizione, ed e' un
// invito che ha senso fare a chi sta gia' leggendo un pezzo.

const LINK = 'https://www.google.com/preferences/source?q=lastcorner.net'

export default function FontiPreferite() {
  return (
    <div className="bg-lc-card rounded-card border border-white/10 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-lc-red/15 flex items-center justify-center shrink-0">
          {/* Stella: l'icona che Google stessa usa per le fonti preferite. */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-lc-red"
            aria-hidden="true"
          >
            <path d="M12 2l2.9 6.26L21.5 9.2l-4.9 4.6 1.2 6.7L12 17.3 6.2 20.5l1.2-6.7-4.9-4.6 6.6-.94L12 2z" />
          </svg>
        </div>
        <p className="font-akira font-bold text-[12px] text-white leading-tight">
          Seguici su Google
        </p>
      </div>

      <p className="font-montserrat text-[11px] text-lc-subtle mt-3 leading-relaxed">
        Aggiungi Lastcorner alle tue fonti preferite: i nostri articoli
        compariranno più spesso fra le notizie in cima ai risultati di ricerca.
      </p>

      <a
        href={LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 bg-lc-red text-white font-akira text-[11px] uppercase tracking-widest py-3 rounded-card-sm hover:opacity-90 transition-opacity"
      >
        Aggiungi alle fonti preferite
      </a>
    </div>
  )
}
