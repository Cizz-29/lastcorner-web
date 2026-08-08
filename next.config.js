/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Caricatore personalizzato: le immagini degli articoli le ridimensiona
    // Sanity dal suo CDN, non l'ottimizzatore di Vercel. Vedi lib/imageLoader.js.
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',

    // Larghezze generate. Il tetto e' fermo a 828 pixel: sotto la meta' dei
    // 1920 che venivano richiesti prima da ogni telefono ad alta densita'.
    // E' una scelta di emergenza per restare dentro la quota Sanity fino al
    // primo del mese: su uno schermo retina da scrivania le copertine grandi
    // risulteranno un po' morbide. Da riportare a 1200 quando la quota si
    // azzera.
    deviceSizes: [640, 828],
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
