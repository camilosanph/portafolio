import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cormorant, plexMono } from '@/lib/fonts'
import { isLocale } from '@/lib/i18n/config'
import { SITE } from '@/lib/site'
import '../globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Camilo Sanchez — Color · Retouch · Motion',
    template: '%s · Camilo Sanchez',
  },
  description:
    'Camilo Sanchez — colorist and retoucher. Color grading, retouching, video editing and AI-assisted video.',
}

// Root layout for all localized routes (no top-level app/layout.tsx), which lets
// us set <html lang> per locale. Invalid locales are rejected via notFound().
export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  return (
    <html lang={lang} className={`${cormorant.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
