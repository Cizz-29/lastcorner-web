import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'
import { projectId, dataset } from './lib/sanity/env'
import GeneraBozzaTool from './sanity/tools/GeneraBozzaTool'
import CategorieInBloccoTool from './sanity/tools/CategorieInBloccoTool'
import { structure } from './sanity/structure'
import { ricercaImmagini } from './sanity/studio/personalizzazioni'

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
      ? [structureTool({ structure }), visionTool()]
      : [structureTool({ structure })],
  schema: { types: schemaTypes },
  // Aggiunge la scheda "Cerca" nella finestra di selezione immagine, accanto
  // a quelle native di Sanity (caricamento e archivio).
  form: {
    image: {
      assetSources: (fonti) => [ricercaImmagini, ...fonti],
    },
  },
  tools: [
    {
      name: 'genera-bozza',
      title: 'Genera Bozza IA',
      component: GeneraBozzaTool,
    },
    {
      name: 'categorie-in-blocco',
      title: 'Categorie in blocco',
      component: CategorieInBloccoTool,
    },
  ],
})
