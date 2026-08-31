import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { CATEGORIES } from '@/lib/categories'
import { authorSlug } from '@/lib/authors'

// Aggiornamento su richiesta, chiamato da Sanity quando pubblichi.
//
// Regola di fondo: non si invalida MAI l'intero sito. Marcare tutte le pagine
// come da rifare sembra prudente, ma significa che il primo crawler di
// passaggio le fa ricalcolare una per una — centinaia di rigenerazioni, e
// altrettante interrogazioni a Sanity, per una modifica che ne riguardava tre.
// Qui si aggiorna solo cio' che il documento tocca davvero; se non si riesce a
// capirlo, si aggiorna la home e ci si ferma.

export const dynamic = 'force-dynamic'

// Sotto-categorie che hanno una pagina propria (le altre confluiscono nella
// pagina categoria, gia' inclusa).
const SOTTOCATEGORIE_CON_PAGINA = new Set([
  'editoriali',
  'analisi-tecnica',
  'guide-approfondimenti',
  'rubriche',
])

function slugCategoria(etichetta: unknown): string | null {
  if (typeof etichetta !== 'string') return null
  const trovata = CATEGORIES.find(
    (c) => c.label.toLowerCase() === etichetta.trim().toLowerCase()
  )
  return trovata?.slug ?? null
}

/** Percorsi da aggiornare per il documento ricevuto. Sempre un pugno, mai tutti. */
function percorsiDa(corpo: any): string[] {
  const percorsi = new Set<string>(['/'])
  const tipo = corpo?._type

  if (tipo === 'article') {
    const categoria = slugCategoria(corpo?.category)
    const slug = typeof corpo?.slug?.current === 'string' ? corpo.slug.current : null
    if (categoria) {
      percorsi.add(`/${categoria}`)
      if (slug) percorsi.add(`/${categoria}/${slug}`)
      const sotto = corpo?.subcategory
      if (typeof sotto === 'string' && SOTTOCATEGORIE_CON_PAGINA.has(sotto)) {
        percorsi.add(`/${categoria}/${sotto}`)
      }
    }
    return Array.from(percorsi)
  }

  // Le biografie compaiono sulle schede pilota e team. La categoria non e'
  // nel documento, quindi si aggiornano le schede in tutte le categorie: sono
  // sei percorsi, non cinquecento.
  if (tipo === 'driverBio' && typeof corpo?.driverId === 'string') {
    for (const c of CATEGORIES) percorsi.add(`/${c.slug}/piloti/${corpo.driverId}`)
    return Array.from(percorsi)
  }
  if (tipo === 'teamBio' && typeof corpo?.constructorId === 'string') {
    for (const c of CATEGORIES) percorsi.add(`/${c.slug}/team/${corpo.constructorId}`)
    return Array.from(percorsi)
  }

  // La scheda autore sta su una pagina sola, ricavata normalizzando il nome
  // esattamente come fa la pagina stessa.
  if (tipo === 'authorBio' && typeof corpo?.fullName === 'string') {
    percorsi.add(`/autori/${authorSlug(corpo.fullName)}`)
    return Array.from(percorsi)
  }

  // Tipo sconosciuto: si aggiorna la sola home. Se un domani nascera' un tipo
  // di documento nuovo, va aggiunto qui sopra — meglio una riga da ricordare
  // che un'invalidazione totale silenziosa a ogni salvataggio.
  return Array.from(percorsi)
}

export async function POST(req: NextRequest) {
  const atteso = process.env.REVALIDATE_SECRET
  if (!atteso) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET non configurata su Vercel.' },
      { status: 500 }
    )
  }

  const fornito =
    req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-lastcorner-secret')
  if (fornito !== atteso) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const corpo = await req.json().catch(() => null)
  const percorsi = percorsiDa(corpo)
  for (const p of percorsi) revalidatePath(p)

  return NextResponse.json({
    aggiornate: percorsi,
    quante: percorsi.length,
    documento: corpo?._type ?? null,
    quando: new Date().toISOString(),
  })
}

// Comoda per verificare a mano che la route esista, senza invalidare nulla.
export async function GET() {
  return NextResponse.json({ pronto: true, metodo: 'usa POST con il segreto' })
}
