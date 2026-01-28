'use client'

import { useState } from 'react'
import { THEMES, ThemeKey } from '@/lib/constants'

interface ColorPickerProps {
  value: ThemeKey
  onChange: (theme: ThemeKey) => void
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const themeKeys = Object.keys(THEMES) as ThemeKey[]

  return (
    <div className="flex items-center gap-1.5">
      {isExpanded ? (
        themeKeys.map((theme) => (
          <button
            key={theme}
            onClick={() => {
              onChange(theme)
              setIsExpanded(false)
            }}
            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
              value === theme ? 'ring-2 ring-offset-1 ring-gray-400' : ''
            }`}
            style={{ backgroundColor: THEMES[theme].primary }}
            title={THEMES[theme].name}
          />
        ))
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: THEMES[value].primary }}
          title="Choose theme color"
        />
      )}
    </div>
  )
}
