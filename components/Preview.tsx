'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { THEMES, ThemeKey, PhotoStyle } from '@/lib/constants'
import SpotifyCard from '@/components/SpotifyCard'

// Items: photo:0, photo:1, text, buttons, spotify
export type PreviewItem = string

interface PreviewProps {
  recipientName: string
  message: string
  photos: string[]
  theme: ThemeKey
  photoStyle: PhotoStyle
  spotifyLink: string
  viewMode: 'mobile' | 'desktop'
  itemOrder?: PreviewItem[]
  onItemOrderChange?: (order: PreviewItem[]) => void
}

export function getDefaultItemOrder(photoCount: number, hasSpotify: boolean): PreviewItem[] {
  const items: PreviewItem[] = []
  for (let i = 0; i < photoCount; i++) {
    items.push(`photo:${i}`)
  }
  items.push('text')
  items.push('buttons')
  if (hasSpotify) {
    items.push('spotify')
  }
  return items
}

export default function Preview({
  recipientName,
  message,
  photos,
  theme,
  photoStyle,
  spotifyLink,
  viewMode,
  itemOrder,
  onItemOrderChange,
}: PreviewProps) {
  const themeColors = THEMES[theme]
  const [draggedItem, setDraggedItem] = useState<PreviewItem | null>(null)
  const [dragOverItem, setDragOverItem] = useState<PreviewItem | null>(null)

  // Compute the actual item order based on current photos and spotify
  const computedItemOrder = useMemo(() => {
    if (itemOrder) {
      const validItems: PreviewItem[] = []
      const seenPhotos = new Set<number>()

      for (const item of itemOrder) {
        if (item.startsWith('photo:')) {
          const index = parseInt(item.split(':')[1])
          if (index < photos.length && !seenPhotos.has(index)) {
            validItems.push(item)
            seenPhotos.add(index)
          }
        } else if (item === 'text') {
          validItems.push(item)
        } else if (item === 'buttons') {
          validItems.push(item)
        } else if (item === 'spotify' && spotifyLink) {
          validItems.push(item)
        } else if (item === 'message') {
          // Legacy support - convert 'message' to 'text' and 'buttons'
          if (!validItems.includes('text')) validItems.push('text')
          if (!validItems.includes('buttons')) validItems.push('buttons')
        }
      }

      // Add any new photos not in the order
      for (let i = 0; i < photos.length; i++) {
        if (!seenPhotos.has(i)) {
          validItems.push(`photo:${i}`)
        }
      }

      // Add spotify if not present but needed
      if (spotifyLink && !validItems.includes('spotify')) {
        validItems.push('spotify')
      }

      // Ensure text and buttons are present
      if (!validItems.includes('text')) {
        validItems.push('text')
      }
      if (!validItems.includes('buttons')) {
        validItems.push('buttons')
      }

      return validItems
    }
    return getDefaultItemOrder(photos.length, !!spotifyLink)
  }, [itemOrder, photos.length, spotifyLink])

  const handleDragStart = (e: React.DragEvent, item: PreviewItem) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item)
    setDraggedItem(item)
  }

  const handleDragOver = (e: React.DragEvent, item: PreviewItem) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItem && draggedItem !== item) {
      setDragOverItem(item)
    }
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetItem: PreviewItem) => {
    e.preventDefault()
    if (draggedItem && draggedItem !== targetItem && onItemOrderChange) {
      const newOrder = [...computedItemOrder]
      const draggedIndex = newOrder.indexOf(draggedItem)
      const targetIndex = newOrder.indexOf(targetItem)
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedItem)
      onItemOrderChange(newOrder)
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const renderItem = (item: PreviewItem) => {
    if (item.startsWith('photo:')) {
      const photoIndex = parseInt(item.split(':')[1])
      const photo = photos[photoIndex]
      if (!photo) return null

      return (
        <div className="p-1">
          <div
            className={`relative ${
              photoStyle === 'polaroid'
                ? 'polaroid'
                : 'hearts-border p-1.5 bg-white'
            }`}
            style={{
              transform: photoStyle === 'polaroid'
                ? `rotate(${photoIndex % 2 === 0 ? -2 : 2}deg)`
                : 'none',
              ['--theme-primary' as string]: themeColors.primary,
            }}
          >
            <div className="w-16 h-16 relative">
              <Image
                src={photo}
                alt={`Photo ${photoIndex + 1}`}
                fill
                className="object-cover grayscale select-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>
      )
    }

    if (item === 'text') {
      return (
        <div className="text-center px-4 py-2">
          <p className="font-loveheart text-sm leading-relaxed" style={{ color: '#1a1a1a' }}>
            {message || 'Your message will appear here...'}
          </p>
        </div>
      )
    }

    if (item === 'buttons') {
      return (
        <div className="flex justify-center gap-3 px-4 py-2">
          <button
            className="px-5 py-1.5 rounded-full text-white text-xs font-medium"
            style={{ backgroundColor: themeColors.primary }}
          >
            Yes
          </button>
          <button
            className="px-5 py-1.5 rounded-full border text-xs font-medium"
            style={{ borderColor: themeColors.primary, color: themeColors.primary }}
          >
            No
          </button>
        </div>
      )
    }

    if (item === 'spotify' && spotifyLink) {
      return (
        <div className="px-4 py-2">
          <SpotifyCard
            spotifyLink={spotifyLink}
            themeColor={themeColors.primary}
            compact={viewMode === 'desktop'}
          />
        </div>
      )
    }

    return null
  }

  const renderDraggableItem = (item: PreviewItem) => {
    const content = renderItem(item)
    if (!content) return null

    const isDragging = draggedItem === item
    const isDragOver = dragOverItem === item

    if (!onItemOrderChange) {
      return (
        <div key={item} className="flex justify-center py-1">
          {content}
        </div>
      )
    }

    return (
      <div
        key={item}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={(e) => handleDragOver(e, item)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item)}
        onDragEnd={handleDragEnd}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex justify-center py-1 cursor-grab active:cursor-grabbing transition-all select-none relative group ${
          isDragging ? 'opacity-40 scale-95' : ''
        } ${isDragOver ? 'border-t-2 border-pink-400' : ''}`}
      >
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 text-xs">
          ⋮⋮
        </div>
        {content}
      </div>
    )
  }

  const ValentineContent = () => (
    <div
      className="min-h-full py-2"
      style={{ backgroundColor: themeColors.bgColor }}
    >
      {computedItemOrder.map(item => renderDraggableItem(item))}
    </div>
  )

  const PlaceholderContent = () => (
    <div
      className="min-h-full py-2"
      style={{ backgroundColor: themeColors.bgColor }}
    >
      <div className="flex justify-center gap-2 py-2">
        <div className={photoStyle === 'polaroid' ? 'polaroid' : 'hearts-border p-1.5 bg-white'}>
          <div className="w-16 h-16 bg-gray-300" />
        </div>
        <div className={photoStyle === 'polaroid' ? 'polaroid' : 'hearts-border p-1.5 bg-white'}>
          <div className="w-16 h-16 bg-gray-300" />
        </div>
      </div>
      {renderDraggableItem('text')}
      {renderDraggableItem('buttons')}
      {spotifyLink && renderDraggableItem('spotify')}
    </div>
  )

  if (viewMode === 'mobile') {
    return (
      <div className="bg-gray-900 rounded-[40px] p-2 shadow-xl">
        {/* Dynamic Island */}
        <div className="bg-black rounded-t-[32px] relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
        </div>
        {/* Screen - iPhone 16 proportions */}
        <div
          className="rounded-[32px] overflow-hidden w-[220px] h-[476px] overflow-y-auto"
          style={{ backgroundColor: themeColors.bgColor }}
        >
          <div className="pt-10">
            {photos.length > 0 ? <ValentineContent /> : <PlaceholderContent />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-lg">
      {/* Browser chrome */}
      <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center text-xs text-gray-500 bg-white rounded px-3 py-1">
          {recipientName ? `${recipientName.toLowerCase().replace(/\s+/g, '-')}.askcuter.com` : 'preview'}
        </div>
      </div>
      {/* Screen content - landscape aspect ratio */}
      <div className="w-[500px] h-[320px] overflow-y-auto">
        {photos.length > 0 ? <ValentineContent /> : <PlaceholderContent />}
      </div>
    </div>
  )
}
