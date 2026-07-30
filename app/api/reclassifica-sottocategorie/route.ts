import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { sanityWriteClient } from '@/lib/sanity/writeClient'

// Route temporanea (una tantum): gli articoli esistenti non hanno una
// sotto-categoria impostata (campo aggiunto dopo la loro creazione). Questo
// endpoint li classifica automaticamente via Claude Haiku, rispettando il
// vincolo dello schema (sanity/schemaTypes/article.ts): per "Formula 1" e
// "WRC" sono ammesse tutte e 6 le sotto-categorie, per le altre categorie
// solo "news" o "rubriche".
//
// Va chiamata ripetutamente (POST) finché "remaining" non è 0 — ogni
// chiamata processa un piccolo lotto per restare dentro i limiti di
// esecuzione delle funzioni serverless. Una volta finito, va rimossa dal
// repo (stesso destino previsto per app/api/recategorize-wec/route.ts).

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_BATCH_SIZE = 12
const CONCURRENCY = 4

const FULL_OPTIONS = [
  { title: 'News', value: 'news' },
  { title: 'Editoriali', value: 'editoriali' },
  { title: 'Analisi Tecnica', value: 'analisi-tecnica' },
  { title: 'Guide e Approfondimenti', value: 'guide-approfondimenti' },
  { title: 'Rubriche', value: 'rubriche' },
  { title: 'Classifiche', value: 'classifiche' },
]
const LIMITED_OPTIONS = FULL_OPTIONS.filter((o) => o.value === 'news' || o.value === 'rubriche')
const CATEGORIES_WITH_FULL_SUBCATEGORIES = ['Formula 1', 'WRC']

interface ArticleDoc {
  _id: string
  title: string
  category?: string
  excerpt?: string
  body?: Array<{ _type?: string; children?: Array<{ text?: string }> }>
}

function allowedOptionsFor(category: string | undefined) {
  return category && CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(category) ? FULL_OPTIONS : LIMITED_OPTIONS
}

function extractPlainText(body: ArticleDoc['body']): string {
  if (!Array.isArray(body)) return ''
  return body
    .filter((b) => b?._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')
    .slice(0, 600)
}

async function classifyOne(apiKey: string, doc: ArticleDoc): Promise<string | null> {
  const options = allowedOptionsFor(doc.category)
  const optionsList = options.map((o) => `${o.value} (${o.title})`).join(', ')
  const excerpt = doc.excerpt ?? extractPlainText(doc.body)

  const prompt = `Classifica questo articolo di motorsport in UNA delle seguenti sotto-categorie: ${optionsList}.

Titolo: ${doc.title}
Categoria: ${doc.category ?? 'n/d'}
Estratto: ${excerpt || '(non disponibile)'}

Regole:
- "classifiche" solo se l'articolo è un recap/riepilogo di fine weekend con risultati.
- "editoriali" per opinioni/commenti personali dell'autore.
- "analisi-tecnica" per approfondimenti tecnici (aerodinamica, strategia, regolamento).
- "guide-approfondimenti" per contenuti esplicativi/didattici o approfondimenti storici.
- "rubriche" per contenuti ricorrenti di rubrica non tecnici.
- "news" per notizie di cronaca semplice, quando nessuna delle altre si applica.

Rispondi SOLO con il valore esatto della sotto-categoria scelta (es. "news"), senza altro testo.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 20,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const blocks: Array<{ type?: string; text?: string }> = Array.isArray(data?.content) ? data.content : []
  const textBlock = blocks.find((b) => b?.type === 'text' && typeof b.text === 'string')
  const raw = (textBlock?.text ?? '').trim().toLowerCase().replace(/[^a-z-]/g, '')

  const match = options.find((o) => o.value === raw)
  return match ? match.value : options[0].value // fallback prudente: la prima opzione ammessa (news)
}

export async function GET() {
  const remaining = await sanityClient.fetch<number>(
    `count(*[_type == "article" && !defined(subcategory)])`
  )
  return NextResponse.json({ remaining })
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurata su Vercel.' }, { status: 500 })
  }

  let batchSize = DEFAULT_BATCH_SIZE
  try {
    const body = await req.json()
    if (typeof body?.batchSize === 'number' && body.batchSize > 0) {
      batchSize = Math.min(body.batchSize, 40)
    }
  } catch {
    // nessun body: usa il default
  }

  const docs = await sanityClient.fetch<ArticleDoc[]>(
    `*[_type == "article" && !defined(subcategory)][0...${batchSize}]{ _id, title, category, excerpt, body }`
  )

  const results: Array<{ id: string; title: string; subcategory: string }> = []

  for (let i = 0; i < docs.length; i += CONCURRENCY) {
    const chunk = docs.slice(i, i + CONCURRENCY)
    const classified = await Promise.all(
      chunk.map(async (doc) => {
        const value = await classifyOne(apiKey, doc)
        return { doc, value }
      })
    )
    for (const { doc, value } of classified) {
      if (!value) continue
      await sanityWriteClient.patch(doc._id).set({ subcategory: value }).commit()
      results.push({ id: doc._id, title: doc.title, subcategory: value })
    }
  }

  const remaining = await sanityClient.fetch<number>(
    `count(*[_type == "article" && !defined(subcategory)])`
  )

  return NextResponse.json({ processed: results.length, remaining, results })
}
