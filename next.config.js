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
    // Il tetto e' a 828 come misura d'emergenza per restare dentro la quota
    // Sanity fino al primo del mese: sulle copertine grandi da scrivania si
    // perde un po' di nitidezza. Da riportare a 1200 quando la quota si azzera.
    deviceSizes: [256, 384, 640, 828],
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
