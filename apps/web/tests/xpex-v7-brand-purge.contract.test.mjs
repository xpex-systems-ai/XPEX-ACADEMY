import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const learningLayout = read('app/orgs/[orgslug]/(withmenu)/layout.tsx')
const learningTheme = read('app/orgs/[orgslug]/(withmenu)/xpex-learning-shell.css')
const orgMenu = read('components/Objects/Menus/OrgMenu.tsx')
const watermark = read('components/Objects/Watermark.tsx')
const courseMetadata = read('app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/page.tsx')
const embed = read('app/embed/[orgslug]/course/[courseuuid]/activity/[activityid]/EmbedActivityClient.tsx')
const authDesktop = read('components/Auth/AuthBrandingPanel.tsx')
const authMobile = read('components/Auth/AuthMobileHeader.tsx')
const poloPresets = read('lib/xpex/polo-branding-presets.ts')
const aiLab = read('app/xpex/ai-lab/page.tsx')
const projects = read('app/xpex/ai-lab/projects/page.tsx')
const controlCenter = read('app/xpex/control-center/page.tsx')
const boardToolbar = read('components/Dashboard/Boards/BoardToolbar.tsx')
const boardTopbar = read('components/Dashboard/Boards/BoardTopBar.tsx')

describe('XPEX Academy V7 brand purge', () => {
  test('owns the complete public learning shell without upstream watermarks', () => {
    expect(learningLayout).toContain('xpex-learning-shell')
    expect(learningLayout).toContain('XpeX Academy')
    expect(learningLayout).toContain("import './xpex-learning-shell.css'")
    expect(learningLayout).not.toMatch(/Watermark|lrn\.svg|lrn-text|learnhouse\.app/i)
    expect(learningTheme).toContain('--xpex-orange: #ff7a00')
    expect(learningTheme).toContain('--xpex-cyan: #00d4ff')
    expect(learningTheme).toContain('nav[aria-label="Top navigation"]')
  })

  test('replaces inherited navigation and floating badges with XpeX marks', () => {
    for (const source of [orgMenu, watermark, boardToolbar, boardTopbar]) {
      expect(source).toContain('XpeX Academy')
      expect(source).not.toMatch(/src="\/lrn|lrn-text|learnhouse\.app|docs\.learnhouse|discord\.gg\/learnhouse/i)
    }
    expect(orgMenu).not.toContain('getOrgLogoMediaDirectory')
  })

  test('removes the broken persisted logo request from authentication surfaces', () => {
    for (const source of [authDesktop, authMobile]) {
      expect(source).toContain('organizationName')
      expect(source).not.toContain('getOrgLogoMediaDirectory')
    }
    expect(poloPresets).toContain("logo: '/xpex/polos/kelle-digital-lab/logo.svg'")
  })

  test('brands course metadata, embeds and XpeX operational copy', () => {
    expect(courseMetadata).toContain("org?.name || 'XpeX Academy'")
    expect(courseMetadata).not.toMatch(/LearnHouse|Learnhouse/)
    expect(embed).toContain('XpexBrandBadge')
    expect(embed).not.toMatch(/src="\/(?:lrn|learnhouse)|alt="LearnHouse"/i)
    for (const source of [aiLab, projects]) expect(source).not.toMatch(/LearnHouse|Learnhouse/)
    expect(controlCenter.replaceAll('LearnHouseMembership', '')).not.toMatch(/LearnHouse|Learnhouse/)
  })

  test('keeps license attribution outside the product chrome', () => {
    const legal = read('components/Footers/LegalFooters.tsx')
    expect(legal).toContain('AGPL-3.0')
    expect(legal).toContain('Código-fonte correspondente')
  })
})
