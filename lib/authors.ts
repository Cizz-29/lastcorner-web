// Utility per le pagine autore (/autori/[slug]).
// Il campo "author" su ogni articolo è una semplice stringa (es. "Francesco Di
// Blasi"), non un riferimento Sanity: lo slug della pagina si ricava quindi
// normalizzando il nome, senza bisogno di un documento "autore" a parte.

export function authorSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
