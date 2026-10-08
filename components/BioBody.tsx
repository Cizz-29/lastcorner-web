import Image from 'next/image'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { urlFor, dimensioniDa } from '@/lib/sanity/image'
import { partiCredito } from '@/lib/fontiImmagini'
import CreditoFoto from '@/components/CreditoFoto'

// Rendering Portable Text per le bio pilota/team (stesso editor ricco degli
// articoli, ma senza inserimento automatico di annunci/embed: qui il testo
// è più breve e non ha senso interromperlo con pubblicità).

// Come le immagini degli articoli (components/ArticleBody.tsx): nelle sue
// proporzioni reali, con la didascalia sotto. Prima era un riquadro fisso
// alto 220px, che tagliava le foto verticali, e la didascalia non esisteva.
function BioImage({ value }: { value: any }) {
  const dim = dimensioniDa(value)
  const src = value?.asset?._ref
    ? urlFor(value).width(Math.min(1600, dim?.larghezza ?? 1200)).url()
    : value?.asset?.url
  if (!src) return null
  const alt = value.alt || value.caption || ''
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
      <figure className="mb-5">
        <div className="relative w-full h-[220px] rounded-card overflow-hidden">
          <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
        </div>
        {didascalia}
      </figure>
    )
  }
  const proporzioni = dim.larghezza / dim.altezza
  return (
    <figure className="mb-5">
      {/* Mai piu' larga del file: diverse bio hanno foto da 300px, che a
          tutta colonna sarebbero sgranate. Meglio piccole e nitide. */}
      <div
        className="mx-auto"
        style={{ maxWidth: `min(100%, ${dim.larghezza}px, calc(70vh * ${proporzioni.toFixed(4)}))` }}
      >
        <Image
          src={src}
          alt={alt}
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

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="font-montserrat text-[14px] text-white/85 leading-relaxed mb-4">{children}</p>
    ),
    h2: ({ children }) => (
      <h3 className="font-akira text-[15px] text-white font-bold mt-6 mb-3">{children}</h3>
    ),
    h3: ({ children }) => (
      <h3 className="font-akira text-[14px] text-white font-bold mt-5 mb-2">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-lc-red pl-4 italic text-white/70 mb-4">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside font-montserrat text-[14px] text-white/85 mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside font-montserrat text-[14px] text-white/85 mb-4 space-y-1">{children}</ol>
    ),
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
    image: BioImage,
  },
}

export default function BioBody({ blocks }: { blocks?: any[] }) {
  if (!blocks || blocks.length === 0) return null
  return <PortableText value={blocks} components={components} />
}
