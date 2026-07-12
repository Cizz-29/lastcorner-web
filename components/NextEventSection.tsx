import CountdownWidget from './CountdownWidget'
import { getNextRace } from '@/lib/f1api'

// Mappa paese → emoji bandiera
const FLAGS: Record<string, string> = {
  'Australia': '🇦🇺', 'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Japan': '🇯🇵',
  'China': '🇨🇳', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
  'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹', 'UK': '🇬🇧',
  'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Singapore': '🇸🇬',
  'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Las Vegas': '🇺🇸', 'Qatar': '🇶🇦',
  'Abu Dhabi': '🇦🇪', 'Azerbaijan': '🇦🇿',
}

// Mappa paese → colore di accento per il gradiente bandiera
const COUNTRY_COLORS: Record<string, [string, string]> = {
  'Australia':   ['#00008B', '#FF0000'],
  'Bahrain':     ['#CE1126', '#CE1126'],
  'Saudi Arabia':['#006C35', '#FFFFFF'],
  'Japan':       ['#BC002D', '#FFFFFF'],
  'China':       ['#DE2910', '#FFDE00'],
  'USA':         ['#3C3B6E', '#B22234'],
  'Italy':       ['#009246', '#CE2B37'],
  'Monaco':      ['#CE1126', '#CE1126'],
  'Canada':      ['#FF0000', '#FF0000'],
  'Spain':       ['#AA151B', '#F1BF00'],
  'Austria':     ['#ED2939', '#FFFFFF'],
  'UK':          ['#012169', '#C8102E'],
  'Hungary':     ['#CE2939', '#436F4D'],
  'Belgium':     ['#000000', '#FAE042'],
  'Netherlands': ['#AE1C28', '#21468B'],
  'Singapore':   ['#EF3340', '#EF3340'],
  'Mexico':      ['#006847', '#CE1126'],
  'Brazil':      ['#009C3B', '#FFDF00'],
  'Las Vegas':   ['#3C3B6E', '#B22234'],
  'Qatar':       ['#8D1B3D', '#8D1B3D'],
  'Abu Dhabi':   ['#00732F', '#FF0000'],
  'Azerbaijan':  ['#0092BC', '#E8192C'],
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getRaceWeekend(race: any) {
  const sessions = [
    { label: 'PL1',         key: 'FirstPractice',  date: race.FirstPractice?.date,  time: race.FirstPractice?.time },
    { label: 'PL2',         key: 'SecondPractice', date: race.SecondPractice?.date, time: race.SecondPractice?.time },
    { label: 'PL3',         key: 'ThirdPractice',  date: race.ThirdPractice?.date,  time: race.ThirdPractice?.time },
    { label: 'Sprint',      key: 'Sprint',         date: race.Sprint?.date,          time: race.Sprint?.time },
    { label: 'Qualifiche',  key: 'Qualifying',     date: race.Qualifying?.date,      time: race.Qualifying?.time },
    { label: 'Gara',        key: 'Race',           date: race.date,                  time: race.time ?? '13:00:00Z' },
  ].filter(s => s.date)

  const now = new Date()
  let nextSessionLabel = 'Gara'
  let nextSessionDate: Date | null = null

  for (const s of sessions) {
    const dt = new Date(`${s.date}T${s.time}`)
    if (dt > now) {
      nextSessionLabel = s.label
      nextSessionDate = dt
      break
    }
  }

  return { sessions, nextSessionLabel, nextSessionDate }
}

export default async function NextEventSection() {
  const race = await getNextRace()
  if (!race) return null

  const country = race.Circuit?.Location?.country ?? ''
  const flag = FLAGS[country] ?? '🏁'
  const colors = COUNTRY_COLORS[country] ?? ['#FF3A3A', '#FF3A3A']
  const { sessions, nextSessionLabel, nextSessionDate } = getRaceWeekend(race)

  // Data gara
  const raceDate = formatDate(race.date)

  // Round number
  const round = race.round ? `Round ${race.round}` : ''

  return (
    <section className="relative mb-16 overflow-hidden rounded-[32px]">

      {/* ── Sfondo con bandiera sfumata ──────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* Gradiente base scuro */}
        <div className="absolute inset-0 bg-[#0a0a0e]" />
        {/* Glow colori nazionali sfumato — effetto bandiera */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 85% 50%, ${colors[0]}88 0%, transparent 60%),
                         radial-gradient(ellipse 60% 80% at 15% 80%, ${colors[1]}44 0%, transparent 50%)`,
          }}
        />
        {/* Grande bandiera emoji sfumata come watermark */}
        <div
          className="absolute right-[-40px] top-1/2 -translate-y-1/2 text-[240px] leading-none select-none pointer-events-none"
          style={{ opacity: 0.07, filter: 'blur(2px)' }}
          aria-hidden
        >
          {flag}
        </div>
        {/* Griglia decorativa F1 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Contenuto ────────────────────────────────────────── */}
      <div className="relative z-10 p-8 lg:p-12">

        {/* Header sezione */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-lc-red rounded-full" />
          <div>
            <p className="font-montserrat text-[11px] text-lc-subtle uppercase tracking-[0.2em] mb-1">
              {round}
            </p>
            <h2 className="font-akira font-extrabold text-[28px] lg:text-[40px] leading-none">
              <span className="text-lc-red">F1:</span>{' '}
              <span className="text-white">PROSSIMO EVENTO</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-start">

          {/* ── Colonna 1: info GP ──────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* Nome GP e location */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[48px] leading-none">{flag}</span>
                <div>
                  <h3 className="font-akira font-bold text-[22px] lg:text-[28px] text-white leading-tight">
                    {race.raceName}
                  </h3>
                  <p className="font-montserrat text-[12px] text-lc-subtle mt-1">
                    {race.Circuit?.circuitName}
                  </p>
                  <p className="font-montserrat text-[11px] text-white/50 mt-0.5">
                    {race.Circuit?.Location?.locality}, {country}
                  </p>
                </div>
              </div>
            </div>

            {/* Data gara */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-lc-red shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <p className="font-montserrat text-[10px] text-lc-subtle uppercase tracking-wider">Data gara</p>
                <p className="font-akira text-[13px] text-white">{raceDate}</p>
              </div>
            </div>

            {/* Prossima sessione */}
            {nextSessionDate && (
              <div className="flex items-center gap-3 bg-lc-red/10 rounded-xl px-4 py-3 border border-lc-red/30">
                <div className="w-2 h-2 rounded-full bg-lc-red animate-pulse shrink-0" />
                <div>
                  <p className="font-montserrat text-[10px] text-lc-red uppercase tracking-wider">Prossima sessione</p>
                  <p className="font-akira font-bold text-[13px] text-white">{nextSessionLabel}</p>
                  <p className="font-montserrat text-[11px] text-lc-subtle mt-0.5">
                    {nextSessionDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' — '}
                    {nextSessionDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Divisore verticale ──────────────────────────── */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent self-stretch" />

          {/* ── Colonna 2: countdown + schedule ─────────────── */}
          <div className="flex flex-col gap-6">

            {/* Countdown */}
            <CountdownWidget initialRace={race} />

            {/* Schedule weekend */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="font-akira text-[10px] text-lc-subtle uppercase tracking-widest mb-3">
                Programma weekend
              </p>
              <div className="flex flex-col gap-1">
                {sessions.map((s) => {
                  const dt = new Date(`${s.date}T${s.time}`)
                  const isPast = dt < new Date()
                  const isNext = s.label === nextSessionLabel
                  return (
                    <div
                      key={s.key}
                      className={`flex items-center justify-between py-[6px] px-3 rounded-lg transition-colors ${
                        isNext ? 'bg-lc-red/15 border border-lc-red/30' :
                        isPast ? 'opacity-35' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isNext && <div className="w-1.5 h-1.5 rounded-full bg-lc-red animate-pulse" />}
                        {isPast && !isNext && <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                        {!isNext && !isPast && <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                        <span className={`font-akira text-[11px] ${isNext ? 'text-white' : 'text-white/70'}`}>
                          {s.label}
                        </span>
                      </div>
                      <span className="font-montserrat text-[10px] text-lc-subtle">
                        {dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' '}
                        <span className={isNext ? 'text-lc-red font-semibold' : ''}>
                          {dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bordo rosso in basso */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-lc-red to-transparent" />
    </section>
  )
}
