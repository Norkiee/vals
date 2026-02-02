import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { valentineId, response } = body

    if (!valentineId || response === undefined) {
      return NextResponse.json(
        { error: 'Valentine ID and response are required' },
        { status: 400 }
      )
    }

    if (typeof response !== 'boolean') {
      return NextResponse.json(
        { error: 'Response must be true or false' },
        { status: 400 }
      )
    }

    // Verify valentine exists
    const { data: valentine, error: valentineError } = await supabase
      .from('valentines')
      .select('id')
      .eq('id', valentineId)
      .single()

    if (valentineError || !valentine) {
      return NextResponse.json(
        { error: 'Valentine not found' },
        { status: 404 }
      )
    }

    // Check for existing response (prevent duplicates)
    const { data: existingResponse } = await supabase
      .from('valentine_responses')
      .select('id')
      .eq('valentine_id', valentineId)
      .limit(1)
      .single()

    if (existingResponse) {
      return NextResponse.json({
        success: true,
        message: 'You already responded!',
        alreadyResponded: true,
      })
    }

    // Insert the response
    const { error } = await supabase
      .from('valentine_responses')
      .insert({
        valentine_id: valentineId,
        response: response,
      })

    if (error) {
      console.error('Error submitting response:', error)
      return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
    }

    // Get valentine details for potential email notification
    const { data: valentineDetails } = await supabase
      .from('valentines')
      .select('creator_email, sender_name, recipient_name')
      .eq('id', valentineId)
      .single()

    // TODO: Send email notification if creator_email exists
    // This would integrate with a service like SendGrid, Resend, or Supabase Edge Functions
    if (valentineDetails?.creator_email) {
      console.log(`Email notification would be sent to: ${valentineDetails.creator_email}`)
      // await sendNotificationEmail(valentineDetails.creator_email, valentineDetails.recipient_name, response)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
  }
}
