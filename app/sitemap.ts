import type { MetadataRoute } from 'next'

const SITE_URL = 'https://lastcorner.net'

// Sitemap minimale con la sola homepage per ora. Man mano che vengono
// aggiunte le pagine categoria/articolo/pilota andranno incluse qui
// (idealmente generate dinamicamente dal contenuto Sanity).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ]
}
