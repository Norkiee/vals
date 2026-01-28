import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateSubdomain } from '@/lib/utils'
import { fetchSpotifyMetadata } from '@/lib/spotify'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recipientName,
      senderName,
      message,
      spotifyLink,
      theme,
      photoStyle,
      font,
      photos,
      itemOrder,
      userId,
    } = body

    // Validate required fields
    if (!recipientName?.trim()) {
      return NextResponse.json({ error: 'Recipient name is required' }, { status: 400 })
    }

    if (!photos?.length) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 })
    }

    // Generate subdomain
    let subdomain = generateSubdomain(recipientName)

    // Check if subdomain exists and make it unique if needed
    const { data: existing } = await supabase
      .from('valentines')
      .select('subdomain')
      .eq('subdomain', subdomain)
      .single()

    if (existing) {
      subdomain = `${subdomain}-${uuidv4().slice(0, 8)}`
    }

    // Create valentine record
    const valentineId = uuidv4()

    // Fetch Spotify metadata if link provided
    let spotifyTitle: string | null = null
    let spotifyArtist: string | null = null
    let spotifyThumbnail: string | null = null

    if (spotifyLink?.trim()) {
      const metadata = await fetchSpotifyMetadata(spotifyLink.trim())
      if (metadata) {
        spotifyTitle = metadata.title
        spotifyArtist = metadata.artist
        spotifyThumbnail = metadata.thumbnail
      }
    }

    const { error: valentineError } = await supabase
      .from('valentines')
      .insert({
        id: valentineId,
        subdomain,
        sender_name: senderName?.trim() || 'Someone special',
        recipient_name: recipientName.trim(),
        message: message?.trim() || null,
        spotify_link: spotifyLink?.trim() || null,
        spotify_title: spotifyTitle,
        spotify_artist: spotifyArtist,
        spotify_thumbnail: spotifyThumbnail,
        section_order: itemOrder || 'message',
        theme: theme || 'pink',
        photo_style: photoStyle || 'polaroid',
        font_family: font || 'Loveheart',
        user_id: userId || null,
      })

    if (valentineError) {
      console.error('Error creating valentine:', valentineError)
      return NextResponse.json({ error: 'Failed to create valentine' }, { status: 500 })
    }

    // Upload photos and create photo records
    const photoRecords = []

    for (let i = 0; i < photos.length; i++) {
      const photoData = photos[i]

      // If it's a base64 data URL, upload to Supabase storage
      if (photoData.startsWith('data:')) {
        const base64Data = photoData.split(',')[1]
        const mimeType = photoData.split(';')[0].split(':')[1]
        const extension = mimeType.split('/')[1] || 'jpg'
        const fileName = `${valentineId}/${Date.now()}-${i}.${extension}`

        const buffer = Buffer.from(base64Data, 'base64')

        const { error: uploadError } = await supabase.storage
          .from('valentine-photos')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false,
          })

        if (uploadError) {
          console.error('Error uploading photo:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('valentine-photos')
          .getPublicUrl(fileName)

        photoRecords.push({
          valentine_id: valentineId,
          photo_url: urlData.publicUrl,
          display_order: i,
        })
      } else {
        // It's already a URL
        photoRecords.push({
          valentine_id: valentineId,
          photo_url: photoData,
          display_order: i,
        })
      }
    }

    if (photoRecords.length > 0) {
      const { error: photoError } = await supabase
        .from('valentine_photos')
        .insert(photoRecords)

      if (photoError) {
        console.error('Error saving photo records:', photoError)
      }
    }

    return NextResponse.json({
      success: true,
      subdomain,
      id: valentineId,
    })
  } catch (error) {
    console.error('Error creating valentine:', error)
    return NextResponse.json({ error: 'Failed to create valentine' }, { status: 500 })
  }
}
