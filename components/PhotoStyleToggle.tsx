'use client'

import { PhotoStyle } from '@/lib/constants'

interface PhotoStyleToggleProps {
  value: PhotoStyle
  onChange: (style: PhotoStyle) => void
}

export default function PhotoStyleToggle({ value, onChange }: PhotoStyleToggleProps) {
  return (
    <div className="flex gap-1.5 items-center">
      {/* Polaroid style preview */}
      <button
        type="button"
        onClick={() => onChange('polaroid')}
        className={`rounded transition-all ${
          value === 'polaroid'
            ? 'ring-1 ring-gray-900 ring-offset-1'
            : 'hover:opacity-70'
        }`}
      >
        <div className="w-5 h-6 bg-white shadow-sm border border-gray-300 flex flex-col">
          <div className="flex-1 bg-gray-400 m-px" />
          <div className="h-1.5" />
        </div>
      </button>

      {/* Hearts style preview */}
      <button
        type="button"
        onClick={() => onChange('hearts')}
        className={`rounded transition-all ${
          value === 'hearts'
            ? 'ring-1 ring-gray-900 ring-offset-1'
            : 'hover:opacity-70'
        }`}
      >
        <div className="w-5 h-5 bg-white border border-dashed border-pink-400 relative flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-400" />
          <span className="absolute -top-1 -left-1 text-[5px] text-pink-400 leading-none">♥</span>
          <span className="absolute -top-1 -right-1 text-[5px] text-pink-400 leading-none">♥</span>
          <span className="absolute -bottom-1 -left-1 text-[5px] text-pink-400 leading-none">♥</span>
          <span className="absolute -bottom-1 -right-1 text-[5px] text-pink-400 leading-none">♥</span>
        </div>
      </button>
    </div>
  )
}
