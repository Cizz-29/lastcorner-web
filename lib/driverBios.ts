// Testi biografici dei piloti. Da compilare manualmente per ogni pilota:
// finché una entry non viene aggiunta qui, la pagina mostra un placeholder.
// L'unica voce già scritta (Hamilton) serve da esempio di tono e lunghezza.
const PLACEHOLDER =
  'La biografia di questo pilota sarà pubblicata a breve. Torna a trovarci per scoprire il suo percorso in Formula 1.'

export const DRIVER_BIOS: Record<string, string> = {
  hamilton: `Lewis Hamilton è uno dei piloti più vincenti nella storia della Formula 1: sette titoli mondiali conquistati tra il 2008 e il 2020, in coppia con McLaren prima e Mercedes poi, e il record assoluto di vittorie e pole position della categoria. Dopo oltre un decennio da protagonista assoluto del Mondiale, nel 2025 ha scelto una svolta clamorosa nella sua carriera firmando per la Ferrari, coronando un sogno inseguito fin da bambino e aprendo uno dei capitoli più attesi della sua storia sportiva. Conosciuto tanto per l'aggressività in pista quanto per l'impegno fuori, Hamilton resta un punto di riferimento assoluto per una generazione di piloti e per il pubblico della Formula 1 in tutto il mondo.`,
}

export function getDriverBio(driverId: string): string {
  return DRIVER_BIOS[driverId] ?? PLACEHOLDER
}
