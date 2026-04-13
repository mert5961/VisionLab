import { RelatedLessonCard } from './RelatedLessonCard'
import { TargetGlyph } from './TargetGlyph'
import type { RelatedLesson } from '../modules/lessonCompanion'
import type { Point } from '../cv/types'
import type { VisionLabChapter, VisionLabMissionSet } from '../game/catalog'
import type { GameplayQaReport, UiQaReport } from '../qa/types'

interface MissionSidebarProps {
  missionSet: VisionLabMissionSet
  chapterNumber: number
  currentLevelTitle: string
  objective: string
  questLabel: string
  targetCode: string
  targetOutline: Point[]
  confidence: number
  systemState: 'stable' | 'unstable' | 'failed'
  levelProgressLabel: string
  levels: Array<{
    id: string
    number: number
    title: string
    unlocked: boolean
    completed: boolean
    current: boolean
  }>
  chapters: VisionLabChapter[]
  lesson: RelatedLesson | null
  shouldHighlightLesson: boolean
  gameplayQa: GameplayQaReport
  uiQa: UiQaReport
  activeStageLabel: string
  diagnostics: string[]
  onLoadLevel: (levelId: string) => void
}

export function MissionSidebar({
  missionSet,
  chapterNumber,
  currentLevelTitle,
  objective,
  questLabel,
  targetCode,
  targetOutline,
  confidence,
  systemState,
  levelProgressLabel,
  levels,
  chapters,
  lesson,
  shouldHighlightLesson,
  gameplayQa,
  uiQa,
  activeStageLabel,
  diagnostics,
  onLoadLevel,
}: MissionSidebarProps) {
  return (
    <aside className="mission-panel">
      <header className="mission-panel__header">
        <p className="mission-panel__eyebrow">
          Chapter {chapterNumber} / {missionSet.lecture.rangeLabel}
        </p>
        <h2 className="mission-panel__title">{missionSet.title}</h2>
        <p className="mission-panel__summary">{missionSet.summary}</p>
      </header>

      <section className="mission-card mission-card--target">
        <div className="mission-card__glyph">
          <TargetGlyph points={targetOutline} />
        </div>
        <div className="mission-card__body">
          <p className="mission-card__label">Quest</p>
          <h3 className="mission-card__title">{questLabel}</h3>
          <p className="mission-card__meta">
            {targetCode} / {currentLevelTitle}
          </p>
          <p className="mission-card__summary">{objective}</p>
        </div>
      </section>

      <section className="mission-card mission-card--status">
        <div className="mission-stat">
          <span className="mission-stat__label">State</span>
          <span className={`mission-stat__value mission-stat__value--${systemState}`}>
            {systemState}
          </span>
        </div>
        <div className="mission-stat mission-stat--bar">
          <div className="mission-stat__row">
            <span className="mission-stat__label">Confidence</span>
            <span className="mission-stat__value">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="mission-progress" aria-hidden="true">
            <div
              className="mission-progress__fill"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mission-card mission-card--levels">
        <div className="mission-card__section-head">
          <span>Mission Set</span>
          <span>{levelProgressLabel}</span>
        </div>
        <div className="level-list" aria-label="Mission levels">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              className={`level-list__item ${level.current ? 'level-list__item--current' : ''} ${level.completed ? 'level-list__item--completed' : ''}`}
              disabled={!level.unlocked}
              onClick={() => onLoadLevel(level.id)}
            >
              <span className="level-list__number">
                {level.completed && !level.current ? '✓' : level.number}
              </span>
              <span className="level-list__text">{level.title}</span>
            </button>
          ))}
        </div>
      </section>

      {lesson ? (
        <section
          className={`mission-card mission-card--lesson ${shouldHighlightLesson ? 'mission-card--lesson-alert' : ''}`}
        >
          <div className="mission-card__section-head">
            <span>Learning Link</span>
            <span>{shouldHighlightLesson ? 'Relevant now' : 'Optional'}</span>
          </div>
          <RelatedLessonCard lesson={lesson} />
        </section>
      ) : null}

      <details className="mission-card mission-card--tertiary">
        <summary className="mission-card__summary">Diagnostics</summary>
        <div className="mission-diagnostics">
          <span className="mission-diagnostics__chip">{activeStageLabel}</span>
          {diagnostics.slice(0, 3).map((entry) => (
            <p key={entry} className="mission-diagnostics__line">
              {entry}
            </p>
          ))}
        </div>
      </details>

      <details className="mission-card mission-card--tertiary">
        <summary className="mission-card__summary">QA</summary>
        <div className="qa-block">
          <p className="qa-block__summary">{gameplayQa.debugSummary}</p>
          {gameplayQa.checks.map((check) => (
            <p key={check.id} className={`qa-block__line ${check.passed ? 'qa-block__line--pass' : 'qa-block__line--fail'}`}>
              {check.label}: {check.passed ? 'pass' : 'fail'}
            </p>
          ))}
          <p className="qa-block__summary">UI issues: {uiQa.checks.length}</p>
          {uiQa.checks.slice(0, 3).map((check) => (
            <p key={check.id} className="qa-block__line qa-block__line--fail">
              {check.detail}
            </p>
          ))}
        </div>
      </details>

      <section className="mission-card mission-card--chapters">
        <div className="mission-card__section-head">
          <span>Capability Stack</span>
          <span>{missionSet.concept}</span>
        </div>
        <div className="chapter-list">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className={`chapter-list__item chapter-list__item--${chapter.status}`}
            >
              <span className="chapter-list__number">{chapter.number}</span>
              <div className="chapter-list__copy">
                <span className="chapter-list__title">{chapter.title}</span>
                <span className="chapter-list__meta">{chapter.capability}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
