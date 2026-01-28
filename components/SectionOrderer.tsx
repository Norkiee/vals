'use client'

import { SectionType } from '@/lib/constants'

interface SectionOrdererProps {
  sections: SectionType[]
  onChange: (sections: SectionType[]) => void
}

const SECTION_LABELS: Record<SectionType, string> = {
  photos: 'Photos',
  message: 'Message + Buttons',
  spotify: 'Spotify',
}

export default function SectionOrderer({ sections, onChange }: SectionOrdererProps) {
  const moveUp = (index: number) => {
    if (index === 0) return
    const newSections = [...sections]
    const temp = newSections[index - 1]
    newSections[index - 1] = newSections[index]
    newSections[index] = temp
    onChange(newSections)
  }

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return
    const newSections = [...sections]
    const temp = newSections[index + 1]
    newSections[index + 1] = newSections[index]
    newSections[index] = temp
    onChange(newSections)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Section order</label>
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="flex-1 text-sm text-gray-700">{SECTION_LABELS[section]}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label={`Move ${SECTION_LABELS[section]} up`}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === sections.length - 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label={`Move ${SECTION_LABELS[section]} down`}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
