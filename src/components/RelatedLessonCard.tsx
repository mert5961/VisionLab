import {
  buildRelatedLessonHref,
  formatLessonTimestamp,
  resolveLessonTimingLabel,
} from '../modules/lessonCompanion'
import type { RelatedLesson } from '../modules/lessonCompanion'

interface RelatedLessonCardProps {
  lesson: RelatedLesson
}

export function RelatedLessonCard({ lesson }: RelatedLessonCardProps) {
  const timingLabel = resolveLessonTimingLabel(lesson)
  const lessonHref = buildRelatedLessonHref(lesson)
  const resourceKindLabel = lesson.resourceKind ?? 'resource'

  return (
    <section className="lesson-card">
      <div className="lesson-card__header">
        <div>
          <p className="lesson-card__eyebrow">Related Lesson</p>
          <h3 className="lesson-card__title">{lesson.lessonTitle}</h3>
        </div>
        {timingLabel ? <span className="lesson-card__timing">{timingLabel}</span> : null}
      </div>

      <div className="lesson-card__meta">
        <span className="lesson-chip">{lesson.courseName}</span>
        <span className="lesson-chip">{resourceKindLabel}</span>
        {lesson.timestampSeconds ? (
          <span className="lesson-chip">
            starts {formatLessonTimestamp(lesson.timestampSeconds)}
          </span>
        ) : null}
      </div>

      <p className="lesson-card__relevance">{lesson.relevance}</p>

      <a
        className="lesson-card__link"
        href={lessonHref}
        target="_blank"
        rel="noreferrer"
      >
        {lesson.buttonLabel ?? 'Open Lesson'}
      </a>
    </section>
  )
}
