export type PoloBranding = {
  organization_name: string
  logo?: string
  teacher_photo?: string
  primary_color?: string
  accent_color?: string
  background?: string
  hero_image?: string
  location?: string
  coordinator_name?: string
  tagline?: string
  footer_credit?: string
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined
const color = (value: unknown) => {
  const candidate = text(value)
  return candidate && /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(candidate) ? candidate : undefined
}
export const safePoloImage = (value: unknown): string | undefined => {
  const candidate = text(value)
  if (!candidate || /[\s\\]/.test(candidate) || [...candidate].some(char => char.charCodeAt(0) < 32)) return undefined
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' && !url.username && !url.password ? candidate : undefined
  } catch { return undefined }
}

/** Read existing landing JSON; never infer identity from tenant names. */
export function resolvePoloBranding(source: unknown, organizationSlug: string, fallbackName?: string): PoloBranding {
  const organization = record(source)
  const fallback = { organization_name: text(fallbackName) ?? 'Organização atual' }
  if (!organizationSlug || organization.slug !== organizationSlug) return fallback
  const wrapper = record(organization.config)
  const config = record(wrapper.config ?? wrapper)
  const customization = record(config.customization)
  const v2 = config.config_version === '2.0'
  const branding = record(record(v2 ? customization.landing : config.landing).xpex_polo_branding)
  const general = record(v2 ? customization.general : config.general)
  return {
    organization_name: text(branding.organization_name) ?? text(organization.name) ?? fallback.organization_name,
    logo: safePoloImage(branding.logo),
    teacher_photo: safePoloImage(branding.teacher_photo),
    primary_color: color(branding.primary_color) ?? color(general.color),
    accent_color: color(branding.accent_color),
    background: color(branding.background),
    hero_image: safePoloImage(branding.hero_image),
    location: text(branding.location),
    coordinator_name: text(branding.coordinator_name),
    tagline: text(branding.tagline),
    footer_credit: text(branding.footer_credit) ?? text(general.footer_text),
  }
}
