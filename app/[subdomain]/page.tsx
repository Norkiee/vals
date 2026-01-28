'use client'

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { THEMES, ThemeKey, PhotoStyle } from '@/lib/constants'
import SpotifyCard from '@/components/SpotifyCard'

interface CanvasElement {
  id: string
  type: 'photo' | 'spotify' | 'text' | 'buttons'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  photoIndex?: number
}

interface CanvasState {
  mobile: CanvasElement[]
  desktop: CanvasElement[]
}

interface ValentineData {
  id: string
  subdomain: string
  sender_name: string
  recipient_name: string
  message: string | null
  spotify_link: string | null
  spotify_title: string | null
  spotify_artist: string | null
  spotify_thumbnail: string | null
  theme: ThemeKey
  photo_style: PhotoStyle
  font_family: string
  font_size: number
  canvas_layout: CanvasState | null
  photos: { photo_url: string; display_order: number }[]
}

const MOBILE_WIDTH = 220
const MOBILE_HEIGHT = 476

export default function ValentinePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [valentine, setValentine] = useState<ValentineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responded, setResponded] = useState(false)
  const [response, setResponse] = useState<boolean | null>(null)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function fetchValentine() {
      try {
        const res = await fetch(`/api/valentine/${subdomain}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Valentine not found')
          } else {
            setError('Failed to load valentine')
          }
          return
        }
        const data = await res.json()
        setValentine(data)
      } catch {
        setError('Failed to load valentine')
      } finally {
        setLoading(false)
      }
    }

    fetchValentine()
  }, [subdomain])

  const handleResponse = async (answer: boolean) => {
    if (!valentine) return

    try {
      await fetch('/api/submit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valentineId: valentine.id,
          response: answer,
        }),
      })
      setResponse(answer)
      setResponded(true)
    } catch {
      console.error('Failed to submit response')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !valentine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600">{error || 'Valentine not found'}</p>
        </div>
      </div>
    )
  }

  const themeColors = THEMES[valentine.theme] || THEMES.pink
  const canvasLayout = valentine.canvas_layout
  const elements = canvasLayout?.mobile || []
  const fontSize = valentine.font_size || 16

  // Calculate scale to fit screen while maintaining aspect ratio
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const calculateScale = () => {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const scaleX = (screenWidth - 32) / MOBILE_WIDTH // 32px padding
      const scaleY = (screenHeight - 80) / MOBILE_HEIGHT // 80px for margins
      setScale(Math.min(scaleX, scaleY, 2.5)) // Cap at 2.5x
    }
    calculateScale()
    window.addEventListener('resize', calculateScale)
    return () => window.removeEventListener('resize', calculateScale)
  }, [])

  const renderPhoto = (element: CanvasElement) => {
    const photo = valentine.photos[element.photoIndex || 0]
    if (!photo) return null

    const isPolaroid = valentine.photo_style === 'polaroid'

    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex,
        }}
      >
        <div
          className={`w-full h-full ${
            isPolaroid
              ? 'bg-white p-1 pb-3 shadow-lg'
              : 'border-2 border-dashed p-1 bg-white'
          }`}
          style={{
            borderColor: isPolaroid ? undefined : themeColors.primary,
          }}
        >
          <img
            src={photo.photo_url}
            alt="Photo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )
  }

  const renderText = (element: CanvasElement) => {
    if (!valentine.message) return null

    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          zIndex: element.zIndex,
        }}
      >
        <p
          className="font-loveheart text-gray-800 leading-relaxed"
          style={{ fontSize: fontSize }}
        >
          {valentine.message}
        </p>
      </div>
    )
  }

  const renderButtons = (element: CanvasElement) => {
    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          zIndex: element.zIndex,
        }}
      >
        {!responded ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 py-2 rounded-full text-white font-medium text-sm shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: themeColors.primary }}
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 py-2 rounded-full border-2 font-medium text-sm hover:bg-white/50 transition-all"
              style={{ borderColor: themeColors.primary, color: themeColors.primary }}
            >
              No
            </button>
          </div>
        ) : (
          <div className="text-center bg-white/80 rounded-xl p-3 shadow-md">
            {response ? (
              <>
                <span className="text-2xl mb-1 block">💕</span>
                <p className="font-loveheart text-lg text-gray-800">Yay!</p>
              </>
            ) : (
              <>
                <span className="text-2xl mb-1 block">💔</span>
                <p className="font-loveheart text-lg text-gray-800">Maybe next time</p>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderSpotify = (element: CanvasElement) => {
    if (!valentine.spotify_link) return null

    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          zIndex: element.zIndex,
        }}
      >
        <SpotifyCard
          spotifyLink={valentine.spotify_link}
          title={valentine.spotify_title || undefined}
          artist={valentine.spotify_artist || undefined}
          thumbnail={valentine.spotify_thumbnail}
          themeColor={themeColors.primary}
          compact
        />
      </div>
    )
  }

  const renderElement = (element: CanvasElement) => {
    switch (element.type) {
      case 'photo':
        return renderPhoto(element)
      case 'text':
        return renderText(element)
      case 'buttons':
        return renderButtons(element)
      case 'spotify':
        return renderSpotify(element)
      default:
        return null
    }
  }

  // If no canvas layout, render fallback
  if (!canvasLayout || elements.length === 0) {
    return (
      <main
        className="min-h-screen"
        style={{ backgroundColor: themeColors.bgColor }}
      >
        <div className="max-w-md mx-auto px-4 py-8">
          {/* Photos */}
          {valentine.photos.length > 0 && (
            <div className="mb-6 flex justify-center gap-3 flex-wrap">
              {valentine.photos.map((photo, i) => (
                <div
                  key={i}
                  className={`relative ${
                    valentine.photo_style === 'polaroid'
                      ? 'bg-white p-2 pb-6 shadow-lg'
                      : 'border-2 border-dashed p-2 bg-white'
                  }`}
                  style={{
                    transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                    borderColor: valentine.photo_style !== 'polaroid' ? themeColors.primary : undefined,
                  }}
                >
                  <div className="w-28 h-28 overflow-hidden">
                    <img
                      src={photo.photo_url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message */}
          {valentine.message && (
            <div className="text-center mb-6 px-4">
              <p
                className="font-loveheart leading-relaxed text-gray-800"
                style={{ fontSize: `${fontSize}px` }}
              >
                {valentine.message}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mb-6">
            {!responded ? (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleResponse(true)}
                  className="px-10 py-3 rounded-full text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleResponse(false)}
                  className="px-10 py-3 rounded-full border-2 font-medium text-lg hover:bg-white/50 transition-all"
                  style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                >
                  No
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white/80 rounded-2xl p-6 shadow-lg inline-block">
                  {response ? (
                    <>
                      <span className="text-4xl mb-2 block">💕</span>
                      <p className="font-loveheart text-2xl text-gray-800">Yay! That&apos;s amazing!</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl mb-2 block">💔</span>
                      <p className="font-loveheart text-2xl text-gray-800">Maybe next time...</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Spotify */}
          {valentine.spotify_link && (
            <div className="mb-6 px-4">
              <SpotifyCard
                spotifyLink={valentine.spotify_link}
                title={valentine.spotify_title || undefined}
                artist={valentine.spotify_artist || undefined}
                thumbnail={valentine.spotify_thumbnail}
                themeColor={themeColors.primary}
              />
            </div>
          )}

          {/* From */}
          {valentine.sender_name && (
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                With love from <span className="font-medium">{valentine.sender_name}</span>
              </p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // Render with canvas layout
  return (
    <main
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: themeColors.bgColor }}
    >
      <div
        className="relative"
        style={{
          width: MOBILE_WIDTH,
          height: MOBILE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {elements.map(renderElement)}

        {/* From - always at the bottom */}
        {valentine.sender_name && (
          <div
            className="absolute bottom-2 left-0 right-0 text-center"
            style={{ zIndex: 1000 }}
          >
            <p className="text-gray-600 text-[10px]">
              With love from <span className="font-medium">{valentine.sender_name}</span>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
