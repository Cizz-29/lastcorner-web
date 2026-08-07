// Caricatore immagini personalizzato per next/image.
//
// Le foto degli articoli stanno gia' su Sanity, che sa ridimensionarle e
// convertirle in WebP/AVIF da se', senza limiti e senza costi. Facendole
// passare anche dall'ottimizzatore di Vercel le si elaborava due volte, e
// ogni larghezza contava come una "trasformazione": con qualche centinaio
// di articoli e i motori di ricerca che scansionano, il tetto del piano
// gratuito si esaurisce in un giorno.
//
// Qui le richieste per Sanity vengono riscritte perche' sia il suo CDN a
// fare il lavoro. Tutto il resto (bandiere, logo, immagini locali) viene
// restituito com'e': sono file piccoli, per cui non vale la pena elaborare
// nulla.

const SANITY = 'https://cdn.sanity.io/'

export default function imageLoader({ src, width, quality }) {
  if (!src.startsWith(SANITY)) return src

  const url = new URL(src)
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality || 75))
  // auto=format serve WebP o AVIF ai browser che li supportano;
  // fit=max non ingrandisce mai oltre la risoluzione originale.
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'max')
  return url.toString()
}
