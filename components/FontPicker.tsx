'use client'

import { useState, useRef, useEffect } from 'react'
import { FONTS } from '@/lib/constants'

interface FontPickerProps {
  value: string
  onChange: (font: string) => void
}

export default function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const selected = FONTS.find((f) => f.name === value) || FONTS[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm xl:text-base cursor-pointer"
      >
        <span style={{ fontFamily: `'${selected.name}', cursive` }}>
          {selected.displayName}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 min-w-[180px]">
          {FONTS.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => {
                onChange(f.name)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === f.name
                  ? 'bg-pink-50 text-pink-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{ fontFamily: `'${f.name}', cursive` }}
            >
              {f.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
