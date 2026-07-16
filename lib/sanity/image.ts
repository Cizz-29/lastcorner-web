import imageUrlBuilder from '@sanity/image-url'
import { projectId, dataset } from '@/lib/sanity/env'

// Builder puro (nessuna dipendenza React), sicuro da importare sia nei
// componenti server sia nelle utility di query.
const builder = imageUrlBuilder({ projectId, dataset })

export function urlFor(source: any) {
  return builder.image(source)
}
