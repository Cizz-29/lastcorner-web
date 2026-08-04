import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { sanityWriteClient } from '@/lib/sanity/writeClient'
import { getDriverStandings, getConstructorStandings } from '@/lib/f1api'
import { getRosterDrivers, getRosterTeams } from '@/lib/rosterData'

// Route temporanea: assegna i tag pilota/team agli articoli che ne sono
// sprovvisti, leggendoli dal titolo. Se compare un pilota si aggiunge sia
// lui sia la sua scuderia; se compare un team si aggiunge il team.
//
// Il riconoscimento è anzitutto deterministico (confronto con l'elenco
// reale di piloti e team di tutte le categorie): è gratuito, immediato e
// verificabile. Solo per i titoli dove non trova nulla si può attivare un
// secondo passaggio con l'IA, utile per i casi che richiedono conoscenza
// del contesto — per esempio "Briatore" che rimanda ad Alpine.
//
// Da chiamare ripetutamente (POST) finché "restanti" non è 0, poi va
// rimossa dal repo.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL_IA = 'claude-haiku-4-5-20251001'
const DEFAULT_BATCH = 25

interface Voce {
  termini: string[]
  tag: string
  team?: string // per i piloti: la scuderia da aggiungere insieme
}

function normalizza(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Nomi alternativi con cui i team compaiono nei titoli.
const ALIAS_TEAM: Record<string, string[]> = {
  red_bull: ['red bull', 'redbull'],
  aston_martin: ['aston martin', 'aston'],
  rb: ['racing bulls', 'visa cash app', 'vcarb'],
  haas: ['haas'],
  mclaren: ['mclaren'],
  mercedes: ['mercedes'],
  ferrari: ['ferrari'],
  alpine: ['alpine'],
  williams: ['williams'],
  audi: ['audi'],
  cadillac: ['cadillac'],
  'prema-racing': ['prema'],
  'campos-racing': ['campos'],
  'art-grand-prix': ['art grand prix', 'art gp'],
  'rodin-motorsport': ['rodin'],
  'mp-motorsport': ['mp motorsport'],
  'van-amersfoort-racing': ['van amersfoort'],
  'aix-racing': ['aix racing'],
  'dams-lucas-oil': ['dams'],
  hitech: ['hitech'],
  'invicta-racing': ['invicta'],
  trident: ['trident'],
}

// Costruisce l'elenco dei termini riconoscibili. I cognomi molto corti
// vengono esclusi dal confronto: "Ho" o "Le" comparirebbero dentro
// moltissime parole e produrrebbero tag sbagliati.
async function costruisciVoci(): Promise<{ piloti: Voce[]; team: Voce[] }> {
  const piloti: Voce[] = []
  const team: Voce[] = []

  // --- Formula 1 (dati live) ---
  try {
    const [driverStandings, constructorStandings] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
    ])
    for (const d of driverStandings) {
      const cognome = d.Driver.familyName
      const termini = [`${d.Driver.givenName} ${cognome}`]
      if (cognome.length >= 4) termini.push(cognome)
      piloti.push({
        termini: termini.map(normalizza),
        tag: d.Driver.driverId,
        team: d.Constructors?.[0]?.constructorId,
      })
    }
    for (const c of constructorStandings) {
      const id = c.Constructor.constructorId
      const termini = [c.Constructor.name, ...(ALIAS_TEAM[id] ?? [])]
      team.push({ termini: termini.map(normalizza), tag: id })
    }
  } catch {
    // API F1 non raggiungibile: si procede con le sole categorie statiche.
  }

  // --- F2, F3, F1 Academy (roster statico) ---
  for (const categoria of ['formula-2', 'formula-3', 'f1-academy']) {
    for (const d of getRosterDrivers(categoria)) {
      const cognome = d.familyName
      const termini = [`${d.givenName} ${cognome}`]
      if (cognome.length >= 4) termini.push(cognome)
      piloti.push({ termini: termini.map(normalizza), tag: d.driverId, team: d.teamId })
    }
    for (const t of getRosterTeams(categoria)) {
      if (team.some((x) => x.tag === t.constructorId)) continue
      const termini = [t.name, ...(ALIAS_TEAM[t.constructorId] ?? [])]
      team.push({ termini: termini.map(normalizza), tag: t.constructorId })
    }
  }

  return { piloti, team }
}

// Confronto a parole intere: evita che "Ho" dentro "Hochberg" o "Sainz"
// dentro un'altra parola producano falsi positivi.
function contiene(titolo: string, termine: string): boolean {
  const re = new RegExp(`(^|[^a-z0-9])${termine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)
  return re.test(titolo)
}

function tagDaTitolo(titolo: string, voci: { piloti: Voce[]; team: Voce[] }): string[] {
  const t = normalizza(titolo)
  const trovati = new Set<string>()

  for (const p of voci.piloti) {
    if (p.termini.some((termine) => contiene(t, termine))) {
      trovati.add(p.tag)
      if (p.team) trovati.add(p.team) // il pilota porta con sé la scuderia
    }
  }
  for (const s of voci.team) {
    if (s.termini.some((termine) => contiene(t, termine))) trovati.add(s.tag)
  }

  return Array.from(trovati)
}

// Secondo passaggio facoltativo: per i titoli senza corrispondenze dirette
// si chiede all'IA se riconosce un pilota o un team, scegliendo solo fra
// gli identificativi esistenti.
async function tagDaIA(
  titolo: string,
  categoria: string,
  voci: { piloti: Voce[]; team: Voce[] },
  apiKey: string
): Promise<string[]> {
  const elenco = [
    ...voci.piloti.map((p) => p.tag),
    ...voci.team.map((s) => s.tag),
  ].join(', ')

  const prompt = `Titolo di un articolo di motorsport (categoria: ${categoria}):
"${titolo}"

Identificativi disponibili: ${elenco}

Se il titolo si riferisce chiaramente a uno o più piloti o team presenti nell'elenco — anche indirettamente, per esempio citando un dirigente o un team principal — rispondi con i loro identificativi separati da virgola. Se citi un pilota, includi anche il suo team.
Se non riconosci nulla con ragionevole certezza, rispondi esattamente: NESSUNO.
Rispondi solo con gli identificativi o con NESSUNO, senza altro testo.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL_IA,
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const blocchi: { type?: string; text?: string }[] = Array.isArray(data?.content) ? data.content : []
    const testo = (blocchi.find((b) => b?.type === 'text')?.text ?? '').trim()
    if (!testo || testo.toUpperCase().includes('NESSUNO')) return []

    const validi = new Set([...voci.piloti.map((p) => p.tag), ...voci.team.map((s) => s.tag)])
    return testo
      .split(',')
      .map((s) => s.trim())
      .filter((s) => validi.has(s))
  } catch {
    return []
  }
}

export async function GET() {
  const restanti = await sanityClient.fetch<number>(
    `count(*[_type == "article" && (!defined(tags) || count(tags) == 0)])`
  )
  return NextResponse.json({ senzaTag: restanti })
}

export async function POST(req: Request) {
  const opzioni = (await req.json().catch(() => ({}))) as {
    batchSize?: number
    usaIA?: boolean
    soloAnteprima?: boolean
    offset?: number
  }
  const batchSize = Math.min(opzioni.batchSize ?? DEFAULT_BATCH, 50)
  // Gli articoli in cui non si riconosce nulla restano senza tag: senza uno
  // scorrimento tornerebbero in cima a ogni chiamata, bloccando l'avanzamento.
  // Il chiamante incrementa l'offset del numero di articoli non assegnati.
  const offset = Math.max(0, opzioni.offset ?? 0)
  const usaIA = opzioni.usaIA === true
  const soloAnteprima = opzioni.soloAnteprima === true
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''

  const voci = await costruisciVoci()
  if (voci.piloti.length === 0 && voci.team.length === 0) {
    return NextResponse.json({ error: 'Elenco piloti/team non disponibile.' }, { status: 500 })
  }

  const articoli = await sanityClient.fetch<{ _id: string; title: string; category: string }[]>(
    `*[_type == "article" && (!defined(tags) || count(tags) == 0)]
      | order(publishedAt desc)[${offset}...${offset + batchSize}]{ _id, title, category }`
  )

  const risultati: { titolo: string; tag: string[]; via: string }[] = []
  let aggiornati = 0

  for (const a of articoli) {
    let tag = tagDaTitolo(a.title, voci)
    let via = 'titolo'

    if (tag.length === 0 && usaIA && apiKey) {
      tag = await tagDaIA(a.title, a.category ?? '', voci, apiKey)
      via = tag.length ? 'ia' : 'nessuno'
    } else if (tag.length === 0) {
      via = 'nessuno'
    }

    risultati.push({ titolo: a.title.slice(0, 70), tag, via })

    if (tag.length > 0 && !soloAnteprima) {
      await sanityWriteClient.patch(a._id).set({ tags: tag }).commit()
      aggiornati++
    }
  }

  const restanti = await sanityClient.fetch<number>(
    `count(*[_type == "article" && (!defined(tags) || count(tags) == 0)])`
  )

  const senzaCorrispondenza = risultati.filter((r) => r.tag.length === 0).length

  return NextResponse.json({
    esaminati: articoli.length,
    aggiornati,
    senzaCorrispondenza,
    // Offset da usare alla chiamata successiva per non ripescare gli
    // articoli in cui non si è riconosciuto nulla.
    prossimoOffset: offset + senzaCorrispondenza,
    restanti,
    anteprima: soloAnteprima,
    risultati,
  })
}
