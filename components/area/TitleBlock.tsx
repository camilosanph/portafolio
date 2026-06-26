// Area-page title block: mono meta line, huge serif uppercase title, italic blurb.
export function TitleBlock({
  meta,
  title,
  blurb,
}: {
  meta: string
  title: string
  blurb?: string | null
}) {
  return (
    <section className="px-[clamp(20px,5vw,72px)] pb-[clamp(30px,4vw,54px)] pt-[clamp(48px,7vw,110px)]">
      <div className="mb-6 font-mono text-[11px] uppercase tracking-meta text-muted">{meta}</div>
      <h1 className="m-0 font-serif text-[clamp(48px,10vw,140px)] font-normal uppercase leading-[0.92] tracking-[0.01em]">
        {title}
      </h1>
      {blurb && (
        <p className="mt-7 max-w-[620px] font-serif text-[clamp(15px,1.6vw,20px)] italic leading-[1.6] text-muted">
          {blurb}
        </p>
      )}
    </section>
  )
}
