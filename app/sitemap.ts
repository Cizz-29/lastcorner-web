import type { MetadataRoute } from 'next'
import { CATEGORIES } from '@/lib/categories'
import { getAllArticles } from '@/lib/sanity/articles'
import { getDriverStandings, getConstructorStandings } from '@/lib/f1api'
import { getRosterDrivers, getRosterTeams, hasStaticRoster } from '@/lib/rosterData'

const SITE_URL = 'https://lastcorner.net'

// Sitemap generata dinamicamente da tutto il contenuto reale del sito:
// pagine statiche, categorie (+ classifica/calendario dove esistono),
// articoli Sanity, e pagine piloti/team (F1 da dati live, F2/F3 da
// roster statico). WEC/WRC non hanno pagine pilota/team individuali
// (nessuna fonte dati affidabile), quindi non vengono incluse.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/chi-siamo`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contatti`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${SITE_URL}/cookie`,
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${SITE_URL}/note-legali`,
      changeFrequency: 'yearly',
      priority: 0.1,
    },
  ]

  // Pagine categoria + relative sotto-pagine (piloti, team, classifica,
  // calendario solo per F1).
  for (const cat of CATEGORIES) {
    entries.push({
      url: `${SITE_URL}/${cat.slug}`,
      changeFrequency: 'hourly',
      priority: 0.9,
    })

    if (cat.slug === 'altro') continue

    entries.push({
      url: `${SITE_URL}/${cat.slug}/piloti`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
    entries.push({
      url: `${SITE_URL}/${cat.slug}/team`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
    entries.push({
      url: `${SITE_URL}/${cat.slug}/classifica`,
      changeFrequency: 'daily',
      priority: 0.7,
    })
    if (cat.hasStandings) {
      entries.push({
        url: `${SITE_URL}/${cat.slug}/calendario`,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  // Articoli (Sanity + mock residui).
  const articles = await getAllArticles()
  for (const article of articles) {
    entries.push({
      url: `${SITE_URL}/${article.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  // Pagine pilota/team F1 (dati live Jolpica).
  try {
    const [drivers, constructors] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
    ])
    for (const d of drivers) {
      entries.push({
        url: `${SITE_URL}/formula-1/piloti/${d.Driver.driverId}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
    for (const c of constructors) {
      entries.push({
        url: `${SITE_URL}/formula-1/team/${c.Constructor.constructorId}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch {
    // API F1 irraggiungibile: si procede senza queste pagine, il resto
    // della sitemap resta comunque valido.
  }

  // Pagine pilota/team F2/F3 (roster statico).
  for (const cat of CATEGORIES) {
    if (!hasStaticRoster(cat.slug)) continue
    for (const d of getRosterDrivers(cat.slug)) {
      entries.push({
        url: `${SITE_URL}/${cat.slug}/piloti/${d.driverId}`,
        changeFrequency: 'monthly',
        priority: 0.4,
      })
    }
    for (const t of getRosterTeams(cat.slug)) {
      entries.push({
        url: `${SITE_URL}/${cat.slug}/team/${t.constructorId}`,
        changeFrequency: 'monthly',
        priority: 0.4,
      })
    }
  }

  return entries
}
