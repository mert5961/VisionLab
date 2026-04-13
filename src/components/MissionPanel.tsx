import type { DetectionResult } from '../cv/types'
import type { RelatedLesson } from '../modules/lessonCompanion'
import type { FindShapeScene } from '../modules/find-the-shape/types'
import { RelatedLessonCard } from './RelatedLessonCard'
import { TargetGlyph } from './TargetGlyph'

interface MissionPanelProps {
  code: string
  title: string
  subtitle: string
  objective: string
  directives: string[]
  relatedLesson?: RelatedLesson
  scene: FindShapeScene
  analysis: DetectionResult
  isPending: boolean
}

export function MissionPanel({
  code,
  title,
  subtitle,
  objective,
  directives,
  relatedLesson,
  scene,
  analysis,
  isPending,
}: MissionPanelProps) {
  const toneClass =
    analysis.systemState === 'stable'
      ? 'status-pill--ok'
      : analysis.systemState === 'unstable'
        ? 'status-pill--warm'
        : 'status-pill--error'
  const objectiveLines = [objective, ...directives]

  return (
    <aside className="panel mission-panel">
      <header className="panel__header">
        <div>
          <p className="panel__eyebrow">
            {code} / {scene.targetCode}
          </p>
          <h1 className="panel__hero">{title}</h1>
        </div>

        <span className={`status-pill ${toneClass}`}>
          {isPending ? 'Updating' : analysis.systemState}
        </span>
      </header>

      <p className="mission-panel__subtitle">{subtitle}</p>

      <div className="mission-target">
        <TargetGlyph points={scene.targetOutline} />
        <div className="mission-target__copy">
          <span className="mission-target__label">Mission Target</span>
          <strong>{scene.targetLabel}</strong>
          <p>{objective}</p>
        </div>
      </div>

      <section className="mission-section">
        <span className="mission-section__label">Objective</span>
        <ul className="mission-list">
          {objectiveLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mission-section mission-section--status">
        <div className="mission-status-grid">
          <article className="mission-status-card">
            <span className="mission-status-card__label">Current Status</span>
            <strong className="mission-status-card__value">
              {analysis.systemState}
            </strong>
            <p>{analysis.statusText}</p>
          </article>

          <article className="mission-status-card">
            <span className="mission-status-card__label">Confidence</span>
            <strong className="mission-status-card__value">
              {Math.round(analysis.confidence * 100)}%
            </strong>
            <div className="confidence-meter">
              <span style={{ width: `${Math.max(4, analysis.confidence * 100)}%` }} />
            </div>
          </article>
        </div>
      </section>

      <section className="mission-section mission-debug">
        <div className="mission-debug__block">
          <span className="mission-section__label">Why It Fails</span>
          <p>{analysis.primaryIssue}</p>
        </div>

        <div className="mission-debug__block">
          <span className="mission-section__label">Fix Next</span>
          <p>{analysis.nextAction}</p>
        </div>
      </section>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-card__label">Coverage</span>
          <strong className="metric-card__value">
            {Math.round(analysis.metrics.coverage * 100)}%
          </strong>
        </article>
        <article className="metric-card">
          <span className="metric-card__label">Purity</span>
          <strong className="metric-card__value">
            {Math.round(analysis.metrics.purity * 100)}%
          </strong>
        </article>
        <article className="metric-card">
          <span className="metric-card__label">Edge Focus</span>
          <strong className="metric-card__value">
            {Math.round(analysis.metrics.edgeScore * 100)}%
          </strong>
        </article>
      </div>

      {relatedLesson ? <RelatedLessonCard lesson={relatedLesson} /> : null}
    </aside>
  )
}
