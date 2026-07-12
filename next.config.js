/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Elenco esplicito degli host consentiti per next/image invece del
    // wildcard '**' (che disattiva di fatto il controllo di sicurezza
    // e l'ottimizzazione). Aggiungere qui il dominio Sanity/CDN quando
    // verrà collegato il CMS (es. 'cdn.sanity.io').
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
