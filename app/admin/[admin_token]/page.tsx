'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Valentine {
  id: string
  subdomain: string
  senderName: string
  recipientName: string
  creatorEmail: string | null
  message: string | null
  spotifyLink: string | null
  theme: string
  photoStyle: string
  createdAt: string
}

interface Response {
  id: string
  response: boolean
  responded_at: string
}

interface Analytics {
  responses: number
  yesCount: number
  noCount: number
}

export default function AdminPage() {
  const params = useParams()
  const adminToken = params.admin_token as string

  const [valentine, setValentine] = useState<Valentine | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'askcuter.xyz'
  const shareUrl = valentine ? `https://${valentine.subdomain}.${rootDomain}` : ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/${adminToken}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load valentine')
          return
        }

        setValentine(data.valentine)
        setResponses(data.responses)
        setAnalytics(data.analytics)
      } catch {
        setError('Failed to load valentine')
      } finally {
        setLoading(false)
      }
    }

    if (adminToken) {
      fetchData()
    }
  }, [adminToken])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  if (error || !valentine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Valentine Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This admin link is invalid or has expired.'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const latestResponse = responses[0]
  const hasResponse = responses.length > 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Your Valentine to {valentine.recipientName}
          </h1>
          <p className="text-gray-500 text-sm">
            Created {formatDate(valentine.createdAt)}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Status</h2>

          {hasResponse ? (
            <div className={`p-4 rounded-xl ${latestResponse.response ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${latestResponse.response ? 'bg-green-100' : 'bg-red-100'}`}>
                  {latestResponse.response ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-bold text-lg ${latestResponse.response ? 'text-green-700' : 'text-red-700'}`}>
                    {valentine.recipientName} said {latestResponse.response ? 'YES!' : 'No'}
                  </p>
                  <p className={`text-sm ${latestResponse.response ? 'text-green-600' : 'text-red-600'}`}>
                    {formatDate(latestResponse.responded_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-yellow-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg text-yellow-700">Awaiting response...</p>
                  <p className="text-sm text-yellow-600">Share the link with {valentine.recipientName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Share Link */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Share Link</h2>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 flex items-center">
              <p className="text-red-600 font-medium text-sm truncate">{shareUrl}</p>
              <button
                onClick={handleCopy}
                className="ml-auto p-1.5 hover:bg-gray-200 rounded-md transition-colors"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <Link
              href={`/${valentine.subdomain}`}
              target="_blank"
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View
            </Link>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Analytics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900">{analytics.responses}</p>
                <p className="text-sm text-gray-500">Responses</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{analytics.yesCount}</p>
                <p className="text-sm text-green-600">Yes</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-3xl font-bold text-red-600">{analytics.noCount}</p>
                <p className="text-sm text-red-600">No</p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {valentine.creatorEmail && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Notifications</h2>
            <p className="text-gray-600">
              Notifications will be sent to: <span className="font-medium">{valentine.creatorEmail}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/create"
            className="flex-1 py-3 bg-white text-gray-700 rounded-full font-medium hover:bg-gray-100 transition-colors text-center shadow-sm"
          >
            Create Another
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
