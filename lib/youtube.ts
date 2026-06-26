// Extract a YouTube video id from the common URL shapes Camilo might paste.
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/embed\/([\w-]{11})/,
    /\/shorts\/([\w-]{11})/,
    /\/live\/([\w-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// 'max' = maxresdefault (1280x720, crisp 16:9). Not every video has it, so callers
// should fall back to 'hq' (hqdefault, always present) on load error.
export function youTubeThumb(id: string, quality: 'max' | 'hq' = 'max'): string {
  const file = quality === 'max' ? 'maxresdefault' : 'hqdefault'
  return `https://i.ytimg.com/vi/${id}/${file}.jpg`
}

export function youTubeEmbed(id: string): string {
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
}
