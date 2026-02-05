'use client'

import React, { useEffect, useRef } from 'react'
import { getMusicProvider } from '@/lib/music'

interface MusicPlayerProps {
    musicLink: string | null
    previewUrl?: string | null
    playing: boolean
}

export default function MusicPlayer({ musicLink, previewUrl, playing }: MusicPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)

    if (!musicLink) return null

    const provider = getMusicProvider(musicLink)

    // Check if we have a direct audio file (Apple Music or future MP3 support)
    // Apple Music previewUrls from iTunes API are .m4a files
    const isDirectFile = previewUrl && (
        provider === 'apple' ||
        previewUrl.endsWith('.mp3') ||
        previewUrl.endsWith('.m4a')
    )

    // Effect to handle <audio> play/pause
    useEffect(() => {
        if (isDirectFile && audioRef.current && previewUrl) {
            if (playing) {
                audioRef.current.play().catch(e => console.log('Audio autoplay prevented:', e))
            } else {
                audioRef.current.pause()
            }
        }
    }, [playing, previewUrl, isDirectFile])

    // 1. Direct Audio Player (Best for Apple Music & MP3s)
    if (isDirectFile && previewUrl) {
        return (
            <audio
                ref={audioRef}
                src={previewUrl}
                loop
                preload="auto"
                style={{ display: 'none' }}
            />
        )
    }

    // 2. Hidden Iframe Player (YouTube, Spotify, SoundCloud, etc.)
    // We expect `previewUrl` to be the optimized Embed URL from lib/music.ts
    // If no previewUrl exists yet (old records), we calculate it on the fly (legacy support would be complex here, 
    // so we might need a fallback if previewUrl is null. 
    // BUT checking for null: if null, we can try to fall back to generating one locally or just return null for now).
    // Given the refactor, let's assume we want to use the previewUrl if present.
    // If NOT present (legacy), we should technically calculate it. A simplified inline fallback is safer.

    let embedSrc = previewUrl
    if (!embedSrc) {
        // Fallback for existing records without previewUrl stored
        if (provider === 'youtube') embedSrc = `https://www.youtube.com/embed/${getYouTubeId(musicLink)}?autoplay=${playing ? 1 : 0}&loop=1&playlist=${getYouTubeId(musicLink)}&controls=0&showinfo=0&start=0&end=30&playsinline=1`
        else if (provider === 'soundcloud') embedSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(musicLink)}&auto_play=${playing}&hide_related=true&show_comments=false&show_user=false&visual=true`
        else if (provider === 'spotify') embedSrc = musicLink.replace('open.spotify.com', 'open.spotify.com/embed') + (musicLink.includes('?') ? '&' : '?') + `autoplay=${playing ? 1 : 0}`
        else if (provider === 'apple') embedSrc = musicLink.replace('music.apple.com', 'embed.music.apple.com')
    }

    // Ensure autoplay param is correct for the iframe if playing changed (reactivity)
    // Note: The optimized URLs from lib/music often have autoplay=1 hardcoded.
    // If we rely on conditional rendering for 'playing', the iframe reloads.
    // That is actually good for autoplay success.

    // SR-only style hiding pattern: better than display:none or opacity:0
    // Keeps the element "visible" in the DOM for browsers/APIs but invisible to user.
    const hiddenStyle: React.CSSProperties = {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
        top: 0,
        left: 0,
        zIndex: -1,
    }

    if (embedSrc) {
        return (
            <div style={hiddenStyle} aria-hidden="true">
                {playing && (
                    <iframe
                        width="100%"
                        height="100%"
                        src={embedSrc}
                        allow="autoplay *; clipboard-write; encrypted-media *; fullscreen *; picture-in-picture *"
                        title="Background Music"
                    />
                )}
            </div>
        )
    }

    return null
}

// Helper for legacy fallback
function getYouTubeId(url: string) {
    if (url.includes('youtu.be')) return url.split('youtu.be/')[1]?.split('?')[0] || ''
    if (url.includes('youtube.com/watch')) return new URLSearchParams(url.split('?')[1]).get('v') || ''
    return ''
}
