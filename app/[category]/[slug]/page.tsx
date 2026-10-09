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
import AltriArticoli from '@/components/AltriArticoli'
import CondividiArticolo from '@/components/CondividiArticolo'
import { ArticleCardGrid, type Article } from '@/components/ArticleCard'
import {
  getArticleBody,
  getArticleBySlug,
  getCorrelati,
  getPercorsiArticoli,
  getUltimiArticoli,
} from '@/lib/sanity/articles'
import { getSchedaAutore, type SchedaAutore } from '@/lib/sanity/authors'
import { autoreLd } from '@/lib/datiStrutturati'
import { urlFor } from '@/lib/sanity/image'
import { getCategoryConfig } from '@/lib/categories'
import { authorSlug } from '@/lib/authors'
import { jsonLd } from '@/lib/jsonLd'
import { metadati, SITE_URL } from '@/lib/seo'
import { dataOraItaliana, minutiDiLettura } from '@/lib/date'

import { ALTRI_ARTICOLI } from '@/lib/altriArticoli'
import CreditoFoto from '@/components/CreditoFoto'

// Articoli in fondo alla pagina ("Continua a leggere"). Se ne chiede uno in
// piu' a Sanity: il primo va nel riquadro "Leggi anche" dentro il testo.
const CORRELATI = 4

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
  const [categoriaVera, ...resto] = article.slug.split('/')
  const slugVero = resto.join('/')
  // Stesso slug ma con maiuscole diverse (vedi getArticleBySlug): si manda
  // all'indirizzo scritto come su Sanity, che e' quello nella sitemap.
  // Il confronto e' solo sulle maiuscole, non sulla codifica degli accenti,
  // cosi' non si innesca mai un giro di redirect.
  const soloMaiuscole = slug !== slugVero && slug.toLowerCase() === slugVero.toLowerCase()
  return categoriaVera === category && !soloMaiuscole
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

  // Titolo senza il suffisso " | Lastcorner" che il template di app/layout.tsx
  // aggiunge alle altre pagine. Nei risultati Google il nome del sito compare
  // gia' su una riga sua, e il suffisso costerebbe tredici caratteri su un
  // titolo che Google taglia intorno ai sessanta: a farne le spese sarebbe la
  // fine del titolo, cioe' spesso la parola che la gente ha cercato.
  return metadati({
    titolo: article.title,
    titoloAssoluto: true,
    descrizione: article.excerpt ?? `${article.title} — Lastcorner.net`,
    percorso: `/${params.category}/${params.slug}`,
    tipo: 'article',
    immagine: { url: article.imageUrl, width: 1200, height: 675, alt: article.imageAlt ?? article.title },
    openGraphExtra: {
      publishedTime: article.publishedAt,
      ...(article.aggiornatoIl ? { modifiedTime: article.aggiornatoIl } : {}),
      section: article.category,
      authors: article.author ? [`${SITE_URL}/autori/${authorSlug(article.author)}`] : undefined,
    },
  })
}

const SITO = 'https://lastcorner.net'

/** Dati strutturati dell'articolo. Servono a dire a Google che questa pagina
 *  e' una notizia, di che data, e chi l'ha scritta: senza, il pezzo parte
 *  svantaggiato rispetto a chi li dichiara — cioe' tutte le testate. */
function datiStrutturati(
  article: Article,
  percorso: string,
  categorySlug: string,
  scheda: SchedaAutore | null
) {
  const notizia = {
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.publishedAt ?? undefined,
    // L'aggiornamento dichiarato dalla redazione (campo "Aggiornato il"), non
    // l'ultima modifica tecnica: Google chiede che dateModified segnali i
    // cambiamenti di contenuto, e un refuso corretto non lo e'. Prima qui c'era
    // sempre la data di pubblicazione, quindi un pezzo aggiornato non lo
    // diceva mai.
    dateModified: article.aggiornatoIl ?? article.publishedAt ?? undefined,
    articleSection: article.category,
    // Con foto e profili social dalla scheda autore, quando c'e': sono i
    // campi che permettono a Google di riconoscere la firma.
    author: article.author
      ? autoreLd(article.author, `/autori/${authorSlug(article.author)}`, scheda)
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Lastcorner',
      logo: { '@type': 'ImageObject', url: `${SITO}/images/logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITO}${percorso}` },
  }
  // Il percorso Home > Categoria > Articolo, lo stesso delle briciole in
  // cima alla pagina: Google lo usa per mostrare il risultato con la
  // gerarchia al posto dell'indirizzo nudo.
  const briciole = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITO },
      { '@type': 'ListItem', position: 2, name: article.category, item: `${SITO}/${categorySlug}` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${SITO}${percorso}` },
    ],
  }
  return { '@context': 'https://schema.org', '@graph': [notizia, briciole] }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { article, spostatoIn } = await trovaArticolo(params.category, params.slug)
  if (spostatoIn) permanentRedirect(`/${spostatoIn}`)
  if (!article) notFound()

  const hasStandings = getCategoryConfig(params.category)?.hasStandings ?? false

  // Il testo dell'articolo viaggia separato: vedi la nota su ARTICLE_QUERY in
  // lib/sanity/articles.ts. Le due richieste sono indipendenti, quindi partono
  // insieme.
  const [corpo, otherArticles, correlati, scheda] = await Promise.all([
    getArticleBody(article.id),
    getUltimiArticoli(ALTRI_ARTICOLI, article.id),
    getCorrelati(article, CORRELATI + 1),
    article.author ? getSchedaAutore(authorSlug(article.author)) : Promise.resolve(null),
  ])

  const urlAssoluto = `${SITO}/${params.category}/${params.slug}`
  const pubblicato = dataOraItaliana(article.publishedAt)
  const aggiornato = dataOraItaliana(article.aggiornatoIl)
  const minuti = minutiDiLettura(corpo)
  // Il primo correlato va nel riquadro "Leggi anche" dentro il testo, gli
  // altri in fondo: cosi' nessun titolo compare due volte.
  const [inTesto, ...altri] = correlati
  // In fondo le card vanno su due colonne: un numero pari evita la card
  // sola in fondo alla griglia.
  const inFondo = altri.length > 1 ? altri.slice(0, altri.length - (altri.length % 2)) : altri
  const fotoAutore = scheda?.foto?.asset?._ref ? urlFor(scheda.foto).width(112).height(112).fit('crop').url() : null

  return (
    <div className="min-h-screen bg-lc-bg flex flex-col">
      <Navbar />

      {/* Padding orizzontale: quello della home page (80px) + 8px extra */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(datiStrutturati(article, `/${params.category}/${params.slug}`, params.category, scheda)),
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
            {/* 24px su mobile: a 28 un titolo medio andava su sei righe e da
                solo riempiva il primo schermo del telefono. */}
            <h1 className="font-akira font-extrabold text-[24px] sm:text-[28px] lg:text-[38px] text-white leading-[1.12] mb-4 [text-wrap:balance]">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="font-montserrat text-[17px] lg:text-[18px] text-lc-muted leading-relaxed mb-5 max-w-[68ch]">
                {article.excerpt}
              </p>
            )}

            {/* Data, autore e minuti di lettura.
                Con un aggiornamento dichiarato (campo "Aggiornato il") la data
                in evidenza e' quella dell'aggiornamento, e la pubblicazione
                scende sulla riga sotto: e' la data che conta per chi legge un
                pezzo che cambia nel weekend (orari, risultati), e Google tende
                a mostrare nell'anteprima la data piu' in vista della pagina.
                Entrambe restano scritte, come Google raccomanda, e nei dati
                strutturati vanno come datePublished e dateModified. */}
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] font-montserrat text-lc-subtle mb-5">
              {aggiornato && article.aggiornatoIl ? (
                <span className="text-white font-semibold">
                  Aggiornato il <time dateTime={article.aggiornatoIl}>{aggiornato}</time>
                </span>
              ) : pubblicato && article.publishedAt ? (
                <time dateTime={article.publishedAt}>{pubblicato}</time>
              ) : (
                <span>{article.date}</span>
              )}
              <span className="opacity-50" aria-hidden="true">·</span>
              <Link
                href={`/autori/${authorSlug(article.author)}`}
                className="text-white hover:text-lc-red transition-colors duration-200"
              >
                {article.author}
              </Link>
              {minuti && (
                <>
                  <span className="opacity-50" aria-hidden="true">·</span>
                  <span>{minuti} min di lettura</span>
                </>
              )}
              {aggiornato && article.aggiornatoIl && pubblicato && article.publishedAt && (
                <span className="basis-full text-lc-muted">
                  Pubblicato il <time dateTime={article.publishedAt}>{pubblicato}</time>
                </span>
              )}
            </div>

            <div className="mb-6">
              <CondividiArticolo titolo={article.title} url={urlAssoluto} />
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
            <div className={`relative w-full aspect-[3/2] rounded-card overflow-hidden border-b-2 border-lc-red ${article.imageCredit ? 'mb-2' : 'mb-8'}`}>
              <Image
                src={article.heroImageUrl ?? article.imageUrl}
                alt={article.imageAlt ?? article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>
            {article.imageCredit && (
              <p className="font-montserrat text-[11px] text-lc-subtle mb-8"><CreditoFoto parti={article.imageCredit} /></p>
            )}

            {corpo && corpo.length > 0 ? (
              <ArticleBody
                blocks={corpo}
                leggiAnche={inTesto ? { titolo: inTesto.title, href: `/${inTesto.slug}` } : undefined}
              />
            ) : (
              <p className="font-montserrat text-[14px] text-lc-subtle italic">
                Contenuto in arrivo.
              </p>
            )}

            {/* Fondo articolo: condivisione, chi l'ha scritto, cosa leggere
                dopo. Prima l'articolo finiva nel vuoto, e su mobile gli altri
                pezzi stavano solo nella barra laterale, sotto social e annunci. */}
            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col gap-8">
              <CondividiArticolo titolo={article.title} url={urlAssoluto} variante="esteso" />

              {article.author && (
                <Link
                  href={`/autori/${authorSlug(article.author)}`}
                  className="group flex items-center gap-4 bg-lc-card border border-white/10 rounded-card-sm p-4 hover:border-white/25 transition-colors duration-200"
                >
                  {fotoAutore ? (
                    <Image
                      src={fotoAutore}
                      alt={article.author}
                      width={56}
                      height={56}
                      className="rounded-full shrink-0 object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="w-14 h-14 rounded-full shrink-0 bg-lc-red/15 border border-lc-red/40 flex items-center justify-center font-akira font-bold text-[16px] text-white"
                    >
                      {article.author.trim().charAt(0)}
                    </span>
                  )}
                  <span className="flex flex-col min-w-0">
                    <span className="font-montserrat text-[11px] uppercase tracking-widest text-lc-subtle">Scritto da</span>
                    <span className="font-montserrat font-bold text-[16px] text-white">{article.author}</span>
                    {scheda?.ruolo && (
                      <span className="font-montserrat text-[13px] text-lc-subtle">{scheda.ruolo}</span>
                    )}
                    <span className="font-montserrat text-[13px] text-lc-red mt-1 group-hover:underline">
                      Tutti i suoi articoli →
                    </span>
                  </span>
                </Link>
              )}

              {inFondo.length > 0 && (
                <section aria-labelledby="correlati-heading">
                  <div className="flex items-center gap-3 mb-5">
                    <h2 id="correlati-heading" className="font-akira font-extrabold text-[18px] text-white whitespace-nowrap">
                      CONTINUA A <span className="text-lc-red">LEGGERE</span>
                    </h2>
                    <div className="flex-1 h-[3px] bg-gradient-to-r from-lc-red to-transparent rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inFondo.map((a) => (
                      <ArticleCardGrid key={a.id} article={a} />
                    ))}
                  </div>
                </section>
              )}
            </div>
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

            <AltriArticoli iniziali={otherArticles} escludiId={article.id} />

            <AdSlot height={600} label="300×600" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
