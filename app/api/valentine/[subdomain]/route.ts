import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  if (!subdomain) {
    return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
  }

  try {
    // Fetch valentine
    const { data: valentine, error: valentineError } = await supabase
      .from('valentines')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (valentineError || !valentine) {
      return NextResponse.json({ error: 'Valentine not found' }, { status: 404 })
    }

    // Fetch photos
    const { data: photos, error: photosError } = await supabase
      .from('valentine_photos')
      .select('*')
      .eq('valentine_id', valentine.id)
      .order('display_order', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
    }

    return NextResponse.json({
      ...valentine,
      photos: photos || [],
    })
  } catch (error) {
    console.error('Error fetching valentine:', error)
    return NextResponse.json({ error: 'Failed to fetch valentine' }, { status: 500 })
  }
}
