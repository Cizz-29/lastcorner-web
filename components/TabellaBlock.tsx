// Tabella incollata nell'editor (blocco "tabella" dello schema articolo).
//
// Nasce per i riepiloghi di classifica: l'autore incolla il testo prodotto
// altrove — un foglio di calcolo, una tabella generata da un assistente —
// e il sito lo formatta con la grafica del resto delle pagine, senza che
// nessuno debba sistemare a mano l'impaginazione.
//
// Le colonne si riconoscono da TAB (quello che si ottiene incollando da un
// foglio di calcolo o da una tabella HTML) oppure dal carattere "|", che è
// il formato tipico delle tabelle testuali.

interface TabellaValue {
  titolo?: string
  dati?: string
  primaRigaIntestazione?: boolean
}

function separaCelle(riga: string): string[] {
  const pulita = riga.trim().replace(/^\|/, '').replace(/\|$/, '')
  if (pulita.includes('\t')) return pulita.split('\t').map((c) => c.trim())
  if (pulita.includes('|')) return pulita.split('|').map((c) => c.trim())
  // Fallback: due o più spazi consecutivi come separatore.
  return pulita.split(/ {2,}/).map((c) => c.trim())
}

// Righe di soli trattini (il separatore delle tabelle Markdown) non sono
// dati: vanno scartate, altrimenti comparirebbe una riga di "---".
function isSeparatore(riga: string): boolean {
  return /^[\s|:-]+$/.test(riga) && riga.includes('-')
}

export default function TabellaBlock({ value }: { value: TabellaValue }) {
  const testo = value?.dati?.trim()
  if (!testo) return null

  const righe = testo
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r.length > 0 && !isSeparatore(r))
    .map(separaCelle)

  if (righe.length === 0) return null

  const conIntestazione = value.primaRigaIntestazione !== false && righe.length > 1
  const intestazione = conIntestazione ? righe[0] : null
  const corpo = conIntestazione ? righe.slice(1) : righe
  const colonne = Math.max(...righe.map((r) => r.length))

  return (
    <figure className="mb-6">
      {value.titolo && (
        <figcaption className="font-akira text-[11px] text-white uppercase tracking-widest mb-3">
          {value.titolo}
        </figcaption>
      )}
      {/* overflow-x: su schermi stretti la tabella scorre invece di
          sfondare il layout o comprimere le colonne fino a illeggibilità. */}
      <div className="overflow-x-auto rounded-card border border-white/10 bg-lc-card">
        <table className="w-full border-collapse font-montserrat text-[13px]">
          {intestazione && (
            <thead>
              <tr className="border-b border-white/15">
                {Array.from({ length: colonne }).map((_, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="text-left font-semibold text-white px-4 py-3 whitespace-nowrap"
                  >
                    {intestazione[i] ?? ''}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {corpo.map((riga, i) => (
              <tr
                key={i}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                {Array.from({ length: colonne }).map((_, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2.5 align-top ${
                      j === 0 ? 'text-white font-medium whitespace-nowrap' : 'text-white/85'
                    }`}
                  >
                    {riga[j] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
