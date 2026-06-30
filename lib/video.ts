export function getVimeoId(url?: string | null): string | null {
  if (!url) return null
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

// Unlisted Vimeo videos carry a privacy hash, e.g. vimeo.com/824804225/9e2c1f0abc
// (or ...?h=9e2c1f0abc). The embed REQUIRES it as ?h=… — without it the player
// refuses to load with "Because of its privacy settings, this video cannot be
// played here". Extract the hash so unlisted reels embed instead of erroring.
export function getVimeoHash(url?: string | null): string | null {
  if (!url) return null
  const path = url.match(/vimeo\.com\/(?:video\/)?\d+\/([A-Za-z0-9]+)/)
  if (path) return path[1]
  const query = url.match(/[?&]h=([A-Za-z0-9]+)/)
  return query ? query[1] : null
}

// Build the player embed URL for a Vimeo link, carrying the privacy hash when
// present. Returns null if the URL isn't a Vimeo link.
export function vimeoEmbed(url?: string | null): string | null {
  const id = getVimeoId(url)
  if (!id) return null
  const hash = getVimeoHash(url)
  const prefix = hash ? `h=${hash}&` : ''
  return `https://player.vimeo.com/video/${id}?${prefix}autoplay=1`
}
