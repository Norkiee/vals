'use client'

import { useState, useRef, useEffect } from 'react'
import { THEMES, ThemeKey } from '@/lib/constants'
import { CanvasState } from '@/components/CanvasEditor'

export interface Template {
  id: string
  name: string
  description: string
  theme: ThemeKey
  photo_style: 'polaroid' | 'hearts'
  font_family: string
  font_size: number
  canvas_layout: CanvasState | null
  placeholder_count: number
  display_order: number
}

interface TemplateSelectorProps {
  templates: Template[]
  selectedId: string | null
  onSelect: (template: Template) => void
}

export default function TemplateSelector({ templates, selectedId, onSelect }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = templates.find(t => t.id === selectedId)
  const selectedColor = selected ? (THEMES[selected.theme]?.primary || '#ec4899') : '#ec4899'

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="space-y-2" ref={ref}>
      <label className="block text-sm font-medium text-gray-700">Template</label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selected ? (
            <>
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ background: THEMES[selected.theme]?.gradient || THEMES.pink.gradient }}
              >
                <TemplatePreview canvasLayout={selected.canvas_layout} themeColor={selectedColor} />
              </div>
              <span className="text-sm font-medium text-gray-900">{selected.name}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Choose a template</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-h-[320px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => {
                const isSelected = selectedId === template.id
                const themeColor = THEMES[template.theme]?.primary || '#ec4899'

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      onSelect(template)
                      setOpen(false)
                    }}
                    className={`rounded-xl overflow-hidden transition-all text-left ${
                      isSelected
                        ? 'ring-2 ring-offset-1'
                        : 'border border-gray-100 hover:border-gray-300'
                    }`}
                    style={{
                      ['--tw-ring-color' as string]: isSelected ? themeColor : undefined,
                    }}
                  >
                    <div
                      className="aspect-[4/3] p-2 relative"
                      style={{
                        background: THEMES[template.theme]?.gradient || THEMES.pink.gradient,
                      }}
                    >
                      <TemplatePreview canvasLayout={template.canvas_layout} themeColor={themeColor} />
                      {template.placeholder_count > 0 && (
                        <span className="absolute bottom-1.5 right-1.5 bg-white/80 text-[9px] font-medium text-gray-600 px-1.5 py-0.5 rounded-full">
                          {template.placeholder_count} photos
                        </span>
                      )}
                    </div>
                    <div className="bg-white px-2.5 py-2">
                      <p className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {template.name}
                      </p>
                      {template.description && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{template.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TemplatePreview({ canvasLayout, themeColor }: { canvasLayout: CanvasState | null; themeColor: string }) {
  const elements = canvasLayout?.mobile
  if (!elements || elements.length === 0) {
    return (
      <svg viewBox="0 0 80 60" className="w-full h-full">
        <rect x="10" y="8" width="22" height="18" rx="1" fill="#d1d5db" transform="rotate(-5, 21, 17)" />
        <rect x="40" y="5" width="22" height="18" rx="1" fill="#d1d5db" transform="rotate(5, 51, 14)" />
        <rect x="18" y="28" width="22" height="18" rx="1" fill="#d1d5db" transform="rotate(3, 29, 37)" />
        <rect x="15" y="50" width="50" height="3" rx="1" fill={themeColor} opacity="0.4" />
      </svg>
    )
  }

  const scaleX = 80 / 220
  const scaleY = 60 / 476
  const scale = Math.min(scaleX, scaleY)

  return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      {elements.map((el) => {
        const sx = el.x * scale
        const sy = el.y * scale
        const sw = el.width * scale
        const sh = el.height * scale

        let fill = '#d1d5db'
        if (el.type === 'text') fill = themeColor
        else if (el.type === 'buttons') fill = themeColor
        else if (el.type === 'spotify') fill = '#1db954'

        const opacity = el.type === 'text' || el.type === 'buttons' ? 0.4 : 0.7

        return (
          <rect
            key={el.id}
            x={sx}
            y={sy}
            width={Math.max(sw, 2)}
            height={Math.max(sh, 2)}
            rx="1"
            fill={fill}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation}, ${sx + sw / 2}, ${sy + sh / 2})` : undefined}
          />
        )
      })}
    </svg>
  )
}
