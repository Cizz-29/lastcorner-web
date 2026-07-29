// Sotto-categorie navigabili come pagine vere e proprie (replica della
// struttura del vecchio sito WordPress: /formula-1/news/, /formula-1/editoriali/,
// ecc.). "classifiche" resta gestita a parte da app/[category]/classifica.
export interface SubcategoryPageConfig {
  slug: string
  label: string
}

// F1 e WRC hanno il set completo di sotto-categorie editoriali.
export const FULL_SUBCATEGORY_PAGES: SubcategoryPageConfig[] = [
  { slug: 'editoriali', label: 'Editoriali' },
  { slug: 'analisi-tecnica', label: 'Analisi Tecnica' },
  { slug: 'guide-approfondimenti', label: 'Guide e Approfondimenti' },
  { slug: 'rubriche', label: 'Rubriche' },
]

// Tutte le altre categorie (tranne "Altro", che non ha sottomenu) hanno
// solo Rubriche in più oltre a News (che resta la pagina categoria root).
export const LIMITED_SUBCATEGORY_PAGES: SubcategoryPageConfig[] = [
  { slug: 'rubriche', label: 'Rubriche' },
]

export const CATEGORIES_WITH_FULL_SUBCATEGORIES = ['formula-1', 'wrc']

// Categorie che hanno la pagina "Rubriche" (tutte tranne Altro).
export const CATEGORIES_WITH_RUBRICHE = ['formula-1', 'formula-2', 'formula-3', 'f1-academy', 'wrc']

export function getSubcategoryPagesForCategory(categorySlug: string): SubcategoryPageConfig[] {
  if (CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(categorySlug)) return FULL_SUBCATEGORY_PAGES
  if (CATEGORIES_WITH_RUBRICHE.includes(categorySlug)) return LIMITED_SUBCATEGORY_PAGES
  return []
}
