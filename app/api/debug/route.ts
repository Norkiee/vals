import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      },
      modules: {
        uuid: await testImport('uuid'),
        supabase: await testImport('@supabase/supabase-js'),
        sharp: await testImport('sharp'),
      }
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

async function testImport(moduleName: string) {
  try {
    await import(moduleName)
    return 'OK'
  } catch (e) {
    return `Failed: ${e instanceof Error ? e.message : 'unknown'}`
  }
}
