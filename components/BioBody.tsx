import Image from 'next/image'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/lib/sanity/image'

// Rendering Portable Text per le bio pilota/team (stesso editor ricco degli
// articoli, ma senza inserimento automatico di annunci/embed: qui il testo
// è più breve e non ha senso interromperlo con pubblicità).

function BioImage({ value }: { value: any }) {
  const src = value?.asset?._ref ? urlFor(value).width(1200).url() : value?.asset?.url
  if (!src) return null
  return (
    <div className="relative w-full h-[220px] rounded-card overflow-hidden mb-5">
      <Image src={src} alt={value.alt ?? ''} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
    </div>
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
