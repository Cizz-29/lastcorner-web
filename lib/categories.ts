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
  // Sezione "Piloti" (nav, pagina overview, sitemap): assente per F1 Academy
  // e WRC finché non c'è abbastanza materiale (roster/articoli) da
  // giustificare una pagina dedicata — di default true.
  hasPiloti?: boolean
}

export const CATEGORIES: CategoryConfig[] = [
  { slug: 'formula-1', label: 'Formula 1', hasStandings: true },
  { slug: 'formula-2', label: 'Formula 2', hasStandings: false },
  { slug: 'formula-3', label: 'Formula 3', hasStandings: false },
  { slug: 'f1-academy', label: 'F1 Academy', hasStandings: false, hasPiloti: false },
  { slug: 'wrc', label: 'WRC', hasStandings: false, hasPiloti: false },
  { slug: 'altro', label: 'Altro', hasStandings: false },
]

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}
