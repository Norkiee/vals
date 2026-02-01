import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Domains that should not be treated as subdomains
const RESERVED_SUBDOMAINS = ['www', 'api', 'app', 'admin']

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Get the root domain from environment or default
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'askcuter.xyz'

  // Check if we're on localhost for development
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  // Skip subdomain routing for API routes - they should always be accessible
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next({ request })
  }

  // Extract subdomain
  let subdomain: string | null = null

  if (isLocalhost) {
    // For local development, use query param or path-based routing
    // e.g., localhost:3000/sarah or localhost:3000?subdomain=sarah
    subdomain = null
  } else {
    // Extract subdomain from hostname
    // e.g., sarah.askcuter.xyz -> sarah
    const hostParts = hostname.replace(`.${rootDomain}`, '').split('.')
    if (hostParts.length > 0 && hostParts[0] !== rootDomain.split('.')[0]) {
      subdomain = hostParts[0]
    }
  }

  // Skip subdomain routing for reserved subdomains
  if (subdomain && RESERVED_SUBDOMAINS.includes(subdomain)) {
    subdomain = null
  }

  // If we have a subdomain and we're at the root path, rewrite to /[subdomain]
  if (subdomain && url.pathname === '/') {
    url.pathname = `/${subdomain}`
    return NextResponse.rewrite(url)
  }

  // Handle Supabase auth session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
