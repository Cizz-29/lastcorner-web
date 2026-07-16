import { createClient } from '@sanity/client'
import { projectId, dataset } from '@/lib/sanity/env'

// Client con permessi di scrittura: usato SOLO in route API server-side
// (mai importato da componenti/pagine pubbliche). Richiede la variabile
// d'ambiente SANITY_WRITE_TOKEN impostata su Vercel.
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})
