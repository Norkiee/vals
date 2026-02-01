'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { getSpotifyEmbedUrl, fetchSpotifyMetadata } from '@/lib/spotify'

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
  title: initialTitle,
  artist: initialArtist,
  thumbnail: initialThumbnail,
  themeColor,
  compact = false,
}: SpotifyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [title, setTitle] = useState(initialTitle || 'Music title')
  const [artist, setArtist] = useState(initialArtist || 'Artist name')
  const [thumbnail, setThumbnail] = useState<string | null | undefined>(initialThumbnail)
  const embedUrl = getSpotifyEmbedUrl(spotifyLink)

  // Fetch metadata client-side if not provided
  useEffect(() => {
    async function loadMetadata() {
      // Fetch if we don't have title/artist from props
      const needsFetch = !initialTitle || !initialArtist || initialTitle === 'Music title'
      if (needsFetch && spotifyLink) {
        try {
          const metadata = await fetchSpotifyMetadata(spotifyLink)
          if (metadata) {
            setTitle(metadata.title)
            setArtist(metadata.artist)
            if (metadata.thumbnail) {
              setThumbnail(metadata.thumbnail)
            }
          }
        } catch (error) {
          console.error('Failed to fetch Spotify metadata:', error)
        }
      }
    }
    loadMetadata()
  }, [spotifyLink, initialTitle, initialArtist])

  const handleTogglePlay = () => {
    if (embedUrl) {
      setIsPlaying(!isPlaying)
    }
  }

  if (compact) {
    return (
      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        {/* Our custom card */}
        <div className="p-1 flex items-center gap-1.5">
          {/* Album art / Thumbnail */}
          <div className="w-7 h-7 rounded flex-shrink-0 overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={`${title} album art`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500" />
            )}
          </div>

          {/* Song info */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium truncate leading-tight">{title}</p>
            <p className="text-[8px] text-gray-500 truncate leading-tight">{artist}</p>
            <div className="flex items-center gap-0.5">
              <svg className="w-2 h-2" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-[8px] text-gray-400">Spotify</span>
            </div>
          </div>

          {/* Play/Pause button */}
          <button
            onClick={handleTogglePlay}
            className="px-1 py-0.5 rounded-full text-white text-[8px] font-medium hover:opacity-90 transition-opacity flex items-center gap-0.5"
            style={{ backgroundColor: themeColor }}
          >
            {isPlaying ? (
              <>
                <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play me
              </>
            )}
          </button>
        </div>

        {/* Hidden Spotify embed for audio playback */}
        {isPlaying && embedUrl && (
          <div className="h-[1px] overflow-hidden">
            <iframe
              src={embedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ marginTop: '-79px' }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Our custom card */}
      <div className="p-3 flex items-center gap-3">
        {/* Album art / Thumbnail */}
        <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`${title} album art`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500" />
          )}
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-gray-500 truncate">{artist}</p>
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="text-xs text-gray-400">Spotify</span>
          </div>
        </div>

        {/* Play/Stop button */}
        <button
          onClick={handleTogglePlay}
          className="px-4 py-1.5 rounded-full text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          style={{ backgroundColor: themeColor }}
        >
          {isPlaying ? (
            <>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play me
            </>
          )}
        </button>
      </div>

      {/* Hidden Spotify embed for audio playback */}
      {isPlaying && embedUrl && (
        <div className="h-[1px] overflow-hidden">
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ marginTop: '-79px' }}
          />
        </div>
      )}
    </div>
  )
}
