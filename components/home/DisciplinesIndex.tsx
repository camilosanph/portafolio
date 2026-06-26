import Link from 'next/link'
import type { Discipline } from '@/payload-types'
import type { Dictionary } from '@/lib/i18n/dictionaries/types'
import type { Locale } from '@/lib/i18n/config'
import { disciplineNumber } from '@/lib/disciplines'

// The "Four Disciplines" index: hairline-divided rows, each a link to its area
// page. On small screens the right-hand blurb is hidden and the row collapses to
// number + name.
export function DisciplinesIndex({
  disciplines,
  dict,
  lang,
}: {
  disciplines: Discipline[]
  dict: Dictionary
  lang: Locale
}) {
  return (
    <section id="disciplines" className="px-[clamp(20px,6vw,96px)] py-[clamp(64px,10vw,150px)]">
      <div className="mb-9 font-mono text-[11px] uppercase tracking-label text-muted">
        {dict.home.fourDisciplines}
      </div>
      {disciplines.map((d, i) => (
        <Link
          key={d.id}
          href={`/${lang}/${d.slug}`}
          className="group grid grid-cols-[56px_1fr] items-center gap-7 border-t border-line py-8 sm:grid-cols-[78px_1fr_auto]"
        >
          <span className="font-mono text-[12px] text-accent">{disciplineNumber(i)}</span>
          <span className="font-serif text-[clamp(30px,6vw,72px)] font-normal leading-none tracking-[0.01em] transition-colors group-hover:text-accent">
            {d.title}
          </span>
          <span className="hidden max-w-[380px] text-right font-serif text-[16px] italic text-muted sm:block">
            {d.homeBlurb}
          </span>
        </Link>
      ))}
      <div className="border-t border-line" />
    </section>
  )
}
