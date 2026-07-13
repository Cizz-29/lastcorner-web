import { Fragment } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import TeamCard from '@/components/TeamCard'
import { getConstructorStandings } from '@/lib/f1api'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'

const CARDS_PER_AD_BLOCK = 6 // ogni 3 righe da 2 card (grid-cols-2)

interface PageProps {
  params: { category: string }
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getCategoryConfig(params.category)
  if (!config) return { title: 'Team non trovata' }
  return { title: `Team ${config.label}` }
}

export default async function TeamsOverviewPage({ params }: PageProps) {
  const config = getCategoryConfig(params.category)
  if (!config) notFound()

  const teams = config.slug === 'formula-1' ? await getConstructorStandings() : []

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />
      <main className="max-w-[1280px] w-full mx-auto px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            Team {config.label}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            {teams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((t, i) => {
                  const showAd = (i + 1) % CARDS_PER_AD_BLOCK === 0 && i !== teams.length - 1
                  return (
                    <Fragment key={t.Constructor.constructorId}>
                      <TeamCard team={t} categorySlug={config.slug} />
                      {showAd && (
                        <div className="sm:col-span-2">
                          <AdSlot height={100} />
                        </div>
                      )}
                    </Fragment>
                  )
                })}
              </div>
            ) : (
              <div className="pb-16">
                <p className="font-montserrat text-[14px] text-lc-subtle mb-8 max-w-xl leading-relaxed">
                  L&apos;elenco team {config.label} sarà disponibile a breve: al momento non
                  esiste una fonte dati gratuita e affidabile per questa categoria.
                </p>
                <AdSlot height={250} label="300×250" />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <SocialCard />
            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
