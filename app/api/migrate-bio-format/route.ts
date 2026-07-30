import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity/writeClient'

// Route temporanea (una tantum): i documenti driverBio/teamBio avevano il
// campo "bio" come testo semplice; ora lo schema usa lo stesso editor a
// blocchi (Portable Text) degli articoli. Questo endpoint converte i
// documenti esistenti (bozze incluse) dal vecchio formato stringa al nuovo
// formato a blocchi, così non si perde nulla di quanto già scritto.
// Da chiamare una sola volta, poi va rimossa dal repo (come
// app/api/recategorize-wec/route.ts in passato).

export const dynamic = 'force-dynamic'

function stringToBlocks(text: string) {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((paragraph, i) => ({
      _type: 'block',
      _key: `mig-${i}-${Math.random().toString(36).slice(2, 8)}`,
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: `mig-${i}-span-${Math.random().toString(36).slice(2, 8)}`,
          text: paragraph,
          marks: [],
        },
      ],
    }))
}

export async function GET() {
  const docs = await sanityWriteClient.fetch<{ _id: string; _type: string; title: string; bio: unknown }[]>(
    `*[_type in ["driverBio", "teamBio"]]{ _id, _type, "title": coalesce(fullName, name, driverId, constructorId), bio }`
  )

  const migrated: string[] = []
  const skipped: string[] = []

  for (const doc of docs) {
    if (typeof doc.bio === 'string' && doc.bio.trim()) {
      const blocks = stringToBlocks(doc.bio)
      await sanityWriteClient.patch(doc._id).set({ bio: blocks }).commit()
      migrated.push(`${doc._type}/${doc.title}`)
    } else {
      skipped.push(`${doc._type}/${doc.title}`)
    }
  }

  return NextResponse.json({ migrated: migrated.length, migratedTitles: migrated, skipped: skipped.length, skippedTitles: skipped })
}
