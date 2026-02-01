import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import sharp from 'sharp'

const MAX_WIDTH = 1200
const QUALITY = 75

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const valentineId = formData.get('valentineId') as string

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Compress and resize with sharp
    const compressed = await sharp(rawBuffer)
      .rotate() // auto-rotate based on EXIF
      .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()

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
