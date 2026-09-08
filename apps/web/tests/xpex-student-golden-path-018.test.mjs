import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XPeX student production golden path 018 regressions', () => {
  test('AI Lab uses canonical LearnHouse Boards and Library routes', async () => {
    const source = await read('app/xpex/ai-lab/page.tsx')
    expect(source).toContain("href: '/boards'")
    expect(source).toContain("href: '/library'")
    expect(source).not.toContain('/orgs/${learning.organization.slug}')
    expect(source).not.toContain('orgRoute: true')
  })

  test('community strips the native prefix once and checks read rights before offering entry', async () => {
    const source = await read('app/xpex/community/page.tsx')
    expect(source).toContain("replace(/^community_/, '')")
    expect(source).toContain('getCommunityRights')
    expect(source).toContain('rights.permissions?.read')
    expect(source).toContain('canRead ?')
    expect(source).not.toContain('href={`/community/${community.community_uuid}`}')
  })

  test('topbar search has a real submit button and profile has a canonical account link', async () => {
    const source = await read('components/Xpex/XpexAuthenticatedShell.tsx')
    expect(source).toContain('type="submit"')
    expect(source).toContain('xpex-search-submit')
    expect(source).toContain('onSubmit={submitSearch}')
    expect(source).toContain('href="/account/profile"')
  })

  test('authorized search includes course activities and opens them in the XPeX player', async () => {
    const source = await read('app/xpex/search/page.tsx')
    expect(source).toContain('course.activities')
    expect(source).toContain('activity.chapter_name')
    expect(source).toContain('activity.activity_uuid')
    expect(source).toContain('/learn/${activity.activity_uuid.replace')
    expect(source).toContain('Aulas e atividades')
  })
})
