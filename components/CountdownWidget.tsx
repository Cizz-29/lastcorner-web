'use client'

import { useEffect, useState } from 'react'

interface Session {
  date: string
  time: string
}

interface Race {
  raceName: string
  date: string
  time?: string
  Circuit?: { circuitName: string; Location?: { country: string; locality: string } }
  FirstPractice?: Session
  SecondPractice?: Session
  ThirdPractice?: Session
  Sprint?: Session
  Qualifying?: Session
}

function getNextSession(race: Race): { label: string; datetime: Date } | null {
  const sessions = [
    { label: 'PL1',        data: race.FirstPractice },
    { label: 'PL2',        data: race.SecondPractice },
    { label: 'PL3',        data: race.ThirdPractice },
    { label: 'Sprint',     data: race.Sprint },
    { label: 'Qualifiche', data: race.Qualifying },
    { label: 'Gara',       data: { date: race.date, time: race.time ?? '13:00:00Z' } },
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
  const s = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    days:    pad(Math.floor(s / 86400)),
    hours:   pad(Math.floor((s % 86400) / 3600)),
    minutes: pad(Math.floor((s % 3600) / 60)),
    seconds: pad(s % 60),
  }
}

export default function CountdownWidget({ initialRace }: { initialRace: Race | null }) {
  const [cd, setCd] = useState({ days: '--', hours: '--', minutes: '--', seconds: '--' })
  const [nextSession, setNextSession] = useState<{ label: string; datetime: Date } | null>(null)

  useEffect(() => {
    if (!initialRace) return
    const session = getNextSession(initialRace)
    setNextSession(session)
    const interval = setInterval(() => {
      if (!session) return
      setCd(formatCountdown(session.datetime.getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(interval)
  }, [initialRace])

  if (!initialRace) return null

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
      {nextSession && (
        <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-widest mb-3 text-center">
          Countdown → <span className="text-lc-red font-semibold">{nextSession.label}</span>
        </p>
      )}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: cd.days,    label: 'Giorni' },
          { value: cd.hours,   label: 'Ore' },
          { value: cd.minutes, label: 'Min' },
          { value: cd.seconds, label: 'Sec' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center bg-black/30 rounded-xl py-3 px-1 border border-white/10">
            <span className="font-akira font-bold text-[26px] text-lc-red leading-none tabular-nums">
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
