'use client'
import React, { useEffect, useMemo, useState } from 'react'

const SAFE_PROTOCOLS = ['http:', 'https:', 'blob:'] as const

export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (url.startsWith('blob:')) return true

  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.includes(parsed.protocol as typeof SAFE_PROTOCOLS[number])
  } catch {
    return false
  }
}

export function sanitizeMediaUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined
  if (!isValidMediaUrl(url)) return undefined
  if (url.includes('<') || url.includes('>')) return undefined
  return url
}

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined
  fallback?: React.ReactNode
}

/**
 * Validates media URLs and degrades deterministically when the remote object is
 * missing. Enterprise surfaces must never leave a broken-image glyph or an
 * invisible zero-width image in place of product content.
 */
export function SafeImage({ src, alt, fallback = null, onError, ...props }: SafeImageProps) {
  const sanitizedSrc = useMemo(() => sanitizeMediaUrl(src), [src])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [sanitizedSrc])

  if (!sanitizedSrc || failed) {
    return <>{fallback}</>
  }

  return (
    <img
      src={sanitizedSrc}
      alt={alt}
      {...props}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}

interface SafeVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src: string | null | undefined
}

export function SafeVideo({ src, ...props }: SafeVideoProps) {
  const sanitizedSrc = useMemo(() => sanitizeMediaUrl(src), [src])

  if (!sanitizedSrc) {
    return null
  }

  return <video src={sanitizedSrc} {...props} />
}

export default SafeImage
