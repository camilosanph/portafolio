export const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  behance: 'Behance',
  linkedin: 'LinkedIn',
}

export function socialLabel(platform?: string | null): string {
  if (!platform) return ''
  return SOCIAL_LABELS[platform] ?? platform
}

export type SocialLink = { platform?: string | null; url?: string | null; id?: string | null }

export function findSocial(
  socials: SocialLink[] | null | undefined,
  platform: string,
): string | null {
  return socials?.find((s) => s.platform === platform)?.url ?? null
}
