import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import sharp from 'sharp'

const MAX_WIDTH = 1200
const QUALITY = 75
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const valentineId = formData.get('valentineId') as string

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload an image file.' },
        { status: 400 }
      )
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Compress and resize with sharp
    let compressed: Buffer
    try {
      compressed = await sharp(rawBuffer)
        .rotate() // auto-rotate based on EXIF
        .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer()
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError)
      return NextResponse.json(
        { error: 'Invalid or corrupt image. Please try a different file.' },
        { status: 400 }
      )
    }

    const fileName = `${valentineId || 'temp'}/${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from('valentine-photos')
      .upload(fileName, compressed, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading photo:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('valentine-photos')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
  }
}
