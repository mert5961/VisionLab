import type { DetectionResult } from '../cv/types'
import type { GameplayQaReport } from './types'
import { createFindShapeProgramCopy } from '../modules/find-the-shape/pipelineModel'
import { findShapeModule } from '../modules/find-the-shape/module'
import type { FindShapeLevelConfig } from '../modules/find-the-shape/chapter'

interface EvaluateFindShapeQaArgs {
  level: FindShapeLevelConfig
  module: typeof findShapeModule
}

export function evaluateFindShapeLevelQa({
  level,
  module,
}: EvaluateFindShapeQaArgs): GameplayQaReport {
  const scene = module.createScene(level.sceneSeed, level.sceneOptions)
  const initialResult = module.analyze(scene, createFindShapeProgramCopy(level.initialProgram))
  const solutionResult = module.analyze(scene, createFindShapeProgramCopy(level.solutionProgram))

  return {
    checks: [
      {
        id: 'initial-fails',
        label: 'Initial pipeline fails',
        passed: !initialResult.success,
        detail: summarizeResult(initialResult),
      },
      {
        id: 'solution-succeeds',
        label: 'Canonical fix succeeds',
        passed: solutionResult.success,
        detail: summarizeResult(solutionResult),
      },
      {
        id: 'correct-target',
        label: 'Solution isolates target cleanly',
        passed:
          solutionResult.bestContour !== null &&
          solutionResult.bestContour.coverage >= 0.8 &&
          solutionResult.bestContour.purity >= 0.76,
        detail:
          solutionResult.bestContour !== null
            ? `coverage ${Math.round(solutionResult.bestContour.coverage * 100)}%, purity ${Math.round(solutionResult.bestContour.purity * 100)}%`
            : 'No target contour returned.',
      },
    ],
    debugSummary: `seed ${level.sceneSeed.toString(16).toUpperCase()} | initial: ${initialResult.primaryIssue} | solved: ${solutionResult.statusText}`,
  }
}

function summarizeResult(result: DetectionResult) {
  return `${result.statusText}. ${result.primaryIssue}`
}
