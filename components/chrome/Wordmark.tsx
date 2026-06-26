// The hero wordmark: large uppercase serif, one word per line
// (e.g. "CAMILO SANCHEZ" → two stacked lines).
export function Wordmark({ text }: { text: string }) {
  const words = text.trim().split(/\s+/)
  return (
    <h1 className="m-0 font-serif font-normal uppercase leading-[0.92] tracking-[0.05em] text-[clamp(42px,9vw,124px)]">
      {words.map((w, i) => (
        <span key={i} className="block">
          {w}
        </span>
      ))}
    </h1>
  )
}
