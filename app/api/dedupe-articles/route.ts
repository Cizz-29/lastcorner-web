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
//
// IMPORTANTE: le prime versioni di questa route restituivano sempre la
// stessa risposta (stesso transactionId) su chiamate successive: la
// funzione veniva servita da una cache (edge/CDN) nonostante
// dynamic="force-dynamic". Per essere sicuri che ogni chiamata esegua
// davvero query e mutazioni fresche, ogni risposta include header
// Cache-Control: no-store espliciti.

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
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (!process.env.MIGRATION_SECRET || secret !== process.env.MIGRATION_SECRET) {
    return noStoreJson({ error: 'unauthorized' }, { status: 401 })
  }
  const confirm = searchParams.get('confirm') === 'true'

  const rows = await sanityWriteClient.fetch<ArticleRow[]>(
    `*[_type == "article" && defined(slug.current)]{ _id, _createdAt, "slug": slug.current } | order(slug asc, _createdAt asc)`,
    {},
    { cache: 'no-store' }
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

  if (searchParams.get('debug') === 'true') {
    const testId = allIdsToRemove[0]
    if (!testId) {
      return noStoreJson({ debug: true, message: 'nessun duplicato da testare', totalToRemove })
    }
    let deleteResult: any = null
    let deleteError: string | null = null
    try {
      deleteResult = await sanityWriteClient.delete(testId)
    } catch (err: any) {
      deleteError = err?.message ?? String(err)
    }
    const stillExists = await sanityWriteClient.fetch<any>(
      `*[_id == $id][0]`,
      { id: testId },
      { cache: 'no-store' }
    )
    return noStoreJson({
      debug: true,
      testId,
      deleteResult,
      deleteError,
      stillExists,
    })
  }

  if (!confirm) {
    return noStoreJson({
      dryRun: true,
      totalArticles: rows.length,
      duplicateSlugs: duplicateGroups.length,
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
    totalArticlesBefore: rows.length,
    duplicateSlugsBefore: duplicateGroups.length,
    totalToRemoveBefore: totalToRemove,
    deletedThisBatch: deleted.length,
    remainingAfterThisBatch: totalToRemove - deleted.length,
    errors,
  })
}
