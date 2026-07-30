// Converte l'output testuale del modello (formato semplice: riga TITOLO,
// poi paragrafi separati da riga vuota, "## " per i sottotitoli, "**testo**"
// per il grassetto) in un titolo + un array di blocchi Portable Text
// compatibili con lo schema sanity/schemaTypes/article.ts (campo "body").

interface PortableTextSpan {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

interface PortableTextBlock {
  _type: 'block'
  _key: string
  style: 'normal' | 'h3'
  markDefs: []
  children: PortableTextSpan[]
}

let counter = 0
function randomKey(): string {
  counter += 1
  return `k${Date.now().toString(36)}${counter}`
}

function parseInlineBold(text: string): PortableTextSpan[] {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts
    .filter((p) => p.length > 0)
    .map((part, i) => ({
      _type: 'span' as const,
      _key: randomKey(),
      text: part,
      // Le parti dispari (indice 1, 3, 5...) sono quelle catturate dal
      // gruppo **...** nello split, quindi vanno in grassetto.
      marks: i % 2 === 1 ? ['strong'] : [],
    }))
}

export function parseDraft(raw: string): { title: string; blocks: PortableTextBlock[] } {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')

  let title = ''
  let bodyStartIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.toUpperCase().startsWith('TITOLO:')) {
      title = line.slice(line.indexOf(':') + 1).trim()
      bodyStartIndex = i + 1
      break
    }
  }

  const bodyLines = lines.slice(bodyStartIndex).filter((l) => l.trim().toUpperCase() !== 'CORPO:')
  const bodyText = bodyLines.join('\n').trim()

  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const blocks: PortableTextBlock[] = paragraphs.map((p) => {
    const isHeading = p.startsWith('## ')
    const text = isHeading ? p.slice(3).trim() : p
    return {
      _type: 'block',
      _key: randomKey(),
      style: isHeading ? 'h3' : 'normal',
      markDefs: [],
      children: parseInlineBold(text),
    }
  })

  return { title: title || 'Bozza senza titolo', blocks }
}
