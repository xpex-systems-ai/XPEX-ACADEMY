import { isLocalhost } from '../services/utils/ts/hostUtils'

/** Normalize configured domains and Host headers before exact comparisons. */
export function normalizeProxyHost(value?: string | null): string {
  if (!value) return ''

  const trimmed = value.trim().toLowerCase()
  const withoutProtocol = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
  const hostWithOptionalPort = withoutProtocol.split('/')[0]?.split('?')[0]?.split('#')[0] ?? ''
  const bracketlessIpv6 = hostWithOptionalPort.startsWith('[')
    ? hostWithOptionalPort.slice(1, hostWithOptionalPort.indexOf(']'))
    : hostWithOptionalPort
  const host = bracketlessIpv6.includes(':') && !hostWithOptionalPort.startsWith('[')
    ? bracketlessIpv6.split(':')[0]
    : bracketlessIpv6

  return host.replace(/\.$/, '')
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

  return isLocalhost(currentHost) || isConfiguredApex || isVercelPreviewHost(currentHost)
}
