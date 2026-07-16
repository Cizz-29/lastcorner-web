// Progetto e dataset sono dati pubblici (non segreti): identificano solo
// dove si trova il contenuto, l'accesso e' comunque protetto dal login
// Sanity di chi apre /studio.
//
// Questo file NON deve importare nulla da 'sanity' o dai plugin dello
// Studio (structureTool, visionTool, ecc.): sono pacchetti pensati per il
// browser che dipendono da React in modi che rompono la fase di "collect
// page data" di Next.js quando finiscono, anche solo indirettamente,
// dentro il bundle server di una pagina come quella di pilota/team.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'tg4ypg7t'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
