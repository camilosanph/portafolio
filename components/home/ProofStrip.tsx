// Bottom-of-home proof strip: three photos, 4:5, flush with 2px gutters.
// Collapses to one column on the smallest screens.
export function ProofStrip({ images }: { images: string[] }) {
  if (images.length === 0) return null
  return (
    <section className="grid grid-cols-1 gap-[2px] sm:grid-cols-3">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className="aspect-[4/5] w-full object-cover"
        />
      ))}
    </section>
  )
}
