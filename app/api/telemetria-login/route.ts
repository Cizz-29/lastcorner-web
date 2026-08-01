import { NextResponse } from 'next/server'

// Login dell'area Telemetria (staff). Confronta la password inviata con
// l'env TELEMETRIA_PASSWORD e, se corretta, salva in un cookie httpOnly lo
// SHA-256 della password (mai la password in chiaro). Il middleware
// verifica quel cookie su tutte le route /telemetria*.

export const dynamic = 'force-dynamic'

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string }
  const expected = process.env.TELEMETRIA_PASSWORD

  if (!expected) {
    return NextResponse.json({ error: 'TELEMETRIA_PASSWORD non configurata su Vercel.' }, { status: 500 })
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Password errata.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('lc-telemetria-auth', await sha256Hex(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 giorni
  })
  return res
}
