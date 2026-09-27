import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CategoryListing from '@/components/CategoryListing'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'
import { getAllArticles } from '@/lib/sanity/articles'
import { paginaDaSegmento, paginePerGenerazioneStatica } from '@/lib/paginazione'

// Aggiornamento a tempo, una volta l'ora al massimo e solo se qualcuno apre
// la pagina. Quando esce un articolo nuovo tutte le pagine dell'elenco
// scorrono di un posto, ma il webhook di Sanity non puo' invalidarle: con
// dynamicParams = false (qui sotto) in Next 14 una rotta invalidata su
// richiesta si rigenera come 404. A tempo invece funziona. Per la Formula 1
// e' lo stesso ritmo di prima, quando lo imponeva il widget classifica.
export const revalidate = 3600

// Solo le pagine generate qui sotto esistono. Senza questa riga un indirizzo
// inventato come /formula-1/page/842 farebbe partire una funzione che scarica
// l'elenco completo degli articoli per poi scoprire che non c'e' nulla da
// mostrare: esattamente il consumo che questa modifica vuole eliminare. Cosi'
// invece risponde 404 senza eseguire niente.
export const dynamicParams = false

interface PageProps {
  params: { category: string; n: string }
}

export async function generateStaticParams() {
  const articoli = await getAllArticles()
  return CATEGORIES.flatMap((c) => {
    const dellaCategoria = articoli.filter((a) => a.category === c.label)
    return paginePerGenerazioneStatica(dellaCategoria.length).map((n) => ({
      category: c.slug,
      n: String(n),
    }))
  })
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Categoria non trovata' }
  return {
    title: `${config.label} — pagina ${params.n}`,
    // Le pagine oltre la prima non aggiungono nulla all'indice: sono le stesse
    // notizie, piu' vecchie. Restano navigabili dai lettori e percorribili dai
    // crawler (follow), ma fuori dai risultati.
    robots: { index: false, follow: true },
  }
}

export default function CategoryPaginaPage({ params }: PageProps) {
  const pagina = paginaDaSegmento(params.n)
  if (!pagina || !getCategoryConfig(params.category)) notFound()
  return <CategoryListing categorySlug={params.category} pagina={pagina} />
}
