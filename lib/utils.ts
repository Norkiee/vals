export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50)
}

export function extractSpotifyId(link: string): string | null {
  if (!link) return null

  // Handle different Spotify URL formats
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
    /spotify:album:([a-zA-Z0-9]+)/,
    /spotify:playlist:([a-zA-Z0-9]+)/,
  ]

  for (const pattern of patterns) {
    const match = link.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function getSpotifyEmbedUrl(link: string): string | null {
  if (!link) return null

  // Extract type and ID
  const trackMatch = link.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
  const uriMatch = link.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/)

  const match = trackMatch || uriMatch
  if (!match) return null

  const [, type, id] = match
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
}

export function isValidSpotifyLink(link: string): boolean {
  if (!link) return true // Optional field
  return extractSpotifyId(link) !== null
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateAdminToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const randomValues = new Uint8Array(32)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < 32; i++) {
    token += chars[randomValues[i] % chars.length]
  }
  return token
}
