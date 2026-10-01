// Dati strutturati (schema.org, in JSON-LD) condivisi fra le pagine.
//
// Sono descrizioni della pagina scritte per i motori di ricerca, invisibili
// al lettore: "questa e' una persona, nata il..., che corre per...". Google
// li usa per capire di cosa parla una pagina e, per alcuni tipi, per
// arricchire il risultato (le briciole al posto dell'indirizzo, la scheda
// dell'autore). Il formato e' quello di https://schema.org.

import { SITE_URL } from '@/lib/seo'
import { urlFor } from '@/lib/sanity/image'
import type { SchedaAutore } from '@/lib/sanity/authors'

export interface Briciola {
  nome: string
  /** Percorso sul sito, es. "/formula-1/piloti". */
  percorso: string
}

/** BreadcrumbList: il percorso Home > Sezione > Pagina. Con questo Google
 *  mostra "lastcorner.net › Formula 1 › Piloti" al posto dell'indirizzo. */
export function bricioleLd(voci: Briciola[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: voci.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: v.nome,
      item: `${SITE_URL}${v.percorso === '/' ? '' : v.percorso}`,
    })),
  }
}

/** L'autore come Person: nome, pagina, foto e profili social. La foto e i
 *  profili (sameAs) sono cio' che permette a Google di riconoscere la stessa
 *  persona su piu' siti: e' un segnale di affidabilita' della firma. */
export function autoreLd(nome: string, percorso: string, scheda?: SchedaAutore | null) {
  const sameAs = (scheda?.social ?? []).map((s) => s.url).filter(Boolean)
  const foto = scheda?.foto?.asset?._ref
    ? urlFor(scheda.foto).width(400).height(400).fit('crop').url()
    : undefined
  return {
    '@type': 'Person',
    name: nome,
    url: `${SITE_URL}${percorso}`,
    image: foto,
    jobTitle: scheda?.ruolo || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    worksFor: { '@type': 'Organization', name: 'Lastcorner', url: SITE_URL },
  }
}

/** Un oggetto pronto per lo <script>: piu' entita' nello stesso grafo. */
export function grafo(...entita: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': entita.filter(Boolean) }
}
