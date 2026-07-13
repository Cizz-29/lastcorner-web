import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import { getCurrentSchedule } from '@/lib/f1api'
import { getCategoryConfig } from '@/lib/categories'
import { FLAG_CODES, COUNTRY_COLORS } from '@/components/NextEventSection'

const AD_EVERY_N_ROUNDS = 6

interface PageProps {
  params: { category: string }
}

// Il calendario è disponibile solo per la F1: per le altre categorie non
// c'è modo di mantenerlo aggiornato senza una fonte dati dedicata.
export function generateStaticParams() {
  return [{ category: 'formula-1' }]
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (params.category !== 'formula-1') return { title: 'Calendario non disponibile' }
  return { title: `Calendario Formula 1 ${new Date().getFullYear()}` }
}

function formatDateRange(firstPractice: string | undefined, raceDate: string): string {
  const race = new Date(raceDate)
  if (!firstPractice) {
    return race.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' })
  }
  const start = new Date(firstPractice)
  const sameMonth = start.getMonth() === race.getMonth()
  const startLabel = start.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: sameMonth ? undefined : 'long',
    timeZone: 'Europe/Rome',
  })
  const endLabel = race.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' })
  return `${startLabel} — ${endLabel}`
}

export default async function CalendarioPage({ params }: PageProps) {
  const config = getCategoryConfig(params.category)
  if (!config || params.category !== 'formula-1') notFound()

  const races = await getCurrentSchedule()
  const season = new Date().getFullYear()
  const now = new Date()

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            Calendario {config.label} {season}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            {races.length > 0 ? (
              <div className="flex flex-col gap-3">
                {races.map((race: any, i: number) => {
                  const country = race.Circuit?.Location?.country ?? ''
                  const flagCode = FLAG_CODES[country] ?? null
                  const [accent] = COUNTRY_COLORS[country] ?? ['#FF3A3A', '#FF3A3A']
                  const raceDateTime = new Date(`${race.date}T${race.time ?? '13:00:00Z'}`)
                  const isPast = raceDateTime < now
                  const isNext = !isPast && races.findIndex((r: any) => new Date(`${r.date}T${r.time ?? '13:00:00Z'}`) >= now) === i
                  const showAd = (i + 1) % AD_EVERY_N_ROUNDS === 0 && i !== races.length - 1

                  return (
                    <div key={race.round}>
                      <div
                        className={`relative bg-lc-card rounded-card-sm border overflow-hidden flex items-center gap-4 p-4 transition-colors ${
                          isNext ? 'border-lc-red/40' : 'border-white/10'
                        } ${isPast ? 'opacity-50' : ''}`}
                      >
                        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: accent }} />
                        <span className="font-akira font-extrabold text-[13px] text-lc-subtle w-8 text-center shrink-0">
                          {String(race.round).padStart(2, '0')}
                        </span>
                        {flagCode ? (
                          <div className="relative w-[42px] h-[28px] rounded-[4px] overflow-hidden shrink-0 ring-1 ring-white/10">
                            <Image
                              src={`https://flagcdn.com/w160/${flagCode}.png`}
                              alt={`Bandiera ${country}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-[24px] w-[42px] text-center shrink-0" aria-hidden>🏁</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-akira font-bold text-[14px] text-white truncate">
                            {race.raceName}
                          </p>
                          <p className="font-montserrat text-[11px] text-lc-subtle truncate">
                            {race.Circuit?.circuitName}
                            {race.Circuit?.Location?.locality ? ` — ${race.Circuit.Location.locality}, ${country}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-montserrat text-[12px] text-white">
                            {formatDateRange(race.FirstPractice?.date, race.date)}
                          </p>
                          {isNext && (
                            <p className="font-akira text-[10px] text-lc-red uppercase tracking-widest mt-1">
                              Prossimo GP
                            </p>
                          )}
                        </div>
                      </div>
                      {showAd && (
                        <div className="mt-3">
                          <AdSlot height={100} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="pb-16">
                <p className="font-montserrat text-[14px] text-lc-subtle mb-8 max-w-xl leading-relaxed">
                  Il calendario non è disponibile al momento.
                </p>
                <AdSlot height={250} label="300×250" />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <SocialCard />
            <AdSlot height={250} label="300×250" />
            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
