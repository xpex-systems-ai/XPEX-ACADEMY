import React from 'react'
import YouTube from 'react-youtube'
import { useOrg } from '@components/Contexts/OrgContext'
import LearnHousePlayer from './LearnHousePlayer'
import {
  isActivityHlsReady,
  resolveActivityVideoSource,
  resolveHlsThumbnails,
  resolveActivityCaptions,
} from './videoSource'

interface VideoDetails {
  startTime?: number
  endTime?: number | null
  autoplay?: boolean
  muted?: boolean
}

interface VideoActivityProps {
  activity: {
    activity_sub_type: string
    activity_uuid: string
    content: {
      filename?: string
      uri?: string
    }
    details?: VideoDetails
    extra_metadata?: {
      hls?: {
        status?: string
        thumbnails?: {
          url?: string
          interval?: number
          width?: number
          height?: number
          columns?: number
          rows?: number
        } | null
      }
      captions?: {
        enabled?: boolean
        languages?: { code?: string; label?: string; status?: string }[]
      } | null
    } | null
  }
  course: {
    course_uuid: string
  }
  orgUuid?: string
}

function MissingVideo({ reason }: { reason: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-none bg-[radial-gradient(circle_at_50%_20%,rgba(0,208,255,.16),transparent_34%),linear-gradient(145deg,#020711,#07111d)] sm:rounded-xl">
      <div className="max-w-xl px-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-2xl text-cyan-200">▶</div>
        <h2 className="mt-5 text-xl font-black text-white">Player de vídeo pronto</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{reason}</p>
        <p className="mt-3 text-xs leading-5 text-slate-500">Nenhum vídeo fictício é exibido. Assim que uma fonte hospedada ou URL do YouTube for configurada nesta atividade, o player LearnHouse abre automaticamente aqui.</p>
      </div>
    </div>
  )
}

function VideoActivity({ activity, course, orgUuid }: VideoActivityProps) {
  const org = useOrg() as any
  const resolvedOrgUuid = orgUuid || org?.org_uuid
  const [videoId, setVideoId] = React.useState('')

  React.useEffect(() => {
    if (activity?.content?.uri) {
      var getYouTubeID = require('get-youtube-id')
      setVideoId(getYouTubeID(activity.content.uri) || '')
    } else {
      setVideoId('')
    }
  }, [activity, org])

  const hlsReady = isActivityHlsReady(activity)

  const getVideoSource = () =>
    resolveActivityVideoSource({
      hlsReady,
      orgUuid: resolvedOrgUuid,
      courseUuid: course?.course_uuid,
      activityUuid: activity.activity_uuid,
      filename: activity.content?.filename,
    })

  if (activity.activity_sub_type === 'SUBTYPE_VIDEO_HOSTED') {
    // Native uploaded LearnHouse videos are resolved through the activity content
    // directory. XPeX also supports an explicit hosted URI for immutable MP4s baked
    // into the production image; this keeps those first-course lessons durable
    // without weakening the existing HLS/upload path.
    const explicitHostedSrc = activity.content?.uri?.trim()
    const { src, isHls } = explicitHostedSrc
      ? { src: explicitHostedSrc, isHls: false }
      : getVideoSource()
    if (!src) return <MissingVideo reason="A atividade está marcada como vídeo hospedado, mas ainda não possui arquivo de mídia publicado." />
    const thumbnails = isHls
      ? resolveHlsThumbnails(activity, {
          orgUuid: resolvedOrgUuid,
          courseUuid: course?.course_uuid,
          activityUuid: activity.activity_uuid,
        })
      : null
    const fallbackSrc = isHls
      ? resolveActivityVideoSource({
          hlsReady: false,
          orgUuid: resolvedOrgUuid,
          courseUuid: course?.course_uuid,
          activityUuid: activity.activity_uuid,
          filename: activity.content?.filename,
        }).src
      : undefined
    const captions = explicitHostedSrc
      ? []
      : resolveActivityCaptions(activity, {
          orgUuid: resolvedOrgUuid,
          courseUuid: course?.course_uuid,
          activityUuid: activity.activity_uuid,
        })
    return (
      <div className="w-full max-w-full px-0 sm:px-4">
        <div className="my-0 w-full sm:my-3 md:my-5">
          <div className="relative aspect-video w-full overflow-hidden shadow-none ring-0 sm:rounded-lg sm:ring-1 sm:ring-gray-200/10 sm:dark:ring-gray-700/20">
            <LearnHousePlayer
              key={src}
              src={src}
              isHls={isHls}
              fallbackSrc={fallbackSrc}
              details={activity.details}
              thumbnails={thumbnails}
              captions={captions}
            />
          </div>
        </div>
      </div>
    )
  }

  if (activity.activity_sub_type === 'SUBTYPE_VIDEO_YOUTUBE') {
    if (!videoId) return <MissingVideo reason="A atividade está marcada como vídeo do YouTube, mas o link ainda não foi configurado ou não é válido." />
    return (
      <div className="w-full max-w-full px-0 sm:px-4">
        <div className="my-0 w-full sm:my-3 md:my-5">
          <div className="relative aspect-video w-full overflow-hidden shadow-none ring-0 sm:rounded-lg sm:ring-1 sm:ring-gray-200/10 sm:dark:ring-gray-700/20">
            <YouTube
              className="h-full w-full"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: activity.details?.autoplay ? 1 : 0,
                  mute: activity.details?.muted ? 1 : 0,
                  start: activity.details?.startTime || 0,
                  end: activity.details?.endTime || undefined,
                  controls: 1,
                  modestbranding: 1,
                  rel: 0,
                },
              }}
              videoId={videoId}
              onReady={(event) => {
                if (activity.details?.startTime) event.target.seekTo(activity.details.startTime, true)
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return <MissingVideo reason="Esta atividade é do tipo vídeo, mas o subtipo de mídia ainda não foi configurado." />
}

export default VideoActivity
