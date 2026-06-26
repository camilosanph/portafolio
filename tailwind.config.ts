import type { Config } from 'tailwindcss'

// Editorial dark palette + type system from the handoff brief.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0b0c',
        panel: '#16161a',
        fg: '#f3efe7',
        muted: 'rgba(243,239,231,0.55)',
        line: 'rgba(243,239,231,0.16)',
        accent: '#c9b69b',
      },
      fontFamily: {
        // Cormorant Garamond — display/body serif (wordmark, titles, blurbs, email).
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        // IBM Plex Mono — eyebrows, numbers, labels, chips, buttons, captions.
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.5em',
        label: '0.4em',
        meta: '0.18em',
        nav: '0.12em',
      },
    },
  },
  plugins: [],
}

export default config
