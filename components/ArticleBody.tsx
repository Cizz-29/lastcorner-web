import Image from 'next/image'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import AdSlot from '@/components/AdSlot'
import TabellaBlock from '@/components/TabellaBlock'
import XEmbed from '@/components/XEmbed'
import ClassificaF1Block from '@/components/ClassificaF1Block'
import { urlFor, dimensioniDa } from '@/lib/sanity/image'

// Ogni quanti paragrafi consecutivi inserire uno slot pubblicitario nel corpo.
const AD_EVERY_N_PARAGRAPHS = 3

// Inserisce un blocco "adSlot" sintetico ogni N paragrafi normali (le
// immagini, gli embed e i titoli non contano ai fini del conteggio).
function withAdsInjected(blocks: any[]): any[] {
  let count = 0
  const result: any[] = []
  blocks.forEach((block, i) => {
    result.push(block)
    const isParagraph = block._type === 'block' && !block.listItem && (block.style ?? 'normal') === 'normal'
    if (isParagraph) {
      count++
      const isLast = i === blocks.length - 1
      if (count % AD_EVERY_N_PARAGRAPHS === 0 && !isLast) {
        result.push({ _type: 'adSlot', _key: `ad-${block._key ?? i}` })
      }
    }
  })
  return result
}

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

  const didascalia = value.caption ? (
    <figcaption className="font-montserrat italic text-[12px] text-lc-subtle mt-2">
      {value.caption}
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

// Embed X/Twitter/YouTube. I video YouTube vanno in un iframe responsive;
// i post di X mostrano l'anteprima vera (vedi XEmbed, che carica lo script
// di X solo col consenso marketing); per tutto il resto resta il link.
function EmbedBlock({ value }: { value: { url?: string } }) {
  const url = value?.url
  if (!url) return null

  if (/(^|\/\/)(www\.)?(twitter\.com|x\.com)\//.test(url)) {
    return <XEmbed url={url} />
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

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="font-akira text-[18px] lg:text-[20px] text-white font-bold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-akira text-[16px] lg:text-[18px] text-white font-bold mt-6 mb-3">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="font-montserrat text-[15px] text-white/90 leading-relaxed mb-5">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-lc-red pl-4 italic text-white/80 mb-5">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside font-montserrat text-[15px] text-white/90 mb-5 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside font-montserrat text-[15px] text-white/90 mb-5 space-y-1">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lc-red underline hover:no-underline"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ImageBlock,
    embed: EmbedBlock,
    tabella: ({ value }: { value: any }) => <TabellaBlock value={value} />,
    // ClassificaF1Block è un Server Component asincrono: qui va bene,
    // perché ArticleBody viene reso lato server e i dati della classifica
    // sono già disponibili al momento del rendering.
    classificaF1: ({ value }: { value: any }) => <ClassificaF1Block tipo={value?.tipo} />,
    adSlot: () => <AdSlot height={120} label="Google AdSense" className="mb-6" />,
  },
}

export default function ArticleBody({ blocks }: { blocks?: any[] }) {
  if (!blocks || blocks.length === 0) return null
  return <PortableText value={withAdsInjected(blocks)} components={components} />
}
