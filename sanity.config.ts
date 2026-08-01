import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'
import { projectId, dataset } from './lib/sanity/env'
import GeneraBozzaTool from './sanity/tools/GeneraBozzaTool'

export { projectId, dataset }

export default defineConfig({
  name: 'lastcorner',
  title: 'Lastcorner CMS',
  basePath: '/studio',
  projectId,
  dataset,
  // Vision è una console tecnica per query GROQ: utile in sviluppo, ma per
  // gli editor (specie da mobile, dove lo spazio nella barra è poco) è solo
  // rumore — quindi compare solo in ambiente di sviluppo.
  plugins:
    process.env.NODE_ENV === 'development'
      ? [structureTool(), visionTool()]
      : [structureTool()],
  schema: { types: schemaTypes },
  tools: [
    {
      name: 'genera-bozza',
      title: 'Genera Bozza IA',
      component: GeneraBozzaTool,
    },
  ],
})
