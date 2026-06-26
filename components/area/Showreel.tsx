'use client'

import { useState } from 'react'
import { getYouTubeId, youTubeEmbed } from '@/lib/youtube'
import { getVimeoId } from '@/lib/video'

// Video Editing / AI Video signature: a poster + play button that swaps to an
// autoplaying embed on click (facade — the iframe loads only when activated).
// Honors the CMS-provided poster image. Frame is always 16:9 per the handoff.
export function Showreel({
  url,
  posterUrl,
  label,
}: {
  url: string | null
  posterUrl: string | null
  label: string
}) {
  const [playing, setPlaying] = useState(false)

  const ytId = getYouTubeId(url)
  const vimeoId = getVimeoId(url)
  const src = ytId
    ? youTubeEmbed(ytId)
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
      : null

  return (
    <div className="relative mx-auto aspect-video w-full max-w-[1080px] overflow-hidden bg-black">
      {playing && src ? (
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src={src}
          title="Showreel"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => src && setPlaying(true)}
          aria-label={label}
          className="group absolute inset-0 block w-full cursor-pointer"
        >
          {posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-[0.82]"
            />
          )}
          <span className="absolute left-1/2 top-1/2 flex h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[24px] text-[#111] transition-transform group-hover:scale-105">
            ▶
          </span>
          <span className="absolute bottom-[18px] left-[18px] font-mono text-[11px] uppercase tracking-meta text-white">
            {label}
          </span>
        </button>
      )}
    </div>
  )
}
