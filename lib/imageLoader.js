// Caricatore immagini personalizzato per next/image.
//
// Le foto degli articoli stanno gia' su Sanity, che sa ridimensionarle e
// convertirle in WebP/AVIF da se'. Facendole passare anche dall'ottimizzatore
// di Vercel venivano elaborate due volte, e ogni variante costava a Sanity il
// download dell'originale a piena risoluzione. Qui le richieste vengono
// riscritte perche' sia il suo CDN a fare tutto il lavoro, una volta sola.
//
// Tutto il resto (bandiere, logo, immagini locali) viene restituito com'e':
// sono file piccoli, non vale la pena elaborarli.

const SANITY = 'https://cdn.sanity.io/'

// 75 e' il valore predefinito di Next ed e' un buon compromesso. Era stato
// abbassato a 55 per rientrare nella quota Sanity, salvo poi scoprire dai log
// che le immagini pesavano lo 0,9% del consumo: nessun motivo per tenerle
// compresse.
const QUALITA = 75

export default function imageLoader({ src, width, quality }) {
  if (!src.startsWith(SANITY)) return src

  const url = new URL(src)

  // Se l'indirizzo di partenza chiedeva un ritaglio con proporzioni precise
  // (per esempio 1200x675 per le copertine 16:9), quelle proporzioni vanno
  // mantenute e riscalate: altrimenti si scarica un'immagine piu' alta del
  // necessario, che il riquadro poi taglia comunque via.
  const larghezzaOriginale = Number(url.searchParams.get('w'))
  const altezzaOriginale = Number(url.searchParams.get('h'))

  url.searchParams.set('w', String(width))

  if (larghezzaOriginale > 0 && altezzaOriginale > 0) {
    const altezza = Math.round((width * altezzaOriginale) / larghezzaOriginale)
    url.searchParams.set('h', String(altezza))
    url.searchParams.set('fit', 'crop')
  } else {
    url.searchParams.delete('h')
    // fit=max non ingrandisce mai oltre la risoluzione originale.
    url.searchParams.set('fit', 'max')
  }

  url.searchParams.set('q', String(quality || QUALITA))
  // auto=format serve WebP o AVIF ai browser che li supportano.
  url.searchParams.set('auto', 'format')
  return url.toString()
}
