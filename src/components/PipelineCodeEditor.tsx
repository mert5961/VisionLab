import { useState } from 'react'
import type { ReactNode } from 'react'
import type { PipelineLineReport } from '../cv/types'
import type {
  FindShapeDisplayState,
  FindShapeOperationDefinition,
  FindShapeOperationId,
  FindShapePipelineStep,
  FindShapeProgram,
} from '../modules/find-the-shape/types'
import type { OperationHelpEntry } from '../modules/find-the-shape/help'
import type { RelatedLesson } from '../modules/lessonCompanion'
import { buildRelatedLessonHref } from '../modules/lessonCompanion'

interface PipelineCodeEditorProps {
  program: FindShapeProgram
  lineReports: PipelineLineReport[]
  operationCatalog: Record<FindShapeOperationId, FindShapeOperationDefinition>
  helpCatalog: Record<FindShapeOperationId, OperationHelpEntry>
  relatedLesson: RelatedLesson | null
  isPending: boolean
  systemState: 'stable' | 'unstable' | 'failed'
  breakingStepId: string | null
  primaryIssue: string
  onMoveStep: (stepId: string, direction: -1 | 1) => void
  onToggleStep: (stepId: string) => void
  onChangeFunction: (stepId: string, functionId: FindShapeOperationId | null) => void
  onChangeParameter: (stepId: string, key: string, value: number) => void
  onToggleDisplay: (key: keyof FindShapeDisplayState, value: boolean) => void
  onReset: () => void
  onRescan: () => void
}

const displayControls: Array<{
  key: keyof FindShapeDisplayState
  label: string
}> = [
  { key: 'showMask', label: 'Mask' },
  { key: 'showContours', label: 'Contours' },
  { key: 'showOverlay', label: 'Overlay' },
]

export function PipelineCodeEditor({
  program,
  lineReports,
  operationCatalog,
  helpCatalog,
  relatedLesson,
  isPending,
  systemState,
  breakingStepId,
  primaryIssue,
  onMoveStep,
  onToggleStep,
  onChangeFunction,
  onChangeParameter,
  onToggleDisplay,
  onReset,
  onRescan,
}: PipelineCodeEditorProps) {
  const reportMap = new Map(lineReports.map((report) => [report.stepId, report]))
  const breakingIndex = breakingStepId
    ? program.steps.findIndex((step) => step.id === breakingStepId)
    : -1
  const [openHelpStepId, setOpenHelpStepId] = useState<string | null>(null)

  return (
    <section className="pipeline-stage">
      <header className="stage-heading pipeline-stage__header">
        <div>
          <p className="stage-heading__eyebrow">Pipeline</p>
          <h2 className="stage-heading__title">Repair the script</h2>
        </div>
        <span className={`hero-badge hero-badge--${systemState}`}>
          {isPending ? 'Updating' : systemState}
        </span>
      </header>

      <div className="pipeline-focus">
        <span className="pipeline-focus__line">
          {breakingIndex >= 0 ? `L${String(breakingIndex + 1).padStart(2, '0')}` : 'Ready'}
        </span>
        <p className="pipeline-focus__issue">{primaryIssue}</p>
      </div>

      <section className="pipeline-stack" aria-label="Structured pipeline editor">
        {program.steps.map((step, index) => {
          const report = reportMap.get(step.id)
          return (
            <PipelineCodeLine
              key={step.id}
              step={step}
              lineNumber={index + 1}
              isFirst={index === 0}
              isLast={index === program.steps.length - 1}
              report={report}
              isBreaking={step.id === breakingStepId}
              operationCatalog={operationCatalog}
              helpEntry={helpCatalog[step.functionId ?? step.functionOptions[0]]}
              relatedLesson={relatedLesson}
              helpOpen={openHelpStepId === step.id}
              onToggleHelp={() =>
                setOpenHelpStepId((current) => (current === step.id ? null : step.id))
              }
              onMoveStep={onMoveStep}
              onToggleStep={onToggleStep}
              onChangeFunction={onChangeFunction}
              onChangeParameter={onChangeParameter}
            />
          )
        })}
      </section>

      <div className="pipeline-footer">
        <div className="pipeline-footer__actions">
          <button type="button" className="pipeline-button" onClick={onReset}>
            Restore
          </button>
          <button
            type="button"
            className="pipeline-button pipeline-button--primary"
            onClick={onRescan}
          >
            New Scan
          </button>
        </div>
      </div>

      <details className="pipeline-tools">
        <summary className="drawer__summary">Render Probes</summary>
        <div className="pipeline-tools__panel">
          {displayControls.map((control) => (
            <label key={control.key} className="probe-chip">
              <input
                type="checkbox"
                checked={program.display[control.key]}
                onChange={(event) =>
                  onToggleDisplay(control.key, event.currentTarget.checked)
                }
              />
              <span>{control.label}</span>
            </label>
          ))}
        </div>
      </details>
    </section>
  )
}

function PipelineCodeLine({
  step,
  lineNumber,
  isFirst,
  isLast,
  report,
  isBreaking,
  operationCatalog,
  helpEntry,
  relatedLesson,
  helpOpen,
  onToggleHelp,
  onMoveStep,
  onToggleStep,
  onChangeFunction,
  onChangeParameter,
}: {
  step: FindShapePipelineStep
  lineNumber: number
  isFirst: boolean
  isLast: boolean
  report: PipelineLineReport | undefined
  isBreaking: boolean
  operationCatalog: Record<FindShapeOperationId, FindShapeOperationDefinition>
  helpEntry: OperationHelpEntry | undefined
  relatedLesson: RelatedLesson | null
  helpOpen: boolean
  onToggleHelp: () => void
  onMoveStep: (stepId: string, direction: -1 | 1) => void
  onToggleStep: (stepId: string) => void
  onChangeFunction: (stepId: string, functionId: FindShapeOperationId | null) => void
  onChangeParameter: (stepId: string, key: string, value: number) => void
}) {
  const operationDefinition = step.functionId
    ? operationCatalog[step.functionId]
    : operationCatalog[step.functionOptions[0]]
  const lineState = report?.state ?? 'success'
  const showMessage = isBreaking || lineState !== 'success'

  return (
    <article
      className={`pipeline-line pipeline-line--${lineState} ${isBreaking ? 'pipeline-line--breaking' : ''} ${step.enabled ? '' : 'pipeline-line--off'} ${step.locked ? '' : 'pipeline-line--editable'}`}
    >
      <div className="pipeline-line__head">
        <div className="pipeline-line__meta">
          <span className="pipeline-line__number">{String(lineNumber).padStart(2, '0')}</span>
          <span className={`pipeline-line__dot pipeline-line__dot--${lineState}`} />
        </div>

        <div className="pipeline-line__controls">
          <button
            type="button"
            className={`line-toggle ${step.enabled ? 'line-toggle--on' : ''}`}
            onClick={() => onToggleStep(step.id)}
            disabled={step.locked}
          >
            {step.enabled ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="line-movers__button"
            onClick={() => onMoveStep(step.id, -1)}
            disabled={step.locked || isFirst}
            aria-label={`Move line ${lineNumber} up`}
          >
            ↑
          </button>
          <button
            type="button"
            className="line-movers__button"
            onClick={() => onMoveStep(step.id, 1)}
            disabled={step.locked || isLast}
            aria-label={`Move line ${lineNumber} down`}
          >
            ↓
          </button>
          <span className={`pipeline-line__badge pipeline-line__badge--${lineState}`}>
            {lineState}
          </span>
          <button
            type="button"
            className={`line-help ${helpOpen ? 'line-help--open' : ''}`}
            onClick={onToggleHelp}
            aria-label={`Explain line ${lineNumber}`}
          >
            ?
          </button>
        </div>
      </div>

      <div className="pipeline-line__script">
        <span className="code-token code-token--var">{step.outputVar}</span>
        <span className="code-token code-token--op"> = </span>
        <select
          className={`code-token code-token--fn code-select ${step.functionId ? '' : 'code-select--missing'}`}
          value={step.functionId ?? ''}
          onChange={(event) =>
            onChangeFunction(
              step.id,
              event.currentTarget.value
                ? (event.currentTarget.value as FindShapeOperationId)
                : null,
            )
          }
          disabled={step.locked}
        >
          {!step.functionId ? <option value="">select_op</option> : null}
          {step.functionOptions.map((option) => (
            <option key={option} value={option}>
              {operationCatalog[option].token}
            </option>
          ))}
        </select>
        <span className="code-token code-token--op">(</span>
        <CodeArguments
          step={step}
          definition={operationDefinition}
          disabled={step.locked}
          onChangeParameter={onChangeParameter}
        />
        <span className="code-token code-token--op">)</span>
      </div>

      {showMessage ? <p className="pipeline-line__message">{report?.message}</p> : null}

      {helpOpen && helpEntry ? (
        <div className="pipeline-line__help">
          <p className="pipeline-line__help-title">{helpEntry.title}</p>
          <p className="pipeline-line__help-copy">{helpEntry.summary}</p>
          <p className="pipeline-line__help-copy">{helpEntry.effect}</p>
          <p className="pipeline-line__help-bridge">{helpEntry.lectureBridge}</p>
          {relatedLesson ? (
            <a
              className="pipeline-line__help-link"
              href={buildRelatedLessonHref(relatedLesson)}
              target="_blank"
              rel="noreferrer"
            >
              Open lesson
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function CodeArguments({
  step,
  definition,
  disabled,
  onChangeParameter,
}: {
  step: FindShapePipelineStep
  definition: FindShapeOperationDefinition
  disabled: boolean
  onChangeParameter: (stepId: string, key: string, value: number) => void
}) {
  const parts: ReactNode[] = []

  step.inputVars.forEach((inputVar, index) => {
    if (parts.length > 0 || index > 0) {
      parts.push(
        <span key={`comma-input-${inputVar}-${index}`} className="code-token code-token--op">
          ,{' '}
        </span>,
      )
    }

    parts.push(
      <span key={`input-${inputVar}-${index}`} className="code-token code-token--input">
        {inputVar}
      </span>,
    )
  })

  definition.parameters.forEach((parameter, index) => {
    if (parts.length > 0 || index > 0) {
      parts.push(
        <span
          key={`comma-${parameter.key}`}
          className="code-token code-token--op"
        >
          ,{' '}
        </span>,
      )
    }

    parts.push(
      <label key={parameter.key} className="code-parameter">
        <input
          className="code-parameter__input"
          type="number"
          min={parameter.min}
          max={parameter.max}
          step={parameter.step}
          value={step.parameterValues[parameter.key] ?? parameter.defaultValue}
          disabled={disabled}
          onChange={(event) =>
            onChangeParameter(step.id, parameter.key, Number(event.currentTarget.value))
          }
        />
        {parameter.suffix ? (
          <span className="code-parameter__suffix">{parameter.suffix}</span>
        ) : null}
      </label>,
    )
  })

  return <>{parts}</>
}
