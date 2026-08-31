import { cache } from 'react'
import { sanityClient } from '@/lib/sanity/client'
import { authorSlug } from '@/lib/authors'

export interface ProfiloSocial {
  piattaforma: string
  url: string
}

export interface SchedaAutore {
  nome: string
  ruolo?: string
  foto?: any
  bio?: any[]
  social?: ProfiloSocial[]
  email?: string
}

// Tutte le schede autore. Sono pochi documenti (un pugno di redattori), quindi
// si prendono in blocco e si abbina in JavaScript invece di interrogare Sanity
// per slug: GROQ non sa normalizzare un nome (minuscole, accenti, spazi) allo
// stesso modo di authorSlug(), e avere due normalizzazioni diverse che devono
// restare d'accordo e' esattamente il tipo di cosa che si rompe in silenzio.
const QUERY = `*[_type == "authorBio" && defined(fullName)]{
  fullName, role, photo, bio, social, email
}`

const tutteLeSchede = cache(async (): Promise<SchedaAutore[]> => {
  try {
    const docs = await sanityClient.fetch<any[]>(QUERY)
    return docs.map((d) => ({
      nome: d.fullName,
      ruolo: d.role,
      foto: d.photo,
      bio: d.bio,
      social: Array.isArray(d.social)
        ? d.social.filter((s: any) => s?.piattaforma && s?.url)
        : undefined,
      email: d.email,
    }))
  } catch {
    // Sanity irraggiungibile: la pagina autore mostra comunque gli articoli,
    // semplicemente senza scheda.
    return []
  }
})

/** Scheda dell'autore corrispondente allo slug, se esiste. */
export const getSchedaAutore = cache(async (slug: string): Promise<SchedaAutore | null> => {
  const schede = await tutteLeSchede()
  return schede.find((s) => authorSlug(s.nome) === slug) ?? null
})
