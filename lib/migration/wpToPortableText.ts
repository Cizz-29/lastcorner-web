import { parse, NodeType, type HTMLElement, type Node } from 'node-html-parser'

// Conversione del contenuto Gutenberg (HTML) di WordPress in blocchi
// Portable Text compatibili con lo schema Sanity `article.body`.
// Usata solo dallo script di migrazione una tantum (app/api/migrate-wp).

function randKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

interface InlineResult {
  children: any[]
  markDefs: any[]
}

// Percorre i figli inline di un elemento (testo, <strong>, <em>, <a>, <br>)
// e produce gli span Portable Text con i relativi marks.
function parseInline(el: HTMLElement): InlineResult {
  const children: any[] = []
  const markDefs: any[] = []

  function walk(node: Node, marks: string[]) {
    if (node.nodeType === NodeType.TEXT_NODE) {
      const text = decodeEntities(node.rawText ?? '')
      if (text) children.push({ _type: 'span', _key: randKey(), text, marks: [...marks] })
      return
    }
    if (node.nodeType !== NodeType.ELEMENT_NODE) return
    const elNode = node as HTMLElement
    const tag = elNode.tagName?.toLowerCase()

    if (tag === 'strong' || tag === 'b') {
      elNode.childNodes.forEach((c) => walk(c, [...marks, 'strong']))
    } else if (tag === 'em' || tag === 'i') {
      elNode.childNodes.forEach((c) => walk(c, [...marks, 'em']))
    } else if (tag === 'a') {
      const href = elNode.getAttribute('href') ?? ''
      const key = `link-${randKey()}`
      if (href) markDefs.push({ _type: 'link', _key: key, href })
      elNode.childNodes.forEach((c) => walk(c, href ? [...marks, key] : marks))
    } else if (tag === 'br') {
      children.push({ _type: 'span', _key: randKey(), text: '\n', marks: [...marks] })
    } else {
      elNode.childNodes.forEach((c) => walk(c, marks))
    }
  }

  el.childNodes.forEach((c) => walk(c, []))

  return {
    children: children.length ? children : [{ _type: 'span', _key: randKey(), text: '' }],
    markDefs,
  }
}

function textBlock(style: string, el: HTMLElement, extra: Record<string, any> = {}) {
  const { children, markDefs } = parseInline(el)
  return { _type: 'block', _key: randKey(), style, markDefs, children, ...extra }
}

type ImageUploader = (url: string, filename: string) => Promise<{ _id: string } | null>

// Converte l'HTML del corpo articolo (content.rendered di WP) in blocchi
// Portable Text. uploadImage scarica e carica su Sanity le immagini trovate
// nel testo, restituendo l'asset creato (o null se il download fallisce).
export async function htmlToPortableText(
  html: string,
  uploadImage: ImageUploader,
  slugPrefix: string
): Promise<any[]> {
  const root = parse(html || '')
  const blocks: any[] = []
  let imgCounter = 0

  for (const node of root.childNodes) {
    if (node.nodeType !== NodeType.ELEMENT_NODE) continue
    const el = node as HTMLElement
    const classList = el.getAttribute('class') ?? ''
    const tag = el.tagName?.toLowerCase()

    if (tag === 'p') {
      const block = textBlock('normal', el)
      if (block.children.some((c: any) => c.text?.trim())) blocks.push(block)
    } else if (tag === 'h2') {
      blocks.push(textBlock('h2', el))
    } else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      blocks.push(textBlock('h3', el))
    } else if (tag === 'blockquote') {
      // Le blockquote di Gutenberg avvolgono spesso i paragrafi in <p> interni
      const inner = el.querySelector('p') ?? el
      blocks.push(textBlock('blockquote', inner))
    } else if (tag === 'ul' || tag === 'ol') {
      const listItem = tag === 'ul' ? 'bullet' : 'number'
      el.querySelectorAll('li').forEach((li) => {
        blocks.push(textBlock('normal', li, { listItem, level: 1 }))
      })
    } else if (tag === 'figure' && classList.includes('wp-block-image')) {
      const img = el.querySelector('img')
      const caption = el.querySelector('figcaption')?.text?.trim()
      const src = img?.getAttribute('data-src') || img?.getAttribute('src')
      if (src) {
        imgCounter++
        const asset = await uploadImage(src, `${slugPrefix}-body-${imgCounter}.jpg`)
        if (asset) {
          blocks.push({
            _type: 'image',
            _key: randKey(),
            asset: { _type: 'reference', _ref: asset._id },
            alt: img?.getAttribute('alt') || caption || '',
            ...(caption ? { caption } : {}),
          })
        }
      }
    } else if (tag === 'figure' && classList.includes('wp-block-embed')) {
      const iframe = el.querySelector('iframe')
      const link = el.querySelector('a')
      const url = iframe?.getAttribute('src') || link?.getAttribute('href')
      if (url) blocks.push({ _type: 'embed', _key: randKey(), url })
    } else if (tag === 'img') {
      // Immagine "nuda", senza wrapper <figure> (raro ma possibile)
      const src = el.getAttribute('data-src') || el.getAttribute('src')
      if (src) {
        imgCounter++
        const asset = await uploadImage(src, `${slugPrefix}-body-${imgCounter}.jpg`)
        if (asset) {
          blocks.push({
            _type: 'image',
            _key: randKey(),
            asset: { _type: 'reference', _ref: asset._id },
            alt: el.getAttribute('alt') || '',
          })
        }
      }
    } else {
      // Contenitori generici (wp-block-group, div, section...): si scende di
      // un livello cercando paragrafi/testo diretto invece di scartare il blocco.
      const nestedText = el.text?.trim()
      if (nestedText) {
        const nestedParagraphs = el.querySelectorAll('p')
        if (nestedParagraphs.length > 0) {
          nestedParagraphs.forEach((p) => {
            const block = textBlock('normal', p)
            if (block.children.some((c: any) => c.text?.trim())) blocks.push(block)
          })
        } else {
          blocks.push(textBlock('normal', el))
        }
      }
    }
  }

  return blocks
}
