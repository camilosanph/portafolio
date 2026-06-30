import { VideoEmbed } from './VideoEmbed'

// Video Editing / AI Video signature module: the discipline showreel. A thin
// wrapper over the shared VideoEmbed facade (kept as its own component so the
// discipline page's intent reads clearly and to preserve its import path).
export function Showreel(props: { url: string | null; posterUrl: string | null; label: string }) {
  return <VideoEmbed {...props} />
}
