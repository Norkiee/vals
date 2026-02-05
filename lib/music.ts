export interface MusicMetadata {
    title: string
    artist: string
    thumbnail: string | null
    previewUrl: string | null
    provider: 'spotify' | 'apple' | 'soundcloud' | 'youtube' | 'other'
}

/**
 * Identifies the music provider from the URL
 */
export function getMusicProvider(url: string): MusicMetadata['provider'] {
    if (!url) return 'other'

    if (url.includes('spotify.com') || url.startsWith('spotify:')) return 'spotify'
    if (url.includes('music.apple.com')) return 'apple'
    if (url.includes('soundcloud.com')) return 'soundcloud'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'

    return 'other'
}

/**
 * Scrapes music metadata and preview URLs.
 * - Apple Music: Fetches iTunes API for direct .m4a preview.
 * - YouTube/SoundCloud/Spotify: Returns optimized Embed URLs.
 */
export async function scrapeMusicMetadata(url: string): Promise<MusicMetadata | null> {
    if (!url) return null

    const provider = getMusicProvider(url)

    // APPLE MUSIC - 100% Free, No API Key Needed!
    if (provider === 'apple') {
        try {
            // Regex to find the ID (works for /album/id?i=songId and /song/id)
            // usually: .../album/album-name/12345?i=67890 (song id is 67890)
            // or .../song/song-name/12345
            let songId = ''
            const iParam = url.match(/[?&]i=(\d+)/)
            if (iParam) {
                songId = iParam[1]
            } else {
                const parts = url.split('/')
                const lastPart = parts[parts.length - 1]
                const idMatch = lastPart.match(/(\d+)/)
                if (idMatch) {
                    songId = idMatch[1]
                }
            }

            if (songId) {
                const response = await fetch(
                    `https://itunes.apple.com/lookup?id=${songId}&entity=song`
                )
                const data = await response.json()

                if (data.results?.[0]) {
                    const track = data.results[0]
                    // Use 600x600 artwork
                    const artwork = track.artworkUrl100?.replace('100x100bb', '600x600bb')

                    return {
                        title: track.trackName,
                        artist: track.artistName,
                        thumbnail: artwork,
                        previewUrl: track.previewUrl, // Direct 30s MP3/M4A!
                        provider: 'apple'
                    }
                }
            }
        } catch (e) {
            console.error('Apple Music preview fetch failed', e)
        }
    }

    // SPOTIFY - Use oEmbed for metadata, Embed URL for playback
    if (provider === 'spotify') {
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
        try {
            const response = await fetch(oembedUrl)
            if (response.ok) {
                const data = await response.json()
                // Parse "Title by Artist" format often returned by Spotify oEmbed
                let title = data.title
                let artist = 'Spotify'

                // Try to parse "Song by Artist"
                const byIndex = title.lastIndexOf(' by ')
                if (byIndex > 0) {
                    artist = title.substring(byIndex + 4)
                    title = title.substring(0, byIndex)
                }

                // Construct Embed URL
                // If it's a track, we definitely want the embed.
                let embedUrl = url
                if (!url.includes('/embed')) {
                    embedUrl = url.replace('open.spotify.com', 'open.spotify.com/embed')
                }
                const separator = embedUrl.includes('?') ? '&' : '?'
                embedUrl = `${embedUrl}${separator}autoplay=1`

                return {
                    title,
                    artist,
                    thumbnail: data.thumbnail_url,
                    previewUrl: embedUrl, // Returning embed URL for iframe
                    provider: 'spotify'
                }
            }
        } catch (e) {
            console.error('Spotify oEmbed failed', e)
        }
    }

    // SOUNDCLOUD - Use oEmbed + Widget URL
    if (provider === 'soundcloud') {
        try {
            const response = await fetch(
                `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
            )
            const data = await response.json()

            if (data) {
                // Construct Widget URL
                const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`

                return {
                    title: data.title,
                    artist: data.author_name,
                    thumbnail: data.thumbnail_url,
                    previewUrl: widgetUrl,
                    provider: 'soundcloud'
                }
            }
        } catch (e) {
            console.error('SoundCloud fetch failed', e)
        }
    }

    // YOUTUBE - Generic fetch for title/thumb, construct Embed URL
    if (provider === 'youtube') {
        try {
            let videoId = ''
            if (url.includes('youtu.be')) {
                videoId = url.split('youtu.be/')[1].split('?')[0]
            } else if (url.includes('youtube.com/watch')) {
                const params = new URLSearchParams(url.split('?')[1])
                videoId = params.get('v') || ''
            }

            if (videoId) {
                // Fetch page to get title/thumb (fallback if no API key)
                // Note: This relies on the server not blocking us.
                let title = 'YouTube Video'
                let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                let artist = 'YouTube'

                try {
                    const response = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ValBot/1.0)' }
                    })
                    const html = await response.text()
                    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
                    if (titleMatch) title = titleMatch[1]
                } catch (e) {
                    // ignore fetch error, use defaults
                }

                // Optimized YouTube Embed URL
                const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&start=0&end=30&playsinline=1`

                return {
                    title,
                    artist,
                    thumbnail,
                    previewUrl: embedUrl,
                    provider: 'youtube'
                }
            }
        } catch (e) {
            console.error('YouTube fetch failed', e)
        }
    }

    // Generic OpenGraph Fetching for other platforms or fallbacks
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ValBot/1.0; +https://askcuter.xyz)' // Polite bot UA
            }
        })

        if (!response.ok) return null

        const html = await response.text()

        // Simple regex extraction
        const getMetaContent = (property: string) => {
            const regex = new RegExp(`<meta property="${property}" content="([^"]+)"`, 'i')
            const match = html.match(regex)
            return match ? match[1] : null
        }

        const getSecondaryContent = (name: string) => {
            const regex = new RegExp(`<meta name="${name}" content="([^"]+)"`, 'i')
            const match = html.match(regex)
            return match ? match[1] : null
        }

        let title = getMetaContent('og:title') || getSecondaryContent('twitter:title')
        let artist = getMetaContent('og:description') || getSecondaryContent('description')
        const thumbnail = getMetaContent('og:image') || getSecondaryContent('twitter:image')

        // Cleanups
        if (provider === 'apple') {
            const siteName = getMetaContent('og:site_name')
            if (title && title.includes(' on Apple Music')) {
                title = title.replace(' on Apple Music', '')
            }
            if (title && title.includes(' by ')) {
                const parts = title.split(' by ')
                title = parts[0]
                artist = parts[1]
            }
        }

        if (!title) return null // Required

        return {
            title: title.trim(),
            artist: artist ? artist.trim().slice(0, 100) : 'Unknown Artist',
            thumbnail: thumbnail || null,
            previewUrl: null, // No preview for generic
            provider
        }

    } catch (error) {
        console.error('Error generic music fetch:', error)
    }

    // Basic Fallback
    return {
        title: 'Music Link',
        artist: getProviderName(provider),
        thumbnail: null,
        previewUrl: null,
        provider
    }
}

/**
 * Returns a display-ready generic provider name
 */
export function getProviderName(provider: MusicMetadata['provider']): string {
    switch (provider) {
        case 'spotify': return 'Spotify'
        case 'apple': return 'Apple Music'
        case 'soundcloud': return 'SoundCloud'
        case 'youtube': return 'YouTube'
        default: return 'Music'
    }
}

/**
 * Extracts the URL for opening in app/web
 * Normalizes different formats to a standard URL
 */
export function getMusicOpenUrl(link: string): string | null {
    if (!link) return null

    // Spotify deep links
    if (link.startsWith('spotify:')) {
        const uriMatch = link.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/)
        if (uriMatch) {
            const [, type, id] = uriMatch
            return `https://open.spotify.com/${type}/${id}?play=true` // Append play=true
        }
    }

    // Spotify Web Links
    if (link.includes('spotify.com') && !link.includes('play=true')) {
        const separator = link.includes('?') ? '&' : '?'
        return `${link}${separator}play=true`
    }

    // YouTube
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
        if (!link.includes('autoplay=1')) {
            const separator = link.includes('?') ? '&' : '?'
            return `${link}${separator}autoplay=1`
        }
    }

    // SoundCloud
    if (link.includes('soundcloud.com')) {
        // SoundCloud is tricky, usually just the link is fine, but we can try appending params
        // note: normal SC links are just the track page. 
        // Some users report appending `?auto_play=true` works on the web player
        if (!link.includes('auto_play=true')) {
            const separator = link.includes('?') ? '&' : '?'
            return `${link}${separator}auto_play=true`
        }
    }

    // Apple Music
    if (link.includes('music.apple.com')) {
        // Apple Music doesn't have a universal "autoplay" query param for web links 
        // that works consistently across devices, but we can try deep linking schemes if relevant.
        // For now, returning the standard link is safest, but we can ensure standard https.
        return link
    }

    return link
}

/**
 * Client-side helper to fetch metadata via our API proxy
 * Use this in client components to avoid CORS issues
 */
export async function fetchMusicMetadata(url: string): Promise<MusicMetadata | null> {
    if (!url) return null

    try {
        const response = await fetch(`/api/music-metadata?url=${encodeURIComponent(url)}`)

        if (!response.ok) {
            console.error('Failed to fetch music metadata:', response.status)
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Error fetching music metadata:', error)
        return null
    }
}
