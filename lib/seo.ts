import type { Metadata } from 'next'
import type { CategoryConfig } from '@/lib/categories'

// Metadati di pagina in un posto solo.
//
// Fino al 30 settembre 2026 le pagine che non erano articoli dichiaravano
// solo il titolo. Tutto il resto lo ereditavano dal layout: la description
// generica della home, e soprattutto og:url fisso sulla home. Chi
// condivideva la scheda di Leclerc su WhatsApp o Facebook vedeva l'anteprima
// della home, e Facebook attribuiva la condivisione alla home. Su X anche gli
// articoli comparivano come "Lastcorner", perche' il layout fissava
// twitter:title e X legge quello prima di og:title.
//
// Qui ogni pagina dichiara titolo, description, canonical e anteprime social
// coerenti fra loro. Attenzione: in Next un campo "openGraph" o "twitter" di
// pagina sostituisce per intero quello del layout, non lo completa. Per
// questo il helper scrive sempre anche siteName, locale e type.

export const SITE_URL = 'https://lastcorner.net'
export const NOME_SITO = 'Lastcorner'

/** Immagine di riserva per le anteprime social delle pagine senza foto
 *  propria: quella generata da app/opengraph-image.tsx, 1200x630. */
const IMMAGINE_SITO = { url: '/opengraph-image', width: 1200, height: 630, alt: 'Lastcorner' }

export const FEED_RSS = { 'application/rss+xml': [{ url: '/feed.xml', title: 'Lastcorner' }] }

export interface ImmagineSocial {
  url: string
  width?: number
  height?: number
  alt?: string
}

interface OpzioniMetadati {
  /** Titolo della pagina, senza " | Lastcorner": lo aggiunge il template del layout. */
  titolo: string
  /** true per non far aggiungere il suffisso (articoli, home). */
  titoloAssoluto?: boolean
  descrizione: string
  /** Percorso della pagina, es. "/formula-1/piloti/leclerc". Diventa canonical e og:url. */
  percorso: string
  immagine?: ImmagineSocial
  tipo?: 'website' | 'article' | 'profile'
  /** false solo per le pagine da tenere fuori dall'indice (ricerca). */
  indicizzabile?: boolean
  /** Campi Open Graph in piu', per esempio publishedTime degli articoli. */
  openGraphExtra?: Record<string, unknown>
}

/** Accorcia una description a una lunghezza che Google mostra per intero,
 *  tagliando su uno spazio e non a meta' parola. */
export function descrizioneBreve(testo: string, massimo = 158): string {
  const pulito = testo.replace(/\s+/g, ' ').trim()
  if (pulito.length <= massimo) return pulito
  const taglio = pulito.slice(0, massimo - 1)
  const spazio = taglio.lastIndexOf(' ')
  return `${taglio.slice(0, spazio > 80 ? spazio : taglio.length).replace(/[,;:.\s]+$/, '')}…`
}

export function metadati(o: OpzioniMetadati): Metadata {
  const titoloCompleto = o.titoloAssoluto ? o.titolo : `${o.titolo} | ${NOME_SITO}`
  const descrizione = descrizioneBreve(o.descrizione)
  const immagine = o.immagine ?? IMMAGINE_SITO
  const immagini = [
    {
      url: immagine.url,
      width: immagine.width ?? 1200,
      height: immagine.height ?? 675,
      alt: immagine.alt ?? o.titolo,
    },
  ]
  return {
    title: o.titoloAssoluto ? { absolute: o.titolo } : o.titolo,
    description: descrizione,
    // Il canonical di pagina sostituisce l'intero "alternates" del layout,
    // quindi il link al feed RSS va ripetuto qui.
    alternates: { canonical: o.percorso, types: FEED_RSS },
    openGraph: {
      title: titoloCompleto,
      description: descrizione,
      url: o.percorso,
      siteName: NOME_SITO,
      locale: 'it_IT',
      type: o.tipo ?? 'website',
      images: immagini,
      ...(o.openGraphExtra ?? {}),
    } as Metadata['openGraph'],
    twitter: {
      card: 'summary_large_image',
      site: '@Lastcorner_F1',
      title: titoloCompleto,
      description: descrizione,
      images: immagini.map((i) => i.url),
    },
    // Si scrive solo per chiudere: una pagina indicizzabile eredita dal
    // layout anche max-image-preview:large, che serve a Discover, e un
    // "robots" di pagina lo cancellerebbe.
    ...(o.indicizzabile === false ? { robots: { index: false, follow: true } } : {}),
  }
}

/** Nome breve della categoria da usare nei titoli: "F1" invece di
 *  "Formula 1" dove lo spazio conta. */
export function sigla(config: CategoryConfig): string {
  if (config.slug === 'formula-1') return 'F1'
  if (config.slug === 'formula-2') return 'F2'
  if (config.slug === 'formula-3') return 'F3'
  return config.label
}

const DESCRIZIONI_SOTTOCATEGORIA: Record<string, (label: string) => string> = {
  'analisi-tecnica': (l) =>
    `Analisi tecniche ${l}: aggiornamenti delle vetture, aerodinamica, motori e regolamento spiegati da Lastcorner.`,
  editoriali: (l) => `Editoriali ${l}: le opinioni di Lastcorner su fatti, retroscena e protagonisti della stagione.`,
  'guide-approfondimenti': (l) =>
    `Guide e approfondimenti ${l}: regolamento, costi, record, tecnica e tutto quello che serve per capire il campionato.`,
  rubriche: (l) => `Rubriche ${l}: le pagelle dopo ogni gara e gli appuntamenti fissi di Lastcorner.`,
}

/** Metadati delle pagine di sotto-categoria e della loro paginazione. */
export function metadatiSottocategoria(
  config: CategoryConfig,
  sotto: { slug: string; label: string },
  pagina?: number
): Metadata {
  const base = `/${config.slug}/${sotto.slug}`
  const descrizione =
    DESCRIZIONI_SOTTOCATEGORIA[sotto.slug]?.(config.label) ??
    `${sotto.label} di ${config.label} su Lastcorner.`
  return metadati({
    titolo: pagina && pagina > 1 ? `${sotto.label} ${config.label}, pagina ${pagina}` : `${sotto.label} ${config.label}`,
    descrizione: pagina && pagina > 1 ? `${descrizione} Pagina ${pagina}.` : descrizione,
    percorso: pagina && pagina > 1 ? `${base}/page/${pagina}` : base,
  })
}

/** Metadati della pagina categoria e della sua paginazione. */
export function metadatiCategoria(config: CategoryConfig, pagina?: number): Metadata {
  const titolo =
    config.slug === 'altro'
      ? 'Altro motorsport: notizie e approfondimenti'
      : `Notizie ${config.label}: news, risultati e analisi`
  const descrizione =
    config.slug === 'altro'
      ? 'Notizie dal resto del motorsport raccontate da Lastcorner: gare, protagonisti e storie fuori dai campionati principali.'
      : `Tutte le notizie di ${config.label} aggiornate ogni giorno: risultati, mercato piloti, dichiarazioni, analisi tecniche e approfondimenti.`
  return metadati({
    titolo: pagina && pagina > 1 ? `${titolo}, pagina ${pagina}` : titolo,
    descrizione: pagina && pagina > 1 ? `${descrizione} Pagina ${pagina}.` : descrizione,
    percorso: pagina && pagina > 1 ? `/${config.slug}/page/${pagina}` : `/${config.slug}`,
  })
}
