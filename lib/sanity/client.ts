import { createClient } from '@sanity/client'
import { projectId, dataset } from '@/lib/sanity/env'

// Client di sola lettura per il sito pubblico. Usa @sanity/client (non
// next-sanity) perche' quest'ultimo include codice legato a React che fa
// fallire la fase di "collect page data" di Next.js in build su Vercel.
export const sanityClient = createClient({
      projectId,
      dataset,
      apiVersion: '2025-01-01',
      useCdn: true,
})
