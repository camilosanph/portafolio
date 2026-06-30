// A URL-safe slug: lowercase letters/digits in hyphen-separated groups, e.g.
// "video-reel". No spaces, capitals, accents, leading/trailing or doubled
// hyphens — anything that would produce a broken URL like "/es/Video Reel".
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value)
}

// Best-effort conversion of free text into a valid slug, used to suggest a fix
// in the validation message (e.g. "Video Reel" -> "video-reel").
export function slugify(value: string): string {
  return value
    .normalize('NFKD') // separate accents from letters (e.g. é -> e + combining mark)
    .replace(/\p{M}/gu, '') // strip the separated diacritics (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumerics -> single hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}
