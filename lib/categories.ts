// Categorie del sito e relativo slug URL. `hasStandings` indica se esiste
// una classifica automatica per quella categoria: al momento solo la F1 ha
// un'API gratuita senza chiave (Jolpica). Per F2, F3, WEC e WRC non è stata
// trovata un'alternativa altrettanto semplice (le API esistenti richiedono
// una chiave e/o non coprono queste categorie), quindi il widget classifica
// viene omesso per non introdurre una dipendenza a pagamento o poco solida.
export interface CategoryConfig {
  slug: string
  label: string
  hasStandings: boolean
  // Sezioni "Piloti" e "Team" (nav, pagine overview, sitemap): si possono
  // disattivare per categoria quando non c'è abbastanza materiale da
  // giustificare una pagina dedicata. Di default entrambe attive.
  hasPiloti?: boolean
  hasTeam?: boolean
  /** Come chiamare la sezione piloti nei menu e nei titoli. Serve alla F1
   *  Academy, che è un campionato interamente femminile: "Pilote". */
  etichettaPiloti?: string
}

export const CATEGORIES: CategoryConfig[] = [
  { slug: 'formula-1', label: 'Formula 1', hasStandings: true },
  { slug: 'formula-2', label: 'Formula 2', hasStandings: false },
  { slug: 'formula-3', label: 'Formula 3', hasStandings: false },
  { slug: 'f1-academy', label: 'F1 Academy', hasStandings: false, etichettaPiloti: 'Pilote' },
  { slug: 'wrc', label: 'WRC', hasStandings: false, hasPiloti: false, hasTeam: false },
  { slug: 'altro', label: 'Altro', hasStandings: false },
]

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}
