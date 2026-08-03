import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { sanityWriteClient } from '@/lib/sanity/writeClient'
import { STYLE_PROFILE } from '@/lib/ai/styleProfile'
import { parseDraft } from '@/lib/ai/parseDraft'

// Route usata dal tool "Genera Bozza IA" dentro Sanity Studio (/studio).
// Riceve la fonte (testo di una notizia) e una descrizione opzionale
// (es. spunto per un post Instagram), genera una bozza in italiano nello
// stile di Francesco Di Blasi via Claude, e la salva come DRAFT (non
// pubblicato) in Sanity, pronta per la revisione dell'editor.
//
// Richiede la variabile d'ambiente ANTHROPIC_API_KEY su Vercel.

export const dynamic = 'force-dynamic'

const MODEL = 'claude-sonnet-5'
// Quanti articoli reali allegare come esempio di stile. Tre bastano a
// trasmettere ritmo, lessico e struttura senza gonfiare troppo la richiesta.
const NUM_ESEMPI = 3

interface BloccoTesto {
  _type?: string
  style?: string
  children?: { text?: string; marks?: string[] }[]
}

// Riporta il corpo Portable Text di un articolo nel formato testuale che
// chiediamo al modello di produrre (## per i sottotitoli, ** per il
// grassetto): così gli esempi parlano esattamente la stessa lingua
// dell'output atteso.
function bodyToTesto(blocchi: BloccoTesto[] | undefined): string {
  if (!Array.isArray(blocchi)) return ''
  return blocchi
    .filter((b) => b?._type === 'block')
    .map((b) => {
      const testo = (b.children ?? [])
        .map((c) => {
          const t = c.text ?? ''
          return c.marks?.includes('strong') && t.trim() ? `**${t}**` : t
        })
        .join('')
      if (!testo.trim()) return ''
      return b.style === 'h2' || b.style === 'h3' ? `## ${testo}` : testo
    })
    .filter(Boolean)
    .join('\n\n')
}

// Pesca dagli articoli già pubblicati alcuni esempi dello stesso autore,
// preferendo la stessa categoria. È il modo più efficace per trasmettere
// lo stile: il modello imita meglio da esempi reali che da descrizioni.
async function esempiDiStile(autore: string, categoria: string): Promise<string> {
  const query = `*[_type == "article" && author == $autore && defined(body) && count(body) >= 5
      && (!defined($cat) || $cat == "" || category == $cat)]
      | order(publishedAt desc)[0...$n]{ title, body }`
  try {
    let docs = await sanityClient.fetch<{ title: string; body: BloccoTesto[] }[]>(query, {
      autore,
      cat: categoria,
      n: NUM_ESEMPI,
    })
    // Se in quella categoria non ci sono abbastanza pezzi suoi, si allarga
    // a tutte le categorie piuttosto che rinunciare agli esempi.
    if (docs.length < 2) {
      docs = await sanityClient.fetch(query, { autore, cat: '', n: NUM_ESEMPI })
    }
    if (docs.length === 0) return ''

    const blocchi = docs
      .map((d, i) => {
        const corpo = bodyToTesto(d.body)
        if (!corpo) return ''
        return `--- ESEMPIO ${i + 1} ---\nTITOLO: ${d.title}\n\nCORPO:\n${corpo}`
      })
      .filter(Boolean)

    if (blocchi.length === 0) return ''

    return `Di seguito alcuni articoli realmente scritti da ${autore}. Studiali con attenzione: sono il riferimento più affidabile per il ritmo delle frasi, la lunghezza dei paragrafi, il modo di introdurre e riportare le dichiarazioni, il lessico e il tipo di chiusura. Imita questo modo di scrivere, NON il contenuto: i fatti devono venire esclusivamente dalla fonte fornita più sotto.\n\n${blocchi.join('\n\n')}\n\n--- FINE ESEMPI ---\n\n`
  } catch {
    // Se Sanity non risponde si procede comunque con il solo profilo di stile.
    return ''
  }
}

function buildUserPrompt(
  fonte: string,
  descrizione: string | undefined,
  esempi: string
): string {
  const descrizioneBlock = descrizione?.trim()
    ? `Descrizione/spunto fornito dall'editore (es. per un post Instagram):\n${descrizione.trim()}\n\n`
    : ''

  return `${esempi}${descrizioneBlock}Fonte della notizia (può essere in lingua diversa dall'italiano):\n${fonte.trim()}\n\nScrivi una bozza di articolo in italiano su questa notizia, seguendo scrupolosamente lo stile descritto sopra e ricalcando il modo di scrivere degli esempi. Rispondi SOLO nel seguente formato, senza aggiungere altro testo prima o dopo:\n\nTITOLO: <titolo dell'articolo>\n\nCORPO:\n<primo paragrafo>\n\n<secondo paragrafo>\n\n## <eventuale sottotitolo con citazione>\n\n<altri paragrafi>\n\nUsa "**testo**" per il grassetto sulle frasi-clou, come indicato nello stile. Non inventare fatti, nomi o cifre non presenti nella fonte.`
}

// Slug a partire dal titolo, come farebbe Sanity con "Generate": si può
// sempre modificare a mano prima di pubblicare.
function slugFromTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96)
    .replace(/-$/, '')
}

export async function POST(req: Request) {
  try {
    const { fonte, descrizione, categoria, autore } = (await req.json()) as {
      fonte?: string
      descrizione?: string
      categoria?: string
      autore?: string
    }

    if (!fonte || !fonte.trim()) {
      return NextResponse.json({ error: 'Manca il testo della fonte.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY non configurata su Vercel. Aggiungila nelle variabili d\'ambiente del progetto.' },
        { status: 500 }
      )
    }

    const nomeAutore = autore?.trim() || 'Francesco Di Blasi'
    const esempi = await esempiDiStile(nomeAutore, categoria?.trim() || '')

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: STYLE_PROFILE,
        messages: [{ role: 'user', content: buildUserPrompt(fonte, descrizione, esempi) }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      return NextResponse.json({ error: `Errore chiamata Claude: ${errText}` }, { status: 502 })
    }

    const data = await anthropicRes.json()
    const contentBlocks: Array<{ type?: string; text?: string }> = Array.isArray(data?.content) ? data.content : []
    const textBlock = contentBlocks.find((b) => b?.type === 'text' && typeof b.text === 'string' && b.text.length > 0)
    const rawText: string = textBlock?.text ?? ''
    if (!rawText) {
      return NextResponse.json(
        {
          error: 'Risposta vuota dal modello.',
          debug: { stop_reason: data?.stop_reason, blockTypes: contentBlocks.map((b) => b?.type) },
        },
        { status: 502 }
      )
    }

    const { title, blocks } = parseDraft(rawText)

    // La bozza viene precompilata con i campi obbligatori dello schema
    // (slug, categoria, autore, data): senza, l'editor si trova un
    // documento che Sanity rifiuta di pubblicare finché non li riempie a
    // mano uno per uno. Restano tutti modificabili prima della pubblicazione.
    // L'immagine principale non si può indovinare: quella va caricata a mano.
    const draftId = `drafts.ai-${Date.now()}`
    await sanityWriteClient.create({
      _id: draftId,
      _type: 'article',
      title,
      slug: { _type: 'slug', current: slugFromTitle(title) },
      category: categoria?.trim() || 'Formula 1',
      subcategory: 'news',
      author: nomeAutore,
      publishedAt: new Date().toISOString(),
      breaking: false,
      body: blocks,
    })

    const plainId = draftId.replace(/^drafts\./, '')
    const studioUrl = `/studio/intent/edit/id=${plainId};type=article`

    return NextResponse.json({ title, studioUrl })
  } catch (err) {
    return NextResponse.json({ error: `Errore imprevisto: ${(err as Error).message}` }, { status: 500 })
  }
}
