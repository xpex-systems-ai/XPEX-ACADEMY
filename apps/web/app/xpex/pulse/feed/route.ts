import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { pulseRegistry } from '@services/pulse/sources/registry'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const learning = await getAuthorizedStudentLearning('/xpex/pulse')
  if (!learning) {
    return NextResponse.json({ status: 'forbidden' }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const youtubeEnabled = params.get('youtube') === '1'
  const newsEnabled = params.get('news') !== '0'

  const [videos, news, health] = await Promise.all([
    pulseRegistry.getVideos(youtubeEnabled),
    pulseRegistry.getNews(newsEnabled),
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
