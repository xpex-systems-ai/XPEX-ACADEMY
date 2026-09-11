import type { PoloBranding } from './polo-branding'

/**
 * Repository-backed visual defaults for polos whose runtime OrganizationConfig
 * has not yet been populated. Runtime/persisted branding always wins.
 *
 * Keep this file declarative: no role, auth, enrollment or KPI logic belongs here.
 */
export const poloBrandingPresets: Record<string, Partial<PoloBranding>> = {
  'kelle-digital-lab': {
    organization_name: 'KELLE DIGITAL LAB',
    primary_color: '#FF7A00',
    accent_color: '#00D4FF',
    background: '#07111F',
    location: 'Campos Lindos/Marajó-GO',
    coordinator_name: 'Professora Kelle',
    tagline: 'Educação que inspira, tecnologia que transforma!',
    footer_credit: 'Tecnologia educacional XpeX Academy',
  },
}

export function applyPoloBrandingPreset(slug: string, branding: PoloBranding): PoloBranding {
  const preset = poloBrandingPresets[slug]
  if (!preset) return branding

  return {
    ...preset,
    ...Object.fromEntries(Object.entries(branding).filter(([, value]) => value !== undefined)),
    organization_name: branding.organization_name,
  }
}
