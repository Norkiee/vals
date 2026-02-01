'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { THEMES, ThemeKey, PhotoStyle } from '@/lib/constants'
import { SpotifyMetadata } from '@/lib/spotify'
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

export interface CanvasState {
  mobile: CanvasElement[]
  desktop: CanvasElement[]
}

interface CanvasEditorProps {
  photos: string[]
  message: string
  spotifyLink: string
  spotifyMeta?: SpotifyMetadata | null
  theme: ThemeKey
  photoStyle: PhotoStyle
  canvasState?: CanvasState
  onCanvasStateChange?: (state: CanvasState) => void
  viewMode?: 'mobile' | 'desktop'
  recipientName?: string
  fontSize?: number
  font?: string
  templateMode?: boolean
  placeholderCount?: number
}

const MOBILE_WIDTH = 220
const MOBILE_HEIGHT = 476
const DESKTOP_WIDTH = 800
const DESKTOP_HEIGHT = 500

// --- Layout algorithms ---

function getScatteredLayout(photoCount: number, hasSpotify: boolean, mode: 'mobile' | 'desktop'): CanvasElement[] {
  const elements: CanvasElement[] = []

  if (mode === 'mobile') {
    const TOP_OFFSET = 40
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
    elements.push({
      id: 'text-1', type: 'text',
      x: 10, y: photoCount > 0 ? TOP_OFFSET + 180 : TOP_OFFSET + 80,
      width: 200, height: 60, rotation: 0, zIndex: photoCount + 1,
    })
    elements.push({
      id: 'buttons-1', type: 'buttons',
      x: 30, y: photoCount > 0 ? TOP_OFFSET + 250 : TOP_OFFSET + 150,
      width: 160, height: 40, rotation: 0, zIndex: photoCount + 2,
    })
    if (hasSpotify) {
      elements.push({
        id: 'spotify-1', type: 'spotify',
        x: 10, y: TOP_OFFSET + 310, width: 200, height: 80, rotation: 0, zIndex: photoCount + 3,
      })
    }
  } else {
    for (let i = 0; i < photoCount; i++) {
      elements.push({
        id: `photo-${i}`,
        type: 'photo',
        photoIndex: i,
        x: 40 + (i % 4) * 180,
        y: 40 + Math.floor(i / 4) * 180,
        width: 150,
        height: 150,
        rotation: (i % 2 === 0 ? -3 : 3),
        zIndex: i + 1,
      })
    }
    elements.push({
      id: 'text-1', type: 'text',
      x: 40, y: photoCount > 0 ? 260 : 100,
      width: 500, height: 80, rotation: 0, zIndex: photoCount + 1,
    })
    elements.push({
      id: 'buttons-1', type: 'buttons',
      x: 300, y: photoCount > 0 ? 360 : 200,
      width: 200, height: 50, rotation: 0, zIndex: photoCount + 2,
    })
    if (hasSpotify) {
      elements.push({
        id: 'spotify-1', type: 'spotify',
        x: 40, y: photoCount > 0 ? 360 : 300,
        width: 220, height: 80, rotation: 0, zIndex: photoCount + 3,
      })
    }
  }
  return elements
}

export function getDefaultCanvasState(photoCount: number, hasSpotify: boolean, mode: 'mobile' | 'desktop' = 'mobile'): CanvasElement[] {
  return getScatteredLayout(photoCount, hasSpotify, mode)
}

export function getDefaultCanvasStates(photoCount: number, hasSpotify: boolean): CanvasState {
  return {
    mobile: getDefaultCanvasState(photoCount, hasSpotify, 'mobile'),
    desktop: getDefaultCanvasState(photoCount, hasSpotify, 'desktop'),
  }
}

export default function CanvasEditor({
  photos,
  message,
  spotifyLink,
  spotifyMeta,
  theme,
  photoStyle,
  canvasState,
  onCanvasStateChange,
  viewMode = 'mobile',
  recipientName = '',
  fontSize = 16,
  font = 'Loveheart',
  templateMode = false,
  placeholderCount = 3,
}: CanvasEditorProps) {
  const themeColors = THEMES[theme]
  const canvasRef = useRef<HTMLDivElement>(null)
  const prevPlaceholderCountRef = useRef<number>(placeholderCount)

  // Separate states for mobile and desktop
  const [mobileElements, setMobileElements] = useState<CanvasElement[]>(() =>
    canvasState?.mobile && canvasState.mobile.length > 0
      ? canvasState.mobile
      : getDefaultCanvasState(templateMode ? placeholderCount : photos.length, !!spotifyLink, 'mobile')
  )
  const [desktopElements, setDesktopElements] = useState<CanvasElement[]>(() =>
    canvasState?.desktop && canvasState.desktop.length > 0
      ? canvasState.desktop
      : getDefaultCanvasState(templateMode ? placeholderCount : photos.length, !!spotifyLink, 'desktop')
  )

  // Get current elements based on view mode
  const elements = viewMode === 'mobile' ? mobileElements : desktopElements
  const setElements = viewMode === 'mobile' ? setMobileElements : setDesktopElements

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0, rotation: 0 })
  const [primarySelectedId, setPrimarySelectedId] = useState<string | null>(null)

  // Refs for drag state to avoid stale closures
  const selectedIdsRef = useRef<string[]>([])
  const elementsStartRef = useRef<Record<string, { x: number; y: number }>>({})
  const didDragRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  // Clear selection when switching view modes
  useEffect(() => {
    setSelectedIds([])
    setPrimarySelectedId(null)
  }, [viewMode])

  // Sync external canvasState prop into internal state (e.g. when a template is selected)
  // Use a flag to avoid infinite loop: internal changes → onCanvasStateChange → parent setState → new prop → sync effect
  const isInternalUpdateRef = useRef(false)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }
    if (canvasState?.mobile && canvasState.mobile.length > 0) {
      setMobileElements(canvasState.mobile)
    }
    if (canvasState?.desktop && canvasState.desktop.length > 0) {
      setDesktopElements(canvasState.desktop)
    }
  }, [canvasState])

  // In template mode, regenerate photo placeholder elements when placeholderCount changes
  useEffect(() => {
    if (!templateMode) return
    if (placeholderCount === prevPlaceholderCountRef.current) return
    prevPlaceholderCountRef.current = placeholderCount

    const updatePlaceholders = (prev: CanvasElement[], mode: 'mobile' | 'desktop') => {
      const nonPhotoElements = prev.filter(e => e.type !== 'photo')
      const existingPhotos = prev.filter(e => e.type === 'photo')

      if (placeholderCount > existingPhotos.length) {
        // Add new placeholder slots
        const referenceLayout = getDefaultCanvasState(placeholderCount, !!spotifyLink, mode)
        const newPhotos = [...existingPhotos]
        for (let i = existingPhotos.length; i < placeholderCount; i++) {
          const ref = referenceLayout.find(e => e.type === 'photo' && e.photoIndex === i)
          if (ref) {
            newPhotos.push({ ...ref, zIndex: nonPhotoElements.length + newPhotos.length + 1 })
          }
        }
        return [...nonPhotoElements, ...newPhotos]
      } else {
        // Remove excess placeholder slots (keep first N)
        return [...nonPhotoElements, ...existingPhotos.slice(0, placeholderCount)]
      }
    }

    setMobileElements(prev => updatePlaceholders(prev, 'mobile'))
    setDesktopElements(prev => updatePlaceholders(prev, 'desktop'))
    setSelectedIds([])
    setPrimarySelectedId(null)
  }, [templateMode, placeholderCount, spotifyLink])

  // Update elements when photos change - for both modes (skip in template mode)
  useEffect(() => {
    if (templateMode) return

    const updateElementsWithPhotos = (prev: CanvasElement[], mode: 'mobile' | 'desktop') => {
      const existingPhotoElements = prev.filter(e => e.type === 'photo')
      const existingPhotoIds = existingPhotoElements.map(e => e.photoIndex)
      const newElements = [...prev]

      // For new photos beyond existing element slots, add new positions
      for (let i = 0; i < photos.length; i++) {
        if (!existingPhotoIds.includes(i)) {
          // Check if there's a template slot we can reuse (element exists but had no photo)
          const emptySlot = existingPhotoElements.find(e => e.photoIndex === i)
          if (!emptySlot) {
            // Generate a default position for this new photo
            const referenceLayout = getDefaultCanvasState(photos.length, !!spotifyLink, mode)
            const ref = referenceLayout.find(e => e.type === 'photo' && e.photoIndex === i)
            if (ref) {
              newElements.push({ ...ref, zIndex: newElements.length + 1 })
            }
          }
        }
      }

      // Only remove photo elements that are beyond what photos + template slots need
      // Keep template placeholder slots (they may not have photos yet)
      const maxSlot = Math.max(photos.length, existingPhotoElements.length)
      return newElements.filter(e =>
        e.type !== 'photo' || (e.photoIndex !== undefined && e.photoIndex < maxSlot)
      )
    }

    setMobileElements(prev => updateElementsWithPhotos(prev, 'mobile'))
    setDesktopElements(prev => updateElementsWithPhotos(prev, 'desktop'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length, spotifyLink])

  // Ensure text and buttons elements always exist - for both modes
  useEffect(() => {
    const ensureTextAndButtons = (prev: CanvasElement[], mode: 'mobile' | 'desktop') => {
      const hasText = prev.some(e => e.type === 'text')
      const hasButtons = prev.some(e => e.type === 'buttons')

      if (hasText && hasButtons) return prev

      const newElements = [...prev]
      const TOP_OFFSET = mode === 'mobile' ? 40 : 0

      if (!hasText) {
        newElements.push({
          id: 'text-1',
          type: 'text',
          x: mode === 'mobile' ? 10 : 40,
          y: mode === 'mobile' ? TOP_OFFSET + 180 : 260,
          width: mode === 'mobile' ? 200 : 500,
          height: mode === 'mobile' ? 60 : 80,
          rotation: 0,
          zIndex: newElements.length + 1,
        })
      }

      if (!hasButtons) {
        newElements.push({
          id: 'buttons-1',
          type: 'buttons',
          x: mode === 'mobile' ? 30 : 300,
          y: mode === 'mobile' ? TOP_OFFSET + 250 : 360,
          width: mode === 'mobile' ? 160 : 200,
          height: mode === 'mobile' ? 40 : 50,
          rotation: 0,
          zIndex: newElements.length + 1,
        })
      }

      return newElements
    }

    setMobileElements(prev => ensureTextAndButtons(prev, 'mobile'))
    setDesktopElements(prev => ensureTextAndButtons(prev, 'desktop'))
  }, [])

  // Add spotify when link is added - for both modes (skip in template mode — spotify always present)
  useEffect(() => {
    if (templateMode) return

    const addOrRemoveSpotify = (prev: CanvasElement[], mode: 'mobile' | 'desktop') => {
      const hasSpotify = prev.some(e => e.type === 'spotify')
      const TOP_OFFSET = mode === 'mobile' ? 40 : 0

      if (spotifyLink && !hasSpotify) {
        return [...prev, {
          id: 'spotify-1',
          type: 'spotify' as const,
          x: mode === 'mobile' ? 10 : 40,
          y: mode === 'mobile' ? TOP_OFFSET + 310 : 360,
          width: mode === 'mobile' ? 200 : 220,
          height: 80,
          rotation: 0,
          zIndex: prev.length + 1,
        }]
      }
      // Don't remove spotify elements — they may come from a template layout
      return prev
    }

    setMobileElements(prev => addOrRemoveSpotify(prev, 'mobile'))
    setDesktopElements(prev => addOrRemoveSpotify(prev, 'desktop'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyLink])

  // Notify parent of state changes - send both states
  useEffect(() => {
    isInternalUpdateRef.current = true
    onCanvasStateChange?.({ mobile: mobileElements, desktop: desktopElements })
  }, [mobileElements, desktopElements, onCanvasStateChange])

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

  const bringToFront = useCallback((ids: string[]) => {
    setElements(prev => {
      const maxZ = Math.max(...prev.map(e => e.zIndex))
      return prev.map((e, i) => ids.includes(e.id) ? { ...e, zIndex: maxZ + 1 + ids.indexOf(e.id) } : e)
    })
  }, [])

  const handleDeleteElement = useCallback((id: string) => {
    // Delete all selected elements if the deleted one is selected
    setElements(prev => prev.filter(e => !selectedIds.includes(e.id)))
    setSelectedIds([])
    setPrimarySelectedId(null)
  }, [selectedIds])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation()
    const pos = getMousePosition(e)
    const element = elements.find(el => el.id === id)
    if (!element) return

    const shiftKey = 'shiftKey' in e ? e.shiftKey : false
    const currentSelectedIds = selectedIdsRef.current

    // Determine what items will be selected/dragged
    let dragIds: string[]
    if (shiftKey) {
      // Shift held - toggle this item in selection
      if (currentSelectedIds.includes(id)) {
        // Remove from selection
        dragIds = currentSelectedIds.filter(sid => sid !== id)
      } else {
        // Add to selection
        dragIds = [...currentSelectedIds, id]
      }
    } else if (currentSelectedIds.includes(id)) {
      // Clicking already selected item without shift - keep all selected
      dragIds = currentSelectedIds
    } else {
      // Clicking unselected item without shift - select only this
      dragIds = [id]
    }

    setPrimarySelectedId(id)
    setIsDragging(true)
    didDragRef.current = false
    setDragStart(pos)
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation })

    // Store starting positions for items that will be dragged
    const starts: Record<string, { x: number; y: number }> = {}
    dragIds.forEach(sid => {
      const el = elements.find(e => e.id === sid)
      if (el) starts[sid] = { x: el.x, y: el.y }
    })
    elementsStartRef.current = starts

    // Temporarily set these as selected for dragging (will be confirmed in onClick)
    selectedIdsRef.current = dragIds

    bringToFront(dragIds)
  }, [elements, getMousePosition, bringToFront])

  const canvasWidth = viewMode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const canvasHeight = viewMode === 'mobile' ? MOBILE_HEIGHT : DESKTOP_HEIGHT

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || selectedIdsRef.current.length === 0) return

    const pos = getMousePosition(e)
    const deltaX = pos.x - dragStart.x
    const deltaY = pos.y - dragStart.y

    // Mark that actual dragging occurred (more than 3px movement)
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      didDragRef.current = true
    }

    setElements(prev => prev.map(el => {
      if (!selectedIdsRef.current.includes(el.id)) return el
      const start = elementsStartRef.current[el.id]
      if (!start) return el
      return {
        ...el,
        x: Math.max(0, Math.min(canvasWidth - el.width, start.x + deltaX)),
        y: Math.max(0, Math.min(canvasHeight - el.height, start.y + deltaY))
      }
    }))
  }, [isDragging, dragStart, getMousePosition, canvasWidth, canvasHeight])

  // Rotation handlers
  const [startAngle, setStartAngle] = useState(0)
  const [hasRotateMoved, setHasRotateMoved] = useState(false)

  const handleRotateStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation()
    const element = elements.find(el => el.id === id)
    if (!element) return

    const pos = getMousePosition(e)
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    const initialAngle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI)

    setSelectedIds([id])
    setPrimarySelectedId(id)
    setIsRotating(true)
    setHasRotateMoved(false)
    setStartAngle(initialAngle)
    setDragStart(pos)
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation })
  }, [elements, getMousePosition])

  const handleRotateMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isRotating || !primarySelectedId) return

    const pos = getMousePosition(e)

    // Only start rotating after mouse has moved at least 5 pixels
    if (!hasRotateMoved) {
      const distance = Math.sqrt(Math.pow(pos.x - dragStart.x, 2) + Math.pow(pos.y - dragStart.y, 2))
      if (distance < 5) return
      setHasRotateMoved(true)
    }

    const centerX = elementStart.x + elementStart.width / 2
    const centerY = elementStart.y + elementStart.height / 2

    const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI)
    const deltaAngle = currentAngle - startAngle

    setElements(prev => prev.map(el =>
      el.id === primarySelectedId ? { ...el, rotation: elementStart.rotation + deltaAngle } : el
    ))
  }, [isRotating, primarySelectedId, elementStart, startAngle, dragStart, hasRotateMoved, getMousePosition])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string, handle: string) => {
    e.stopPropagation()
    const element = elements.find(el => el.id === id)
    if (!element) return

    setSelectedIds([id])
    setPrimarySelectedId(id)
    setIsResizing(handle)
    setDragStart(getMousePosition(e))
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation })
  }, [elements, getMousePosition])

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !primarySelectedId) return

    const pos = getMousePosition(e)
    const deltaX = pos.x - dragStart.x
    const deltaY = pos.y - dragStart.y

    setElements(prev => prev.map(el => {
      if (el.id !== primarySelectedId) return el

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
  }, [isResizing, primarySelectedId, dragStart, elementStart, getMousePosition])

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
    const isSelected = selectedIds.includes(element.id)
    const isPrimary = primarySelectedId === element.id

    const content = (() => {
      switch (element.type) {
        case 'photo':
          if (templateMode) {
            return (
              <div
                className={`w-full h-full ${
                  photoStyle === 'polaroid' ? 'bg-white p-2 pb-6 shadow-lg' : 'hearts-border p-2 bg-white'
                }`}
                style={{ ['--theme-primary' as string]: themeColors.primary }}
              >
                <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-lg">
                  <span className="text-2xl font-bold text-gray-400">
                    {(element.photoIndex ?? 0) + 1}
                  </span>
                </div>
              </div>
            )
          }
          const photo = element.photoIndex !== undefined ? photos[element.photoIndex] : null
          if (!photo) {
            // Show placeholder for unfilled template slots
            return (
              <div
                className={`w-full h-full ${
                  photoStyle === 'polaroid' ? 'bg-white p-2 pb-6 shadow-lg' : 'hearts-border p-2 bg-white'
                }`}
                style={{ ['--theme-primary' as string]: themeColors.primary }}
              >
                <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded">
                  <span className="text-lg font-medium text-gray-300">
                    {(element.photoIndex ?? 0) + 1}
                  </span>
                </div>
              </div>
            )
          }
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
                  className="object-cover"
                  draggable={false}
                />
              </div>
            </div>
          )

        case 'text':
          // Scale font size based on element width (base width: 200)
          const textScale = element.width / 200
          const scaledFontSize = Math.max(8, Math.min(48, fontSize * textScale))
          return (
            <div className="w-full h-full flex items-center justify-center p-2 overflow-hidden">
              <p
                className="leading-relaxed text-center"
                style={{ color: '#1a1a1a', fontSize: `${scaledFontSize}px`, fontFamily: `'${font}', cursive` }}
              >
                {message || 'Your message will appear here...'}
              </p>
            </div>
          )

        case 'buttons':
          // Scale button size based on element width (base width: 160)
          const buttonScale = element.width / 160
          const btnFontSize = Math.max(10, Math.min(24, 12 * buttonScale))
          const btnPaddingX = Math.max(12, Math.min(40, 20 * buttonScale))
          const btnPaddingY = Math.max(4, Math.min(16, 6 * buttonScale))
          const btnGap = Math.max(8, Math.min(24, 12 * buttonScale))
          return (
            <div className="w-full h-full flex items-center justify-center" style={{ gap: `${btnGap}px` }}>
              <button
                className="rounded-full text-white font-medium"
                style={{
                  backgroundColor: themeColors.primary,
                  fontSize: `${btnFontSize}px`,
                  padding: `${btnPaddingY}px ${btnPaddingX}px`
                }}
              >
                Yes
              </button>
              <button
                className="rounded-full border font-medium"
                style={{
                  borderColor: themeColors.primary,
                  color: themeColors.primary,
                  fontSize: `${btnFontSize}px`,
                  padding: `${btnPaddingY}px ${btnPaddingX}px`
                }}
              >
                No
              </button>
            </div>
          )

        case 'spotify':
          const usePlaceholder = !spotifyLink || templateMode
          return (
            <div className="w-full h-full overflow-hidden">
              <SpotifyCard
                spotifyLink={usePlaceholder ? 'https://open.spotify.com/track/placeholder' : spotifyLink}
                title={usePlaceholder ? 'Song title' : spotifyMeta?.title}
                artist={usePlaceholder ? 'Artist name' : spotifyMeta?.artist}
                thumbnail={usePlaceholder ? undefined : spotifyMeta?.thumbnail}
                themeColor={themeColors.primary}
                compact={element.height < 120}
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
        onClick={(e) => {
          e.stopPropagation()

          // Commit the selection that was set up in handleDragStart to React state
          setSelectedIds([...selectedIdsRef.current])
          setPrimarySelectedId(element.id)

          // Only bring to front if it was a click (not a drag)
          if (!didDragRef.current) {
            bringToFront(selectedIdsRef.current)
          }
          didDragRef.current = false
        }}
      >
        {content}

        {/* Selection outline - shown for all selected elements */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
        )}

        {/* Controls - only shown on primary selected element */}
        {isPrimary && (
          <>
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
                  onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => e.stopPropagation()}
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
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl">
          {/* Browser chrome */}
          <div className="bg-gray-900 px-4 py-2 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <div className="max-w-[800px] mx-auto text-center text-xs text-gray-500 bg-gray-800 rounded-full px-4 py-1">
              {recipientName ? `${recipientName.toLowerCase().replace(/\s+/g, '-')}.askcuter.xyz` : 'preview'}
            </div>
            <div className="w-[52px]" /> {/* Spacer to balance the dots */}
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
            onClick={() => { setSelectedIds([]); setPrimarySelectedId(null) }}
          >
            {elements.map(renderElement)}
          </div>
        </div>

        {/* Info */}
        {selectedIds.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {(() => {
              if (selectedIds.length > 1) {
                return `${selectedIds.length} items selected`
              }
              const el = elements.find(e => e.id === selectedIds[0])
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
          onClick={() => { setSelectedIds([]); setPrimarySelectedId(null) }}
        >
          {elements.map(renderElement)}
        </div>
      </div>

      {/* Info */}
      {selectedIds.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {(() => {
            if (selectedIds.length > 1) {
              return `${selectedIds.length} items selected`
            }
            const el = elements.find(e => e.id === selectedIds[0])
            if (!el) return null
            return `X: ${Math.round(el.x)} Y: ${Math.round(el.y)} R: ${Math.round(el.rotation)}°`
          })()}
        </div>
      )}
    </div>
  )
}
