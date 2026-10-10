import { NextResponse } from 'next/server'
import { ESEMPI_PER_TIPO } from '@/lib/ai/esempiDescrizioni'
import { TIPI_POST, eTipoPost, type TipoPost } from '@/lib/ai/tipiPost'

// "Genera descrizione" dell'editor grafiche: dalla notizia (comunicato,
// dichiarazioni, appunti) scrive la descrizione per Instagram nello stile
// di @lastcorner_net e una versione corta per X.
//
// Quattro tipi di post (lib/ai/tipiPost.ts), ognuno con regole ed esempi veri
// propri, ricavati il 10 ottobre 2026 dagli ultimi 117 post della pagina. Il
// prompt di sistema e' uno solo per tutti e quattro, cosi' la cache vale per
// qualunque tipo; il tipo scelto arriva nel messaggio.
//
// Sta sotto /grafiche apposta: la protegge la stessa password del browser
// dell'editor (middleware), che il browser rimanda da solo. Nessuna
// password da riscrivere, e chi non ce l'ha non spende credito Anthropic.
//
// Costo: circa 2 centesimi a descrizione (Sonnet, ~5.000 token in entrata
// con gli esempi, ~800 in uscita). Gli esempi stanno nel prompt di sistema
// con la cache attiva: richieste ravvicinate li pagano un decimo.

export const dynamic = 'force-dynamic'

const MODEL = 'claude-sonnet-5-5'
const MAX_FONTE = 12000

const REGOLE_PER_TIPO: Record<TipoPost, string> = {
  risultato: `- Apertura con 🏁 e la bandiera del paese che ospita la sessione (🏁🇸🇬 o 🇸🇬🏁).
- Pole, sprint pole, vittoria, o un risultato clamoroso: prima riga tutta in MAIUSCOLO con il punto esclamativo ("VERSTAPPEN VINCE UNA GARA INFINITA A SEPANG!", "GEORGE RUSSELL SI PRENDE LA POLE A BAKU!"). Prove libere: prima riga in minuscolo normale ("George Russell chiude in testa la prima sessione di prove libere a Singapore."), al massimo con il punto esclamativo.
- Poi uno-tre paragrafi brevissimi sul resto dell'ordine: "Poi Russell e Leclerc", "Seguono...", "Secondo Antonelli, terzo Hamilton", "P5 per Hamilton". Distacchi a parole o sintetici ("precede di due decimi", "a tre decimi", "A +0.5").
- Dove sono finite le Ferrari va sempre detto, anche se lontane. Un dettaglio che spiega il risultato se c'è nella fonte (errore nel giro, problema tecnico, gomme, giro non fatto).
- Dopo prove libere e qualifiche, se la fonte o le indicazioni danno l'orario della sessione successiva: "Appuntamento alle HH:MM per le qualifiche 👀" (o per le FP2, la sprint, la gara). Mai inventare l'orario: se non c'è, niente riga.
- Corto: 150-500 caratteri. Niente citazioni, niente domande ai lettori.
- Hashtag: solo #F1 #F{ANNO} e l'hashtag del GP.`,
  dichiarazioni: `- Apertura: una o due frasi di contesto che danno lo stato d'animo e il momento ("C'è un po' di delusione Leclerc dopo la quinta piazza...", "Leclerc non fa proclami nel media day a Singapore:", "Intervistato da Sky Sport F1 al termine del GP, Fred Vasseur non ha nascosto..."). Se la fonte lo dice, dove sono state rilasciate (intervista, media day, preview della squadra, radio).
- A volte un secondo paragrafo di contesto che riassume il punto chiave prima delle citazioni.
- Citazioni tradotte in italiano parlato, ognuna nel suo paragrafo, tra virgolette dritte "...". La prima chiude con ", ha detto." (o "ha detto Charles", "ha spiegato"); le successive senza attribuzione; l'ultima spesso con ", ha concluso.".
- Le domande del giornalista diventano una domanda retorica dentro la citazione: "Se si può sperare nel podio? Decisamente sì...", "Il distacco da Lewis? Penso che...".
- Passaggi fra temi con frasi ponte brevi: "E sulla gara:", "E sul futuro:", "Per il monegasco, ...:".
- Note fra parentesi quando servono: "(ride, ndr)", "(da vedere, ndr.)".
- Emoji spesso assente; 👀 o 😬 solo se la notizia è curiosa o scomoda.
- Non tutte le citazioni della fonte: le più forti, 3-6 paragrafi in tutto. Mai cambiarne il senso.
- Se la fonte è solo un video o un audio senza testo, versione corta: "Così Leclerc dopo...", eventualmente "Pareri? 🤔".
- Hashtag: #F1 #F{ANNO}, la squadra (#FerrariF1 #ScuderiaFerrari per Ferrari), il pilota (#Leclerc o #CharlesLeclerc), a volte il GP.`,
  indiscrezione: `- Apertura con la fonte e il giornalista: "Come riportato da AutoRacer...", "Secondo quanto riportato da Thomas Maher sul proprio profilo X,", "come riportato da The-Race" anche a metà frase. Emoji facoltativa: 👀 curiosità e mercato, 😬 notizia scomoda, 🚨 o 🚨🚨 notizia grossa.
- Tutto quello che non è confermato va al condizionale: "sarebbe", "avrebbe", "dovrebbe", "sembrerebbe".
- Contesto per chi non ha seguito: "lo ricordiamo", "come vi avevamo raccontato", con fatti presi dalla fonte.
- Citazioni dall'articolo con "si legge" o ", scrive Maher".
- Se manca la conferma, dirlo: "Non c'è ancora nulla di ufficiale", "Attendiamo il comunicato ufficiale", "Lo scoop non è stato confermato da...".
- Chiusura facoltativa: "Staremo a vedere...", oppure una domanda breve ai lettori ("Vi piacerebbe vedere Horner in Ferrari?").
- Lunghezza secondo la notizia: da 300 caratteri a circa 2.000 per le indiscrezioni lunghe e tecniche.
- Hashtag: #F1 #F{ANNO}, le squadre e i piloti coinvolti, il GP se c'entra.`,
  ufficiale: `- Apertura: "🚨 Ora è ufficiale:" seguito dalla notizia, oppure 🚨🚨 e una frase d'effetto sul soggetto ("Ci pensa Ferrari a spegnere i rumors...").
- Indicativo, niente condizionale: è confermato.
- Uno-tre paragrafi brevi: il retroscena ("Il francese aveva saltato tre tappe per..."), le conseguenze ("Contestualmente, Lawson torna in Racing Bulls...").
- Se il comunicato contiene dichiarazioni: le più significative, ognuna nel suo paragrafo, con "si legge nel comunicato" o "è stato spiegato".
- Chiusura facoltativa: "Questione chiusa dunque? Staremo a vedere se...".
- Hashtag: #F1 #F{ANNO}, la squadra e il pilota coinvolti.`,
}

function promptDiSistema(anno: number): string {
  const tipi = TIPI_POST.map(
    (t) =>
      `### ${t.nome} (tipo "${t.id}")\n${REGOLE_PER_TIPO[t.id].replaceAll('{ANNO}', String(anno))}\n\nEsempi veri:\n\n` +
      ESEMPI_PER_TIPO[t.id].map((e, i) => `--- Esempio ${i + 1} ---\n${e}`).join('\n\n')
  ).join('\n\n')

  return `Scrivi le descrizioni dei post Instagram di Lastcorner (@lastcorner_net), testata italiana di Formula 1 e motorsport (F1, F2, F3, F1 Academy, WRC). Scrivi in italiano, come la redazione.

Regole valide per tutti i tipi di post, ricavate dai post veri:
- La notizia nella prima frase, senza preamboli.
- Paragrafi brevi, da una a tre frasi, separati da una riga vuota.
- Incisi fra trattini con gli spazi: "la quinta piazza - che diventerà quarta domani al via - conquistata...".
- Lessico giornalistico ma colloquiale ("steccato", "pasticcia", "beffata", "rifila tre decimi", "mettere una pezza").
- Per non ripetere i nomi: "il monegasco" (Leclerc), "l'olandese" (Verstappen), "il britannico" o "l'inglese" (Hamilton, Russell, Norris), "il francese", "il bolognese" (Antonelli), "l'asturiano" (Alonso), "la Rossa", "il Cavallino", "Maranello", "la squadra anglo-tedesca" o "Brackley" (Mercedes), "la squadra anglo-austriaca" (Red Bull), "il Circus". Dopo la prima volta, i piloti anche per nome ("Charles", "Lewis", "Max").
- Hashtag nell'ultima riga, da 3 a 5: sempre #F1 #F${anno}. L'hashtag del GP è quello in inglese del nome ufficiale (#SingaporeGP, #AzerbaijanGP); se la redazione ne indica uno, usa quello. Ferrari: #FerrariF1 #ScuderiaFerrari. Altre squadre: #MercedesF1 #McLarenF1 #RedBullRacing #AstonMartinF1 #WilliamsRacing. Piloti: cognome o nome e cognome (#Leclerc, #CharlesLeclerc). Per F2, F3, F1 Academy e WRC l'hashtag della categoria al posto di #F1.
- Niente link e niente "link in bio". Solo se la redazione lo indica (c'è un articolo sul sito), prima degli hashtag: "🔗 | L'articolo completo su Lastcorner.net".
- Domande ai lettori: rare e brevi, solo dove indicato per il tipo o se la redazione lo chiede ("Pareri? 🤔").
- Mai inventare fatti, numeri, orari, nomi o citazioni che non siano nella fonte. Se la fonte è in inglese, traduci le dichiarazioni con naturalezza.

Versione per X: stesso contenuto, al massimo 270 caratteri in tutto, una o due emoji al massimo, al massimo due hashtag (#F1 e uno specifico), nessun link. Se ci sono dichiarazioni, la frase più forte tra virgolette.

Regole ed esempi per tipo di post. Imita gli esempi nello stile, non nel contenuto.

${tipi}

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
  let tipo: TipoPost = 'risultato'
  try {
    const dati = (await req.json()) as { fonte?: string; appunti?: string; tipo?: string }
    if (eTipoPost(dati.tipo)) tipo = dati.tipo
    fonte = (dati.fonte ?? '').trim().slice(0, MAX_FONTE)
    appunti = (dati.appunti ?? '').trim().slice(0, 1000)
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }
  if (!fonte) return NextResponse.json({ error: 'Incolla la notizia o le dichiarazioni.' }, { status: 400 })

  const anno = new Date().getFullYear()
  const nomeTipo = TIPI_POST.find((t) => t.id === tipo)!.nome
  const richiesta =
    `Tipo di post: ${nomeTipo} (tipo "${tipo}"). Segui le regole e gli esempi di questo tipo.\n\n` +
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
