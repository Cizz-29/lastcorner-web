import { sanityClient } from '@/lib/sanity/client'

// Testi "storia/overview" dei team. Prima si controlla Sanity (documento
// teamBio con lo stesso constructorId, ora con editor a blocchi come gli
// articoli), poi il fallback statico qui sotto, poi il placeholder
// generico. Così i team già scritti a mano restano visibili anche prima
// che qualcuno li ricrei nello Studio.
const PLACEHOLDER =
  'La storia di questo team sarà pubblicata a breve. Torna a trovarci per scoprire il suo percorso in Formula 1.'

export const TEAM_BIOS: Record<string, string> = {
  ferrari: `La Scuderia Ferrari è il team più antico e vincente della storia della Formula 1, presente ininterrottamente sin dal primo Mondiale del 1950. Con oltre 240 vittorie e 16 titoli tra piloti e costruttori, il Cavallino Rampante rappresenta un pezzo di storia dello sport a livello globale, capace di costruire un legame con i propri tifosi — i celebri "tifosi Ferrari" — che va oltre i risultati in pista. Dopo alcune stagioni di ricostruzione, il team di Maranello punta a tornare stabilmente al vertice, forte di un progetto tecnico rinnovato e di una line-up piloti tra le più attese del paddock.`,
}

// Converte un testo semplice (fallback statico o placeholder) nello stesso
// formato Portable Text restituito da Sanity, così il componente di
// rendering (BioBody) ha sempre un solo formato da gestire.
function toBlocks(text: string): any[] {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((paragraph, i) => ({
      _type: 'block',
      _key: `fallback-${i}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: `fallback-${i}-span`, text: paragraph, marks: [] }],
    }))
}

export async function getTeamBio(constructorId: string): Promise<any[]> {
  try {
    const doc = await sanityClient.fetch<{ bio: any } | null>(
      `*[_type == "teamBio" && lower(constructorId) == $id][0]{ bio }`,
      { id: constructorId.toLowerCase() }
    )
    if (Array.isArray(doc?.bio) && doc.bio.length > 0) return doc.bio
  } catch {
    // Sanity irraggiungibile o non ancora configurato: si passa al fallback statico.
  }
  return toBlocks(TEAM_BIOS[constructorId] ?? PLACEHOLDER)
}
