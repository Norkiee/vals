'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  viewMode?: 'mobile' | 'desktop'
  recipientName?: string
}

const MOBILE_WIDTH = 220
const MOBILE_HEIGHT = 476
const DESKTOP_WIDTH = 500
const DESKTOP_HEIGHT = 320

export function getDefaultCanvasState(photoCount: number, hasSpotify: boolean): CanvasElement[] {
  const elements: CanvasElement[] = []
  const TOP_OFFSET = 40 // Account for Dynamic Island

  // Position photos in a scattered layout
  for (let i = 0; i < photoCount; i++) {
    elements.push({
      id: `photo-${i}`,
      type: 'photo',
      photoIndex: i,
      x: 30 + (i % 2) * 80,
      y: TOP_OFFSET + 10 + Math.floor(i / 2) * 90,
      width: 70,
      height: 70,
      rotation: (i % 2 === 0 ? -5 : 5),
      zIndex: i + 1,
    })
  }

  // Text element
  elements.push({
    id: 'text-1',
    type: 'text',
    x: 10,
    y: photoCount > 0 ? TOP_OFFSET + 180 : TOP_OFFSET + 80,
    width: 200,
    height: 60,
    rotation: 0,
    zIndex: photoCount + 1,
  })

  // Buttons element
  elements.push({
    id: 'buttons-1',
    type: 'buttons',
    x: 30,
    y: photoCount > 0 ? TOP_OFFSET + 250 : TOP_OFFSET + 150,
    width: 160,
    height: 40,
    rotation: 0,
    zIndex: photoCount + 2,
  })

  // Spotify element
  if (hasSpotify) {
    elements.push({
      id: 'spotify-1',
      type: 'spotify',
      x: 10,
      y: TOP_OFFSET + 310,
      width: 200,
      height: 60,
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
  viewMode = 'mobile',
  recipientName = '',
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
    const TOP_OFFSET = 40
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
            x: 30 + (i % 2) * 80,
            y: TOP_OFFSET + 10 + Math.floor(i / 2) * 90,
            width: 70,
            height: 70,
            rotation: (i % 2 === 0 ? -5 : 5),
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
    const TOP_OFFSET = 40
    if (spotifyLink && !elements.find(e => e.type === 'spotify')) {
      setElements(prev => [...prev, {
        id: 'spotify-1',
        type: 'spotify',
        x: 10,
        y: TOP_OFFSET + 310,
        width: 200,
        height: 60,
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

  const handleDeleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(e => e.id !== id))
    setSelectedId(null)
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

  const canvasWidth = viewMode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const canvasHeight = viewMode === 'mobile' ? MOBILE_HEIGHT : DESKTOP_HEIGHT

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !selectedId) return

    const pos = getMousePosition(e)
    const deltaX = pos.x - dragStart.x
    const deltaY = pos.y - dragStart.y

    setElements(prev => prev.map(el =>
      el.id === selectedId
        ? { ...el, x: Math.max(0, Math.min(canvasWidth - el.width, elementStart.x + deltaX)),
                   y: Math.max(0, Math.min(canvasHeight - el.height, elementStart.y + deltaY)) }
        : el
    ))
  }, [isDragging, selectedId, dragStart, elementStart, getMousePosition, canvasWidth, canvasHeight])

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
        className="absolute cursor-grab active:cursor-grabbing"
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
            {/* Blue outline */}
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

            {/* Corner resize handles - square */}
            {['nw', 'ne', 'se', 'sw'].map(handle => {
              const positions: Record<string, React.CSSProperties> = {
                nw: { left: 0, top: 0, transform: 'translate(-50%, -50%)', cursor: 'nwse-resize' },
                ne: { right: 0, top: 0, transform: 'translate(50%, -50%)', cursor: 'nesw-resize' },
                se: { right: 0, bottom: 0, transform: 'translate(50%, 50%)', cursor: 'nwse-resize' },
                sw: { left: 0, bottom: 0, transform: 'translate(-50%, 50%)', cursor: 'nesw-resize' },
              }
              return (
                <div
                  key={handle}
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500"
                  style={positions[handle]}
                  onMouseDown={(e) => handleResizeStart(e, element.id, handle)}
                  onTouchStart={(e) => handleResizeStart(e, element.id, handle)}
                />
              )
            })}

            {/* Delete button - top center */}
            <div
              className="absolute left-1/2 -top-10 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteElement(element.id)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </div>

            {/* Rotate button - bottom center */}
            <div
              className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-alias hover:bg-gray-50"
              onMouseDown={(e) => handleRotateStart(e, element.id)}
              onTouchStart={(e) => handleRotateStart(e, element.id)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
          </>
        )}
      </div>
    )
  }

  if (viewMode === 'desktop') {
    return (
      <div className="flex flex-col items-center">
        {/* Browser frame */}
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
          {/* Screen content */}
          <div
            ref={canvasRef}
            className="relative overflow-hidden"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              backgroundColor: themeColors.bgColor,
            }}
            onClick={() => setSelectedId(null)}
          >
            {elements.map(renderElement)}
          </div>
        </div>

        {/* Info */}
        {selectedId && (
          <div className="mt-2 text-xs text-gray-500">
            {(() => {
              const el = elements.find(e => e.id === selectedId)
              if (!el) return null
              return `X: ${Math.round(el.x)} Y: ${Math.round(el.y)} R: ${Math.round(el.rotation)}°`
            })()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="bg-gray-900 rounded-[40px] p-2 shadow-xl">
        {/* Dynamic Island */}
        <div className="bg-black rounded-t-[32px] relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
        </div>
        {/* Screen */}
        <div
          ref={canvasRef}
          className="rounded-[32px] overflow-hidden relative"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: themeColors.bgColor,
          }}
          onClick={() => setSelectedId(null)}
        >
          {elements.map(renderElement)}
        </div>
      </div>

      {/* Info */}
      {selectedId && (
        <div className="mt-2 text-xs text-gray-500">
          {(() => {
            const el = elements.find(e => e.id === selectedId)
            if (!el) return null
            return `X: ${Math.round(el.x)} Y: ${Math.round(el.y)} R: ${Math.round(el.rotation)}°`
          })()}
        </div>
      )}
    </div>
  )
}
