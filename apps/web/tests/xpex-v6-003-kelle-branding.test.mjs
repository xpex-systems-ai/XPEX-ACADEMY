import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const shellSource = read('components/Xpex/XpexAuthenticatedShell.tsx')
const experienceSource = read('components/Xpex/AuthenticatedXpexExperience.tsx')
const heroSource = read('components/Xpex/experiences/PoloIdentityHero.tsx')
const poloSectionSource = read('components/Xpex/experiences/XpexPoloSection.tsx')
const navigationSource = read('components/Xpex/xpex-navigation.ts')
const poloPolicySource = read('lib/xpex/polo-policy.ts')
const poloDynamicRouteSource = read('app/xpex/polo/[section]/page.tsx')
const poloStudentsSource = read('app/xpex/polo/alunos/page.tsx')
const brandingSource = read('lib/xpex/polo-branding.ts')
const presetSource = read('lib/xpex/polo-branding-presets.ts')
const studentSource = read('lib/xpex/student.ts')
const coursesSource = read('app/xpex/courses/page.tsx')
const courseSource = read('app/xpex/courses/[courseId]/page.tsx')
const playerPageSource = read('app/xpex/courses/[courseId]/learn/[activityId]/page.tsx')
const playerSource = read('app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx')
const completionSource = read('app/xpex/courses/[courseId]/learn/[activityId]/actions.ts')
const activitiesSource = read('app/xpex/activities/page.tsx')
const certificatesSource = read('app/xpex/certificates/page.tsx')
const trailsSource = read('app/xpex/trails/page.tsx')
const aiLabSource = read('app/xpex/ai-lab/page.tsx')
const aiLabProjectsSource = read('app/xpex/ai-lab/projects/page.tsx')
const communitySource = read('app/xpex/community/page.tsx')
const notificationsSource = read('app/xpex/notifications/page.tsx')
const searchSource = read('app/xpex/search/page.tsx')
const teacherBackendSource = read('..', 'api', 'src', 'services', 'xpex', 'teacher_dashboard.py')
const launchBackendSource = read('..', 'api', 'src', 'services', 'xpex', 'launch_ops.py')
const certificationBackendSource = read('..', 'api', 'src', 'services', 'courses', 'certifications.py')

const nativeRouteDirectories = [
  'app/orgs/[orgslug]/dash/courses',
  'app/orgs/[orgslug]/dash/library',
  'app/orgs/[orgslug]/dash/analytics',
  'app/orgs/[orgslug]/dash/users/settings/[subpage]',
  'app/orgs/[orgslug]/dash/org/settings/[subpage]',
]

describe('XPEX V6-003 persisted Polo identity', () => {
  test('keeps Kelle identity out of runtime source-code conditionals', () => {
    expect(`${shellSource}\n${heroSource}\n${brandingSource}`.toLowerCase()).not.toContain('kelle digital lab')
    expect(`${shellSource}\n${heroSource}\n${brandingSource}`.toLowerCase()).not.toContain('professora kelle')
  })

  test('renders approved hero and teacher identity only from branding', () => {
    expect(heroSource).toContain('branding.hero_image')
    expect(heroSource).toContain('branding.teacher_photo')
    expect(heroSource).toContain('branding.coordinator_name')
    expect(heroSource).toContain('branding.location')
    expect(heroSource).toContain('branding.tagline')
    expect(heroSource).not.toContain('Coordenação:')
  })

  test('registers the approved Kelle hero asset in the declarative preset', () => {
    expect(presetSource).toContain("hero_image: '/xpex/polos/kelle-digital-lab/hero-kelle.png'")
    expect(presetSource).toContain("coordinator_name: 'Professora Kelle'")
    expect(presetSource).toContain("location: 'Campos Lindos/Marajó-GO'")
  })

  test('maps organization orange/cyan palette to canonical shell tokens', () => {
    expect(shellSource).toContain('--xpex-color-brand-secondary')
    expect(shellSource).toContain('--xpex-color-brand-accent')
    expect(shellSource).toContain('--xpex-orange')
    expect(shellSource).toContain('--xpex-cyan')
    expect(shellSource).toContain('--xpex-color-background-base')
  })

  test('inherits organization branding in both Polo and student experiences', () => {
    expect(experienceSource).toContain("role === 'polo' || role === 'aluno'")
    expect(experienceSource).toContain('poloBranding?.organization_name ?? organizationName')
    expect(shellSource).toContain("role === 'polo' || role === 'aluno'")
    expect(shellSource).toContain('brandedOrganization')
    expect(studentSource).toContain('getPoloBranding')
    expect(studentSource).toContain('branding: Awaited<ReturnType<typeof getPoloBranding>>')
  })

  test('keeps Polo branding through every student sidebar and utility destination', () => {
    for (const source of [
      coursesSource,
      courseSource,
      playerPageSource,
      activitiesSource,
      certificatesSource,
      trailsSource,
      aiLabSource,
      aiLabProjectsSource,
      communitySource,
      notificationsSource,
      searchSource,
    ]) {
      expect(source).toContain('poloBranding={learning.branding}')
    }
  })

  test('preserves Super Admin branding path', () => {
    expect(shellSource).toContain("adminNavigation ? '/xpex/admin' : `/xpex/${role}`")
    expect(shellSource).toContain('adminNavigation={adminNavigation}')
    expect(shellSource).toContain('!adminNavigation')
  })
})

describe('XPEX V6-003 Polo sidebar sandbox gate', () => {
  test('keeps every active sidebar destination behind server-side Polo policy', () => {
    for (const label of ['Visão Geral', 'Alunos', 'Turmas', 'Cursos', 'Conteúdos', 'Relatórios', 'Configurações']) {
      expect(navigationSource).toContain(`label: '${label}'`)
    }
    expect(shellSource).toContain("'Visão Geral': '/xpex/polo'")
    expect(shellSource).toContain("'Alunos': '/xpex/polo/alunos'")
    expect(shellSource).toContain("'Turmas': '/xpex/polo/turmas'")
    expect(shellSource).toContain("'Cursos': '/xpex/polo/cursos'")
    expect(shellSource).toContain("'Conteúdos': '/xpex/polo/conteudos'")
    expect(shellSource).toContain("'Relatórios': '/xpex/polo/relatorios'")
    expect(shellSource).toContain("'Configurações': '/xpex/polo/configuracoes'")
    expect(shellSource).toContain('canNavigatePolo(poloAccess, destinations[label])')
    expect(poloPolicySource).toContain("href === '/xpex/polo/alunos'")
    expect(poloPolicySource).toContain("poloSectionPolicy[section as keyof typeof poloSectionPolicy].status === 'NATIVE_BRIDGE'")
  })

  test('rejects unknown Polo sections and authorizes known section routes on the server', () => {
    expect(poloDynamicRouteSource).toContain('xpexPoloSections.includes')
    expect(poloDynamicRouteSource).toContain('AuthenticatedXpexExperience')
    expect(experienceSource).toContain('canAccessPoloSection(poloAccess, poloSection)')
  })

  test('keeps coming-soon modules out of clickable manager navigation', () => {
    for (const section of ['trilhas', 'mentorias', 'eventos', 'certificados', 'recursos']) {
      expect(poloPolicySource).toContain(`${section}: { status: 'COMING_SOON'`)
    }
  })

  test('native bridge destinations exist in the checked-out LearnHouse tree', () => {
    for (const routeDirectory of nativeRouteDirectories) {
      expect(existsSync(join(WEB_ROOT, routeDirectory))).toBe(true)
    }
    expect(poloSectionSource).toContain("native: '/dash/users/settings/usergroups'")
    expect(poloSectionSource).toContain("native: '/dash/courses'")
    expect(poloSectionSource).toContain("native: '/dash/library'")
    expect(poloSectionSource).toContain("native: '/dash/analytics'")
    expect(poloSectionSource).toContain("native: '/dash/org/settings/general'")
  })

  test('Alunos stays in the branded shell and requires live manager authorization', () => {
    expect(poloStudentsSource).toContain('authorizePoloManager')
    expect(poloStudentsSource).toContain('resolveXpexPoloAccess')
    expect(poloStudentsSource).toContain('getPoloBranding')
    expect(poloStudentsSource).toContain('<XpexAuthenticatedShell')
    expect(poloStudentsSource).toContain('poloBranding={poloBranding}')
    expect(poloStudentsSource).toContain('Nenhuma senha é criada ou alterada por este painel.')
  })
})

describe('XPEX V6-003 student sidebar route integrity', () => {
  test('student navigation exposes only real XPeX destinations', () => {
    for (const href of ['/xpex/aluno', '/xpex/courses', '/xpex/trails', '/xpex/activities', '/xpex/ai-lab', '/xpex/community', '/xpex/certificates']) {
      expect(shellSource).toContain(`href: '${href}'`)
    }
  })

  test('student-only topbar tools do not create dead staff routes', () => {
    expect(shellSource).toContain("const studentTools = role === 'aluno' && !adminNavigation")
    expect(shellSource).toContain("getUriWithOrg(organizationSlug, '/account/profile')")
    expect(shellSource).toContain("href=\"/xpex/notifications\"")
    expect(shellSource).toContain("href=\"/xpex/ai-lab\"")
  })

  test('AI Lab scopes native Boards and Library links to the current organization', () => {
    expect(aiLabSource).toContain("if (href === '/boards' || href === '/library')")
    expect(aiLabSource).toContain('`/orgs/${organizationSlug}${href}`')
  })

  test('community cards route through the current organization boundary', () => {
    expect(communitySource).toContain('`/orgs/${learning.organization.slug}/community/${communityRouteId(community.community_uuid)}`')
  })
})

describe('XPEX V6-003 real professor and enrollment backend gate', () => {
  test('teacher dashboard requires real instructor membership and active authorship', () => {
    expect(teacherBackendSource).toContain('TEACHER_ROLE_UUID = "role_global_instructor"')
    expect(teacherBackendSource).toContain('UserOrganization.user_id == user.id')
    expect(teacherBackendSource).toContain('Role.role_uuid == TEACHER_ROLE_UUID')
    expect(teacherBackendSource).toContain('ResourceAuthor.user_id == user.id')
    expect(teacherBackendSource).toContain('ResourceAuthorshipStatusEnum.ACTIVE')
  })

  test('invite and enrollment stay organization-admin scoped', () => {
    expect(launchBackendSource).toContain('is_org_admin')
    expect(launchBackendSource).toContain('Organization.slug == organization_slug')
    expect(launchBackendSource).toContain('Organization administrator access required')
    expect(launchBackendSource).toContain('Course.org_id == organization.id')
    expect(launchBackendSource).toContain('Course.published == True')
    expect(launchBackendSource).toContain('Student must accept the organization invitation before enrollment.')
  })
})

describe('XPEX V6-003 student/player persistence gate', () => {
  test('student access is organization-scoped and enrollment-backed', () => {
    expect(studentSource).toContain("resolveXpexOrganization(session.roles, 'aluno')")
    expect(studentSource).toContain("resolveXpexAccess(session.roles, organization.slug).includes('aluno')")
    expect(studentSource).toContain('getXpexLearningDashboard')
  })

  test('course and player deny content outside the authorized learning snapshot', () => {
    expect(courseSource).toContain('if (!learning || !course) return <XpexStudentDenied />')
    expect(playerPageSource).toContain('if (!learning || !course || index < 0) return <XpexStudentDenied />')
    expect(playerPageSource).toContain('activity.published !== true')
    expect(playerPageSource).toContain('activity.is_locked === true')
  })

  test('player uses real renderers and never fabricates completion for assignments', () => {
    for (const activityType of ['TYPE_VIDEO', 'TYPE_DOCUMENT', 'TYPE_DYNAMIC', 'TYPE_ASSIGNMENT']) {
      expect(playerSource).toContain(activityType)
    }
    expect(playerSource).toContain('completeXpexActivity')
    expect(playerSource).toContain("activity.activity_type !== 'TYPE_ASSIGNMENT'")
  })

  test('completion is persisted and re-read from backend before UI success', () => {
    expect(completionSource).toContain('markActivityAsComplete')
    expect(completionSource).toContain('persistedLearning')
    expect(completionSource).toContain('persistedCourse.activities.some')
    expect(completionSource).toContain("throw new Error('A conclusão não foi confirmada pelo backend')")
  })

  test('certificate screen remains tied to authorized enrolled courses', () => {
    expect(certificatesSource).toContain('getXpexStudentCertificates')
    expect(certificatesSource).toContain('new Set(learning.data.courses.map((course) => course.course_id))')
  })

  test('automatic certificate creation remains real-data and certification-template gated', () => {
    expect(certificationBackendSource).toContain('check_course_completion_and_create_certificate')
    expect(certificationBackendSource).toContain('all_activities_complete')
    expect(certificationBackendSource).toContain('CourseCertification.course_id == course_id')
    expect(certificationBackendSource).toContain('if not certification:')
    expect(certificationBackendSource).toContain('return None')
  })
})
