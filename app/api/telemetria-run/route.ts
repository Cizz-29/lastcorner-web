import { NextResponse } from 'next/server'

// Avvia (POST) e monitora (GET) la pipeline Telemetria da dentro il sito,
// senza passare dall'interfaccia di GitHub.
//
// Richiede la variabile d'ambiente GITHUB_TOKEN su Vercel: un token con il
// solo permesso di avviare workflow su questo repository. Resta lato
// server, non viene mai esposto al browser.
//
// L'accesso è protetto dal middleware come il resto dell'area /telemetria.

export const dynamic = 'force-dynamic'

const OWNER = 'Cizz-29'
const REPO = 'lastcorner-web'
const WORKFLOW = 'telemetria.yml'
const API = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}`

function headers(token: string) {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': '2022-11-28',
    'content-type': 'application/json',
  }
}

export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN non configurato su Vercel: impossibile avviare la pipeline.' },
      { status: 500 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as { year?: number; round?: number | null }
  const year = String(body.year ?? new Date().getFullYear())
  const round = body.round

  // Senza round si lascia decidere allo script (ultimo weekend concluso).
  const inputs: Record<string, string> = {
    gp: 'Automatico (ultimo weekend concluso)',
    year,
  }
  if (round) inputs.round = String(round)

  const res = await fetch(`${API}/dispatches`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ ref: 'main', inputs }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json(
      { error: `GitHub ha rifiutato la richiesta (${res.status}). ${detail.slice(0, 300)}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  if (!token) return NextResponse.json({ runs: [] })

  const res = await fetch(`${API}/runs?per_page=5`, {
    headers: headers(token),
    cache: 'no-store',
  })
  if (!res.ok) return NextResponse.json({ runs: [] })

  const data = await res.json()
  const runs = (data?.workflow_runs ?? []).map((r: any) => ({
    id: r.id,
    status: r.status, // queued | in_progress | completed
    conclusion: r.conclusion, // success | failure | null
    createdAt: r.created_at,
    url: r.html_url,
  }))
  return NextResponse.json({ runs })
}
