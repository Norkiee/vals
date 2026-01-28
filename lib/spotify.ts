export interface SpotifyMetadata {
  title: string
  artist: string
  thumbnail: string | null
}

/**
 * Fetches Spotify metadata using the oEmbed API (no authentication required)
 * The oEmbed API returns title in format: "Song Name by Artist on Spotify"
 */
export async function fetchSpotifyMetadata(spotifyUrl: string): Promise<SpotifyMetadata | null> {
  if (!spotifyUrl) return null

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      console.error('Failed to fetch Spotify oEmbed:', response.status)
      return null
    }

    const data = await response.json()

    // Parse title format: "Song Name by Artist on Spotify"
    const { title, artist } = parseSpotifyTitle(data.title || '')

    return {
      title,
      artist,
      thumbnail: data.thumbnail_url || null,
    }
  } catch (error) {
    console.error('Error fetching Spotify metadata:', error)
    return null
  }
}

/**
 * Parses Spotify oEmbed title format: "Song Name by Artist on Spotify"
 * Returns extracted song title and artist name
 */
function parseSpotifyTitle(fullTitle: string): { title: string; artist: string } {
  // Remove " on Spotify" suffix if present
  let cleaned = fullTitle.replace(/ on Spotify$/i, '')

  // Split by " by " to get title and artist
  const byIndex = cleaned.lastIndexOf(' by ')
  if (byIndex > 0) {
    return {
      title: cleaned.substring(0, byIndex).trim(),
      artist: cleaned.substring(byIndex + 4).trim(),
    }
  }

  // Fallback if parsing fails
  return {
    title: cleaned || 'Unknown Title',
    artist: 'Unknown Artist',
  }
}

/**
 * Extracts the Spotify URL for opening in Spotify app/web
 * Normalizes different formats to a standard URL
 */
export function getSpotifyOpenUrl(link: string): string | null {
  if (!link) return null

  // If it's already a valid Spotify URL, return it
  if (link.includes('open.spotify.com')) {
    return link
  }

  // Handle Spotify URI format (spotify:track:xxxx)
  const uriMatch = link.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/)
  if (uriMatch) {
    const [, type, id] = uriMatch
    return `https://open.spotify.com/${type}/${id}`
  }

  return link
}

/**
 * Converts a Spotify URL to an embed URL for iframe playback
 */
export function getSpotifyEmbedUrl(link: string): string | null {
  if (!link) return null

  // Extract type and ID from various Spotify URL formats
  let type: string | null = null
  let id: string | null = null

  // Handle open.spotify.com URLs
  const webMatch = link.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/)
  if (webMatch) {
    type = webMatch[1]
    id = webMatch[2]
  }

  // Handle Spotify URI format (spotify:track:xxxx)
  const uriMatch = link.match(/spotify:(track|album|playlist|episode|show):([a-zA-Z0-9]+)/)
  if (uriMatch) {
    type = uriMatch[1]
    id = uriMatch[2]
  }

  if (type && id) {
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
  }

  return null
}
