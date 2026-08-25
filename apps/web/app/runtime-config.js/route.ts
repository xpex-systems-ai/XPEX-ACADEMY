import { NextResponse } from 'next/server'

const PUBLIC_RUNTIME_KEYS = [
  'NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL',
  'NEXT_PUBLIC_LEARNHOUSE_API_URL',
  'NEXT_PUBLIC_LEARNHOUSE_DOMAIN',
  'NEXT_PUBLIC_LEARNHOUSE_TOP_DOMAIN',
  'NEXT_PUBLIC_LEARNHOUSE_HTTPS',
  'NEXT_PUBLIC_LEARNHOUSE_PLATFORM_URL',
  'NEXT_PUBLIC_LEARNHOUSE_DEFAULT_ORG',
  'NEXT_PUBLIC_COLLAB_URL',
  'NEXT_PUBLIC_POSTHOG_KEY',
] as const

export const dynamic = 'force-dynamic'

type RuntimeEnvironment = Readonly<Record<string, string | undefined>>

export const getPublicRuntimeConfig = (env: RuntimeEnvironment = process.env) =>
  Object.fromEntries(
    PUBLIC_RUNTIME_KEYS.flatMap((key) => {
      const value = env[key]
      return value ? [[key, value]] : []
    }),
  )

export const buildRuntimeConfigScript = (env: RuntimeEnvironment = process.env) => {
  const serialized = JSON.stringify(getPublicRuntimeConfig(env))
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

  return `window.__RUNTIME_CONFIG__ = Object.assign({}, window.__RUNTIME_CONFIG__ || {}, ${serialized});\n`
}

export async function GET() {
  return new NextResponse(buildRuntimeConfigScript(), {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
