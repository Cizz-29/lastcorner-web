// Date e ore mostrate al lettore, sempre nell'ora italiana.
//
// Le pagine si generano sui server di Vercel, che lavorano in UTC: senza il
// fuso esplicito un articolo pubblicato alle 21:30 risulterebbe delle 19:30.

const FORMATO_DATA_ORA = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** "30 settembre 2026, 21:27" */
export function dataOraItaliana(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  // Intl scrive "30 settembre 2026 alle ore 21:27" o "30 settembre 2026, 21:27"
  // a seconda della versione di ICU: si normalizza sulla forma breve.
  return FORMATO_DATA_ORA.format(d).replace(' alle ore ', ', ')
}

/** Minuti di lettura di un corpo Portable Text, a 200 parole al minuto. */
export function minutiDiLettura(blocchi?: any[]): number | undefined {
  if (!Array.isArray(blocchi)) return undefined
  let parole = 0
  for (const b of blocchi) {
    if (b?._type !== 'block' || !Array.isArray(b.children)) continue
    for (const c of b.children) {
      if (typeof c?.text === 'string') parole += c.text.split(/\s+/).filter(Boolean).length
    }
  }
  if (parole === 0) return undefined
  return Math.max(1, Math.round(parole / 200))
}
