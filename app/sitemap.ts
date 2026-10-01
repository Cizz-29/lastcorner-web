import type { MetadataRoute } from 'next'
import { CATEGORIES } from '@/lib/categories'
import { getAllArticles } from '@/lib/sanity/articles'
import { getDriverStandings, getConstructorStandings } from '@/lib/f1api'
import { getRosterDrivers, getRosterTeams, hasStaticRoster } from '@/lib/rosterData'
import { getSubcategoryPagesForCategory } from '@/lib/subcategories'
import { authorSlug } from '@/lib/authors'
import { weekendTelemetria } from '@/lib/telemetria'

const SITE_URL = 'https://lastcorner.net'

// Sitemap generata dinamicamente da tutto il contenuto reale del sito:
// pagine statiche, categorie (+ classifica/calendario dove esistono),
// articoli Sanity, e pagine piloti/team (F1 da dati live, F2/F3 da
// roster statico). WEC/WRC non hanno pagine pilota/team individuali
// (nessuna fonte dati affidabile), quindi non vengono incluse.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles()

  // Data vera dell'ultima modifica, presa da Sanity (_updatedAt). Prima ogni
  // articolo aveva "new Date()": tutti e 627 risultavano modificati nello
  // stesso secondo, quello in cui si generava la sitemap. Google se ne
  // accorge e smette di fidarsi del campo, anche per i pezzi aggiornati davvero.
  const dataDi = (a: { updatedAt?: string; publishedAt?: string }) => {
    const iso = a.updatedAt ?? a.publishedAt
    const d = iso ? new Date(iso) : undefined
    return d && !Number.isNaN(d.getTime()) ? d : undefined
  }
  const ultimaModifica = articles.map(dataDi).filter(Boolean).sort((x, y) => y!.getTime() - x!.getTime())[0]

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: ultimaModifica,
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

    // Sotto-categorie (editoriali, analisi tecnica, guide, rubriche): pagine
    // vere, nel menu, ma fino a settembre 2026 assenti dalla sitemap.
    for (const sotto of getSubcategoryPagesForCategory(cat.slug)) {
      entries.push({
        url: `${SITE_URL}/${cat.slug}/${sotto.slug}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }

    if (cat.hasPiloti ?? true) {
      entries.push({
        url: `${SITE_URL}/${cat.slug}/piloti`,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
    if (cat.hasTeam ?? true) {
      entries.push({
        url: `${SITE_URL}/${cat.slug}/team`,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
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
  for (const article of articles) {
    entries.push({
      url: `${SITE_URL}/${article.slug}`,
      lastModified: dataDi(article),
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  // Pagine autore: una per firma, con la data del suo ultimo pezzo.
  const autori = new Map<string, Date | undefined>()
  for (const article of articles) {
    if (!article.author?.trim()) continue
    const slug = authorSlug(article.author)
    if (!slug || autori.has(slug)) continue // l'elenco e' gia' dal piu' recente
    autori.set(slug, dataDi(article))
  }
  for (const [slug, data] of Array.from(autori)) {
    entries.push({
      url: `${SITE_URL}/autori/${slug}`,
      lastModified: data,
      changeFrequency: 'weekly',
      priority: 0.4,
    })
  }

  // Telemetria: l'indice e un weekend per pagina.
  const weekend = await weekendTelemetria()
  if (weekend.length > 0) {
    entries.push({ url: `${SITE_URL}/telemetria`, changeFrequency: 'weekly', priority: 0.7 })
    for (const w of weekend) {
      entries.push({
        url: `${SITE_URL}/telemetria/${w.year}/${w.round}`,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
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
