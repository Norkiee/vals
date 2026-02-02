import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import ValentinePageClient from './ValentinePageClient'

interface PageProps {
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params

  const { data: valentine } = await supabase
    .from('valentines')
    .select('id, sender_name, recipient_name, message')
    .eq('subdomain', subdomain)
    .single()

  if (!valentine) {
    return {
      title: 'Valentine Not Found - Ask Cuter',
    }
  }

  const { data: photos } = await supabase
    .from('valentine_photos')
    .select('photo_url')
    .eq('valentine_id', valentine.id)
    .order('display_order', { ascending: true })
    .limit(1)

  const title = `A Valentine for ${valentine.recipient_name} from ${valentine.sender_name}`
  const description = valentine.message
    ? valentine.message.slice(0, 155) + (valentine.message.length > 155 ? '...' : '')
    : `${valentine.sender_name} made you a valentine!`
  const url = `https://${subdomain}.askcuter.xyz`
  const imageUrl = photos?.[0]?.photo_url || undefined

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'Ask Cuter',
      title,
      description,
      url,
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default function ValentinePage() {
  return <ValentinePageClient />
}
