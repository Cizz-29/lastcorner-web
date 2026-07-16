import { NextRequest, NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity/writeClient'

// Route temporanea di pulizia: durante la migrazione WordPress -> Sanity,
// alcuni retry su timeout hanno creato articoli duplicati con lo stesso
// slug (la query di controllo "esiste gia'?" non vedeva ancora il
// documento appena creato per un ritardo di indicizzazione di Sanity).
// Questa route trova i duplicati per slug e, se richiesto, cancella tutte
// le copie tranne la piu' vecchia (_createdAt minore).
// Protetta da MIGRATION_SECRET. Senza ?confirm=true e' un dry-run
// (nessuna cancellazione, solo report).

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ArticleRow {
  _id: string
  _createdAt: string
  slug: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (!process.env.MIGRATION_SECRET || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const confirm = searchParams.get('confirm') === 'true'

  const rows = await sanityWriteClient.fetch<ArticleRow[]>(
    `*[_type == "article" && defined(slug.current)]{ _id, _createdAt, "slug": slug.current } | order(slug asc, _createdAt asc)`
  )

  const bySlug = new Map<string, ArticleRow[]>()
  for (const row of rows) {
    const list = bySlug.get(row.slug) ?? []
    list.push(row)
    bySlug.set(row.slug, list)
  }

  const duplicateGroups: { slug: string; keep: string; remove: string[] }[] = []
  for (const [slug, group] of Array.from(bySlug.entries())) {
    if (group.length <= 1) continue
    const sorted = [...group].sort((a, b) => a._createdAt.localeCompare(b._createdAt))
    const [keep, ...rest] = sorted
    duplicateGroups.push({ slug, keep: keep._id, remove: rest.map((r) => r._id) })
  }

  const allIdsToRemove = duplicateGroups.flatMap((g) => g.remove)
  const totalToRemove = allIdsToRemove.length

  if (!confirm) {
    return NextResponse.json({
      dryRun: true,
      totalArticles: rows.length,
      duplicateSlugs: duplicateGroups.length,
      totalToRemove,
      groups: duplicateGroups,
    })
  }

  // Cancellazione a batch per restare sotto i limiti di durata delle
  // funzioni serverless: va richiamata ripetutamente (stesso URL con
  // confirm=true) finche' remainingAfterThisBatch non e' 0.
  const limit = Math.min(30, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20))
  const batch = allIdsToRemove.slice(0, limit)

  const deleted: string[] = []
  const errors: { id: string; message: string }[] = []
  for (const id of batch) {
    try {
      await sanityWriteClient.delete(id)
      deleted.push(id)
    } catch (err: any) {
      errors.push({ id, message: err?.message ?? String(err) })
    }
  }

  return NextResponse.json({
    dryRun: false,
    totalArticlesBefore: rows.length,
    duplicateSlugsBefore: duplicateGroups.length,
    totalToRemoveBefore: totalToRemove,
    deletedThisBatch: deleted.length,
    remainingAfterThisBatch: totalToRemove - deleted.length,
    errors,
  })
}
