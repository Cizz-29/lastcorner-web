// Testi "storia/overview" dei team. Da compilare manualmente per ogni team:
// finché una entry non viene aggiunta qui, la pagina mostra un placeholder.
// L'unica voce già scritta (Ferrari) serve da esempio di tono e lunghezza.
const PLACEHOLDER =
  'La storia di questo team sarà pubblicata a breve. Torna a trovarci per scoprire il suo percorso in Formula 1.'

export const TEAM_BIOS: Record<string, string> = {
  ferrari: `La Scuderia Ferrari è il team più antico e vincente della storia della Formula 1, presente ininterrottamente sin dal primo Mondiale del 1950. Con oltre 240 vittorie e 16 titoli tra piloti e costruttori, il Cavallino Rampante rappresenta un pezzo di storia dello sport a livello globale, capace di costruire un legame con i propri tifosi — i celebri "tifosi Ferrari" — che va oltre i risultati in pista. Dopo alcune stagioni di ricostruzione, il team di Maranello punta a tornare stabilmente al vertice, forte di un progetto tecnico rinnovato e di una line-up piloti tra le più attese del paddock.`,
}

export function getTeamBio(constructorId: string): string {
  return TEAM_BIOS[constructorId] ?? PLACEHOLDER
}
