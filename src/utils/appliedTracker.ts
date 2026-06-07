import type { AppliedRecord } from '../../electron/ipc/types'

// Record an applied poster set in local history - the single source of truth for
// the "Applied / in library" markers and the Reset Posters page. Deduped by the
// Plex item + set (manual uploads have no setId, so they dedupe per item); the
// per-poster `posterUrls` are merged so multiple uploads to the same set/item
// accumulate rather than overwrite.
export async function recordApplied(rec: AppliedRecord) {
  const cfg = await window.api.config.get()
  const list = cfg.appliedPosters ?? []
  const existing = list.find(r => r.itemKey === rec.itemKey && r.setId === rec.setId)
  const mergedUrls = [...new Set([...(existing?.posterUrls ?? []), ...(rec.posterUrls ?? [])])]
  const merged: AppliedRecord = { ...rec, posterUrls: mergedUrls }
  const deduped = list.filter(r => !(r.itemKey === rec.itemKey && r.setId === rec.setId))
  await window.api.config.set({ appliedPosters: [merged, ...deduped].slice(0, 2000) })
}

// Key used to tell if a title already has applied art (title|year).
export function appliedKey(title: string, year?: number): string {
  return `${title.toLowerCase()}|${year ?? ''}`
}

// A snapshot of what's been applied - interchangeable across Manual Scrape and
// the Library Browser. `setIds` = exact MediUX sets applied; `titles` = any title
// (title|year) that has custom art, regardless of which set/source it came from.
export interface AppliedIndex {
  setIds: Set<string>                  // every set ever applied (current OR previously)
  titles: Set<string>                  // any title (title|year) that has custom art
  posterUrls: Set<string>              // exact poster image URLs ever applied
  currentByItem: Map<string, string>   // itemKey -> the CURRENT set id (latest applied)
  currentPosterUrls: Set<string>       // poster URLs belonging to the current set per item
}

export async function loadAppliedIndex(): Promise<AppliedIndex> {
  const c = await window.api.config.get()
  const recs = c.appliedPosters ?? []

  // The most-recently-applied record per item is the one currently live in Plex;
  // older records for the same item were overwritten (downloaded, not current).
  const latestPerItem = new Map<string, typeof recs[number]>()
  for (const r of recs) {
    const at = Date.parse(r.appliedAt) || 0
    const cur = latestPerItem.get(r.itemKey)
    if (!cur || at > (Date.parse(cur.appliedAt) || 0)) latestPerItem.set(r.itemKey, r)
  }
  const currentByItem = new Map<string, string>()
  const currentPosterUrls = new Set<string>()
  for (const [item, r] of latestPerItem) {
    if (r.setId) currentByItem.set(item, r.setId)
    for (const u of r.posterUrls ?? []) currentPosterUrls.add(u)
  }

  return {
    setIds: new Set(recs.map(r => r.setId).filter(Boolean) as string[]),
    titles: new Set(recs.map(r => appliedKey(r.title, r.year))),
    posterUrls: new Set(recs.flatMap(r => r.posterUrls ?? [])),
    currentByItem,
    currentPosterUrls,
  }
}
