import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StandingsWidget from '@/components/StandingsWidget'
import SocialCard from '@/components/SocialCard'
import FontiPreferite from '@/components/FontiPreferite'
import AdSlot from '@/components/AdSlot'
import ArticleBody from '@/components/ArticleBody'
import { ArticleCardSmall, type Article } from '@/components/ArticleCard'
import {
  getArticleBody,
  getArticleBySlug,
  getPercorsiArticoli,
  getUltimiArticoli,
} from '@/lib/sanity/articles'
import { getCategoryConfig } from '@/lib/categories'
import { authorSlug } from '@/lib/authors'

// Quanti articoli mostrare nella sidebar (ridotti rispetto alla vecchia lista)
const OTHER_ARTICLES_COUNT = 5

// Pagina statica: si genera una volta e si aggiorna solo quando Sanity chiama
// /api/revalidate. Un articolo pubblicato dopo l'ultimo deploy non e' fra le
// pagine generate in build, e viene creato alla prima richiesta (dynamicParams
// e' attivo di default).
//
// Perche' "false" valga davvero, nessun fetch della pagina puo' avere una
// cache a tempo: in Next 14 vincerebbe lui. E' per questo che il widget della
// classifica si carica dal browser — vedi components/StandingsWidget.tsx.
export const revalidate = false

interface ArticlePageProps {
  params: { category: string; slug: string }
}

/** L'articolo e dove sta davvero.
 *
 *  Si cerca per slug in tutte le categorie, con una sola query. Se sta in
 *  un'altra categoria l'articolo e' stato spostato, e questo e' il suo vecchio
 *  indirizzo: la pagina lo reindirizza invece di rispondere 404. In Search
 *  Console erano 47 URL /altro/... in 404, e almeno due erano pezzi vivi
 *  spostati in "Formula 1" e in "WRC". */
async function trovaArticolo(category: string, slug: string) {
  const article = await getArticleBySlug(slug)
  if (!article) return { article: undefined, spostatoIn: undefined }
  const categoriaVera = article.slug.split('/')[0]
  return categoriaVera === category
    ? { article, spostatoIn: undefined }
    : { article: undefined, spostatoIn: article.slug }
}

// Pre-genera in build le pagine di tutti gli articoli. Serve solo sapere
// categoria e slug di ciascuno, non il resto.
export async function generateStaticParams() {
  return getPercorsiArticoli()
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { article } = await trovaArticolo(params.category, params.slug)
  if (!article) return { title: 'Articolo non trovato' }

  const description = article.excerpt ?? `${article.title} — Lastcorner.net`
  const percorso = `/${params.category}/${params.slug}`
  return {
    // Titolo senza il suffisso " | Lastcorner" che il template di
    // app/layout.tsx aggiunge alle altre pagine.
    //
    // Nei risultati Google il nome del sito compare gia' su una riga sua,
    // sopra il titolo: il suffisso lo ripete e basta. Ma soprattutto costa
    // tredici caratteri su un titolo che Google taglia intorno ai sessanta,
    // e a farne le spese e' la fine del titolo — cioe' esattamente la parola
    // che la gente ha cercato. "F1 | Gli Orari TV SKY e TV8 del GP di Spagna
    // 2026 a Madrid" mette "Madrid" al carattere 52: con il suffisso il
    // taglio se lo mangia, senza resta.
    title: { absolute: article.title },
    description,
    // Senza questo l'articolo ereditava il canonical della home e diceva a
    // Google di indicizzare quella al posto suo.
    alternates: { canonical: percorso },
    openGraph: {
      title: article.title,
      description,
      url: percorso,
      images: [article.imageUrl],
      type: 'article',
      publishedTime: article.publishedAt,
    },
  }
}

const SITO = 'https://lastcorner.net'

/** Dati strutturati dell'articolo. Servono a dire a Google che questa pagina
 *  e' una notizia, di che data, e chi l'ha scritta: senza, il pezzo parte
 *  svantaggiato rispetto a chi li dichiara — cioe' tutte le testate. */
function datiStrutturati(article: Article, percorso: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.publishedAt ?? undefined,
    articleSection: article.category,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author,
          url: `${SITO}/autori/${authorSlug(article.author)}`,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Lastcorner',
      logo: { '@type': 'ImageObject', url: `${SITO}/images/logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITO}${percorso}` },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { article, spostatoIn } = await trovaArticolo(params.category, params.slug)
  if (spostatoIn) permanentRedirect(`/${spostatoIn}`)
  if (!article) notFound()

  const hasStandings = getCategoryConfig(params.category)?.hasStandings ?? false

  // Il testo dell'articolo viaggia separato: vedi la nota su ARTICLE_QUERY in
  // lib/sanity/articles.ts. Le due richieste sono indipendenti, quindi partono
  // insieme.
  const [corpo, otherArticles] = await Promise.all([
    getArticleBody(article.id),
    getUltimiArticoli(OTHER_ARTICLES_COUNT, article.id),
  ])

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      {/* Padding orizzontale: quello della home page (80px) + 8px extra */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datiStrutturati(article, `/${params.category}/${params.slug}`)
          ),
        }}
      />

      <main id="main-content" className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-[88px] pt-[96px] flex-1">

        {/* Breadcrumb */}
        <nav aria-label="Percorso" className="font-montserrat text-[11px] text-lc-subtle mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-lc-red transition-colors duration-200">Home</Link>
          <span className="opacity-50">/</span>
          <Link href={`/${params.category}`} className="hover:text-lc-red transition-colors duration-200">
            {article.category}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white/60 truncate max-w-[420px]">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 mb-16">
          {/* min-w-0: senza, la colonna di una griglia non scende mai sotto la
              larghezza minima del suo contenuto. Un'immagine larga bastava a
              gonfiare la colonna e a spingere la barra laterale fuori dallo
              schermo. Con min-w-0 la colonna vale esattamente lo spazio
              disponibile e il contenuto si adatta a lei. */}
          <article className="min-w-0">
            <span className="inline-block font-akira font-bold text-[11px] text-white bg-lc-red rounded-full px-3 py-1 mb-4 tracking-wide">
              {article.category.toUpperCase()}
            </span>

            {/* Titolo — variante più pesante di Akira (SuperBold, 800) */}
            <h1 className="font-akira font-extrabold text-[28px] lg:text-[38px] text-white leading-[1.1] mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="font-montserrat text-[15px] text-lc-subtle leading-relaxed mb-5">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 text-[12px] font-montserrat text-lc-subtle mb-6">
              <span>{article.date}</span>
              <span className="opacity-60">|</span>
              <Link
                href={`/autori/${authorSlug(article.author)}`}
                className="hover:text-lc-red transition-colors duration-200"
              >
                {article.author}
              </Link>
            </div>

            {/* Riquadro a proporzioni fisse, non libere come per le immagini nel
                corpo: la stessa foto compare anche nelle card e nell'anteprima
                social, e un formato costante tiene allineate le griglie di
                tutto il sito. Il 16:9 di prima (440px di altezza su desktop)
                risultava troppo schiacciato, quindi qui si passa al 3:2. Su
                schermo intermedio (finestra a meta', tablet) l'altezza fissa di
                300px faceva anche di peggio: la colonna li' e' larga oltre
                800px, quindi il riquadro diventava una striscia 2,8:1. Un
                rapporto al posto di un'altezza in pixel elimina il problema a
                ogni larghezza, e coincide col ritaglio 3:2 richiesto alla CDN,
                quindi il browser non taglia piu' nulla per conto suo. Cosa
                resta dentro il ritaglio si decide nello Studio col punto di
                interesse (hotspot). */}
            <div className="relative w-full aspect-[3/2] rounded-card overflow-hidden mb-8 border-b-2 border-lc-red">
              <Image
                src={article.heroImageUrl ?? article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>

            {corpo && corpo.length > 0 ? (
              <ArticleBody blocks={corpo} />
            ) : (
              <p className="font-montserrat text-[14px] text-lc-subtle italic">
                Contenuto in arrivo.
              </p>
            )}
          </article>

          {/* Sidebar — il widget social è il primo elemento; il resto (classifica in
              giù) riprende circa all'altezza dell'immagine in evidenza. Lo scarto
              tra i due varia con la lunghezza del titolo, quindi lo spazio è
              colmato con un annuncio invece di un margine fisso "a occhio". */}
          <aside className="flex flex-col gap-4">
            <SocialCard />

            <FontiPreferite />

            <AdSlot height={200} label="300×250" />

            {hasStandings ? (
              <StandingsWidget />
            ) : (
              <AdSlot height={250} label="300×250" />
            )}

            {otherArticles.length > 0 && (
              <div>
                <p className="font-akira text-[11px] text-white uppercase tracking-widest mb-3">
                  Altri articoli
                </p>
                <div className="flex flex-col gap-[3px]">
                  {otherArticles.map((a) => (
                    <ArticleCardSmall key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
