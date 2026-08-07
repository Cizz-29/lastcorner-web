/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Caricatore personalizzato: le immagini degli articoli le ridimensiona
    // Sanity dal suo CDN, non l'ottimizzatore di Vercel. Vedi lib/imageLoader.js
    // per il perche' — in breve, le stavamo elaborando due volte e il tetto
    // gratuito delle trasformazioni si esauriva in un giorno.
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',

    // Meno larghezze possibili: ogni voce di questi elenchi e' una variante
    // in piu' da generare e da tenere in cache. Quelle qui sotto coprono i
    // formati che il sito usa davvero — schermi telefono, tablet, desktop e
    // retina — invece delle sedici predefinite.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [128, 256, 384],

    formats: ['image/avif', 'image/webp'],

    // Con il caricatore personalizzato questi domini non vengono piu' filtrati
    // da Next, ma restano l'elenco di cio' da cui il sito preleva immagini.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },
}

module.exports = nextConfig
