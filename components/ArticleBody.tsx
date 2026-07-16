import Image from 'next/image'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import AdSlot from '@/components/AdSlot'
import { urlFor } from '@/lib/sanity/image'

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

// Immagine nel corpo articolo. Supporta sia asset Sanity veri (asset._ref,
// risolto con urlFor) sia il vecchio formato mock con URL diretto
// (asset.url), per non dover riscrivere l'articolo di esempio esistente.
function ImageBlock({ value }: { value: any }) {
  const src = value?.asset?._ref ? urlFor(value).width(1600).url() : value?.asset?.url
  if (!src) return null
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
      {value.caption && (
        <figcaption className="font-montserrat italic text-[12px] text-lc-subtle mt-2">
          {value.caption}
        </figcaption>
      )}
    </figure>
  )
}

// Embed X/Twitter/YouTube. I video YouTube vengono incorporati con un
// iframe responsive; per il resto (X e altri) mostriamo per ora un link
// diretto al post originale, senza caricare script esterni di terze parti.
function EmbedBlock({ value }: { value: { url?: string } }) {
  const url = value?.url
  if (!url) return null

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
    adSlot: () => <AdSlot height={120} label="Google AdSense" className="mb-6" />,
  },
}

export default function ArticleBody({ blocks }: { blocks?: any[] }) {
  if (!blocks || blocks.length === 0) return null
  return <PortableText value={withAdsInjected(blocks)} components={components} />
}
