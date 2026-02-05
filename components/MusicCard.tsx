'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { fetchMusicMetadata, getMusicOpenUrl, getMusicProvider, getProviderName, MusicMetadata } from '@/lib/music'

import PlatformIcon from './PlatformIcon'

interface MusicCardProps {
  musicLink: string
  title?: string
  artist?: string
  thumbnail?: string | null
  themeColor: string
  compact?: boolean
}

export default function MusicCard({
  musicLink,
  title: initialTitle,
  artist: initialArtist,
  thumbnail: initialThumbnail,
  themeColor,
  compact = false,
}: MusicCardProps) {
  const [title, setTitle] = useState(initialTitle || 'Music title')
  const [artist, setArtist] = useState(initialArtist || 'Artist name')
  const [thumbnail, setThumbnail] = useState<string | null | undefined>(initialThumbnail)
  const openUrl = getMusicOpenUrl(musicLink)
  const provider = getMusicProvider(musicLink)
  const providerName = getProviderName(provider)

  // Fetch metadata client-side if not provided
  useEffect(() => {
    async function loadMetadata() {
      const needsFetch = !initialTitle || !initialArtist || initialTitle === 'Music title'
      if (needsFetch && musicLink) {
        try {
          const metadata = await fetchMusicMetadata(musicLink)
          if (metadata) {
            setTitle(metadata.title)
            setArtist(metadata.artist)
            if (metadata.thumbnail) {
              setThumbnail(metadata.thumbnail)
            }
          }
        } catch (error) {
          console.error('Failed to fetch music metadata:', error)
        }
      }
    }
    loadMetadata()
  }, [musicLink, initialTitle, initialArtist])

  if (!openUrl) return null

  if (compact) {
    return (
      <div className="bg-white rounded-md shadow-sm overflow-hidden">
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
              <PlatformIcon provider={provider} className="w-2 h-2" />
              <span className="text-[8px] text-gray-400">{providerName}</span>
            </div>
          </div>

          {/* Listen button */}
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-1 py-0.5 rounded-full text-white text-[8px] font-medium hover:opacity-90 transition-opacity flex items-center gap-0.5"
            style={{ backgroundColor: themeColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Listen
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
            <PlatformIcon provider={provider} className="w-4 h-4" />
            <span className="text-xs text-gray-400">{providerName}</span>
          </div>
        </div>

        {/* Listen button */}
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-1.5 rounded-full text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          style={{ backgroundColor: themeColor }} // Keep using theme primary for consistency or adjust per provider
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Listen
        </a>
      </div>
    </div>
  )
}

