import imageUrlBuilder from '@sanity/image-url'
import { projectId, dataset } from '@/lib/sanity/env'

// Builder puro (nessuna dipendenza React), sicuro da importare sia nei
// componenti server sia nelle utility di query.
const builder = imageUrlBuilder({ projectId, dataset })

export function urlFor(source: any) {
  return builder.image(source)
}

export interface DimensioniImmagine {
  larghezza: number
  altezza: number
}

// Dimensioni originali di un'immagine Sanity, lette dal riferimento stesso.
//
// Sanity scrive le misure dentro l'id dell'asset:
//   image-027401f31c3ac1e6d78c5d539ccd1beff72b9b11-2000x3000-jpg
//                                                  ^^^^^^^^^
// Quindi si ricavano senza interrogare l'API: nessuna query in piu', nessun
// byte di banda in piu'. Serve per mostrare l'immagine nelle sue proporzioni
// reali riservandole lo spazio esatto, cosi' la pagina non salta mentre carica.
//
// Restituisce null se il riferimento non ha il formato atteso (per esempio
// per le vecchie immagini mock con URL diretto): in quel caso chi chiama
// ricade sul comportamento precedente.
export function dimensioniDa(source: any): DimensioniImmagine | null {
  const ref: unknown = source?.asset?._ref ?? source?._ref
  if (typeof ref !== 'string') return null
  const match = ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i)
  if (!match) return null
  const larghezza = Number(match[1])
  const altezza = Number(match[2])
  if (!Number.isFinite(larghezza) || !Number.isFinite(altezza)) return null
  if (larghezza <= 0 || altezza <= 0) return null

  // Se l'immagine e' stata ritagliata nello Studio, il file servito NON ha piu'
  // le misure scritte nell'id: il builder aggiunge un "rect=..." all'URL e la
  // CDN restituisce solo la porzione scelta. Senza tenerne conto passeremmo a
  // next/image proporzioni sbagliate e il browser deformerebbe la foto per
  // farla entrare nel riquadro riservato.
  const crop = source?.crop
  if (crop && typeof crop === 'object') {
    const frazioneOrizzontale = 1 - (Number(crop.left) || 0) - (Number(crop.right) || 0)
    const frazioneVerticale = 1 - (Number(crop.top) || 0) - (Number(crop.bottom) || 0)
    if (frazioneOrizzontale > 0 && frazioneVerticale > 0) {
      return {
        larghezza: Math.max(1, Math.round(larghezza * frazioneOrizzontale)),
        altezza: Math.max(1, Math.round(altezza * frazioneVerticale)),
      }
    }
  }

  return { larghezza, altezza }
}
