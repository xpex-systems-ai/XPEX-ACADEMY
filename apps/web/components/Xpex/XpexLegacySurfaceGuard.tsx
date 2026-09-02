'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Keeps the XPeX fork visually coherent by preventing authenticated users from
 * falling back into LearnHouse's legacy list/hub surfaces. LearnHouse remains
 * the learning/data engine; deep operational routes (course player/editor,
 * boards, admin children, auth and embeds) are intentionally untouched.
 */
const LEGACY_XPEX_SURFACES = new Set([
  '/home',
  '/courses',
  '/library',
  '/podcasts',
  '/communities',
  '/playgrounds',
  '/users',
  '/organization',
  '/analysis',
])

export default function XpexLegacySurfaceGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!LEGACY_XPEX_SURFACES.has(pathname)) return
    router.replace('/xpex')
  }, [pathname, router])

  return null
}
