import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { pulseRegistry } from '@services/pulse/sources/registry'

export const dynamic = 'force-dynamic'

/**
 * Server-authoritative Pulse feature flag resolution.
 * Client query params may only REDUCE functionality; they can NEVER elevate disabled server flags.
 */
export function getServerPulseFeatureFlags() {
  const serverLiveSourcesEnabled = process.env.PULSE_LIVE_SOURCES_ENABLED === 'true'
  const serverYouTubeEnabled = process.env.PULSE_YOUTUBE_API_ENABLED === 'true'
  const serverNewsEnabled = process.env.PULSE_NEWS_ENABLED !== 'false'

  return {
    serverLiveSourcesEnabled,
    serverYouTubeEnabled,
    serverNewsEnabled,
  }
}

export async function GET(request: NextRequest) {
  const learning = await getAuthorizedStudentLearning('/xpex/pulse')
  if (!learning) {
    return NextResponse.json({ status: 'forbidden' }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const clientRequestedLive = params.get('live') !== '0'
  const clientRequestedYouTube = params.get('youtube') === '1'
  const clientRequestedNews = params.get('news') !== '0'

  const { serverLiveSourcesEnabled, serverYouTubeEnabled, serverNewsEnabled } = getServerPulseFeatureFlags()

  // Effective gating formula:
  // effectiveLiveSourcesEnabled = serverLiveSourcesEnabled AND clientRequestedLiveSources
  // effectiveYouTubeEnabled = serverLiveSourcesEnabled AND serverYouTubeEnabled AND clientRequestedYouTube
  // effectiveNewsEnabled = serverLiveSourcesEnabled AND serverNewsEnabled AND clientRequestedNews
  const effectiveLiveSources = serverLiveSourcesEnabled && clientRequestedLive
  const effectiveYouTube = effectiveLiveSources && serverYouTubeEnabled && clientRequestedYouTube
  const effectiveNews = effectiveLiveSources && serverNewsEnabled && clientRequestedNews

  const [videos, news, health] = await Promise.all([
    pulseRegistry.getVideos(effectiveYouTube),
    pulseRegistry.getNews(effectiveNews),
    pulseRegistry.getHealthReport(),
  ])

  return NextResponse.json(
    {
      status: 'ok',
      generatedAt: new Date().toISOString(),
      videos,
      news,
      health,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=0, no-store',
      },
    }
  )
}
