import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { CATEGORIES } from '@/lib/categories'

// Aggiornamento su richiesta, chiamato da Sanity quando pubblichi.
//
// Prima le pagine si rigeneravano da sole a intervalli fissi: ogni visita
// dopo la scadenza faceva ripartire il calcolo, anche se nel frattempo non
// era cambiato nulla. Con qualche centinaio di pagine e i motori di ricerca
// che scansionano in continuazione, e' quello che consumava la CPU inclusa
// nel piano.
//
// Ora le pagine restano statiche a tempo indeterminato e vengono invalidate
// solo qui. Ma con attenzione: invalidare l'intero sito a ogni pubblicazione
// significherebbe che il primo crawler di passaggio fa ricalcolare tutte le
// pagine una per una. Con cinque articoli al giorno sarebbero migliaia di
// rigenerazioni, cioe' il problema di prima sotto altro nome. Quindi si
// aggiorna solo cio' che l'articolo tocca davvero: se stesso, la sua
// categoria e la home.

export const dynamic = 'force-dynamic'

function slugCategoria(etichetta: unknown): string | null {
  if (typeof etichetta !== 'string') return null
  const trovata = CATEGORIES.find(
    (c) => c.label.toLowerCase() === etichetta.trim().toLowerCase()
  )
  return trovata?.slug ?? null
}

export async function POST(req: NextRequest) {
  const atteso = process.env.REVALIDATE_SECRET
  if (!atteso) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET non configurata su Vercel.' },
      { status: 500 }
    )
  }

  // Il segreto si puo' passare nell'indirizzo o in un'intestazione: Sanity
  // permette entrambi, e cosi' la configurazione del webhook e' libera.
  const fornito =
    req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-lastcorner-secret')
  if (fornito !== atteso) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const corpo = await req.json().catch(() => null)
  const categoria = slugCategoria(corpo?.category)
  const slug = typeof corpo?.slug?.current === 'string' ? corpo.slug.current : null

  const aggiornate: string[] = []
  const aggiorna = (percorso: string) => {
    revalidatePath(percorso)
    aggiornate.push(percorso)
  }

  // La home elenca sempre gli ultimi articoli, quindi va rifatta comunque.
  aggiorna('/')

  if (categoria) {
    aggiorna(`/${categoria}`)
    if (slug) aggiorna(`/${categoria}/${slug}`)
  }

  // Se il documento non e' un articolo (una bio, per esempio) non sappiamo
  // quali pagine tocchi: in quel caso, e solo in quello, si rifa' tutto.
  if (!categoria) {
    revalidatePath('/', 'layout')
    aggiornate.push('(intero sito)')
  }

  return NextResponse.json({
    aggiornate,
    quando: new Date().toISOString(),
    documento: corpo?._type ?? null,
  })
}

// Comoda per verificare a mano che la route esista, senza invalidare nulla.
export async function GET() {
  return NextResponse.json({ pronto: true, metodo: 'usa POST con il segreto' })
}
