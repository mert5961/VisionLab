import type { DetectionResult } from '../cv/types'

interface DiagnosticsStripProps {
  analysis: DetectionResult
  seed: number
}

export function DiagnosticsStrip({
  analysis,
  seed,
}: DiagnosticsStripProps) {
  return (
    <section className="diagnostics-strip">
      <div className="diagnostics-console">
        <p className="diagnostics-strip__eyebrow">Diagnostic Console</p>
        <p className="diagnostics-console__issue">{analysis.primaryIssue}</p>
        <p className="diagnostics-console__fix">{analysis.nextAction}</p>
      </div>

      <div className="diagnostics-log" aria-label="System messages">
        {analysis.diagnostics.map((entry, index) => (
          <p key={entry} className="diagnostics-log__entry">
            <span className="diagnostics-log__index">
              [{String(index).padStart(2, '0')}]
            </span>
            <span>{entry}</span>
          </p>
        ))}
      </div>

      <div className="diagnostics-meta">
        <span className="diag-chip diag-chip--metric">
          status {analysis.systemState}
        </span>
        <span className="diag-chip diag-chip--metric">
          stage {analysis.activeStageLabel}
        </span>
        <span className="diag-chip diag-chip--metric">
          errors {analysis.errorCount}
        </span>
        <span className="diag-chip diag-chip--metric">
          weak {analysis.warningCount}
        </span>
        <span className="diag-chip diag-chip--metric">
          scan {seed.toString(16).toUpperCase()}
        </span>
      </div>
    </section>
  )
}
