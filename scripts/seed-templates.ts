
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

async function seedTemplates() {
    console.log('Reading .env file...')
    const envPath = path.resolve(process.cwd(), '.env')

    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at', envPath)
        return
    }

    const envConfig = fs.readFileSync(envPath, 'utf8')
    const env: Record<string, string> = {}

    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^['"]|['"]$/g, '')
            env[key] = value
        }
    })

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY']

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing credentials in .env file')
        return
    }

    console.log('Connecting to Supabase...')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    const templates = [
        {
            name: 'Classic',
            description: 'The timeless pink hearts style',
            theme: 'pink',
            photo_style: 'polaroid',
            font_family: 'Loveheart',
            font_size: 16,
            placeholder_count: 3,
            display_order: 0,
            canvas_layout: { mobile: [], desktop: [] }
        },
        {
            name: 'Clean',
            description: 'A modern, minimal red theme',
            theme: 'red',
            photo_style: 'polaroid',
            font_family: 'Inter', // Assuming Inter is available or similar
            font_size: 16,
            placeholder_count: 3,
            display_order: 1,
            canvas_layout: { mobile: [], desktop: [] }
        },
        {
            name: 'Sunset',
            description: 'Warm colors and heart frames',
            theme: 'sunset',
            photo_style: 'hearts',
            font_family: 'Great Vibes',
            font_size: 18,
            placeholder_count: 3,
            display_order: 2,
            canvas_layout: { mobile: [], desktop: [] }
        }
    ]

    console.log('Seeding templates...')

    for (const template of templates) {
        console.log(`Creating template: ${template.name}`)

        // Check if exists
        const { data: existing } = await supabaseAdmin
            .from('templates')
            .select('id')
            .eq('name', template.name)
            .single()

        if (existing) {
            console.log(`Template ${template.name} already exists. Skipping.`)
            continue
        }

        const { error } = await supabaseAdmin
            .from('templates')
            .insert(template)

        if (error) {
            console.error(`Error creating ${template.name}:`, error)
        } else {
            console.log(`Created ${template.name}`)
        }
    }

    console.log('Done!')
}

seedTemplates()
