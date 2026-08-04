import Link from 'next/link'
import { getDriverStandings, getConstructorStandings } from '@/lib/f1api'
import { getTeamColor } from '@/lib/teamColors'

// Classifica F1 inserita dentro un articolo (blocco "classificaF1").
// Legge i dati live come la pagina Classifica: l'autore non scrive nulla e
// il contenuto resta aggiornato anche a distanza di settimane.
//
// Attenzione all'uso: i dati ufficiali arrivano qualche ora dopo la gara,
// quindi per il riepilogo pubblicato subito dopo il traguardo conviene il
// blocco "Tabella", dove si incolla la classifica a mano.

export default async function ClassificaF1Block({ tipo }: { tipo?: string }) {
  const costruttori = tipo === 'costruttori'

  const righe = costruttori
    ? (await getConstructorStandings()).map((t) => ({
        pos: t.position,
        nome: t.Constructor.name,
        href: `/formula-1/team/${t.Constructor.constructorId}`,
        colore: getTeamColor(t.Constructor.name),
        punti: t.points,
        sotto: null as string | null,
      }))
    : (await getDriverStandings()).map((d) => ({
        pos: d.position,
        nome: `${d.Driver.givenName} ${d.Driver.familyName}`,
        href: `/formula-1/piloti/${d.Driver.driverId}`,
        colore: getTeamColor(d.Constructors[0]?.name ?? ''),
        punti: d.points,
        sotto: d.Constructors[0]?.name ?? null,
      }))

  if (righe.length === 0) return null

  return (
    <figure className="mb-6">
      <figcaption className="font-akira text-[11px] text-white uppercase tracking-widest mb-3">
        Classifica {costruttori ? 'costruttori' : 'piloti'}
      </figcaption>
      <div className="rounded-card border border-white/10 bg-lc-card overflow-hidden">
        {righe.map((r) => (
          <div
            key={r.pos}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
          >
            <span className="font-akira text-[12px] text-lc-subtle w-6 shrink-0">{r.pos}</span>
            <span className="w-[3px] h-6 rounded-full shrink-0" style={{ backgroundColor: r.colore }} />
            <div className="flex-1 min-w-0">
              <Link
                href={r.href}
                className="font-montserrat text-[13px] text-white hover:text-lc-red transition-colors block truncate"
              >
                {r.nome}
              </Link>
              {r.sotto && (
                <span className="font-montserrat text-[11px] text-lc-subtle block truncate">
                  {r.sotto}
                </span>
              )}
            </div>
            <span className="font-akira text-[13px] text-white shrink-0">{r.punti}</span>
          </div>
        ))}
      </div>
      <p className="font-montserrat text-[11px] text-lc-subtle mt-2">
        Classifica aggiornata automaticamente.
      </p>
    </figure>
  )
}
