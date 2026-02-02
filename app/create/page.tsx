'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUpload from '@/components/PhotoUpload'
import ColorPicker from '@/components/ColorPicker'
import FontPicker from '@/components/FontPicker'
import PhotoStyleToggle from '@/components/PhotoStyleToggle'
import CanvasEditor, { CanvasState } from '@/components/CanvasEditor'
import TemplateSelector, { Template } from '@/components/TemplateSelector'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeKey, PhotoStyle, FONTS, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from '@/lib/constants'
import { generateSubdomain } from '@/lib/utils'
import { fetchSpotifyMetadata, SpotifyMetadata } from '@/lib/spotify'

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
  const [fontSize, setFontSize] = useState<number>(16)
  const [canvasState, setCanvasState] = useState<CanvasState>({ mobile: [], desktop: [] })
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [spotifyMeta, setSpotifyMeta] = useState<SpotifyMetadata | null>(null)
  const [loadingSpotify, setLoadingSpotify] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Subdomain availability
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  // Email notification (optional)
  const [creatorEmail, setCreatorEmail] = useState('')

  // Error state
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [spotifyError, setSpotifyError] = useState<string | null>(null)
  const [subdomainError, setSubdomainError] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdSubdomain, setCreatedSubdomain] = useState('')
  const [copied, setCopied] = useState(false)

  const subdomain = generateSubdomain(recipientName)

  // Pre-fill sender name from user profile
  useEffect(() => {
    if (user?.user_metadata?.full_name && !senderName) {
      setSenderName(user.user_metadata.full_name)
    }
  }, [user, senderName])

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates')
        const data = await res.json()
        setTemplates(data)
        // Select "Classic" (first template) by default
        if (data.length > 0 && !selectedTemplateId) {
          handleTemplateSelect(data[0])
        }
      } catch {
        setTemplateError('Failed to load templates')
      }
    }
    fetchTemplates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplateId(template.id)
    setTheme(template.theme)
    setPhotoStyle(template.photo_style as PhotoStyle)
    setFont(template.font_family)
    setFontSize(template.font_size)
    // Load the exact canvas positions from the template
    if (template.canvas_layout) {
      setCanvasState(template.canvas_layout)
    }
  }, [])

  // Fetch Spotify metadata when link changes
  useEffect(() => {
    if (!spotifyLink) {
      setSpotifyMeta(null)
      return
    }

    const fetchMeta = async () => {
      setLoadingSpotify(true)
      setSpotifyError(null)
      try {
        const meta = await fetchSpotifyMetadata(spotifyLink)
        if (!meta) {
          setSpotifyError('Could not load Spotify metadata. Check the link.')
        }
        setSpotifyMeta(meta)
      } catch {
        setSpotifyMeta(null)
        setSpotifyError('Failed to fetch Spotify metadata')
      } finally {
        setLoadingSpotify(false)
      }
    }

    // Debounce the fetch
    const timeoutId = setTimeout(fetchMeta, 500)
    return () => clearTimeout(timeoutId)
  }, [spotifyLink])

  const checkSubdomain = useCallback(async (name: string) => {
    if (!name.trim()) {
      setSubdomainAvailable(null)
      setSubdomainError(null)
      return
    }

    setCheckingSubdomain(true)
    setSubdomainError(null)
    try {
      const response = await fetch(`/api/check-subdomain?subdomain=${generateSubdomain(name)}`)
      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        setSubdomainError(errData?.error || 'Failed to check subdomain availability')
        setSubdomainAvailable(null)
        return
      }
      const data = await response.json()
      setSubdomainAvailable(data.available)
    } catch {
      setSubdomainError('Failed to check subdomain availability')
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
    setFormError(null)
    setFieldErrors({})

    // Client-side validation
    const errors: Record<string, string> = {}
    if (!recipientName.trim()) errors.recipientName = 'Recipient name is required'
    if (photos.length === 0) errors.photos = 'At least one photo is required'
    if (!creatorEmail.trim()) {
      errors.creatorEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creatorEmail.trim())) {
      errors.creatorEmail = 'Please enter a valid email address'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('Please fix the errors below')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        recipientName,
        senderName,
        message,
        spotifyLink,
        theme,
        photoStyle,
        font,
        fontSize,
        photos,
        canvasState,
        userId: user?.id,
        creatorEmail: creatorEmail.trim() || null,
      }

      let body: string
      try {
        body = JSON.stringify(payload)
      } catch {
        setFormError('Failed to serialize data. Please try again.')
        return
      }

      const response = await fetch('/api/create-valentine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) {
        let errData: { error?: string; fieldErrors?: Record<string, string> } | null = null
        try {
          errData = await response.json()
        } catch {
          // Response wasn't JSON
        }

        if (errData?.fieldErrors) {
          setFieldErrors(errData.fieldErrors)
          setFormError(errData.error || 'Please fix the errors below')
        } else {
          setFormError(errData?.error || 'Failed to create valentine. Please try again.')
        }
        return
      }

      const data = await response.json()
      setCreatedSubdomain(data.subdomain)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error creating valentine:', error)
      setFormError('Failed to create valentine. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = recipientName.trim() && photos.length > 0 && creatorEmail.trim()

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'askcuter.xyz'
  const valentineUrl = `https://${createdSubdomain}.${rootDomain}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(valentineUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = valentineUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Valentine',
          text: `I made a special valentine for you!`,
          url: valentineUrl,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink()
    }
  }

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)

  useEffect(() => {
    const check = () => setIsMobileOrTablet(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/favicon.png"
            alt="Ask Cuter"
            width={80}
            height={80}
            className="mx-auto mb-6"
          />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Desktop only for now
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            We&apos;re working on a mobile version. For now, please create your valentine on a desktop computer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen lg:h-screen lg:flex lg:overflow-hidden bg-[#fafafa]">
      {/* Left side - Form (scrollable) */}
      <div className="w-full lg:w-[400px] xl:w-[450px] 2xl:w-[500px] bg-[#fafafa] flex-shrink-0 lg:h-screen lg:overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8 max-w-lg mx-auto lg:max-w-none">
          <h1 className="font-loveheart text-3xl md:text-4xl text-gray-900 mb-6">
            CREATE YOUR VALENTINE
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error banner */}
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {templateError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-xs text-yellow-700">
                {templateError}
              </div>
            )}

            {templates.length > 0 && (
              <TemplateSelector
                templates={templates}
                selectedId={selectedTemplateId}
                onSelect={handleTemplateSelect}
              />
            )}

            <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
            {fieldErrors.photos && (
              <p className="text-xs text-red-500 -mt-2">{fieldErrors.photos}</p>
            )}

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
                        <span className="text-xs text-gray-400 hidden sm:inline">{subdomain}.askcuter.xyz</span>
                        <span className="text-green-500">✓</span>
                      </>
                    ) : subdomainAvailable === false ? (
                      <>
                        <span className="text-xs text-gray-400 hidden sm:inline">{subdomain}.askcuter.xyz</span>
                        <span className="text-red-500">✗</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              {fieldErrors.recipientName && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.recipientName}</p>
              )}
              {subdomainError && (
                <p className="text-xs text-red-500 mt-1">{subdomainError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={3}
                placeholder="You make every day feel like Valentine's Day. Will you officially be mine?"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-white"
              />
              <p className="text-xs text-gray-400 text-right">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </p>
              {fieldErrors.message && (
                <p className="text-xs text-red-500">{fieldErrors.message}</p>
              )}
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
              {(spotifyError || fieldErrors.spotifyLink) && (
                <p className="text-xs text-red-500">{fieldErrors.spotifyLink || spotifyError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Your email</label>
              <input
                type="email"
                required
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              />
              <p className="text-xs text-gray-400">Get notified when they respond</p>
              {fieldErrors.creatorEmail && (
                <p className="text-xs text-red-500">{fieldErrors.creatorEmail}</p>
              )}
            </div>

            {/* Mobile preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors flex items-center justify-center gap-2 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {showPreview ? 'Hide preview' : 'Preview valentine'}
            </button>

            {/* Inline mobile preview */}
            {showPreview && (
              <div className="lg:hidden isolate">
                {/* Mobile toolbar */}
                <div className="flex items-center gap-2 flex-wrap pb-3">
                  <div className="bg-white rounded-full shadow-sm p-2 border border-gray-100">
                    <ColorPicker value={theme} onChange={(t) => { setTheme(t); setSelectedTemplateId(null) }} />
                  </div>
                  <div className="bg-white rounded-full shadow-sm px-3 py-2 border border-gray-100">
                    <PhotoStyleToggle value={photoStyle} onChange={(ps) => { setPhotoStyle(ps); setSelectedTemplateId(null) }} />
                  </div>
                  <div className="bg-white rounded-full shadow-sm px-2 py-2 border border-gray-100 flex items-center gap-1">
                    <button
                      onClick={() => setFontSize(prev => Math.max(8, prev - 2))}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="text-xs font-medium w-5 text-center">{fontSize}</span>
                    <button
                      onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <CanvasEditor
                    photos={photos}
                    message={message}
                    spotifyLink={spotifyLink}
                    spotifyMeta={spotifyMeta}
                    theme={theme}
                    photoStyle={photoStyle}
                    canvasState={canvasState}
                    onCanvasStateChange={setCanvasState}
                    viewMode="mobile"
                    recipientName={recipientName}
                    fontSize={fontSize}
                    font={font}
                  />
                </div>
              </div>
            )}

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

      {/* Right side - Canvas Editor (desktop only) */}
      <div className="hidden lg:flex flex-1 bg-white flex-col h-screen overflow-hidden">
        {/* Floating toolbar */}
        <div className="flex items-center justify-center gap-2 xl:gap-3 py-4 px-4 flex-wrap">
          {/* Color picker */}
          <div className="bg-white rounded-full shadow-sm p-2.5 border border-gray-100">
            <ColorPicker value={theme} onChange={(t) => { setTheme(t); setSelectedTemplateId(null) }} />
          </div>

          {/* Font selector */}
          <div className="bg-white rounded-full shadow-sm px-4 xl:px-5 py-2.5 border border-gray-100">
            <FontPicker value={font} onChange={setFont} />
          </div>

          {/* Font size controls */}
          <div className="bg-white rounded-full shadow-sm px-2 py-2.5 border border-gray-100 flex items-center gap-1">
            <button
              onClick={() => setFontSize(prev => Math.max(8, prev - 2))}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              title="Decrease font size"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              title="Increase font size"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* Photo style toggle */}
          <div className="bg-white rounded-full shadow-sm px-4 xl:px-5 py-2.5 border border-gray-100">
            <PhotoStyleToggle value={photoStyle} onChange={(ps) => { setPhotoStyle(ps); setSelectedTemplateId(null) }} />
          </div>

          {/* View mode toggle */}
          <div className="bg-white rounded-full shadow-sm px-2.5 py-1.5 border border-gray-100 flex gap-1">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1 rounded-full transition-colors ${viewMode === 'mobile' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              title="Mobile view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1 rounded-full transition-colors ${viewMode === 'desktop' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              title="Desktop view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas Editor */}
        <div className="flex-1 flex items-center justify-center p-4 xl:p-8 overflow-auto isolate">
          <CanvasEditor
            photos={photos}
            message={message}
            spotifyLink={spotifyLink}
            spotifyMeta={spotifyMeta}
            theme={theme}
            photoStyle={photoStyle}
            canvasState={canvasState}
            onCanvasStateChange={setCanvasState}
            viewMode={viewMode}
            recipientName={recipientName}
            fontSize={fontSize}
            font={font}
          />
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Valentine Created!</h2>
            <p className="text-gray-600 mb-6">Your valentine is ready to share with your special someone.</p>

            {/* Share Link */}
            <div className="text-left mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Share this link</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 flex items-center">
                  <p className="text-red-600 font-medium text-sm truncate">{valentineUrl}</p>
                  <button
                    onClick={handleCopyLink}
                    className="ml-auto p-1 hover:bg-gray-200 rounded-md transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleShare}
                  className="px-2 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-6">
              <button
                onClick={() => router.push(`/${createdSubdomain}`)}
                className="text-sm text-gray-700 hover:underline"
              >
                View Your Valentine
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
