import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ admin_token: string }> }
) {
  try {
    const { admin_token } = await params

    if (!admin_token) {
      return NextResponse.json({ error: 'Admin token is required' }, { status: 400 })
    }

    // Get valentine by admin token
    const { data: valentine, error: valentineError } = await supabase
      .from('valentines')
      .select('*')
      .eq('admin_token', admin_token)
      .single()

    if (valentineError || !valentine) {
      return NextResponse.json({ error: 'Valentine not found' }, { status: 404 })
    }

    // Get photos
    const { data: photos } = await supabase
      .from('valentine_photos')
      .select('*')
      .eq('valentine_id', valentine.id)
      .order('display_order', { ascending: true })

    // Get responses
    const { data: responses } = await supabase
      .from('valentine_responses')
      .select('*')
      .eq('valentine_id', valentine.id)
      .order('responded_at', { ascending: false })

    // Calculate analytics
    const analytics = {
      responses: responses?.length || 0,
      yesCount: responses?.filter(r => r.response === true).length || 0,
      noCount: responses?.filter(r => r.response === false).length || 0,
    }

    return NextResponse.json({
      success: true,
      valentine: {
        id: valentine.id,
        subdomain: valentine.subdomain,
        senderName: valentine.sender_name,
        recipientName: valentine.recipient_name,
        creatorEmail: valentine.creator_email,
        message: valentine.message,
        spotifyLink: valentine.spotify_link,
        theme: valentine.theme,
        photoStyle: valentine.photo_style,
        createdAt: valentine.created_at,
      },
      photos: photos || [],
      responses: responses || [],
      analytics,
    })
  } catch (error) {
    console.error('Error fetching admin data:', error)
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
  }
}
