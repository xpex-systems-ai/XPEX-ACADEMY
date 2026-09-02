'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Keeps the XPeX fork visually coherent by preventing authenticated users from
 * falling back into LearnHouse's legacy list/hub surfaces. LearnHouse remains
 * the learning/data engine; deep operational routes (course player/editor,
 * boards, admin children, auth, embeds and configuration subpages) are
 * intentionally untouched.
 *
 * IMPORTANT: keep this allowlist exact. Do not redirect whole /dash/* trees:
 * nested LearnHouse routes still host operational editors/settings that XPeX
 * has not replaced yet.
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
  '/dash/courses',
  '/dash/library',
  '/dash/podcasts',
  '/dash/communities',
  '/dash/playgrounds',
  '/dash/boards',
  '/dash/assignments',
  '/dash/analytics',
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
