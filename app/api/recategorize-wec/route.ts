import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { sanityWriteClient } from '@/lib/sanity/writeClient'

// Senza questo, Next.js tratta una GET route handler senza funzioni dinamiche
// come statica e ne mette in cache il risultato al build: la seconda chiamata
// restituirebbe sempre la stessa risposta cristallizzata invece di rieseguire
// la query su Sanity.
export const dynamic = 'force-dynamic'

// Route temporanea: la categoria "WEC" è stata rimossa (sostituita da
// "F1 Academy"). Questo endpoint sposta i vecchi articoli ancora taggati
// "WEC" sotto "Altro", così restano visibili e coerenti nello Studio invece
// di restare con un valore di categoria non più selezionabile.
// Da chiamare una sola volta, poi va rimossa dal repo.
export async function GET() {
  const docs = await sanityClient.fetch<{ _id: string; title: string }[]>(
    `*[_type == "article" && category == "WEC"]{ _id, title }`
  )

  const results = []
  for (const doc of docs) {
    await sanityWriteClient.patch(doc._id).set({ category: 'Altro' }).commit()
    results.push(doc.title)
  }

  return NextResponse.json({ updated: results.length, titles: results })
}
