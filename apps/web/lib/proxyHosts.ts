/** Normalize configured domains and Host headers before exact comparisons. */
export function normalizeProxyHost(value?: string | null): string {
  if (!value) return ''

  const trimmed = value.trim().toLowerCase()
  const withoutProtocol = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
  const hostWithOptionalPort = withoutProtocol.split('/')[0]?.split('?')[0]?.split('#')[0] ?? ''
  const closingBracket = hostWithOptionalPort.indexOf(']')
  const bracketlessIpv6 = hostWithOptionalPort.startsWith('[') && closingBracket > 0
    ? hostWithOptionalPort.slice(1, closingBracket)
    : hostWithOptionalPort
  const colonCount = (bracketlessIpv6.match(/:/g) ?? []).length
  const host = colonCount === 1 && !hostWithOptionalPort.startsWith('[')
    ? bracketlessIpv6.replace(/:\d+$/, '')
    : bracketlessIpv6

  return host.replace(/\.$/, '')
}

/** Match local loopback hosts after one unambiguous normalization pass. */
export function isProxyLocalhost(value?: string | null): boolean {
  const host = normalizeProxyHost(value)
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

/** Match Vercel-assigned deployment hosts, but not the apex or lookalike domains. */
export function isVercelPreviewHost(value?: string | null): boolean {
  return normalizeProxyHost(value).endsWith('.vercel.app')
}

/** Decide whether the public landing page owns this root request. */
export function isPublicRootRequest(
  pathname: string,
  host: string | null,
  configuredApexHosts: Array<string | null | undefined>,
): boolean {
  if (pathname !== '/') return false

  const currentHost = normalizeProxyHost(host)
  if (!currentHost) return false

  const isConfiguredApex = configuredApexHosts
    .map(normalizeProxyHost)
    .filter(Boolean)
    .some((configuredHost) => configuredHost === currentHost)

  return isProxyLocalhost(host) || isConfiguredApex || isVercelPreviewHost(currentHost)
}
