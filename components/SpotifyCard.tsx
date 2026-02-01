'use client'

import { getSpotifyEmbedUrl } from '@/lib/spotify'

interface SpotifyCardProps {
  spotifyLink: string
  title?: string
  artist?: string
  thumbnail?: string | null
  themeColor: string
  compact?: boolean
}

export default function SpotifyCard({
  spotifyLink,
  compact = false,
}: SpotifyCardProps) {
  const embedUrl = getSpotifyEmbedUrl(spotifyLink)

  if (!embedUrl) return null

  if (compact) {
    return (
      <div className="rounded-md overflow-hidden shadow-sm">
        <iframe
          src={embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-md"
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-sm">
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-xl"
      />
    </div>
  )
}
