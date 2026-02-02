'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'

const MAX_DIMENSION = 1600
const CLIENT_QUALITY = 0.8
const MAX_UPLOAD_SIZE = 4 * 1024 * 1024 // 4MB target to stay under Vercel's 4.5MB limit

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas compression failed'))
        },
        'image/jpeg',
        CLIENT_QUALITY
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxPhotos - photos.length
    const filesToUpload = Array.from(files)
      .slice(0, remainingSlots)
      .filter((f) => f.type.startsWith('image/'))

    if (filesToUpload.length === 0) return

    setUploading(true)
    setUploadError(null)
    const uploadedUrls: string[] = []
    let failCount = 0

    for (const file of filesToUpload) {
      try {
        let uploadBlob: Blob = file
        if (file.size > MAX_UPLOAD_SIZE) {
          uploadBlob = await compressImage(file)
        }

        const formData = new FormData()
        formData.append('file', uploadBlob, file.name)
        formData.append('valentineId', 'temp')

        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          failCount++
          const errData = await res.json().catch(() => null)
          console.error('Failed to upload photo:', errData?.error || res.statusText)
          continue
        }

        const data = await res.json()
        if (data.url) {
          uploadedUrls.push(data.url)
        }
      } catch (err) {
        failCount++
        console.error('Error uploading photo:', err)
      }
    }

    if (failCount > 0) {
      setUploadError(
        failCount === filesToUpload.length
          ? 'Upload failed. Please try again.'
          : `${failCount} photo${failCount > 1 ? 's' : ''} failed to upload.`
      )
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

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      <p className="text-xs text-gray-500">
        {photos.length}/{maxPhotos} photos
      </p>
    </div>
  )
}
