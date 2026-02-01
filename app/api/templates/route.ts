import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      // If the table doesn't exist yet, return seed data as fallback
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(getDefaultTemplates())
      }
      throw error
    }

    // If no templates in DB, return seed data
    if (!data || data.length === 0) {
      return NextResponse.json(getDefaultTemplates())
    }

    return NextResponse.json(data)
  } catch {
    // Fallback to default templates if anything goes wrong
    return NextResponse.json(getDefaultTemplates())
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, theme, photo_style, font_family, font_size, canvas_layout, placeholder_count } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get max display_order to put new template at the end
    const { data: existing } = await supabase
      .from('templates')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0

    const { data, error } = await supabase
      .from('templates')
      .insert({
        name,
        description: description || '',
        theme: theme || 'pink',
        photo_style: photo_style || 'polaroid',
        font_family: font_family || 'Loveheart',
        font_size: font_size || 16,
        canvas_layout: canvas_layout || null,
        placeholder_count: placeholder_count || 3,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}

function getDefaultTemplates() {
  return []
}
