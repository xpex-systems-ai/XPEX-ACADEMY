import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = process.cwd()
const firebaseDir = path.join(root, 'lib/firebase')

const typesSrc = fs.readFileSync(path.join(firebaseDir, 'types.ts'), 'utf8')
const configSrc = fs.readFileSync(path.join(firebaseDir, 'config.ts'), 'utf8')
const clientSrc = fs.readFileSync(path.join(firebaseDir, 'client.ts'), 'utf8')
const analyticsSrc = fs.readFileSync(path.join(firebaseDir, 'analytics.ts'), 'utf8')
const appCheckSrc = fs.readFileSync(path.join(firebaseDir, 'app-check.ts'), 'utf8')
const remoteConfigSrc = fs.readFileSync(path.join(firebaseDir, 'remote-config.ts'), 'utf8')
const featureFlagsSrc = fs.readFileSync(path.join(firebaseDir, 'feature-flags.ts'), 'utf8')
const performanceSrc = fs.readFileSync(path.join(firebaseDir, 'performance.ts'), 'utf8')
const messagingSrc = fs.readFileSync(path.join(firebaseDir, 'messaging.ts'), 'utf8')
const aiLogicSrc = fs.readFileSync(path.join(firebaseDir, 'ai-logic.ts'), 'utf8')
const eventsSrc = fs.readFileSync(path.join(firebaseDir, 'events.ts'), 'utf8')
const indexSrc = fs.readFileSync(path.join(firebaseDir, 'index.ts'), 'utf8')
const shellSrc = fs.readFileSync(path.join(root, 'components/Xpex/XpexAuthenticatedShell.tsx'), 'utf8')

test('Firebase Fabric: Public facade exports all required contracts and functions', () => {
  assert.match(indexSrc, /getFirebaseFabricStatus/)
  assert.match(indexSrc, /initFirebaseFabric/)
  assert.match(indexSrc, /logFirebaseEvent/)
  assert.match(indexSrc, /getFeatureFlag/)
  assert.match(indexSrc, /isFeatureEnabled/)
  assert.match(indexSrc, /getAllFeatureFlags/)
  assert.match(indexSrc, /checkMessagingCapability/)
  assert.match(indexSrc, /getAILogicStatus/)
  assert.match(indexSrc, /setTelemetryTenantContext/)
  assert.match(indexSrc, /trackStudentShellLoaded/)
  assert.match(indexSrc, /trackXaraOpened/)
  assert.match(indexSrc, /trackCourseOpened/)
})

test('Firebase Fabric: SSR safety and browser-only isolation', () => {
  // client.ts must guard every client invocation with isBrowser()
  assert.match(clientSrc, /export function isBrowser\(\): boolean/)
  assert.match(clientSrc, /if \(!isBrowser\(\)\)/)
  // analytics.ts must guard initialization
  assert.match(analyticsSrc, /if \(!isBrowser\(\)\)/)
  // appCheckSrc must guard initialization
  assert.match(appCheckSrc, /if \(!isBrowser\(\)\)/)
  // remoteConfigSrc must guard initialization
  assert.match(remoteConfigSrc, /if \(!isBrowser\(\)\)/)
  // messagingSrc must guard capability probe
  assert.match(messagingSrc, /if \(!isBrowser\(\)\)/)
})

test('Firebase Fabric: Zero secret / service account key exposure in client source code', () => {
  const allFabricSources = [
    typesSrc,
    configSrc,
    clientSrc,
    analyticsSrc,
    appCheckSrc,
    remoteConfigSrc,
    featureFlagsSrc,
    performanceSrc,
    messagingSrc,
    aiLogicSrc,
    eventsSrc,
    indexSrc,
  ].join('\n')

  // Explicitly disallow any private service account or secret keys in client-side code
  assert.doesNotMatch(allFabricSources, /private_key/i, 'No private_key in fabric client code')
  assert.doesNotMatch(allFabricSources, /service_account/i, 'No service_account in fabric client code')
  assert.doesNotMatch(allFabricSources, /client_secret/i, 'No client_secret in fabric client code')
  assert.doesNotMatch(allFabricSources, /BEGIN PRIVATE KEY/, 'No PEM keys in fabric client code')
  assert.doesNotMatch(allFabricSources, /FIREBASE_ADMIN/, 'No Firebase Admin credentials in client code')
})

test('Firebase Fabric: Analytics sanitizes PII and enforces clean telemetry hygiene', () => {
  assert.match(analyticsSrc, /sanitizeAnalyticsParams/)
  assert.match(analyticsSrc, /sanitizeTelemetryParams/)
  assert.match(analyticsSrc, /FORBIDDEN_PII_KEYS/)
  assert.match(analyticsSrc, /email/)
  assert.match(analyticsSrc, /password/)
  assert.match(analyticsSrc, /token/)
  assert.match(analyticsSrc, /logFirebaseEvent/)
  // Ensures events module logs telemetry with safe tenant context
  assert.match(eventsSrc, /setTelemetryTenantContext/)
  assert.match(eventsSrc, /trackStudentShellLoaded/)
})

test('Firebase Fabric: App Check enforces staged rollout with default observe mode', () => {
  assert.match(appCheckSrc, /initAppCheck/)
  assert.match(appCheckSrc, /observe/)
  assert.match(configSrc, /getAppCheckMode/)
  // Must support auto refresh and observe mode without blocking enforcement
  assert.match(appCheckSrc, /isTokenAutoRefreshEnabled:\s*true/)
})

test('Firebase Fabric: Remote Config enforces code-authoritative safe defaults', () => {
  assert.match(typesSrc, /XPEX_FEATURE_FLAG_DEFAULTS/)
  assert.match(typesSrc, /ff_gxeon_command_center_enabled:\s*true/)
  assert.match(typesSrc, /ff_xara_copilot_enabled:\s*true/)
  assert.match(typesSrc, /ff_app_check_enforcement:\s*false/)
  assert.match(typesSrc, /ff_push_notifications_enabled:\s*false/)
  assert.match(typesSrc, /ff_ai_logic_enabled:\s*false/)

  // Remote config must load defaults
  assert.match(remoteConfigSrc, /rc\.defaultConfig = \{ \.\.\.XPEX_FEATURE_FLAG_DEFAULTS \}/)
  assert.match(featureFlagsSrc, /getFeatureFlag/)
  assert.match(featureFlagsSrc, /isFeatureEnabled/)
  assert.match(featureFlagsSrc, /getAllFeatureFlags/)
})

test('Firebase Fabric: Messaging capability probe has ZERO auto-prompt on page load', () => {
  assert.match(messagingSrc, /checkMessagingCapability/)
  // Must check Notification.permission passively without calling requestPermission automatically
  assert.match(messagingSrc, /!isBrowser\(\)/)
  assert.match(messagingSrc, /Notification\.permission/)
  assert.doesNotMatch(messagingSrc, /Notification\.requestPermission\(\)\s*;?\s*\}\s*initMessaging/)
})

test('Firebase Fabric: AI Logic maintains GXEON backend gateway as canonical', () => {
  assert.match(aiLogicSrc, /getAILogicStatus/)
  assert.match(aiLogicSrc, /canonicalGateway:\s*'\/xpex\/ai-gateway'/)
  assert.match(aiLogicSrc, /directClientGemini:\s*false/)
})

test('Firebase Fabric: Student Shell integrates telemetry without blocking user experience', () => {
  // Shell must dynamically import firebase lib inside an effect
  assert.match(shellSrc, /import\('@\/lib\/firebase'\)/)
  assert.match(shellSrc, /initFirebaseFabric/)
  assert.match(shellSrc, /setTelemetryTenantContext/)
  assert.match(shellSrc, /trackStudentShellLoaded/)
  // Preserves existing canonical architecture and links
  assert.match(shellSrc, /href:\s*'\/xpex\/gxeon'/)
  assert.match(shellSrc, /href:\s*'\/xpex\/ai-lab'/)
})
