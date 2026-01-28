export interface SpotifyMetadata {
  title: string
  artist: string
  thumbnail: string | null
}

/**
 * Fetches Spotify metadata via our API proxy (avoids CORS issues)
 */
export async function fetchSpotifyMetadata(spotifyUrl: string): Promise<SpotifyMetadata | null> {
  if (!spotifyUrl) return null

  try {
    const response = await fetch(`/api/spotify-metadata?url=${encodeURIComponent(spotifyUrl)}`)

    if (!response.ok) {
      console.error('Failed to fetch Spotify metadata:', response.status)
      return null
    }

    const data = await response.json()
    return {
      title: data.title,
      artist: data.artist,
      thumbnail: data.thumbnail,
    }
  } catch (error) {
    console.error('Error fetching Spotify metadata:', error)
    return null
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
