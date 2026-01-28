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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
  }
}
