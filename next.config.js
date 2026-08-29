/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Caricatore personalizzato: le immagini degli articoli le ridimensiona
    // Sanity dal suo CDN, non l'ottimizzatore di Vercel. Vedi lib/imageLoader.js.
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',

    // Larghezze generate.
    //
    // I valori piccoli in cima all'elenco sono la parte importante: tutte le
    // immagini del sito usano "fill", e per quelle Next costruisce il
    // srcset SOLTANTO da deviceSizes, ignorando imageSizes. Fermandosi a
    // [640, 828] una miniatura larga 140 pixel scaricava comunque un file da
    // 828: quasi dieci volte i pixel necessari. Con 256 e 384 disponibili,
    // ogni immagine scarica la misura giusta.
    //
    // Il tetto e' a 1600 per una ragione precisa: Google Discover mostra solo
    // contenuti con un'immagine da almeno 1200 pixel di larghezza. Fermandosi
    // esattamente a 1200 si starebbe sul filo; 1600 lascia margine. Il costo
    // di banda oggi e' irrilevante — dopo la correzione delle query siamo
    // sotto i 10 MB al giorno.
    deviceSizes: [256, 384, 640, 828, 1200, 1600],
    imageSizes: [128, 256, 384],

    formats: ['image/avif', 'image/webp'],

    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },
}

module.exports = nextConfig
