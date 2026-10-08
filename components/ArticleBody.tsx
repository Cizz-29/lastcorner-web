import Image from 'next/image'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import AdSlot from '@/components/AdSlot'
import TabellaBlock from '@/components/TabellaBlock'
import XEmbed from '@/components/XEmbed'
import InstagramEmbed from '@/components/InstagramEmbed'
import ClassificaF1Block from '@/components/ClassificaF1Block'
import { urlFor, dimensioniDa } from '@/lib/sanity/image'
import { partiCredito } from '@/lib/fontiImmagini'
import CreditoFoto from '@/components/CreditoFoto'
import { MINIMO_VOCI_INDICE, titoliDelCorpo, vociIndice, type LivelloIndice, type VoceIndice } from '@/lib/indice'

// Ogni quanti paragrafi consecutivi inserire uno slot pubblicitario nel corpo.
const AD_EVERY_N_PARAGRAPHS = 3

// Dopo quale paragrafo proporre il riquadro "Leggi anche", e da quanti
// paragrafi in su: in un pezzo corto interromperebbe la lettura per niente.
const LEGGI_ANCHE_DOPO = 4
const LEGGI_ANCHE_MINIMO = 6

export interface LeggiAnche {
  titolo: string
  href: string
}

function isParagrafo(block: any): boolean {
  return block?._type === 'block' && !block.listItem && (block.style ?? 'normal') === 'normal'
}

// Inserisce un blocco "adSlot" sintetico ogni N paragrafi normali (le
// immagini, gli embed e i titoli non contano ai fini del conteggio), e un
// "Leggi anche" dopo il quarto paragrafo dei pezzi abbastanza lunghi.
function withAdsInjected(blocks: any[], leggiAnche?: LeggiAnche): any[] {
  const paragrafi = blocks.filter(isParagrafo).length
  let count = 0
  const result: any[] = []
  blocks.forEach((block, i) => {
    result.push(block)
    if (isParagrafo(block)) {
      count++
      const isLast = i === blocks.length - 1
      if (count % AD_EVERY_N_PARAGRAPHS === 0 && !isLast) {
        result.push({ _type: 'adSlot', _key: `ad-${block._key ?? i}` })
      }
      if (leggiAnche && count === LEGGI_ANCHE_DOPO && paragrafi >= LEGGI_ANCHE_MINIMO && !isLast) {
        result.push({ _type: 'leggiAnche', _key: 'leggi-anche', ...leggiAnche })
      }
    }
  })
  return result
}

// Il testo corrente sta in una colonna di circa 68 caratteri: sopra i 90-100
// l'occhio fatica a ritrovare l'inizio della riga successiva, e la colonna
// dell'articolo su desktop arriva a 744px. Immagini, tabelle ed embed restano
// invece a tutta larghezza.
const COLONNA_TESTO = 'max-w-[68ch]'

// Immagine nel corpo articolo.
//
// L'immagine occupa tutta la larghezza della colonna di testo e mantiene le
// proporzioni con cui e' stata caricata (o ritagliata nello Studio): niente
// ritaglio automatico. Prima veniva forzata in un riquadro alto 280px (360 su
// desktop) e tagliata al centro, il che rovinava tutto cio' che non fosse gia'
// panoramico — uno screenshot di telemetria, un grafico, una foto verticale.
//
// La larghezza piena e' voluta: usando la dimensione in pixel del file, una
// foto piu' stretta della colonna restava piccola e sperduta in mezzo alla
// pagina, con un margine bianco diverso da immagine a immagine.
//
// Le misure si leggono dal riferimento Sanity (vedi dimensioniDa): passandole a
// next/image il browser conosce le proporzioni prima di scaricare il file e
// riserva lo spazio giusto, quindi il testo non si sposta mentre la pagina
// carica.
//
// Unico limite: una foto verticale non deve occupare piu' di circa l'80%
// dell'altezza dello schermo, altrimenti spinge fuori vista il testo che la
// segue. Il limite e' espresso come limite di LARGHEZZA ricavato dalle
// proporzioni, cosi' l'immagine rimpicciolisce invece di venire tagliata.
//
// Se le dimensioni non sono ricavabili (vecchie immagini mock con URL diretto)
// si ricade sul riquadro a proporzioni fisse di prima.
function ImageBlock({ value }: { value: any }) {
  const dim = dimensioniDa(value)
  const daSanity = Boolean(value?.asset?._ref)
  const src = daSanity
    ? urlFor(value).width(Math.min(1600, dim?.larghezza ?? 1600)).url()
    : value?.asset?.url
  if (!src) return null

  // Didascalia e credito della foto (campo "Fonte e permesso"): il credito
  // compare anche senza didascalia, perché alcune fonti lo richiedono.
  const credito = partiCredito(value?.fonte)
  const didascalia = value.caption || credito ? (
    <figcaption className="font-montserrat italic text-[12px] text-lc-subtle mt-2">
      {value.caption}
      {credito && (
        <span className="not-italic">
          {value.caption ? ' · ' : ''}
          <CreditoFoto parti={credito} />
        </span>
      )}
    </figcaption>
  ) : null

  if (!dim) {
    return (
      <figure className="mb-6">
        <div className="relative w-full h-[280px] lg:h-[360px] rounded-card overflow-hidden">
          <Image
            src={src}
            alt={value.alt || value.caption || ''}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
          />
        </div>
        {didascalia}
      </figure>
    )
  }

  const proporzioni = dim.larghezza / dim.altezza

  // Il tetto di altezza e' scritto come min(100%, ...) e l'immagine tiene un
  // max-w-full: senza il 100% il riquadro poteva chiedere piu' spazio della
  // colonna (su una finestra bassa e larga 80vh vale poco, ma moltiplicato
  // per le proporzioni di una foto panoramica diventa piu' della colonna) e
  // la pagina finiva per allargarsi oltre lo schermo.
  return (
    <figure className="mb-6">
      <div className="mx-auto" style={{ maxWidth: `min(100%, calc(80vh * ${proporzioni.toFixed(4)}))` }}>
        <Image
          src={src}
          alt={value.alt || value.caption || ''}
          width={dim.larghezza}
          height={dim.altezza}
          sizes="(max-width: 1024px) 100vw, 800px"
          className="w-full max-w-full h-auto rounded-card"
        />
        {didascalia}
      </div>
    </figure>
  )
}

// Embed X/Twitter, Instagram e YouTube. I video YouTube vanno in un iframe
// responsive; i post di X e di Instagram mostrano l'anteprima vera (vedi
// XEmbed e InstagramEmbed, che caricano lo script di terze parti solo col
// consenso marketing); per tutto il resto resta il link.
function EmbedBlock({ value }: { value: { url?: string } }) {
  const url = value?.url
  if (!url) return null

  if (/(^|\/\/)(www\.)?(twitter\.com|x\.com)\//.test(url)) {
    return <XEmbed url={url} />
  }

  // Post, reel e IGTV: sono le tre forme che l'embed di Instagram accetta.
  if (/(^|\/\/)(www\.)?instagram\.com\/(p|reel|reels|tv)\//.test(url)) {
    return <InstagramEmbed url={url} />
  }

  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) {
    return (
      <div className="relative w-full aspect-video mb-6 rounded-card overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${yt[1]}`}
          title="Video YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mb-6 rounded-card border border-white/10 bg-lc-card px-4 py-3 font-montserrat text-[13px] text-lc-red hover:underline"
    >
      Guarda il post originale →
    </a>
  )
}

// L'header e' fisso (75px): senza margine di scorrimento, cliccando una voce
// dell'indice il titolo finirebbe nascosto sotto la barra.
const MARGINE_ANCORA = 'scroll-mt-[96px]'

// Indice dei contenuti (blocco `indice` dello Studio, vedi lib/indice.ts).
// Reso dal server come semplice elenco di link interni: nessun JavaScript,
// funziona anche prima che la pagina abbia finito di caricare.
function IndiceBlock({
  value,
  titoli,
}: {
  value: { titolo?: string; livelli?: LivelloIndice; _key?: string }
  titoli: VoceIndice[]
}) {
  const voci = vociIndice(titoli, value?.livelli)
  if (voci.length < MINIMO_VOCI_INDICE) return null
  const idTitolo = `indice-${value?._key ?? 'articolo'}`
  return (
    <nav
      aria-labelledby={idTitolo}
      className={`mb-8 border-l-2 border-lc-red bg-lc-card rounded-r-xl px-4 py-4 lg:px-5 ${COLONNA_TESTO}`}
    >
      <p id={idTitolo} className="font-akira font-bold text-[10px] tracking-widest text-lc-red mb-3 uppercase">
        {value?.titolo?.trim() || 'In questo articolo'}
      </p>
      <ol className="space-y-2 font-montserrat text-[15px] lg:text-[16px] leading-snug">
        {voci.map((v) => (
          <li key={v.key} className={v.livello === 3 ? 'pl-4 text-[14px] lg:text-[15px]' : undefined}>
            <a
              href={`#${v.id}`}
              className={`hover:text-lc-red hover:underline ${v.livello === 3 ? 'text-white/70' : 'text-white/90 font-semibold'}`}
            >
              {v.testo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function creaComponenti(titoli: VoceIndice[]): PortableTextComponents {
  const idPerBlocco = new Map(titoli.map((t) => [t.key, t.id]))
  return {
    block: {
      h2: ({ children, value }) => (
        <h2
          id={value?._key ? idPerBlocco.get(value._key) : undefined}
          className={`font-akira text-[18px] lg:text-[20px] text-white font-bold mt-9 mb-4 ${MARGINE_ANCORA} ${COLONNA_TESTO}`}
        >
          {children}
        </h2>
      ),
      h3: ({ children, value }) => (
        <h3
          id={value?._key ? idPerBlocco.get(value._key) : undefined}
          className={`font-akira text-[16px] lg:text-[18px] text-white font-bold mt-7 mb-3 ${MARGINE_ANCORA} ${COLONNA_TESTO}`}
        >
          {children}
        </h3>
      ),
      // 17px su mobile e 18 su desktop, interlinea 1,7. Prima erano 15px: sotto
      // la soglia di lettura comoda su telefono, dove arriva l'86% del traffico
      // da Google.
      normal: ({ children }) => (
        <p className={`font-montserrat text-[17px] lg:text-[18px] text-white/90 leading-[1.7] mb-6 ${COLONNA_TESTO}`}>{children}</p>
      ),
      blockquote: ({ children }) => (
        <blockquote className={`border-l-2 border-lc-red pl-4 italic font-montserrat text-[17px] lg:text-[18px] text-white/85 leading-[1.7] mb-6 ${COLONNA_TESTO}`}>{children}</blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className={`list-disc pl-5 font-montserrat text-[17px] lg:text-[18px] text-white/90 leading-[1.7] mb-6 space-y-1 ${COLONNA_TESTO}`}>{children}</ul>
      ),
      number: ({ children }) => (
        <ol className={`list-decimal pl-5 font-montserrat text-[17px] lg:text-[18px] text-white/90 leading-[1.7] mb-6 space-y-1 ${COLONNA_TESTO}`}>{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      // I link esterni si aprono in una scheda nuova, quelli interni no.
      //
      // Prima ci finivano tutti: cliccando su un altro articolo del sito il
      // lettore si ritrovava con una scheda in piu' invece di navigare, e la
      // sessione si spezzava. Un link interno e' scritto come percorso
      // relativo ("/formula-1/calendario"), quindi basta guardare se comincia
      // con http per distinguerli; il dominio nostro e' trattato come interno
      // per i link vecchi scritti per esteso.
      link: ({ children, value }) => {
        const href: string = value?.href ?? ''
        const esterno =
          /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?lastcorner\.net(\/|$)/i.test(href)
        return (
          <a
            href={href}
            {...(esterno ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-lc-red underline hover:no-underline"
          >
            {children}
          </a>
        )
      },
    },
    types: {
      image: ImageBlock,
      embed: EmbedBlock,
      tabella: ({ value }: { value: any }) => <TabellaBlock value={value} />,
      // ClassificaF1Block è un Server Component asincrono: qui va bene,
      // perché ArticleBody viene reso lato server e i dati della classifica
      // sono già disponibili al momento del rendering.
      classificaF1: ({ value }: { value: any }) => <ClassificaF1Block tipo={value?.tipo} />,
      indice: ({ value }: { value: any }) => <IndiceBlock value={value} titoli={titoli} />,
      adSlot: () => <AdSlot height={120} label="Google AdSense" className="mb-6" />,
      leggiAnche: ({ value }: { value: LeggiAnche }) => (
        <aside className={`mb-6 ${COLONNA_TESTO}`} aria-label="Leggi anche">
          <Link
            href={value.href}
            className="group flex flex-col gap-1 border-l-2 border-lc-red bg-lc-card rounded-r-xl px-4 py-3 hover:bg-white/[0.04] transition-colors duration-200"
          >
            <span className="font-akira font-bold text-[10px] tracking-widest text-lc-red">LEGGI ANCHE</span>
            <span className="font-montserrat font-semibold text-[15px] lg:text-[16px] text-white leading-snug group-hover:underline">
              {value.titolo}
            </span>
          </Link>
        </aside>
      ),
    },
  }
}

export default function ArticleBody({ blocks, leggiAnche }: { blocks?: any[]; leggiAnche?: LeggiAnche }) {
  if (!blocks || blocks.length === 0) return null
  const titoli = titoliDelCorpo(blocks)
  return <PortableText value={withAdsInjected(blocks, leggiAnche)} components={creaComponenti(titoli)} />
}
