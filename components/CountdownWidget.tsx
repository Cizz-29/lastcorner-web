'use client'

import { useEffect, useState } from 'react'

interface RaceSession {
  raceName: string
  Circuit: { circuitName: string; Location: { country: string; locality: string } }
  date: string
  time?: string
  // sessioni
  FirstPractice?: { date: string; time: string }
  SecondPractice?: { date: string; time: string }
  ThirdPractice?: { date: string; time: string }
  Qualifying?: { date: string; time: string }
  Sprint?: { date: string; time: string }
}

function getNextSession(race: RaceSession): { label: string; datetime: Date } | null {
  const sessions = [
    { label: 'Prove Libere 1', data: race.FirstPractice },
    { label: 'Prove Libere 2', data: race.SecondPractice },
    { label: 'Prove Libere 3', data: race.ThirdPractice },
    { label: 'Sprint',         data: race.Sprint },
    { label: 'Qualifiche',     data: race.Qualifying },
    { label: 'Gara',           data: { date: race.date, time: race.time ?? '13:00:00Z' } },
  ]
  const now = new Date()
  for (const s of sessions) {
    if (!s.data) continue
    const dt = new Date(`${s.data.date}T${s.data.time}`)
    if (dt > now) return { label: s.label, datetime: dt }
  }
  return null
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { days: '00', hours: '00', minutes: '00', seconds: '00' }
  const totalSeconds = Math.floor(ms / 1000)
  const days    = Math.floor(totalSeconds / 86400)
  const hours   = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return { days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) }
}

// Bandiere paese (emoji)
const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺', 'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Japan': '🇯🇵',
  'China': '🇨🇳', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
  'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹', 'UK': '🇬🇧',
  'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Singapore': '🇸🇬',
  'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Las Vegas': '🇺🇸', 'Qatar': '🇶🇦',
  'Abu Dhabi': '🇦🇪',
}

export default function CountdownWidget({ initialRace }: { initialRace: RaceSession | null }) {
  const [countdown, setCountdown] = useState({ days: '--', hours: '--', minutes: '--', seconds: '--' })
  const [nextSession, setNextSession] = useState<{ label: string; datetime: Date } | null>(null)

  useEffect(() => {
    if (!initialRace) return
    const session = getNextSession(initialRace)
    setNextSession(session)

    const interval = setInterval(() => {
      if (!session) return
      const diff = session.datetime.getTime() - Date.now()
      setCountdown(formatCountdown(diff))
    }, 1000)

    return () => clearInterval(interval)
  }, [initialRace])

  if (!initialRace) return null

  const flag = COUNTRY_FLAGS[initialRace.Circuit?.Location?.country] ?? '🏁'

  return (
    <div className="bg-lc-card rounded-card p-5 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 bg-lc-red rounded-full" />
        <h2 className="font-akira font-bold text-[13px] text-white uppercase tracking-wide">
          F1: Prossimo Evento
        </h2>
      </div>

      {/* Nome GP */}
      <div className="mb-4">
        <p className="font-akira font-bold text-[16px] text-lc-red leading-tight">
          {flag} {initialRace.raceName}
        </p>
        <p className="font-montserrat text-[11px] text-lc-subtle mt-1">
          {initialRace.Circuit?.circuitName}
        </p>
        {nextSession && (
          <p className="font-montserrat font-medium text-[11px] text-white/70 mt-1">
            Prossima: <span className="text-white">{nextSession.label}</span>
          </p>
        )}
      </div>

      {/* Countdown */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: countdown.days,    label: 'Giorni' },
          { value: countdown.hours,   label: 'Ore' },
          { value: countdown.minutes, label: 'Min' },
          { value: countdown.seconds, label: 'Sec' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center bg-lc-bg rounded-xl py-2 px-1">
            <span className="font-akira font-bold text-[22px] text-lc-red leading-none">
              {value}
            </span>
            <span className="font-montserrat text-[9px] text-lc-subtle mt-1 uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
