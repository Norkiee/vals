import { NextRequest, NextResponse } from 'next/server'
import { scrapeMusicMetadata } from '@/lib/music'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
        const metadata = await scrapeMusicMetadata(url)

        if (!metadata) {
            return NextResponse.json({ error: 'Could not fetch metadata' }, { status: 404 })
        }

        return NextResponse.json(metadata)
    } catch (error) {
        console.error('Error in music metadata proxy:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
