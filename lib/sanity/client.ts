import { createClient } from '@sanity/client'
import { projectId, dataset } from '@/lib/sanity/env'

// Client di sola lettura per il sito pubblico.
// useCdn: false — con la CDN di Sanity le mutazioni (es. cancellazione
// duplicati) possono restare visibili in cache per un po' anche dopo un
// nuovo deploy, mostrando dati vecchi (articoli duplicati "fantasma").
// Query dirette all'API sono leggermente più lente ma sempre aggiornate;
// il livello ISR (revalidate 60s) delle pagine resta comunque la cache
// principale, quindi l'impatto sulle performance è minimo.
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  useCdn: false,
})
