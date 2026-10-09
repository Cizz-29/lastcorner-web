import { NextResponse } from 'next/server'
import { ESEMPI_DESCRIZIONI } from '@/lib/ai/esempiDescrizioni'

// "Genera descrizione" dell'editor grafiche: dalla notizia (comunicato,
// dichiarazioni, appunti) scrive la descrizione per Instagram nello stile
// di @lastcorner_net e una versione corta per X.
//
// Sta sotto /grafiche apposta: la protegge la stessa password del browser
// dell'editor (middleware), che il browser rimanda da solo. Nessuna
// password da riscrivere, e chi non ce l'ha non spende credito Anthropic.
//
// Costo: circa 2 centesimi a descrizione (Sonnet, ~4.000 token in entrata
// con gli esempi, ~800 in uscita). Gli esempi stanno nel prompt di sistema
// con la cache attiva: richieste ravvicinate li pagano un decimo.

export const dynamic = 'force-dynamic'

const MODEL = 'claude-sonnet-5-5'
const MAX_FONTE = 12000

function promptDiSistema(anno: number): string {
  return `Scrivi le descrizioni dei post Instagram di Lastcorner (@lastcorner_net), testata italiana di Formula 1 e motorsport (F1, F2, F3, F1 Academy, WRC). Scrivi in italiano, come la redazione.

Regole di stile, ricavate dai post veri:
- Apertura: la notizia nella prima frase, senza preamboli. Spesso preceduta da una o due emoji a tema: 🚨🚨 per notizie ufficiali o clamorose, 😬 per notizie scomode o polemiche, 📊 per analisi e dati, 👀 per curiosità e attese, 🔙 per amarcord, 🏁 con la bandiera del paese del GP per risultati di sessione. Non sempre: nei post di dichiarazioni spesso non c'è emoji.
- Risultati di sessione: prima riga in MAIUSCOLO con il punto esclamativo ("VERSTAPPEN SI PRENDE LA SPRINT POLE A SINGAPORE!"), poi una o due frasi sul resto dell'ordine.
- Paragrafi brevi, da una a tre frasi, separati da una riga vuota.
- Dichiarazioni: tradotte in italiano, tra virgolette dritte "...", ogni citazione nel suo paragrafo; introdotte o chiuse con "ha detto", "ha spiegato", "scrive". Frase di contesto prima delle citazioni.
- Fonti: "Come riportato da AutoRacer", "Secondo quanto riportato da Thomas Maher sul proprio profilo X", "in un'intervista riportata da Sky Sports F1". Le indiscrezioni vanno al condizionale ("sarebbe", "avrebbe") e, se manca la conferma, si dice ("Attendiamo il comunicato ufficiale").
- Lessico: giornalistico ma colloquiale ("steccato", "pasticcia", "beffata", "mettere una pezza"); per variare i nomi "il monegasco", "l'olandese", "il britannico", "la Rossa", "la squadra di Wolff".
- Chiusura facoltativa: un commento breve o un rimando ("Appuntamento alle 14:30 per le qualifiche 👀", "staremo a vedere se...").
- Ultima riga: hashtag. Sempre #F1 #F${anno}; poi da uno a tre fra pilota protagonista (#Verstappen), Ferrari quando c'entra (#FerrariF1 #ScuderiaFerrari), GP del weekend (#SingaporeGP). Per F2, F3, F1 Academy e WRC l'hashtag della categoria al posto di #F1.
- Niente link, niente "link in bio", niente domande di engagement ("cosa ne pensate?"). Solo se la redazione lo indica (c'è un articolo sul sito), prima degli hashtag: "🔗 | L'articolo completo su Lastcorner.net".
- Mai inventare fatti, numeri, nomi o citazioni che non siano nella fonte. Se la fonte è in inglese, traduci le dichiarazioni con naturalezza.

Versione per X: stesso contenuto, al massimo 270 caratteri in tutto, una o due emoji al massimo, al massimo due hashtag (#F1 e uno specifico), nessun link. Se ci sono dichiarazioni, la frase più forte tra virgolette.

Esempi di descrizioni Instagram vere, da imitare nello stile e non nel contenuto:

${ESEMPI_DESCRIZIONI.map((e, i) => `--- Esempio ${i + 1} ---\n${e}`).join('\n\n')}

--- Fine esempi ---

Rispondi SOLO in questo formato, senza altro testo:

INSTAGRAM:
<descrizione Instagram>

X:
<testo per X>`
}

function dividi(testo: string): { instagram: string; x: string } {
  const m = testo.match(/INSTAGRAM:\s*([\s\S]*?)\n\s*X:\s*([\s\S]*)$/)
  if (!m) return { instagram: testo.trim(), x: '' }
  return { instagram: m[1].trim(), x: m[2].trim() }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurata su Vercel.' }, { status: 500 })
  }

  let fonte = ''
  let appunti = ''
  try {
    const dati = (await req.json()) as { fonte?: string; appunti?: string }
    fonte = (dati.fonte ?? '').trim().slice(0, MAX_FONTE)
    appunti = (dati.appunti ?? '').trim().slice(0, 1000)
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }
  if (!fonte) return NextResponse.json({ error: 'Incolla la notizia o le dichiarazioni.' }, { status: 400 })

  const anno = new Date().getFullYear()
  const richiesta =
    `Notizia o fonte:\n${fonte}` +
    (appunti ? `\n\nIndicazioni della redazione (tono, taglio, cosa evidenziare):\n${appunti}` : '') +
    `\n\nScrivi la descrizione Instagram e la versione per X.`

  try {
    const risposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: [{ type: 'text', text: promptDiSistema(anno), cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: richiesta }],
      }),
    })
    if (!risposta.ok) {
      const dettaglio = await risposta.text()
      console.error('[descrizione] errore Claude:', risposta.status, dettaglio.slice(0, 500))
      return NextResponse.json({ error: `Errore del modello (${risposta.status}). Riprova tra poco.` }, { status: 502 })
    }
    const dati = await risposta.json()
    const testo: string =
      (Array.isArray(dati?.content) ? dati.content : []).find((b: { type?: string }) => b?.type === 'text')?.text ?? ''
    if (!testo) return NextResponse.json({ error: 'Risposta vuota dal modello. Riprova.' }, { status: 502 })
    return NextResponse.json(dividi(testo))
  } catch (errore) {
    return NextResponse.json({ error: `Errore imprevisto: ${(errore as Error).message}` }, { status: 500 })
  }
}
