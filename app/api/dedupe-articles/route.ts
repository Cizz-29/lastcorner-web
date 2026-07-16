import { NextRequest, NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity/writeClient'

// Route temporanea di pulizia duplicati (v2): la prima release di questa
// route deduplicava solo per slug esatto. Francesco continua a vedere
// articoli duplicati (stesso titolo) dopo la pulizia precedente, quindi
// questa versione raggruppa ANCHE per titolo, non solo per slug, per
// scovare copie con slug leggermente diverso.
// Protetta da MIGRATION_SECRET. Senza ?confirm=true e' un dry-run.

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const maxDuration = 60

function noStoreJson(body: any, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
}

interface ArticleRow {
  _id: string
  _createdAt: string
  slug: string
  title: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (!process.env.MIGRATION_SECRET || secret !== process.env.MIGRATION_SECRET) {
    return noStoreJson({ error: 'unauthorized' }, { status: 401 })
  }
  const confirm = searchParams.get('confirm') === 'true'
  const by = searchParams.get('by') === 'title' ? 'title' : 'slug'

  const rows = await sanityWriteClient.fetch<ArticleRow[]>(
    `*[_type == "article" && defined(slug.current)]{ _id, _createdAt, "slug": slug.current, title } | order(title asc, _createdAt asc)`,
    {},
    { cache: 'no-store' }
  )

  const keyFn = (r: ArticleRow) => (by === 'title' ? r.title.trim().toLowerCase() : r.slug)

  const byKey = new Map<string, ArticleRow[]>()
  for (const row of rows) {
    const k = keyFn(row)
    const list = byKey.get(k) ?? []
    list.push(row)
    byKey.set(k, list)
  }

  const duplicateGroups: { key: string; keep: string; keepSlug: string; remove: { id: string; slug: string }[] }[] = []
  for (const [key, group] of Array.from(byKey.entries())) {
    if (group.length <= 1) continue
    const sorted = [...group].sort((a, b) => a._createdAt.localeCompare(b._createdAt))
    const [keep, ...rest] = sorted
    duplicateGroups.push({
      key,
      keep: keep._id,
      keepSlug: keep.slug,
      remove: rest.map((r) => ({ id: r._id, slug: r.slug })),
    })
  }

  const allIdsToRemove = duplicateGroups.flatMap((g) => g.remove.map((r) => r.id))
  const totalToRemove = allIdsToRemove.length

  if (!confirm) {
    return noStoreJson({
      dryRun: true,
      groupedBy: by,
      totalArticles: rows.length,
      duplicateKeys: duplicateGroups.length,
      totalToRemove,
      groups: duplicateGroups,
    })
  }

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

  return noStoreJson({
    dryRun: false,
    groupedBy: by,
    totalArticlesBefore: rows.length,
    duplicateKeysBefore: duplicateGroups.length,
    totalToRemoveBefore: totalToRemove,
    deletedThisBatch: deleted.length,
    remainingAfterThisBatch: totalToRemove - deleted.length,
    errors,
  })
}
