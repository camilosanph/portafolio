'use client'

import { useState } from 'react'
import { ProjectGrid, type GridItem } from './ProjectGrid'
import type { Dictionary } from '@/lib/i18n/dictionaries/types'

type FilterItem = GridItem & { tag?: string | null }
const FILTERS = ['all', 'warm', 'teal', 'film', 'bw'] as const

// Color Grading signature: filter chips over the project grid. The active chip
// inverts; selecting one filters by the project's `tag` (`all` shows everything).
export function FilterGrid({
  items,
  ratio,
  dict,
}: {
  items: FilterItem[]
  ratio: string
  dict: Dictionary
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const filtered = filter === 'all' ? items : items.filter((i) => i.tag === filter)

  return (
    <>
      <div className="mb-[18px] flex flex-wrap gap-[10px]">
        {FILTERS.map((f) => {
          const on = filter === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`border px-[17px] py-[9px] font-mono text-[11px] uppercase tracking-nav transition-colors ${
                on ? 'border-fg bg-fg text-bg' : 'border-line text-fg hover:border-fg'
              }`}
            >
              {dict.filters[f]}
            </button>
          )
        })}
      </div>
      <ProjectGrid items={filtered} ratio={ratio} />
    </>
  )
}
