import { sanityClient } from '@/lib/sanity/client'
import { type ChiaveSessione, type SessioneWeekend } from '@/lib/sessioniF1'

// Articoli di recap delle sessioni di un weekend di F1 (campo "Recap di
// sessione F1"), per i link nel "Prossimo evento" della home.
//
// Il Gran Premio non si sceglie nello Studio: lo dice la data di
// pubblicazione. Vale un recap pubblicato fra il giorno prima della prima
// sessione e tre giorni dopo la gara; due weekend non si sovrappongono mai
// così (fra un GP e l'altro passa almeno una settimana). Se per la stessa
// sessione ci sono più articoli vince il più recente.
const MARGINE_PRIMA = 24 * 3600 * 1000
const MARGINE_DOPO = 3 * 24 * 3600 * 1000

export async function getRecapSessioni(
  sessioni: SessioneWeekend[]
): Promise<Partial<Record<ChiaveSessione, string>>> {
  if (!sessioni.length) return {}
  const da = new Date(sessioni[0].inizio.getTime() - MARGINE_PRIMA).toISOString()
  const a = new Date(sessioni[sessioni.length - 1].inizio.getTime() + MARGINE_DOPO).toISOString()
  try {
    const docs = await sanityClient.fetch<{ sessione: ChiaveSessione; slug: string }[]>(
      `*[_type == "article" && category == "Formula 1" && defined(recapSessione) && defined(slug.current)
        && publishedAt >= $da && publishedAt <= $a] | order(publishedAt desc){
        "sessione": recapSessione, "slug": slug.current
      }`,
      { da, a }
    )
    const link: Partial<Record<ChiaveSessione, string>> = {}
    for (const d of docs) if (!link[d.sessione]) link[d.sessione] = `/formula-1/${d.slug}`
    return link
  } catch (errore) {
    console.error('[sanity] recap delle sessioni non recuperati:', (errore as Error)?.message ?? errore)
    return {}
  }
}
