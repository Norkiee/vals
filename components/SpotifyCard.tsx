'use client'

import { getSpotifyOpenUrl } from '@/lib/spotify'

interface SpotifyCardProps {
  spotifyLink: string
  title?: string
  artist?: string
  thumbnail?: string | null
  themeColor: string
  compact?: boolean
}

function SpotifyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#1DB954"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

export default function SpotifyCard({
  spotifyLink,
  title,
  artist,
  thumbnail,
  themeColor,
  compact = false,
}: SpotifyCardProps) {
  const openUrl = getSpotifyOpenUrl(spotifyLink)
  if (!openUrl) return null

  const displayTitle = title || 'Spotify'
  const displayArtist = artist || ''

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-white/90 shadow-sm px-2 py-1.5 w-full h-full overflow-hidden"
        style={{ border: `1px solid ${themeColor}22` }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={displayTitle}
            className="rounded flex-shrink-0 object-cover"
            style={{ width: 36, height: 36 }}
          />
        ) : (
          <div
            className="rounded flex-shrink-0 flex items-center justify-center bg-gray-100"
            style={{ width: 36, height: 36 }}
          >
            <SpotifyIcon size={18} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate leading-tight">
            {displayTitle}
          </p>
          {displayArtist && (
            <p className="text-[10px] text-gray-500 truncate leading-tight">
              {displayArtist}
            </p>
          )}
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <SpotifyIcon size={16} />
        </a>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl bg-white/90 shadow-md overflow-hidden w-full h-full flex flex-col"
      style={{ border: `1px solid ${themeColor}22` }}
    >
      {thumbnail ? (
        <div className="relative w-full" style={{ flex: '1 1 auto', minHeight: 0 }}>
          <img
            src={thumbnail}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-full flex items-center justify-center bg-gray-100"
          style={{ flex: '1 1 auto', minHeight: 0 }}
        >
          <SpotifyIcon size={40} />
        </div>
      )}
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-gray-900 truncate">{displayTitle}</p>
        {displayArtist && (
          <p className="text-xs text-gray-500 truncate">{displayArtist}</p>
        )}
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 transition-colors"
          style={{
            backgroundColor: themeColor,
            color: '#fff',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SpotifyIcon size={14} />
          <span style={{ color: '#fff' }}>Listen on Spotify</span>
        </a>
      </div>
    </div>
  )
}
