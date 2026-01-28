import { NextRequest, NextResponse } from 'next/server'

/**
 * Parses Spotify oEmbed title format: "Song Name by Artist on Spotify"
 */
function parseSpotifyTitle(fullTitle: string): { title: string; artist: string } {
  let cleaned = fullTitle.replace(/ on Spotify$/i, '')
  const byIndex = cleaned.lastIndexOf(' by ')
  if (byIndex > 0) {
    return {
      title: cleaned.substring(0, byIndex).trim(),
      artist: cleaned.substring(byIndex + 4).trim(),
    }
  }
  return {
    title: cleaned || 'Unknown Title',
    artist: 'Unknown Artist',
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const spotifyUrl = searchParams.get('url')

  if (!spotifyUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Spotify' }, { status: response.status })
    }

    const data = await response.json()
    const { title, artist } = parseSpotifyTitle(data.title || '')

    return NextResponse.json({
      title,
      artist,
      thumbnail: data.thumbnail_url || null,
    })
  } catch (error) {
    console.error('Error fetching Spotify metadata:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}
