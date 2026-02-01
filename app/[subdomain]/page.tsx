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

// Base canvas dimensions (what the editor uses)
const MOBILE_WIDTH = 220
const MOBILE_HEIGHT = 476
const DESKTOP_WIDTH = 800
const DESKTOP_HEIGHT = 500

export default function ValentinePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [valentine, setValentine] = useState<ValentineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responded, setResponded] = useState(false)
  const [response, setResponse] = useState<boolean | null>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [scale, setScale] = useState(1)
  const [screenHeight, setScreenHeight] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setScreenHeight(window.innerHeight)
      const bw = mobile ? MOBILE_WIDTH : DESKTOP_WIDTH
      const bh = mobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT
      const sx = window.innerWidth / bw
      const sy = window.innerHeight / bh
      setScale(Math.min(sx, sy))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
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

  // Parse canvas_layout if it's a string
  let canvasLayout: CanvasState | null = null
  try {
    if (valentine.canvas_layout) {
      canvasLayout = typeof valentine.canvas_layout === 'string'
        ? JSON.parse(valentine.canvas_layout)
        : valentine.canvas_layout
    }
  } catch (e) {
    console.error('Error parsing canvas_layout:', e)
    canvasLayout = null
  }

  // Use mobile or desktop layout based on screen size
  const elements = isMobile
    ? (canvasLayout?.mobile || [])
    : (canvasLayout?.desktop || canvasLayout?.mobile || [])
  const fontSize = valentine.font_size || 16

  // Base dimensions the editor used
  const baseW = isMobile ? MOBILE_WIDTH : DESKTOP_WIDTH
  const baseH = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT

  const renderPhoto = (element: CanvasElement) => {
    const photoIndex = element.photoIndex ?? 0
    if (!valentine.photos || photoIndex >= valentine.photos.length) return null
    const photo = valentine.photos[photoIndex]
    if (!photo || !photo.photo_url) return null

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
              ? 'bg-white p-[6%] pb-[14%] shadow-lg'
              : 'hearts-border p-[6%] bg-white'
          }`}
          style={{ ['--theme-primary' as string]: themeColors.primary }}
        >
          <div className="w-full h-full relative overflow-hidden">
            <img
              src={photo.photo_url}
              alt="Photo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderText = (element: CanvasElement) => {
    if (!valentine.message) return null

    return (
      <div
        key={element.id}
        className="absolute flex items-center justify-center p-1"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
        }}
      >
        <p
          className="font-loveheart text-gray-800 leading-relaxed text-center"
          style={{ fontSize }}
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
        className="absolute flex items-center justify-center"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
        }}
      >
        {!responded ? (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleResponse(true)}
              className="rounded-full text-white font-medium shadow-md hover:shadow-lg transition-all px-6 py-2 text-sm"
              style={{ backgroundColor: themeColors.primary }}
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="rounded-full border-2 font-medium hover:bg-white/50 transition-all px-6 py-2 text-sm"
              style={{
                borderColor: themeColors.primary,
                color: themeColors.primary,
              }}
            >
              No
            </button>
          </div>
        ) : (
          <div className="text-center bg-white/80 rounded-xl p-3 shadow-md">
            {response ? (
              <>
                <span className="text-xl mb-1 block">💕</span>
                <p className="font-loveheart text-sm text-gray-800">Yay!</p>
              </>
            ) : (
              <>
                <span className="text-xl mb-1 block">💔</span>
                <p className="font-loveheart text-sm text-gray-800">Maybe next time</p>
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
        className="absolute overflow-hidden"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
        }}
      >
        <SpotifyCard
          spotifyLink={valentine.spotify_link}
          title={valentine.spotify_title || undefined}
          artist={valentine.spotify_artist || undefined}
          thumbnail={valentine.spotify_thumbnail}
          themeColor={themeColors.primary}
          compact={false}
        />
      </div>
    )
  }

  const renderElement = (element: CanvasElement) => {
    try {
      if (!element || !element.type) return null
      switch (element.type) {
        case 'photo': return renderPhoto(element)
        case 'text': return renderText(element)
        case 'buttons': return renderButtons(element)
        case 'spotify': return renderSpotify(element)
        default: return null
      }
    } catch (e) {
      console.error('Error rendering element:', e)
      return null
    }
  }

  // Fallback layout when no canvas layout exists
  if (!mounted || !canvasLayout || !Array.isArray(elements) || elements.length === 0) {
    return (
      <main
        className="min-h-screen"
        style={{ backgroundColor: themeColors.bgColor }}
      >
        <div className="max-w-md mx-auto px-6 py-10">
          {/* Photos */}
          {valentine.photos.length > 0 && (
            <div className="mb-8 flex justify-center gap-4 flex-wrap">
              {valentine.photos.map((photo, i) => (
                <div
                  key={i}
                  className={`relative ${
                    valentine.photo_style === 'polaroid'
                      ? 'bg-white p-2 pb-6 shadow-lg'
                      : 'hearts-border p-2 bg-white'
                  }`}
                  style={{
                    transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                    ['--theme-primary' as string]: themeColors.primary,
                  }}
                >
                  <div className="w-32 h-32 sm:w-36 sm:h-36 overflow-hidden">
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
            <div className="text-center mb-8 px-2">
              <p
                className="font-loveheart leading-relaxed text-gray-800 text-xl sm:text-2xl"
              >
                {valentine.message}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mb-8">
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
            <div className="mb-8">
              <SpotifyCard
                spotifyLink={valentine.spotify_link}
                title={valentine.spotify_title || undefined}
                artist={valentine.spotify_artist || undefined}
                thumbnail={valentine.spotify_thumbnail}
                themeColor={themeColors.primary}
                compact={false}
              />
            </div>
          )}

          {/* From */}
          {valentine.sender_name && (
            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                With love from <span className="font-medium text-gray-700">{valentine.sender_name}</span>
              </p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // Render with canvas layout — scale transform to fit screen
  // Elements are placed at their original pixel positions, then the
  // whole container is uniformly scaled to fill the viewport.
  const scaledW = baseW * scale
  const scaledH = baseH * scale

  return (
    <main
      className="w-screen h-screen overflow-hidden flex flex-col items-center"
      style={{ backgroundColor: themeColors.bgColor }}
    >
      {/* Scaled canvas — maintains exact editor proportions */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: baseW,
          height: baseH,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          marginTop: scaledH < screenHeight ? (screenHeight - scaledH) / 2 / scale : 0,
        }}
      >
        {elements.map(renderElement)}
      </div>

      {/* From — outside scaled area, pinned to bottom of screen */}
      {valentine.sender_name && (
        <div
          className="fixed bottom-3 left-0 right-0 text-center"
          style={{ zIndex: 1000 }}
        >
          <p className="text-gray-500 text-xs sm:text-sm">
            With love from <span className="font-medium text-gray-700">{valentine.sender_name}</span>
          </p>
        </div>
      )}
    </main>
  )
}
