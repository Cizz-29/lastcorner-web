'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// Login dell'area Telemetria: password unica condivisa dallo staff.
export default function TelemetriaLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    try {
      const res = await fetch('/api/telemetria-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/telemetria')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setErrore(data.error ?? 'Errore di accesso.')
      }
    } catch {
      setErrore('Errore di rete, riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1 flex items-start justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mt-16 bg-lc-card border border-white/10 rounded-card p-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
            <h1 className="font-akira font-extrabold text-[20px] text-white uppercase">Telemetria</h1>
          </div>
          <p className="font-montserrat text-[12px] text-lc-subtle mb-6">
            Area riservata allo staff di Lastcorner. Inserisci la password per continuare.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-lc-bg border border-white/15 rounded-card-sm px-4 py-3 font-montserrat text-[14px] text-white placeholder:text-lc-subtle/60 focus:outline-none focus:border-lc-red mb-4"
          />
          {errore && (
            <p className="font-montserrat text-[12px] text-lc-red mb-4">{errore}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-lc-red disabled:opacity-50 rounded-card-sm py-3 font-akira text-[12px] text-white uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            {loading ? 'Verifica...' : 'Entra'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}
