'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxPhotos - photos.length
    const filesToUpload = Array.from(files)
      .slice(0, remainingSlots)
      .filter((f) => f.type.startsWith('image/'))

    if (filesToUpload.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (const file of filesToUpload) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('valentineId', 'temp')

        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          console.error('Failed to upload photo:', await res.text())
          continue
        }

        const data = await res.json()
        if (data.url) {
          uploadedUrls.push(data.url)
        }
      } catch (err) {
        console.error('Error uploading photo:', err)
      }
    }

    if (uploadedUrls.length > 0) {
      onPhotosChange([...photos, ...uploadedUrls])
    }
    setUploading(false)
  }, [photos, onPhotosChange, maxPhotos])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files)
  }, [handleFileChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const removePhoto = useCallback((index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }, [photos, onPhotosChange])

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Photos</label>

      <div className="flex flex-wrap gap-3">
        {/* Upload area */}
        {photos.length < maxPhotos && (
          <label
            className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFileChange(e.target.files)
                e.target.value = '' // Reset input to allow selecting more files
              }}
            />
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </label>
        )}

        {/* Photo thumbnails */}
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative w-24 h-24 group"
          >
            <Image
              src={photo}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {photos.length}/{maxPhotos} photos
      </p>
    </div>
  )
}
