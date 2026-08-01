/** Routes owned by the public XpeX beta preview, outside every organization. */
export function isPublicBetaPath(pathname: string): boolean {
  return pathname === '/beta' || pathname.startsWith('/beta/')
}

/** Preserve the existing tenant catch-all path construction in one testable helper. */
export function tenantScopedPath(slug: string, pathname: string): string {
  return `/orgs/${slug}${pathname}`
}
