import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google'

// Cormorant Garamond — display/body serif: wordmark, discipline titles, nav,
// blurbs (italic), email. Weights 300/400/500 + 400 italic per the handoff.
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

// IBM Plex Mono — eyebrows, numbers, meta lines, labels, chips, buttons,
// captions. Always uppercase with wide tracking in use.
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})
