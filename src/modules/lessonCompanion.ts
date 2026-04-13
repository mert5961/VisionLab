export type RelatedLessonTiming = 'before' | 'during' | 'after'

export type RelatedLessonResourceKind =
  | 'video'
  | 'notes'
  | 'slides'
  | 'article'
  | 'course-page'

export interface RelatedLesson {
  courseName: string
  lessonTitle: string
  relevance: string
  url: string
  timing?: RelatedLessonTiming
  resourceKind?: RelatedLessonResourceKind
  timestampSeconds?: number
  buttonLabel?: string
}

export function buildRelatedLessonHref(lesson: RelatedLesson) {
  const url = new URL(lesson.url)

  if (!lesson.timestampSeconds || !isYouTubeUrl(url)) {
    return url.toString()
  }

  url.searchParams.set('t', `${Math.max(0, Math.floor(lesson.timestampSeconds))}s`)
  return url.toString()
}

export function formatLessonTimestamp(timestampSeconds: number) {
  const totalSeconds = Math.max(0, Math.floor(timestampSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function resolveLessonTimingLabel(lesson: RelatedLesson) {
  if (!lesson.timing) {
    return null
  }

  const verb = lesson.resourceKind === 'video' ? 'Watch' : 'Review'
  return `${verb} ${lesson.timing} this mission`
}

function isYouTubeUrl(url: URL) {
  return url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')
}
