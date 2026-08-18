/** Routes owned by the public XpeX beta preview, outside every organization. */
export function isPublicBetaPath(pathname: string): boolean {
  return pathname === '/beta' || pathname.startsWith('/beta/')
}

/** Preserve the existing tenant catch-all path construction in one testable helper. */
export function tenantScopedPath(slug: string, pathname: string): string {
  return `/orgs/${slug}${pathname}`
}

/** Accept only same-origin absolute paths for the post-auth bridge. */
export function safeAuthReturnPath(target: string | null): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return '/xpex'
  try {
    const decoded = decodeURIComponent(target)
    const containsControlCharacter = Array.from(decoded).some((character) => character.charCodeAt(0) <= 0x1f)
    if (decoded.startsWith('//') || decoded.includes('\\') || containsControlCharacter) return '/xpex'
    return target
  } catch {
    return '/xpex'
  }
}
