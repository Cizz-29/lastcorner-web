import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'

// Progetto e dataset sono dati pubblici (non segreti): identificano solo
// dove si trova il contenuto, l'accesso è comunque protetto dal login
// Sanity di chi apre /studio.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'tg4ypg7t'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
    name: 'lastcorner',
    title: 'Lastcorner CMS',
    basePath: '/studio',
    projectId,
    dataset,
    plugins: [structureTool(), visionTool()],
    schema: { types: schemaTypes },
})
