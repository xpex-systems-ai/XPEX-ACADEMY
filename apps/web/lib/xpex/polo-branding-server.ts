import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { resolvePoloBranding } from './polo-branding'
import { applyPoloBrandingPreset } from './polo-branding-presets'

export async function getPoloBranding(token: string, slug: string, name?: string) {
  try {
    const organization = await getOrganizationContextInfo(slug, { revalidate: 0 }, token)
    return applyPoloBrandingPreset(slug, resolvePoloBranding(organization, slug, name))
  } catch {
    return applyPoloBrandingPreset(slug, resolvePoloBranding(null, slug, name))
  }
}
