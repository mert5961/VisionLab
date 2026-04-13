import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { UiQaReport } from './types'

interface UseUiQaArgs {
  shellRef: RefObject<HTMLElement | null>
  missionRef: RefObject<HTMLElement | null>
  visualRef: RefObject<HTMLElement | null>
  pipelineRef: RefObject<HTMLElement | null>
  watchKey: string
}

const EMPTY_REPORT: UiQaReport = {
  checks: [],
  layoutShiftPx: 0,
}

export function useUiQa({
  shellRef,
  missionRef,
  visualRef,
  pipelineRef,
  watchKey,
}: UseUiQaArgs) {
  const [report, setReport] = useState<UiQaReport>(EMPTY_REPORT)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const shell = shellRef.current
      const mission = missionRef.current
      const visual = visualRef.current
      const pipeline = pipelineRef.current

      if (!shell || !mission || !visual || !pipeline) {
        setReport(EMPTY_REPORT)
        return
      }

      const shellRect = shell.getBoundingClientRect()
      const panelEntries = [
        ['mission', mission],
        ['visual', visual],
        ['pipeline', pipeline],
      ] as const

      const checks = panelEntries.map(([id, element]) => {
        const rect = element.getBoundingClientRect()
        const fitsShell =
          rect.top >= shellRect.top - 1 &&
          rect.left >= shellRect.left - 1 &&
          rect.right <= shellRect.right + 1 &&
          rect.bottom <= shellRect.bottom + 1

        return {
          id: `${id}-bounds`,
          label: `${id} panel in bounds`,
          passed: fitsShell,
          detail: fitsShell ? 'Contained.' : 'Panel exceeds shell bounds.',
        }
      })

      const interactiveOverflowChecks = panelEntries.flatMap(([id, element]) => {
        const rect = element.getBoundingClientRect()
        return Array.from(
          element.querySelectorAll<HTMLElement>('button, summary, input, select, a, canvas'),
        ).slice(0, 18).map((interactive, index) => {
          const itemRect = interactive.getBoundingClientRect()
          const contained =
            itemRect.top >= rect.top - 1 &&
            itemRect.left >= rect.left - 1 &&
            itemRect.right <= rect.right + 1 &&
            itemRect.bottom <= rect.bottom + 1

          return {
            id: `${id}-interactive-${index}`,
            label: `${id} interactive visible`,
            passed: contained,
            detail: contained ? 'Visible.' : 'Interactive element clipped.',
          }
        })
      })

      const stageGap = visual.getBoundingClientRect().top - mission.getBoundingClientRect().top
      const layoutShiftPx = Math.max(
        0,
        Math.abs(visual.offsetHeight - visual.clientHeight),
        Math.abs(pipeline.offsetHeight - pipeline.clientHeight),
      )

      setReport({
        checks: [
          ...checks,
          ...interactiveOverflowChecks.filter((entry) => !entry.passed),
        ],
        layoutShiftPx: Math.max(0, Math.round(stageGap), Math.round(layoutShiftPx)),
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [missionRef, pipelineRef, shellRef, visualRef, watchKey])

  return report
}
