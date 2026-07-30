import { NextResponse } from 'next/server'
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

function buildUserPrompt(fonte: string, descrizione: string | undefined): string {
  const descrizioneBlock = descrizione?.trim()
    ? `Descrizione/spunto fornito dall'editore (es. per un post Instagram):\n${descrizione.trim()}\n\n`
    : ''

  return `${descrizioneBlock}Fonte della notizia (può essere in lingua diversa dall'italiano):\n${fonte.trim()}\n\nScrivi una bozza di articolo in italiano su questa notizia, seguendo scrupolosamente lo stile descritto sopra. Rispondi SOLO nel seguente formato, senza aggiungere altro testo prima o dopo:\n\nTITOLO: <titolo dell'articolo>\n\nCORPO:\n<primo paragrafo>\n\n<secondo paragrafo>\n\n## <eventuale sottotitolo con citazione>\n\n<altri paragrafi>\n\nUsa "**testo**" per il grassetto sulle frasi-clou, come indicato nello stile. Non inventare fatti, nomi o cifre non presenti nella fonte.`
}

export async function POST(req: Request) {
  try {
    const { fonte, descrizione } = (await req.json()) as { fonte?: string; descrizione?: string }

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
        messages: [{ role: 'user', content: buildUserPrompt(fonte, descrizione) }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      return NextResponse.json({ error: `Errore chiamata Claude: ${errText}` }, { status: 502 })
    }

    const data = await anthropicRes.json()
    const rawText: string = data?.content?.[0]?.text ?? ''
    if (!rawText) {
      return NextResponse.json({ error: 'Risposta vuota dal modello.' }, { status: 502 })
    }

    const { title, blocks } = parseDraft(rawText)

    const draftId = `drafts.ai-${Date.now()}`
    await sanityWriteClient.create({
      _id: draftId,
      _type: 'article',
      title,
      body: blocks,
    })

    const plainId = draftId.replace(/^drafts\./, '')
    const studioUrl = `/studio/intent/edit/id=${plainId};type=article`

    return NextResponse.json({ title, studioUrl })
  } catch (err) {
    return NextResponse.json({ error: `Errore imprevisto: ${(err as Error).message}` }, { status: 500 })
  }
}
