import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Valentine = {
  id: string
  subdomain: string
  sender_name: string
  recipient_name: string
  message: string | null
  spotify_link: string | null
  theme: 'pink' | 'red' | 'purple' | 'sunset'
  photo_style: 'polaroid' | 'hearts'
  font_family: string
  created_at: string
  updated_at: string
}

export type ValentinePhoto = {
  id: string
  valentine_id: string
  photo_url: string
  display_order: number
  created_at: string
}

export type ValentineResponse = {
  id: string
  valentine_id: string
  response: boolean
  responded_at: string
}
