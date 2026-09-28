// Dati strutturati (JSON-LD) da scrivere dentro un <script> della pagina.
//
// JSON.stringify da solo non basta: se un titolo o un estratto contenessero
// la sequenza "</script>", il browser chiuderebbe li' lo script e il resto
// finirebbe nella pagina come HTML. Il carattere "<" scritto come \u003c
// resta JSON valido e identico per chi lo legge (Google compreso), ma non
// puo' chiudere il tag.
export function jsonLd(dati: unknown): string {
  return JSON.stringify(dati).replace(/</g, '\\u003c')
}
