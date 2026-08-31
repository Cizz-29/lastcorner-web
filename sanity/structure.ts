import type { StructureResolver } from 'sanity/structure'
import { CATEGORIES } from '../lib/categories'
import { TAG_REDIRECTS } from '../lib/tagRedirects'
import { getRosterDrivers, getRosterTeams } from '../lib/rosterData'

// Organizzazione del menu di Sanity Studio.
//
// Di serie lo Studio mostra un unico elenco piatto con tutti gli articoli:
// con oltre 400 documenti diventa scomodo. Qui si aggiungono viste
// filtrate per categoria, sotto-categoria e pilota/team, più la lista
// delle bozze non ancora pubblicate.

const SUBCATEGORIES = [
  { value: 'news', title: 'News' },
  { value: 'editoriali', title: 'Editoriali' },
  { value: 'analisi-tecnica', title: 'Analisi Tecnica' },
  { value: 'guide-approfondimenti', title: 'Guide e Approfondimenti' },
  { value: 'rubriche', title: 'Rubriche' },
  { value: 'classifiche', title: 'Classifiche' },
]

const ORDER_RECENTI = [{ field: 'publishedAt', direction: 'desc' as const }]

/** Piloti F1 ricavati dalla mappa dei tag (l'API live non è disponibile qui). */
function pilotiF1(): { id: string; nome: string }[] {
  const visti = new Set<string>()
  const out: { id: string; nome: string }[] = []
  for (const [slug, dest] of Object.entries(TAG_REDIRECTS)) {
    if (!dest.startsWith('/formula-1/piloti/')) continue
    const id = dest.split('/').pop() as string
    if (visti.has(id)) continue
    visti.add(id)
    out.push({
      id,
      nome: slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
    })
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome))
}

function teamF1(): { id: string; nome: string }[] {
  const visti = new Set<string>()
  const out: { id: string; nome: string }[] = []
  for (const [slug, dest] of Object.entries(TAG_REDIRECTS)) {
    if (!dest.startsWith('/formula-1/team/')) continue
    const id = dest.split('/').pop() as string
    if (visti.has(id)) continue
    visti.add(id)
    out.push({
      id,
      nome: slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
    })
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenuti')
    .items([
      // --- Articoli -------------------------------------------------------
      S.listItem()
        .title('Articoli')
        .child(
          S.list()
            .title('Articoli')
            .items([
              S.listItem()
                .title('Tutti gli articoli')
                .child(
                  S.documentTypeList('article')
                    .title('Tutti gli articoli')
                    .defaultOrdering(ORDER_RECENTI)
                ),

              S.listItem()
                .title('Bozze da pubblicare')
                .child(
                  S.documentList()
                    .title('Bozze da pubblicare')
                    .filter('_type == "article" && _id in path("drafts.**")')
                    .defaultOrdering(ORDER_RECENTI)
                ),

              S.divider(),

              S.listItem()
                .title('Per categoria')
                .child(
                  S.list()
                    .title('Per categoria')
                    .items(
                      CATEGORIES.map((c) =>
                        S.listItem()
                          .title(c.label)
                          .child(
                            S.documentTypeList('article')
                              .title(c.label)
                              .filter('_type == "article" && category == $cat')
                              .params({ cat: c.label })
                              .defaultOrdering(ORDER_RECENTI)
                          )
                      )
                    )
                ),

              S.listItem()
                .title('Per sotto-categoria')
                .child(
                  S.list()
                    .title('Per sotto-categoria')
                    .items([
                      ...SUBCATEGORIES.map((s) =>
                        S.listItem()
                          .title(s.title)
                          .child(
                            S.documentTypeList('article')
                              .title(s.title)
                              .filter('_type == "article" && subcategory == $sub')
                              .params({ sub: s.value })
                              .defaultOrdering(ORDER_RECENTI)
                          )
                      ),
                      S.divider(),
                      S.listItem()
                        .title('Senza sotto-categoria')
                        .child(
                          S.documentTypeList('article')
                            .title('Senza sotto-categoria')
                            .filter('_type == "article" && !defined(subcategory)')
                            .defaultOrdering(ORDER_RECENTI)
                        ),
                    ])
                ),

              S.divider(),

              S.listItem()
                .title('Per pilota')
                .child(
                  S.list()
                    .title('Per pilota')
                    .items([
                      S.listItem()
                        .title('Formula 1')
                        .child(
                          S.list()
                            .title('Piloti Formula 1')
                            .items(
                              pilotiF1().map((p) =>
                                S.listItem()
                                  .id(p.id)
                                  .title(p.nome)
                                  .child(
                                    S.documentTypeList('article')
                                      .title(p.nome)
                                      .filter('_type == "article" && $tag in tags')
                                      .params({ tag: p.id })
                                      .defaultOrdering(ORDER_RECENTI)
                                  )
                              )
                            )
                        ),
                      ...['formula-2', 'formula-3'].map((cat) =>
                        S.listItem()
                          .id(`piloti-${cat}`)
                          .title(cat === 'formula-2' ? 'Formula 2' : 'Formula 3')
                          .child(
                            S.list()
                              .title(cat === 'formula-2' ? 'Piloti Formula 2' : 'Piloti Formula 3')
                              .items(
                                getRosterDrivers(cat).map((d) =>
                                  S.listItem()
                                    .id(`${cat}-${d.driverId}`)
                                    .title(`${d.givenName} ${d.familyName}`)
                                    .child(
                                      S.documentTypeList('article')
                                        .title(`${d.givenName} ${d.familyName}`)
                                        .filter('_type == "article" && $tag in tags')
                                        .params({ tag: d.driverId })
                                        .defaultOrdering(ORDER_RECENTI)
                                    )
                                )
                              )
                          )
                      ),
                    ])
                ),

              S.listItem()
                .title('Per team')
                .child(
                  S.list()
                    .title('Per team')
                    .items([
                      S.listItem()
                        .title('Formula 1')
                        .child(
                          S.list()
                            .title('Team Formula 1')
                            .items(
                              teamF1().map((t) =>
                                S.listItem()
                                  .id(t.id)
                                  .title(t.nome)
                                  .child(
                                    S.documentTypeList('article')
                                      .title(t.nome)
                                      .filter('_type == "article" && $tag in tags')
                                      .params({ tag: t.id })
                                      .defaultOrdering(ORDER_RECENTI)
                                  )
                              )
                            )
                        ),
                      S.listItem()
                        .title('Formula 2 / Formula 3')
                        .child(
                          S.list()
                            .title('Team F2 / F3')
                            .items(
                              getRosterTeams('formula-2').map((t) =>
                                S.listItem()
                                  .id(`team-${t.constructorId}`)
                                  .title(t.name)
                                  .child(
                                    S.documentTypeList('article')
                                      .title(t.name)
                                      .filter('_type == "article" && $tag in tags')
                                      .params({ tag: t.constructorId })
                                      .defaultOrdering(ORDER_RECENTI)
                                  )
                              )
                            )
                        ),
                      S.divider(),
                      S.listItem()
                        .title('Senza tag')
                        .child(
                          S.documentTypeList('article')
                            .title('Articoli senza tag')
                            .filter('_type == "article" && (!defined(tags) || count(tags) == 0)')
                            .defaultOrdering(ORDER_RECENTI)
                        ),
                    ])
                ),
            ])
        ),

      S.divider(),

      // --- Biografie ------------------------------------------------------
      S.listItem()
        .title('Bio pilota')
        .child(S.documentTypeList('driverBio').title('Bio pilota')),
      S.listItem()
        .title('Bio team')
        .child(S.documentTypeList('teamBio').title('Bio team')),
      S.listItem()
        .title('Bio autore')
        .child(S.documentTypeList('authorBio').title('Bio autore')),
    ])
