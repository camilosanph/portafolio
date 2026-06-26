'use client'

import { useState } from 'react'

// Retouching signature: two stacked images with a draggable vertical wipe.
// A full-size invisible range input (styled via .ba in globals.css) drives the
// clip on the "after" layer; a divider + handle track the position.
export function BeforeAfter({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string | null
  afterUrl: string | null
  beforeLabel: string
  afterLabel: string
}) {
  const [ba, setBa] = useState(50)

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[560px] select-none overflow-hidden bg-black">
      {beforeUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={beforeUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {afterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={afterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - ba}% 0 0)` }}
        />
      )}

      <div
        className="absolute bottom-0 top-0 w-[2px] bg-white"
        style={{ left: `${ba}%`, boxShadow: '0 0 0 1px rgba(0,0,0,.25)' }}
      />
      <div
        className="absolute top-1/2 flex h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[14px] text-[#111]"
        style={{ left: `${ba}%`, boxShadow: '0 2px 10px rgba(0,0,0,.3)' }}
      >
        ↔
      </div>

      <span className="absolute left-[14px] top-[14px] bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-[14px] top-[14px] bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
        {afterLabel}
      </span>

      <input
        className="ba absolute inset-0 m-0 h-full w-full cursor-ew-resize"
        type="range"
        min={0}
        max={100}
        value={ba}
        onChange={(e) => setBa(Number(e.target.value))}
        aria-label="Before / after comparison slider"
      />
    </div>
  )
}
