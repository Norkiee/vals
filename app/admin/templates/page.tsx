'use client'

import { useState, useEffect, useCallback } from 'react'
import CanvasEditor, { CanvasState, getDefaultCanvasStates } from '@/components/CanvasEditor'
import ColorPicker from '@/components/ColorPicker'
import PhotoStyleToggle from '@/components/PhotoStyleToggle'
import { THEMES, ThemeKey, PhotoStyle, FONTS } from '@/lib/constants'

interface TemplateData {
  id?: string
  name: string
  description: string
  theme: ThemeKey
  photo_style: PhotoStyle
  font_family: string
  font_size: number
  canvas_layout: CanvasState | null
  placeholder_count: number
  display_order: number
}

const emptyTemplate: TemplateData = {
  name: '',
  description: '',
  theme: 'pink',
  photo_style: 'polaroid',
  font_family: 'Loveheart',
  font_size: 16,
  canvas_layout: null,
  placeholder_count: 3,
  display_order: 0,
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Editor state
  const [editing, setEditing] = useState<TemplateData | null>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({ mobile: [], desktop: [] })
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    const tpl = { ...emptyTemplate }
    const defaultState = getDefaultCanvasStates(tpl.placeholder_count, true)
    tpl.canvas_layout = defaultState
    setCanvasState(defaultState)
    setEditing(tpl)
    setViewMode('mobile')
  }

  const handleEditTemplate = (template: TemplateData) => {
    setEditing({ ...template })
    if (template.canvas_layout) {
      setCanvasState(template.canvas_layout)
    } else {
      const defaultState = getDefaultCanvasStates(template.placeholder_count, true)
      setCanvasState(defaultState)
    }
    setViewMode('mobile')
  }

  const handleCanvasStateChange = useCallback((state: CanvasState) => {
    setCanvasState(state)
    setEditing(prev => prev ? { ...prev, canvas_layout: state } : null)
  }, [])

  const handlePlaceholderCountChange = (delta: number) => {
    if (!editing) return
    const newCount = Math.max(1, Math.min(10, editing.placeholder_count + delta))
    setEditing({ ...editing, placeholder_count: newCount })
  }

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return

    setSaving(true)
    try {
      const payload = {
        ...editing,
        canvas_layout: canvasState,
      }

      if (editing.id && !editing.id.startsWith('default-')) {
        // Update existing
        const res = await fetch('/api/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
        if (!res.ok) throw new Error('Failed to update')
      } else {
        // Create new (strip fake id from defaults)
        const { id, ...rest } = payload
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest),
        })
        if (!res.ok) throw new Error('Failed to create')
      }

      await fetchTemplates()
      setEditing(null)
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchTemplates()
      if (editing?.id === id) setEditing(null)
    } catch {
      alert('Failed to delete template')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Template Editor</h1>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            + Create New Template
          </button>
        </div>

        <div className="flex gap-8">
          {/* Left: Template list */}
          <div className="w-64 flex-shrink-0">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Templates</h2>
            <div className="space-y-2">
              {templates.map((tpl) => {
                const isActive = editing?.id === tpl.id || (editing?.name === tpl.name && !editing?.id && !tpl.id)
                return (
                  <div
                    key={tpl.id || tpl.name}
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${
                      isActive ? 'border-gray-900 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleEditTemplate(tpl)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: THEMES[tpl.theme]?.primary }}
                        />
                        {tpl.id && !tpl.id.startsWith('default-') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id!) }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete template"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {tpl.placeholder_count} photos
                      </span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {tpl.photo_style}
                      </span>
                    </div>
                  </div>
                )
              })}

              {templates.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No templates yet</p>
              )}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1">
            {editing ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Editor toolbar */}
                <div className="border-b border-gray-100 px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        placeholder="Template name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={editing.description}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        placeholder="Short description"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Theme */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Theme</span>
                      <ColorPicker
                        value={editing.theme}
                        onChange={(t) => setEditing({ ...editing, theme: t })}
                      />
                    </div>

                    {/* Photo style */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Style</span>
                      <PhotoStyleToggle
                        value={editing.photo_style}
                        onChange={(ps) => setEditing({ ...editing, photo_style: ps })}
                      />
                    </div>

                    {/* Font */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Font</span>
                      <select
                        value={editing.font_family}
                        onChange={(e) => setEditing({ ...editing, font_family: e.target.value })}
                        className="text-sm bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {FONTS.map((f) => (
                          <option key={f.name} value={f.name}>{f.displayName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font size */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Size</span>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setEditing({ ...editing, font_size: Math.max(8, editing.font_size - 2) })}
                          className="px-2 py-1 hover:bg-gray-50 text-sm"
                        >-</button>
                        <span className="px-2 text-sm font-medium">{editing.font_size}</span>
                        <button
                          onClick={() => setEditing({ ...editing, font_size: Math.min(48, editing.font_size + 2) })}
                          className="px-2 py-1 hover:bg-gray-50 text-sm"
                        >+</button>
                      </div>
                    </div>

                    {/* Placeholder count */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Photos</span>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => handlePlaceholderCountChange(-1)}
                          className="px-2 py-1 hover:bg-gray-50 text-sm disabled:opacity-30"
                          disabled={editing.placeholder_count <= 1}
                        >-</button>
                        <span className="px-2 text-sm font-medium">{editing.placeholder_count}</span>
                        <button
                          onClick={() => handlePlaceholderCountChange(1)}
                          className="px-2 py-1 hover:bg-gray-50 text-sm disabled:opacity-30"
                          disabled={editing.placeholder_count >= 10}
                        >+</button>
                      </div>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center border border-gray-200 rounded-lg ml-auto">
                      <button
                        onClick={() => setViewMode('mobile')}
                        className={`px-3 py-1 text-sm rounded-l-lg transition-colors ${
                          viewMode === 'mobile' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                        }`}
                      >
                        Mobile
                      </button>
                      <button
                        onClick={() => setViewMode('desktop')}
                        className={`px-3 py-1 text-sm rounded-r-lg transition-colors ${
                          viewMode === 'desktop' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                        }`}
                      >
                        Desktop
                      </button>
                    </div>
                  </div>
                </div>

                {/* Canvas */}
                <div className="flex items-center justify-center p-8 bg-gray-50 min-h-[550px]">
                  <CanvasEditor
                    photos={[]}
                    message="Your message will appear here..."
                    spotifyLink=""
                    theme={editing.theme}
                    photoStyle={editing.photo_style}
                    canvasState={canvasState}
                    onCanvasStateChange={handleCanvasStateChange}
                    viewMode={viewMode}
                    recipientName="Preview"
                    fontSize={editing.font_size}
                    templateMode={true}
                    placeholderCount={editing.placeholder_count}
                  />
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editing.name.trim()}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Select a template to edit or create a new one</p>
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    + Create New Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
