import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'

import { projectId, dataset } from './lib/sanity/env'

export { projectId, dataset }

export default defineConfig({
    name: 'lastcorner',
    title: 'Lastcorner CMS',
    basePath: '/studio',
    projectId,
    dataset,
    plugins: [structureTool(), visionTool()],
    schema: { types: schemaTypes },
})
