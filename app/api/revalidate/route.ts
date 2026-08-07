import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

// Aggiornamento su richiesta, chiamato da Sanity quando pubblichi.
//
// Prima le pagine si rigeneravano da sole a intervalli fissi: ogni visita
// dopo la scadenza faceva ripartire il calcolo, anche se nel frattempo non
// era cambiato nulla. Con qualche centinaio di pagine e i motori di ricerca
// che scansionano in continuazione, e' quello che consumava la CPU inclusa
// nel piano.
//
// Ora le pagine restano statiche a tempo indeterminato e vengono invalidate
// solo qui, quando un contenuto cambia davvero. Il costo passa da "ogni
// visita" a "ogni pubblicazione": qualche volta al giorno invece di
// migliaia.

export const dynamic = 'force-dynamic'

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

  // Si invalida tutto cio' che sta sotto il layout principale, cioe' l'intero
  // sito. Sembra grossolano ma e' la scelta giusta: le pagine non vengono
  // ricalcolate adesso, vengono solo marcate come da rifare, e ognuna si
  // aggiorna alla prima visita successiva. Quelle che nessuno apre non
  // costano nulla. In cambio non serve indovinare quali pagine tocca un
  // articolo — categoria, home, pagina del pilota, ricerca — e non si
  // rischia di dimenticarne una.
  revalidatePath('/', 'layout')

  const corpo = await req.json().catch(() => null)
  return NextResponse.json({
    aggiornato: true,
    quando: new Date().toISOString(),
    documento: corpo?._type ?? null,
  })
}

// Comoda per verificare a mano che la route esista, senza invalidare nulla.
export async function GET() {
  return NextResponse.json({ pronto: true, metodo: 'usa POST con il segreto' })
}
