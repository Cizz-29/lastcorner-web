// Reindirizzamenti dai vecchi indirizzi /tag/<slug> di WordPress.
//
// Sul vecchio sito ogni pilota e ogni team aveva una pagina /tag/<nome>,
// che conteneva la biografia (poi importata nelle schede del nuovo sito).
// Quelle pagine sono indicizzate su Google: senza un reindirizzamento
// esplicito finirebbero su un 404, perdendo il posizionamento accumulato.
//
// Le chiavi sono gli slug WordPress (nome completo), i valori il percorso
// corrispondente sul nuovo sito. Per i tag non elencati il middleware
// ripiega sulla ricerca interna, che è comunque meglio di un errore.

export const TAG_REDIRECTS: Record<string, string> = {
  // --- Piloti Formula 1 2026 ---
  'andrea-kimi-antonelli': '/formula-1/piloti/antonelli',
  'kimi-antonelli': '/formula-1/piloti/antonelli',
  'lewis-hamilton': '/formula-1/piloti/hamilton',
  'george-russell': '/formula-1/piloti/russell',
  'charles-leclerc': '/formula-1/piloti/leclerc',
  'lando-norris': '/formula-1/piloti/norris',
  'max-verstappen': '/formula-1/piloti/max_verstappen',
  'oscar-piastri': '/formula-1/piloti/piastri',
  'isack-hadjar': '/formula-1/piloti/hadjar',
  'liam-lawson': '/formula-1/piloti/lawson',
  'pierre-gasly': '/formula-1/piloti/gasly',
  'arvid-lindblad': '/formula-1/piloti/arvid_lindblad',
  'franco-colapinto': '/formula-1/piloti/colapinto',
  'oliver-bearman': '/formula-1/piloti/bearman',
  'gabriel-bortoleto': '/formula-1/piloti/bortoleto',
  'carlos-sainz': '/formula-1/piloti/sainz',
  'alexander-albon': '/formula-1/piloti/albon',
  'alex-albon': '/formula-1/piloti/albon',
  'esteban-ocon': '/formula-1/piloti/ocon',
  'nico-hulkenberg': '/formula-1/piloti/hulkenberg',
  'fernando-alonso': '/formula-1/piloti/alonso',
  'lance-stroll': '/formula-1/piloti/stroll',
  'valtteri-bottas': '/formula-1/piloti/bottas',
  'sergio-perez': '/formula-1/piloti/perez',

  // --- Team Formula 1 ---
  ferrari: '/formula-1/team/ferrari',
  'scuderia-ferrari': '/formula-1/team/ferrari',
  mercedes: '/formula-1/team/mercedes',
  mclaren: '/formula-1/team/mclaren',
  'red-bull': '/formula-1/team/red_bull',
  'red-bull-racing': '/formula-1/team/red_bull',
  'aston-martin': '/formula-1/team/aston_martin',
  alpine: '/formula-1/team/alpine',
  williams: '/formula-1/team/williams',
  haas: '/formula-1/team/haas',
  'haas-f1-team': '/formula-1/team/haas',
  audi: '/formula-1/team/audi',
  cadillac: '/formula-1/team/cadillac',
  'racing-bulls': '/formula-1/team/rb',
  rb: '/formula-1/team/rb',

  // --- Categorie (i tag di campionato portano alla sezione) ---
  'formula-1': '/formula-1',
  f1: '/formula-1',
  'formula-2': '/formula-2',
  f2: '/formula-2',
  'formula-3': '/formula-3',
  f3: '/formula-3',
  'f1-academy': '/f1-academy',
  wrc: '/wrc',
  'formula-e': '/altro',
}

/** Percorso di destinazione per un vecchio tag, o null se sconosciuto. */
export function tagRedirectFor(slug: string): string | null {
  return TAG_REDIRECTS[slug.toLowerCase()] ?? null
}
