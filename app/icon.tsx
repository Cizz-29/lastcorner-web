import { promises as fs } from 'node:fs'
import path from 'node:path'

// Favicon del sito: serve lo stesso logo SVG usato nell'header
// (public/images/logo.svg), così l'icona nella tab del browser è identica
// al brand del sito senza duplicare il file. I browser moderni supportano
// le favicon SVG; su quelli molto vecchi resta l'assenza di icona, non un
// errore.
export const contentType = 'image/svg+xml'

export default async function Icon() {
  const svg = await fs.readFile(path.join(process.cwd(), 'public', 'images', 'logo.svg'))
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
