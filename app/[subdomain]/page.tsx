'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { THEMES, ThemeKey, PhotoStyle } from '@/lib/constants'
import SpotifyCard from '@/components/SpotifyCard'
import { getSpotifyOpenUrl } from '@/lib/spotify'

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
  const [responseError, setResponseError] = useState<string | null>(null)
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
    setResponseError(null)

    try {
      const res = await fetch('/api/submit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valentineId: valentine.id,
          response: answer,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        setResponseError(errData?.error || 'Failed to submit response. Please try again.')
        return
      }
      setResponse(answer)
      setResponded(true)
    } catch {
      setResponseError('Failed to submit response. Please check your connection and try again.')
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
          <p className="text-gray-600 mb-4">{error || 'Valentine not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const themeColors = THEMES[valentine.theme] || THEMES.pink
  const fontFamily = `'${valentine.font_family || 'Loveheart'}', cursive`

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

  const BOB_CLASSES = ['animate-bob-1', 'animate-bob-2', 'animate-bob-3', 'animate-bob-4']

  const renderPhoto = (element: CanvasElement) => {
    const photoIndex = element.photoIndex ?? 0
    if (!valentine.photos || photoIndex >= valentine.photos.length) return null
    const photo = valentine.photos[photoIndex]
    if (!photo || !photo.photo_url) return null

    const isPolaroid = valentine.photo_style === 'polaroid'
    const bobClass = BOB_CLASSES[photoIndex % BOB_CLASSES.length]

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
        <div className={`w-full h-full ${bobClass}`}>
          <div
            className={`w-full h-full ${
              isPolaroid
                ? 'bg-white p-[6%] pb-[14%] shadow-lg'
                : 'hearts-border p-[6%] bg-white'
            }`}
            style={{ ['--theme-primary' as string]: themeColors.primary }}
          >
            <div className="w-full h-full relative overflow-hidden">
              <Image
                src={photo.photo_url}
                alt="Photo"
                fill
                sizes="(max-width: 768px) 50vw, 300px"
                className="object-cover"
                priority={photoIndex < 2}
                loading={photoIndex < 2 ? 'eager' : 'lazy'}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderText = (element: CanvasElement) => {
    if (!valentine.message) return null

    // Scale font size based on element width, matching CanvasEditor logic
    const textScale = element.width / 200
    const scaledFontSize = Math.max(8, Math.min(48, fontSize * textScale))

    return (
      <div
        key={element.id}
        className="absolute flex items-center justify-center p-1"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex,
        }}
      >
        <div className="animate-sway">
          <p
            className="text-gray-800 leading-relaxed text-center break-words"
            style={{ fontSize: scaledFontSize, fontFamily }}
          >
            {valentine.message}
          </p>
        </div>
      </div>
    )
  }

  const renderButtons = (element: CanvasElement) => {
    // Scale button size based on element width, matching CanvasEditor logic
    const buttonScale = element.width / 160
    const btnFontSize = Math.max(10, Math.min(24, 12 * buttonScale))
    const btnPaddingX = Math.max(12, Math.min(40, 20 * buttonScale))
    const btnPaddingY = Math.max(4, Math.min(16, 6 * buttonScale))
    const btnGap = Math.max(8, Math.min(24, 12 * buttonScale))

    return (
      <div
        key={element.id}
        className="absolute flex items-center justify-center"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex,
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {responseError && (
            <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-red-700 text-center mb-1" style={{ fontSize: `${Math.max(8, btnFontSize * 0.75)}px` }}>
              {responseError}
            </div>
          )}
          <div className="flex items-center justify-center" style={{ gap: `${btnGap}px` }}>
            <button
              onClick={() => handleResponse(true)}
              className="rounded-full text-white font-medium shadow-md hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.primary,
                fontSize: `${btnFontSize}px`,
                padding: `${btnPaddingY}px ${btnPaddingX}px`,
              }}
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="rounded-full border-2 font-medium hover:bg-white/50 transition-all"
              style={{
                borderColor: themeColors.primary,
                color: themeColors.primary,
                fontSize: `${btnFontSize}px`,
                padding: `${btnPaddingY}px ${btnPaddingX}px`,
              }}
            >
              No
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSpotify = (element: CanvasElement) => {
    if (!valentine.spotify_link) return null

    // Scale spotify card text based on element width (base width: 140)
    const spotifyScale = element.width / 140
    const titleSize = Math.max(7, Math.min(16, 9 * spotifyScale))
    const subtitleSize = Math.max(6, Math.min(14, 8 * spotifyScale))
    const btnSize = Math.max(6, Math.min(14, 8 * spotifyScale))
    const iconSize = Math.max(6, Math.min(14, 8 * spotifyScale))

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
        <div className="w-full h-full animate-bob-2">
        <div className="w-full h-full bg-white rounded-md shadow-sm flex items-center gap-1.5 p-1">
          {/* Thumbnail */}
          <div className="h-[80%] aspect-square rounded flex-shrink-0 overflow-hidden relative">
            {valentine.spotify_thumbnail ? (
              <Image
                src={valentine.spotify_thumbnail}
                alt="Album art"
                fill
                sizes="60px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500" />
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate leading-tight" style={{ fontSize: `${titleSize}px` }}>{valentine.spotify_title || 'Song'}</p>
            <p className="text-gray-500 truncate leading-tight" style={{ fontSize: `${subtitleSize}px` }}>{valentine.spotify_artist || 'Artist'}</p>
            <div className="flex items-center gap-0.5">
              <svg style={{ width: iconSize, height: iconSize }} viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-gray-400" style={{ fontSize: `${subtitleSize}px` }}>Spotify</span>
            </div>
          </div>
          {/* Play button */}
          <a
            href={getSpotifyOpenUrl(valentine.spotify_link) || valentine.spotify_link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full text-white font-medium flex-shrink-0"
            style={{
              backgroundColor: themeColors.primary,
              fontSize: `${btnSize}px`,
              padding: `${Math.max(2, 2 * spotifyScale)}px ${Math.max(4, 6 * spotifyScale)}px`,
            }}
          >
            Play
          </a>
        </div>
        </div>
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

  // Full-page response screen — centered feedback + spotify only
  if (responded) {
    return (
      <main
        className="w-screen h-screen overflow-hidden flex items-center justify-center relative"
        style={{ backgroundColor: themeColors.bgColor }}
      >
        {/* Background hearts */}
        {[
          { left: '5%',  top: '8%',  size: 24, duration: 7,   delay: 0 },
          { left: '88%', top: '5%',  size: 20, duration: 9,   delay: 1.5 },
          { left: '15%', top: '22%', size: 28, duration: 8,   delay: 0.8 },
          { left: '75%', top: '18%', size: 18, duration: 10,  delay: 3.2 },
          { left: '45%', top: '12%', size: 22, duration: 11,  delay: 2.1 },
          { left: '92%', top: '35%', size: 26, duration: 7.5, delay: 0.3 },
          { left: '3%',  top: '45%', size: 20, duration: 9.5, delay: 4 },
          { left: '55%', top: '40%', size: 30, duration: 8,   delay: 1.8 },
          { left: '30%', top: '55%', size: 22, duration: 10,  delay: 2.5 },
          { left: '82%', top: '52%', size: 24, duration: 6.5, delay: 0.6 },
          { left: '10%', top: '68%', size: 28, duration: 8.5, delay: 3.5 },
          { left: '65%', top: '65%', size: 20, duration: 11,  delay: 1.2 },
          { left: '40%', top: '78%', size: 26, duration: 7,   delay: 4.5 },
          { left: '90%', top: '75%', size: 18, duration: 9,   delay: 2.8 },
          { left: '20%', top: '88%', size: 24, duration: 10,  delay: 0.9 },
          { left: '70%', top: '85%', size: 22, duration: 8,   delay: 3.8 },
          { left: '50%', top: '92%', size: 28, duration: 7.5, delay: 1.6 },
        ].map((heart, i) => (
          <span
            key={`heart-${i}`}
            className="absolute animate-heart-drift"
            style={{
              left: heart.left,
              top: heart.top,
              fontSize: heart.size,
              animationDuration: `${heart.duration}s`,
              animationDelay: `${heart.delay}s`,
              color: themeColors.primary,
              opacity: 0.25,
              zIndex: 0,
            }}
          >
            ♥
          </span>
        ))}

        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          {/* Feedback */}
          <div className="text-center animate-float-simple">
            <div className="bg-white/80 rounded-2xl p-8 shadow-lg">
              {response ? (
                <>
                  <span className="text-6xl mb-3 block">💕</span>
                  <p className="text-2xl text-gray-800" style={{ fontFamily }}>Yay! That&apos;s amazing!</p>
                </>
              ) : (
                <>
                  <span className="text-6xl mb-3 block">💔</span>
                  <p className="text-2xl text-gray-800" style={{ fontFamily }}>Maybe next time...</p>
                </>
              )}
            </div>
          </div>

          {/* Spotify */}
          {valentine.spotify_link && (
            <div className="w-full max-w-xs animate-float-simple-delayed">
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
        </div>
      </main>
    )
  }

  // Scattered hearts across the full page
  const scatteredHearts = [
    { left: '5%',  top: '8%',  size: 24, duration: 7,   delay: 0 },
    { left: '88%', top: '5%',  size: 20, duration: 9,   delay: 1.5 },
    { left: '15%', top: '22%', size: 28, duration: 8,   delay: 0.8 },
    { left: '75%', top: '18%', size: 18, duration: 10,  delay: 3.2 },
    { left: '45%', top: '12%', size: 22, duration: 11,  delay: 2.1 },
    { left: '92%', top: '35%', size: 26, duration: 7.5, delay: 0.3 },
    { left: '3%',  top: '45%', size: 20, duration: 9.5, delay: 4 },
    { left: '55%', top: '40%', size: 30, duration: 8,   delay: 1.8 },
    { left: '30%', top: '55%', size: 22, duration: 10,  delay: 2.5 },
    { left: '82%', top: '52%', size: 24, duration: 6.5, delay: 0.6 },
    { left: '10%', top: '68%', size: 28, duration: 8.5, delay: 3.5 },
    { left: '65%', top: '65%', size: 20, duration: 11,  delay: 1.2 },
    { left: '40%', top: '78%', size: 26, duration: 7,   delay: 4.5 },
    { left: '90%', top: '75%', size: 18, duration: 9,   delay: 2.8 },
    { left: '20%', top: '88%', size: 24, duration: 10,  delay: 0.9 },
    { left: '70%', top: '85%', size: 22, duration: 8,   delay: 3.8 },
    { left: '50%', top: '92%', size: 28, duration: 7.5, delay: 1.6 },
  ]

  // Fallback layout when no canvas layout exists
  if (!mounted || !canvasLayout || !Array.isArray(elements) || elements.length === 0) {

    return (
      <main
        className="min-h-screen relative overflow-hidden"
        style={{ backgroundColor: themeColors.bgColor }}
      >
        {/* Scattered background hearts */}
        {scatteredHearts.map((heart, i) => (
          <span
            key={`heart-${i}`}
            className="absolute animate-heart-drift"
            style={{
              left: heart.left,
              top: heart.top,
              fontSize: heart.size,
              animationDuration: `${heart.duration}s`,
              animationDelay: `${heart.delay}s`,
              color: themeColors.primary,
              opacity: 0.25,
              zIndex: 0,
            }}
          >
            ♥
          </span>
        ))}

        <div className="max-w-md mx-auto px-6 py-10 relative z-10">
          {/* Photos */}
          {valentine.photos.length > 0 && (
            <div className="mb-8 flex justify-center gap-4 flex-wrap">
              {valentine.photos.map((photo, i) => (
                <div
                  key={i}
                  style={{
                    transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                  }}
                >
                  <div className={BOB_CLASSES[i % BOB_CLASSES.length]}>
                    <div
                      className={`relative ${
                        valentine.photo_style === 'polaroid'
                          ? 'bg-white p-2 pb-6 shadow-lg'
                          : 'hearts-border p-2 bg-white'
                      }`}
                      style={{
                        ['--theme-primary' as string]: themeColors.primary,
                      }}
                    >
                      <div className="w-32 h-32 sm:w-36 sm:h-36 overflow-hidden relative">
                        <Image
                          src={photo.photo_url}
                          alt={`Photo ${i + 1}`}
                          fill
                          sizes="(max-width: 640px) 128px, 144px"
                          className="object-cover"
                          priority={i < 2}
                          loading={i < 2 ? 'eager' : 'lazy'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message */}
          {valentine.message && (
            <div className="text-center mb-8 px-2 animate-sway">
              <p
                className="leading-relaxed text-gray-800 break-words"
                style={{
                  fontFamily,
                  fontSize: `clamp(${Math.max(14, fontSize * 0.8)}px, ${fontSize * 0.15}vw + ${fontSize * 0.7}px, ${fontSize * 1.5}px)`,
                }}
              >
                {valentine.message}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mb-8">
            {responseError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 text-center mb-3">
                {responseError}
              </div>
            )}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleResponse(true)}
                className="rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
                style={{
                  backgroundColor: themeColors.primary,
                  fontSize: `clamp(14px, 2vw + 8px, 20px)`,
                  padding: `clamp(8px, 1.5vw, 14px) clamp(24px, 4vw, 44px)`,
                }}
              >
                Yes
              </button>
              <button
                onClick={() => handleResponse(false)}
                className="rounded-full border-2 font-medium hover:bg-white/50 transition-all"
                style={{
                  borderColor: themeColors.primary,
                  color: themeColors.primary,
                  fontSize: `clamp(14px, 2vw + 8px, 20px)`,
                  padding: `clamp(8px, 1.5vw, 14px) clamp(24px, 4vw, 44px)`,
                }}
              >
                No
              </button>
            </div>
          </div>

          {/* Spotify */}
          {valentine.spotify_link && (
            <div className="mb-8 animate-bob-2">
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
      className="w-screen h-screen overflow-hidden flex items-center justify-center relative"
      style={{ backgroundColor: themeColors.bgColor }}
    >
      {/* Scattered background hearts across full viewport */}
      {scatteredHearts.map((heart, i) => (
        <span
          key={`heart-${i}`}
          className="absolute animate-heart-drift"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: heart.size,
            animationDuration: `${heart.duration}s`,
            animationDelay: `${heart.delay}s`,
            color: themeColors.primary,
            opacity: 0.25,
            zIndex: 0,
          }}
        >
          ♥
        </span>
      ))}

      {/* Scaled canvas — centered, fits entirely within viewport */}
      <div
        className="relative"
        style={{
          width: baseW,
          height: baseH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          zIndex: 1,
        }}
      >
        {elements.map(renderElement)}

      </div>
    </main>
  )
}
