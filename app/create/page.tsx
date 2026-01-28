'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUpload from '@/components/PhotoUpload'
import ColorPicker from '@/components/ColorPicker'
import PhotoStyleToggle from '@/components/PhotoStyleToggle'
import CanvasEditor, { CanvasElement } from '@/components/CanvasEditor'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeKey, PhotoStyle, FONTS, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from '@/lib/constants'
import { generateSubdomain } from '@/lib/utils'

export default function CreatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [photos, setPhotos] = useState<string[]>([])
  const [recipientName, setRecipientName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [spotifyLink, setSpotifyLink] = useState('')
  const [theme, setTheme] = useState<ThemeKey>('pink')
  const [photoStyle, setPhotoStyle] = useState<PhotoStyle>('polaroid')
  const [font, setFont] = useState<string>(FONTS[0].name)
  const [canvasState, setCanvasState] = useState<CanvasElement[]>([])
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')

  // Subdomain availability
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  const subdomain = generateSubdomain(recipientName)

  // Pre-fill sender name from user profile
  useEffect(() => {
    if (user?.user_metadata?.full_name && !senderName) {
      setSenderName(user.user_metadata.full_name)
    }
  }, [user, senderName])

  const checkSubdomain = useCallback(async (name: string) => {
    if (!name.trim()) {
      setSubdomainAvailable(null)
      return
    }

    setCheckingSubdomain(true)
    try {
      const response = await fetch(`/api/check-subdomain?subdomain=${generateSubdomain(name)}`)
      const data = await response.json()
      setSubdomainAvailable(data.available)
    } catch {
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }, [])

  const handleRecipientNameChange = useCallback((value: string) => {
    setRecipientName(value)
    const timeoutId = setTimeout(() => checkSubdomain(value), 500)
    return () => clearTimeout(timeoutId)
  }, [checkSubdomain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipientName.trim() || photos.length === 0) {
      alert('Please add a recipient name and at least one photo')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/create-valentine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          senderName,
          message,
          spotifyLink,
          theme,
          photoStyle,
          font,
          photos,
          canvasState: JSON.stringify(canvasState),
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create valentine')
      }

      const data = await response.json()
      router.push(`/${data.subdomain}`)
    } catch (error) {
      console.error('Error creating valentine:', error)
      alert('Failed to create valentine. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = recipientName.trim() && photos.length > 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <main className="h-screen flex overflow-hidden">
      {/* Left side - Form (scrollable) */}
      <div className="w-full lg:w-[420px] bg-[#fafafa] flex-shrink-0 h-screen overflow-y-auto">
        <div className="px-8 lg:px-12 py-6 lg:py-8">
          <h1 className="font-loveheart text-3xl md:text-4xl text-gray-900 mb-6">
            CREATE YOUR VALENTINE
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Their name</label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => handleRecipientNameChange(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="Sarah"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                />
                {recipientName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {checkingSubdomain ? (
                      <span className="text-xs text-gray-400">Checking...</span>
                    ) : subdomainAvailable === true ? (
                      <>
                        <span className="text-xs text-gray-400">{subdomain}.askcuter.com</span>
                        <span className="text-green-500">✓</span>
                      </>
                    ) : subdomainAvailable === false ? (
                      <>
                        <span className="text-xs text-gray-400">{subdomain}.askcuter.com</span>
                        <span className="text-red-500">✗</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={4}
                placeholder="You make every day feel like Valentine's Day. Will you officially be mine?"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-white"
              />
              <p className="text-xs text-gray-400 text-right">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Spotify link</label>
              <input
                type="text"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                placeholder="spotify.com/auysghaluk"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create your valentine'}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Canvas Editor (fixed) */}
      <div className="hidden lg:flex flex-1 bg-white flex-col h-screen overflow-hidden">
        {/* Floating toolbar */}
        <div className="flex items-center justify-center gap-2 py-3">
          {/* Color picker */}
          <div className="bg-white rounded-full shadow-sm p-1.5 border border-gray-100">
            <ColorPicker value={theme} onChange={setTheme} />
          </div>

          {/* Font selector */}
          <div className="bg-white rounded-full shadow-sm px-3 py-1.5 border border-gray-100">
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Photo style toggle */}
          <div className="bg-white rounded-full shadow-sm px-3 py-1.5 border border-gray-100">
            <PhotoStyleToggle value={photoStyle} onChange={setPhotoStyle} />
          </div>

          {/* View mode toggle */}
          <div className="bg-white rounded-full shadow-sm p-1 border border-gray-100 flex gap-1">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'mobile' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              title="Mobile view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'desktop' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              title="Desktop view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas Editor */}
        <div className="flex-1 flex items-start justify-center pt-4 px-8 overflow-auto">
          <CanvasEditor
            photos={photos}
            message={message}
            spotifyLink={spotifyLink}
            theme={theme}
            photoStyle={photoStyle}
            canvasState={canvasState}
            onCanvasStateChange={setCanvasState}
            viewMode={viewMode}
            recipientName={recipientName}
          />
        </div>
      </div>
    </main>
  )
}
