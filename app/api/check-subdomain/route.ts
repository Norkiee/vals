import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  if (!subdomain) {
    return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('valentines')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which means available
      console.error('Error checking subdomain:', error)
      return NextResponse.json({ error: 'Failed to check subdomain' }, { status: 500 })
    }

    return NextResponse.json({ available: !data })
  } catch (error) {
    console.error('Error checking subdomain:', error)
    return NextResponse.json({ error: 'Failed to check subdomain' }, { status: 500 })
  }
}
