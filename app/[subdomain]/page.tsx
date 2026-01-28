'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { THEMES, ThemeKey, PhotoStyle } from '@/lib/constants'
import SpotifyCard from '@/components/SpotifyCard'

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
  section_order: string | null
  theme: ThemeKey
  photo_style: PhotoStyle
  font_family: string
  photos: { photo_url: string; display_order: number }[]
}

export default function ValentinePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [valentine, setValentine] = useState<ValentineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responded, setResponded] = useState(false)
  const [response, setResponse] = useState<boolean | null>(null)

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

  const themeColors = THEMES[valentine.theme]

  // Parse item order from database or generate default
  const getDefaultItemOrder = () => {
    const items: string[] = []
    for (let i = 0; i < valentine.photos.length; i++) {
      items.push(`photo:${i}`)
    }
    items.push('message')
    if (valentine.spotify_link) {
      items.push('spotify')
    }
    return items
  }

  const itemOrder: string[] = valentine.section_order
    ? valentine.section_order.split(',')
    : getDefaultItemOrder()

  const renderPhoto = (photoIndex: number) => {
    const photo = valentine.photos[photoIndex]
    if (!photo) return null

    return (
      <div
        key={`photo-${photoIndex}`}
        className={`relative inline-block ${
          valentine.photo_style === 'polaroid'
            ? 'polaroid'
            : 'hearts-border p-2 bg-white'
        }`}
        style={{
          transform: valentine.photo_style === 'polaroid'
            ? `rotate(${photoIndex % 2 === 0 ? -2 : 2}deg)`
            : 'none',
          ['--theme-primary' as string]: themeColors.primary,
        }}
      >
        <div className="w-28 h-28 md:w-36 md:h-36 relative">
          <Image
            src={photo.photo_url}
            alt={`Photo ${photoIndex + 1}`}
            fill
            className="object-cover grayscale"
          />
        </div>
      </div>
    )
  }

  const renderMessage = () => (
    <div key="message" className="mb-6">
      {valentine.message && (
        <div className="text-center mb-4 px-4">
          <p className="font-loveheart text-xl md:text-2xl leading-relaxed text-gray-800">
            {valentine.message}
          </p>
        </div>
      )}

      {!responded ? (
        <div className="text-center">
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
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
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
  )

  const renderSpotify = () => (
    valentine.spotify_link ? (
      <div key="spotify" className="mb-6 px-4">
        <SpotifyCard
          spotifyLink={valentine.spotify_link}
          title={valentine.spotify_title || undefined}
          artist={valentine.spotify_artist || undefined}
          thumbnail={valentine.spotify_thumbnail}
          themeColor={themeColors.primary}
        />
      </div>
    ) : null
  )

  const renderItem = (item: string) => {
    if (item.startsWith('photo:')) {
      const index = parseInt(item.split(':')[1])
      return renderPhoto(index)
    } else if (item === 'message') {
      return renderMessage()
    } else if (item === 'spotify') {
      return renderSpotify()
    }
    return null
  }

  // Group consecutive photos for display
  const renderContent = () => {
    const elements: JSX.Element[] = []
    let photoGroup: string[] = []

    const flushPhotoGroup = () => {
      if (photoGroup.length > 0) {
        elements.push(
          <div key={`photo-group-${elements.length}`} className="mb-6 flex justify-center gap-3 flex-wrap">
            {photoGroup.map(item => renderItem(item))}
          </div>
        )
        photoGroup = []
      }
    }

    for (const item of itemOrder) {
      if (item.startsWith('photo:')) {
        photoGroup.push(item)
      } else {
        flushPhotoGroup()
        const content = renderItem(item)
        if (content) {
          elements.push(content)
        }
      }
    }
    flushPhotoGroup()

    return elements
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: themeColors.bgColor }}
    >
      <div className="max-w-md mx-auto px-4 py-8">
        {renderContent()}

        {/* From section - always at the bottom */}
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
