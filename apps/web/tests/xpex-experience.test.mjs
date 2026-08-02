import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XpeX presentation routes', () => {
  test.each(['aluno', 'professora', 'polo'])('provides /beta/%s', role => {
    const page = read(`app/beta/${role}/page.tsx`)
    expect(page).toContain(`role="${role}"`)
  })

  test('links the landing to every beta experience', () => {
    const landing = read('components/Landings/XpexAcademy/XpexAcademyLanding.tsx')
    for (const route of ['/beta/aluno', '/beta/professora', '/beta/polo']) expect(landing).toContain(route)
  })

  test('keeps demo dashboards isolated from APIs and transparent', () => {
    const dashboard = read('components/Beta/BetaShell.tsx')
    expect(dashboard).not.toContain('fetch(')
    expect(dashboard).not.toContain('getAPIUrl')
    expect(dashboard).toContain('Dados fictícios')
    expect(dashboard + read('components/Xpex/XpexAppShell.tsx')).toContain('não persistem')
  })

  test('every in-page navigation target is rendered by its role experience', () => {
    const navigation = read('components/Xpex/xpex-navigation.ts')
    const dashboard = read('components/Beta/BetaShell.tsx')
    const roles = [
      { role: 'aluno', nextRole: 'professora', component: 'Student', nextComponent: 'Teacher' },
      { role: 'professora', nextRole: 'polo', component: 'Teacher', nextComponent: 'Pole' },
      { role: 'polo', component: 'Pole' },
    ]

    for (const { role, nextRole, component, nextComponent } of roles) {
      const navStart = navigation.indexOf(`  ${role}: [`)
      const navEnd = nextRole ? navigation.indexOf(`  ${nextRole}: [`) : navigation.indexOf('\n}')
      const roleNavigation = navigation.slice(navStart, navEnd)
      const targets = [...roleNavigation.matchAll(/href: '(#[^']+)'/g)].map(match => match[1])
      if (roleNavigation.includes('...common')) targets.push('#visao-geral')

      const componentStart = dashboard.indexOf(`function ${component}()`)
      const componentEnd = nextComponent ? dashboard.indexOf(`function ${nextComponent}()`) : dashboard.indexOf('\nexport type BetaRole')
      const roleExperience = dashboard.slice(componentStart, componentEnd)
      const sharedHeader = dashboard.slice(dashboard.indexOf('function Header('), componentStart)

      for (const target of new Set(targets)) {
        expect(roleExperience + sharedHeader).toContain(`id="${target.slice(1)}"`)
      }
    }
  })
})
