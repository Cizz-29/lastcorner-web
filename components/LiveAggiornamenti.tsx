import { TestoAggiornamento } from '@/components/ArticleBody'
import AdSlot from '@/components/AdSlot'
import AggiornaLive from '@/components/AggiornaLive'
import { idAggiornamento, orarioBreve, type AggiornamentoLive } from '@/lib/live'

// Annuncio fra un aggiornamento e l'altro: le dirette sono le pagine che si
// leggono più a lungo.
const ANNUNCIO_OGNI = 5

/** Bollino LIVE (diretta in corso) o "Diretta conclusa". */
export function BollinoLive({ inCorso }: { inCorso: boolean }) {
  return inCorso ? (
    <span className="inline-flex items-center gap-1.5 font-akira font-bold text-[11px] text-white bg-lc-red rounded-full px-3 py-1 tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse motion-reduce:animate-none" aria-hidden />
      LIVE
    </span>
  ) : (
    <span className="inline-flex items-center font-akira font-bold text-[11px] text-white/70 border border-white/20 rounded-full px-3 py-1 tracking-wide">
      DIRETTA CONCLUSA
    </span>
  )
}

// Aggiornamenti in diretta, dal più recente. Ognuno ha un'ancora propria
// (#agg-…), la stessa che finisce nei dati strutturati.
export default function LiveAggiornamenti({
  aggiornamenti,
  inCorso,
}: {
  aggiornamenti: AggiornamentoLive[]
  inCorso: boolean
}) {
  return (
    <section aria-label="Aggiornamenti in diretta" className="mt-4 mb-6">
      {inCorso && <AggiornaLive />}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-akira font-bold text-[16px] lg:text-[18px] text-white">
          {inCorso ? 'Aggiornamenti in diretta' : 'La diretta'}
        </h2>
        <BollinoLive inCorso={inCorso} />
      </div>
      {aggiornamenti.length === 0 ? (
        <p className="font-montserrat text-[14px] text-lc-subtle italic">La diretta sta per iniziare.</p>
      ) : (
        <ol className="border-l-2 border-white/10 ml-1">
          {aggiornamenti.map((a, i) => (
            <li key={a._key} className="relative pl-5 lg:pl-6 pb-2">
              <span
                className={`absolute -left-[7px] top-[6px] w-3 h-3 rounded-full border-2 border-lc-bg ${i === 0 && inCorso ? 'bg-lc-red' : 'bg-white/40'}`}
                aria-hidden
              />
              <article id={idAggiornamento(a)} className="scroll-mt-[96px]">
                <a
                  href={`#${idAggiornamento(a)}`}
                  className="inline-block font-akira font-bold text-[13px] text-lc-red mb-2 hover:underline"
                >
                  {a.orario ? <time dateTime={a.orario}>{orarioBreve(a.orario)}</time> : '—'}
                </a>
                {a.titolo && (
                  <h3 className="font-akira font-bold text-[15px] lg:text-[17px] text-white leading-snug mb-3">
                    {a.titolo}
                  </h3>
                )}
                <TestoAggiornamento blocks={a.testo} />
              </article>
              {(i + 1) % ANNUNCIO_OGNI === 0 && i < aggiornamenti.length - 1 && (
                <AdSlot height={120} label="Google AdSense" className="mb-6" />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
