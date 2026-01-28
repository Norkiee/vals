'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { THEMES, ThemeKey, PhotoStyle } from '@/lib/constants'
import SpotifyCard from '@/components/SpotifyCard'

export interface CanvasElement {
  id: string
  type: 'photo' | 'spotify' | 'text' | 'buttons'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  photoIndex?: number
}

interface CanvasEditorProps {
  photos: string[]
  message: string
  spotifyLink: string
  theme: ThemeKey
  photoStyle: PhotoStyle
  canvasState?: CanvasElement[]
  onCanvasStateChange?: (state: CanvasElement[]) => void
}

const CANVAS_WIDTH = 375
const CANVAS_HEIGHT = 667

export function getDefaultCanvasState(photoCount: number, hasSpotify: boolean): CanvasElement[] {
  const elements: CanvasElement[] = []

  // Position photos in a scattered layout
  for (let i = 0; i < photoCount; i++) {
    elements.push({
      id: `photo-${i}`,
      type: 'photo',
      photoIndex: i,
      x: 40 + (i % 2) * 150,
      y: 40 + Math.floor(i / 2) * 140,
      width: 120,
      height: 120,
      rotation: (i % 2 === 0 ? -8 : 8),
      zIndex: i + 1,
    })
  }

  // Text element
  elements.push({
    id: 'text-1',
    type: 'text',
    x: 20,
    y: photoCount > 0 ? 300 : 200,
    width: 335,
    height: 80,
    rotation: 0,
    zIndex: photoCount + 1,
  })

  // Buttons element
  elements.push({
    id: 'buttons-1',
    type: 'buttons',
    x: 80,
    y: photoCount > 0 ? 400 : 300,
    width: 215,
    height: 50,
    rotation: 0,
    zIndex: photoCount + 2,
  })

  // Spotify element
  if (hasSpotify) {
    elements.push({
      id: 'spotify-1',
      type: 'spotify',
      x: 20,
      y: 500,
      width: 335,
      height: 80,
      rotation: 0,
      zIndex: photoCount + 3,
    })
  }

  return elements
}

export default function CanvasEditor({
  photos,
  message,
  spotifyLink,
  theme,
  photoStyle,
  canvasState,
  onCanvasStateChange,
}: CanvasEditorProps) {
  const themeColors = THEMES[theme]
  const canvasRef = useRef<HTMLDivElement>(null)

  const [elements, setElements] = useState<CanvasElement[]>(() =>
    canvasState || getDefaultCanvasState(photos.length, !!spotifyLink)
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0, rotation: 0 })

  // Update elements when photos change
  useEffect(() => {
    setElements(prev => {
      const existingPhotoIds = prev.filter(e => e.type === 'photo').map(e => e.photoIndex)
      const newElements = [...prev]

      // Add new photos
      for (let i = 0; i < photos.length; i++) {
        if (!existingPhotoIds.includes(i)) {
          newElements.push({
            id: `photo-${i}`,
            type: 'photo',
            photoIndex: i,
            x: 40 + (i % 2) * 150,
            y: 40 + Math.floor(i / 2) * 140,
            width: 120,
            height: 120,
            rotation: (i % 2 === 0 ? -8 : 8),
            zIndex: newElements.length + 1,
          })
        }
      }

      // Remove photos that no longer exist
      return newElements.filter(e =>
        e.type !== 'photo' || (e.photoIndex !== undefined && e.photoIndex < photos.length)
      )
    })
  }, [photos.length])

  // Add spotify when link is added
  useEffect(() => {
    if (spotifyLink && !elements.find(e => e.type === 'spotify')) {
      setElements(prev => [...prev, {
        id: 'spotify-1',
        type: 'spotify',
        x: 20,
        y: 500,
        width: 335,
        height: 80,
        rotation: 0,
        zIndex: prev.length + 1,
      }])
    } else if (!spotifyLink) {
      setElements(prev => prev.filter(e => e.type !== 'spotify'))
    }
  }, [spotifyLink, elements])

  // Notify parent of state changes
  useEffect(() => {
    onCanvasStateChange?.(elements)
  }, [elements, onCanvasStateChange])

  const getMousePosition = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const bringToFront = useCallback((id: string) => {
    setElements(prev => {
      const maxZ = Math.max(...prev.map(e => e.zIndex))
      return prev.map(e => e.id === id ? { ...e, zIndex: maxZ + 1 } : e)
    })
  }, [])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation()
    const pos = getMousePosition(e)
    const element = elements.find(el => el.id === id)
    if (!element) return

    setSelectedId(id)
    setIsDragging(true)
    setDragStart(pos)
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation })
    bringToFront(id)
  }, [elements, getMousePosition, bringToFront])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !selectedId) return

    const pos = getMousePosition(e)
    const deltaX = pos.x - dragStart.x
    const deltaY = pos.y - dragStart.y

    setElements(prev => prev.map(el =>
      el.id === selectedId
        ? { ...el, x: Math.max(0, Math.min(CANVAS_WIDTH - el.width, elementStart.x + deltaX)),
                   y: Math.max(0, Math.min(CANVAS_HEIGHT - el.height, elementStart.y + deltaY)) }
        : el
    ))
  }, [isDragging, selectedId, dragStart, elementStart, getMousePosition])

  // Rotation handlers
  const handleRotateStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation()
    const element = elements.find(el => el.id === id)
    if (!element) return

    setSelectedId(id)
    setIsRotating(true)
    setDragStart(getMousePosition(e))
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation })
  }, [elements, getMousePosition])

  const handleRotateMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isRotating || !selectedId) return

    const element = elements.find(el => el.id === selectedId)
    if (!element) return

    const pos = getMousePosition(e)
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2

    const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI) + 90

    setElements(prev => prev.map(el =>
      el.id === selectedId ? { ...el, rotation: angle } : el
    ))
  }, [isRotating, selectedId, elements, getMousePosition])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string, handle: string) => {
    e.stopPropagation()
    const element = elements.find(el => el.id === id)
    if (!element) return

    setSelectedId(id)
    setIsResizing(handle)
    setDragStart(getMousePosition(e))
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation })
  }, [elements, getMousePosition])

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !selectedId) return

    const pos = getMousePosition(e)
    const deltaX = pos.x - dragStart.x
    const deltaY = pos.y - dragStart.y

    setElements(prev => prev.map(el => {
      if (el.id !== selectedId) return el

      let newWidth = elementStart.width
      let newHeight = elementStart.height
      let newX = elementStart.x
      let newY = elementStart.y

      // Handle different resize directions
      if (isResizing.includes('e')) newWidth = Math.max(50, elementStart.width + deltaX)
      if (isResizing.includes('w')) {
        newWidth = Math.max(50, elementStart.width - deltaX)
        newX = elementStart.x + (elementStart.width - newWidth)
      }
      if (isResizing.includes('s')) newHeight = Math.max(50, elementStart.height + deltaY)
      if (isResizing.includes('n')) {
        newHeight = Math.max(50, elementStart.height - deltaY)
        newY = elementStart.y + (elementStart.height - newHeight)
      }

      // Maintain aspect ratio for photos
      if (el.type === 'photo' && (isResizing === 'se' || isResizing === 'sw' || isResizing === 'ne' || isResizing === 'nw')) {
        const aspectRatio = elementStart.width / elementStart.height
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
        }
      }

      return { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
    }))
  }, [isResizing, selectedId, dragStart, elementStart, getMousePosition])

  // Global mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsRotating(false)
    setIsResizing(null)
  }, [])

  // Add/remove global event listeners
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) handleDragMove(e)
      else if (isRotating) handleRotateMove(e)
      else if (isResizing) handleResizeMove(e)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, isRotating, isResizing, handleDragMove, handleRotateMove, handleResizeMove, handleMouseUp])

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedId === element.id

    const content = (() => {
      switch (element.type) {
        case 'photo':
          const photo = element.photoIndex !== undefined ? photos[element.photoIndex] : null
          if (!photo) return null
          return (
            <div
              className={`w-full h-full ${
                photoStyle === 'polaroid' ? 'bg-white p-2 pb-6 shadow-lg' : 'hearts-border p-2 bg-white'
              }`}
              style={{ ['--theme-primary' as string]: themeColors.primary }}
            >
              <div className="w-full h-full relative">
                <Image
                  src={photo}
                  alt={`Photo ${(element.photoIndex || 0) + 1}`}
                  fill
                  className="object-cover grayscale"
                  draggable={false}
                />
              </div>
            </div>
          )

        case 'text':
          return (
            <div className="w-full h-full flex items-center justify-center p-2">
              <p className="font-loveheart text-sm leading-relaxed text-center" style={{ color: '#1a1a1a' }}>
                {message || 'Your message will appear here...'}
              </p>
            </div>
          )

        case 'buttons':
          return (
            <div className="w-full h-full flex items-center justify-center gap-3">
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

        case 'spotify':
          if (!spotifyLink) return null
          return (
            <div className="w-full h-full">
              <SpotifyCard
                spotifyLink={spotifyLink}
                themeColor={themeColors.primary}
                compact={true}
              />
            </div>
          )

        default:
          return null
      }
    })()

    if (!content) return null

    return (
      <div
        key={element.id}
        className={`absolute cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex,
        }}
        onMouseDown={(e) => handleDragStart(e, element.id)}
        onTouchStart={(e) => handleDragStart(e, element.id)}
        onClick={() => setSelectedId(element.id)}
      >
        {content}

        {/* Selection handles */}
        {isSelected && (
          <>
            {/* Resize handles */}
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => {
              const positions: Record<string, { left?: string; right?: string; top?: string; bottom?: string; cursor: string }> = {
                nw: { left: '-4px', top: '-4px', cursor: 'nwse-resize' },
                n: { left: '50%', top: '-4px', cursor: 'ns-resize' },
                ne: { right: '-4px', top: '-4px', cursor: 'nesw-resize' },
                e: { right: '-4px', top: '50%', cursor: 'ew-resize' },
                se: { right: '-4px', bottom: '-4px', cursor: 'nwse-resize' },
                s: { left: '50%', bottom: '-4px', cursor: 'ns-resize' },
                sw: { left: '-4px', bottom: '-4px', cursor: 'nesw-resize' },
                w: { left: '-4px', top: '50%', cursor: 'ew-resize' },
              }
              const pos = positions[handle]
              return (
                <div
                  key={handle}
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    ...pos,
                    transform: pos.left === '50%' || pos.top === '50%' ? 'translate(-50%, -50%)' : undefined,
                  }}
                  onMouseDown={(e) => handleResizeStart(e, element.id, handle)}
                  onTouchStart={(e) => handleResizeStart(e, element.id, handle)}
                />
              )
            })}

            {/* Rotation handle */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-alias"
              onMouseDown={(e) => handleRotateStart(e, element.id)}
              onTouchStart={(e) => handleRotateStart(e, element.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative border-2 border-gray-300 rounded-lg overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: themeColors.bgColor,
        }}
        onClick={() => setSelectedId(null)}
      >
        {elements.map(renderElement)}
      </div>

      {/* Info */}
      {selectedId && (
        <div className="mt-2 text-xs text-gray-500">
          {(() => {
            const el = elements.find(e => e.id === selectedId)
            if (!el) return null
            return `X: ${Math.round(el.x)} Y: ${Math.round(el.y)} W: ${Math.round(el.width)} H: ${Math.round(el.height)} R: ${Math.round(el.rotation)}°`
          })()}
        </div>
      )}
    </div>
  )
}
