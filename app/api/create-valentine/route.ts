import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateSubdomain, generateAdminToken } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { FONTS, PHOTO_STYLES, THEMES, MAX_NAME_LENGTH, MAX_MESSAGE_LENGTH } from '@/lib/constants'
import { scrapeMusicMetadata } from '@/lib/music'

// Force Node.js runtime (required for Buffer API)
export const runtime = 'nodejs'

const VALID_THEMES = Object.keys(THEMES)
const VALID_PHOTO_STYLES = [...PHOTO_STYLES]
const VALID_FONT_NAMES = FONTS.map(f => f.name)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Allow any http/https URL for music
const MUSIC_URL_REGEX = /^https?:\/\/.+/


export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE] Step 1: Parsing request body')
    const body = await request.json()
    const {
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
      userId,
      creatorEmail,
    } = body
    console.log('[CREATE] Step 2: Body parsed, validating fields')

    // Validate required fields with specific error messages
    const fieldErrors: Record<string, string> = {}

    if (!recipientName?.trim()) {
      fieldErrors.recipientName = 'Recipient name is required'
    } else if (recipientName.trim().length > MAX_NAME_LENGTH) {
      fieldErrors.recipientName = `Recipient name must be ${MAX_NAME_LENGTH} characters or less`
    }

    if (senderName && senderName.trim().length > MAX_NAME_LENGTH) {
      fieldErrors.senderName = `Sender name must be ${MAX_NAME_LENGTH} characters or less`
    }

    if (message && message.trim().length > MAX_MESSAGE_LENGTH) {
      fieldErrors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
    }

    if (creatorEmail && !EMAIL_REGEX.test(creatorEmail.trim())) {
      fieldErrors.creatorEmail = 'Please enter a valid email address'
    }

    if (theme && !VALID_THEMES.includes(theme)) {
      fieldErrors.theme = `Invalid theme. Must be one of: ${VALID_THEMES.join(', ')}`
    }

    if (photoStyle && !VALID_PHOTO_STYLES.includes(photoStyle)) {
      fieldErrors.photoStyle = `Invalid photo style. Must be one of: ${VALID_PHOTO_STYLES.join(', ')}`
    }

    if (font && !VALID_FONT_NAMES.includes(font)) {
      fieldErrors.font = `Invalid font. Must be one of: ${VALID_FONT_NAMES.join(', ')}`
    }

    if (fontSize !== undefined && (typeof fontSize !== 'number' || fontSize < 8 || fontSize > 48)) {
      fieldErrors.fontSize = 'Font size must be a number between 8 and 48'
    }

    if (spotifyLink?.trim() && !MUSIC_URL_REGEX.test(spotifyLink.trim())) {
      fieldErrors.spotifyLink = 'Invalid link format'
    }

    if (!photos?.length) {
      fieldErrors.photos = 'At least one photo is required'
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', fieldErrors }, { status: 400 })
    }

    console.log('[CREATE] Step 3: Validation passed, generating subdomain')
    // Generate subdomain
    let subdomain = generateSubdomain(recipientName)

    // Check if subdomain exists and make it unique if needed
    console.log('[CREATE] Step 4: Checking subdomain availability')
    const { data: existing } = await supabase
      .from('valentines')
      .select('subdomain')
      .eq('subdomain', subdomain)
      .single()

    if (existing) {
      subdomain = `${subdomain}-${uuidv4().slice(0, 8)}`
    }

    // Create valentine record
    console.log('[CREATE] Step 5: Generating IDs and tokens')
    const valentineId = uuidv4()
    const adminToken = generateAdminToken()

    // Fetch Music metadata if link provided
    let spotifyTitle: string | null = null
    let spotifyArtist: string | null = null
    let spotifyThumbnail: string | null = null
    let musicPreviewUrl: string | null = null

    if (spotifyLink?.trim()) {
      try {
        const metadata = await scrapeMusicMetadata(spotifyLink.trim())
        if (metadata) {
          spotifyTitle = metadata.title
          spotifyArtist = metadata.artist
          spotifyThumbnail = metadata.thumbnail
          musicPreviewUrl = metadata.previewUrl
        }
      } catch (metadataError) {
        console.error('Failed to fetch music metadata, continuing without it:', metadataError)
        // Continue creating valentine even if metadata fetch fails
      }
    }

    console.log('[CREATE] Step 6: Inserting valentine record into database')
    const { error: valentineError } = await supabase
      .from('valentines')
      .insert({
        id: valentineId,
        subdomain,
        name: recipientName.trim(), // Map recipientName to name column
        admin_token: adminToken,
        creator_email: creatorEmail?.trim() || null,
        sender_name: senderName?.trim() || 'Someone special',
        recipient_name: recipientName.trim(),
        message: message?.trim() || null,
        spotify_link: spotifyLink?.trim() || null,
        spotify_title: spotifyTitle,
        spotify_artist: spotifyArtist,
        spotify_thumbnail: spotifyThumbnail,
        music_preview_url: musicPreviewUrl,
        theme: theme || 'pink',
        photo_style: photoStyle || 'polaroid',
        font_family: font || 'Loveheart',
        font_size: fontSize || 16,
        canvas_layout: canvasState || null,
        user_id: userId || null,
      })

    if (valentineError) {
      console.error('[CREATE] Database insert error:', valentineError)
      return NextResponse.json({ error: 'Failed to create valentine', details: valentineError.message }, { status: 500 })
    }

    console.log('[CREATE] Step 7: Valentine record created, uploading photos')
    // Upload photos and create photo records
    const photoRecords = []
    let failedUploads = 0

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
          failedUploads++
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
      adminToken,
      ...(failedUploads > 0 && { failedUploads }),
    })
  } catch (error) {
    console.error('Error creating valentine:', error)
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({
      error: 'Failed to create valentine',
      details: errorMessage, // Temporarily expose in production for debugging
      stack: errorStack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
    }, { status: 500 })
  }
}
