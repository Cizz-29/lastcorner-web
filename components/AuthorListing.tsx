import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SocialCard from '@/components/SocialCard'
import AdSlot from '@/components/AdSlot'
import Pagination from '@/components/Pagination'
import AuthorHeader from '@/components/AuthorHeader'
import { ArticleCardGrid, ArticleCardSmall } from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/sanity/articles'
import { getSchedaAutore } from '@/lib/sanity/authors'
import { authorSlug } from '@/lib/authors'
import { ANNUNCIO_OGNI_N_CARD, fettaElenco } from '@/lib/paginazione'

const SITO = 'https://lastcorner.net'

interface AuthorListingProps {
  slug: string
  pagina: number
}

// Dati strutturati dell'autore. Dicono a Google che dietro gli articoli c'e'
// una persona reale, con un ruolo e dei profili verificabili: e' il segnale di
// affidabilita' che una testata dovrebbe dare e che finora mancava.
function datiStrutturati(nome: string, slug: string, ruolo?: string, social?: { url: string }[]) {
  const sameAs = (social ?? []).map((s) => s.url)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: nome,
    url: `${SITO}/autori/${slug}`,
    jobTitle: ruolo || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    worksFor: { '@type': 'Organization', name: 'Lastcorner', url: SITO },
  }
}

export default async function AuthorListing({ slug, pagina }: AuthorListingProps) {
  const allArticles = await getAllArticles()
  const authorArticles = allArticles.filter((a) => authorSlug(a.author) === slug)
  if (authorArticles.length === 0) notFound()

  const authorName = authorArticles[0].author
  const scheda = await getSchedaAutore(slug)

  const { paginaCorrente, paginePresenti, grandi, piccoli } = fettaElenco(authorArticles, pagina)

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      {scheda && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(datiStrutturati(scheda.nome, slug, scheda.ruolo, scheda.social)),
          }}
        />
      )}

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-20 pt-[96px] flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-lc-red rounded-full shrink-0" />
          <h1 className="font-akira font-extrabold text-[22px] lg:text-[28px] text-white leading-tight uppercase">
            {authorName}
          </h1>
        </div>
        <p className="font-montserrat text-[13px] text-lc-subtle mb-8">
          {authorArticles.length} articol{authorArticles.length === 1 ? 'o' : 'i'} pubblicat
          {authorArticles.length === 1 ? 'o' : 'i'} su Lastcorner.net
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div className="min-w-0">
            {/* La scheda compare solo sulla prima pagina: sulle successive
                sarebbe una ripetizione fra l'utente e l'elenco che cerca. */}
            {paginaCorrente === 1 && <AuthorHeader scheda={scheda} />}

            {grandi.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {grandi.map((a) => (
                  <ArticleCardGrid key={a.id} article={a} />
                ))}
              </div>
            )}

            {piccoli.length > 0 && (
              <>
                <AdSlot height={100} className="mb-8" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {piccoli.map((a, i) => {
                    const isLast = i === piccoli.length - 1
                    const showAd = (i + 1) % ANNUNCIO_OGNI_N_CARD === 0 && !isLast
                    return (
                      <Fragment key={a.id}>
                        <ArticleCardSmall article={a} />
                        {showAd && <div className="sm:col-span-2"><AdSlot height={100} className="my-2" /></div>}
                      </Fragment>
                    )
                  })}
                </div>
              </>
            )}

            <Pagination currentPage={paginaCorrente} totalPages={paginePresenti} basePath={`/autori/${slug}`} />
          </div>

          <aside className="flex flex-col gap-4">
            <SocialCard />
            <AdSlot height={600} label="300×600" />
            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
