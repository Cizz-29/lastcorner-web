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
}

export const CATEGORIES: CategoryConfig[] = [
  { slug: 'formula-1', label: 'Formula 1', hasStandings: true },
  { slug: 'formula-2', label: 'Formula 2', hasStandings: false },
  { slug: 'formula-3', label: 'Formula 3', hasStandings: false },
  { slug: 'wec', label: 'WEC', hasStandings: false },
  { slug: 'wrc', label: 'WRC', hasStandings: false },
  { slug: 'altro', label: 'Altro', hasStandings: false },
]

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}
