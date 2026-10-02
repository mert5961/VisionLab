import { describe, expect, it } from 'vitest'
import { findShapeModule } from '../modules/find-the-shape/module'
import { getPlayableMissionSetsForModule, getPlayableLevelIdsForMissionSet } from '../game/catalog'
import { evaluateFindShapeLevelQa } from './findShapeQa'

describe('playable missions', () => {
  it('makes every implemented level reachable through the mission catalog', () => {
    const ids = getPlayableMissionSetsForModule('find-shape').flatMap(getPlayableLevelIdsForMissionSet)
    expect(ids).toEqual(findShapeModule.levels.map((level) => level.id))
  })

  it('points the first lesson at its editable mono stage', () => {
    const level = findShapeModule.levels[0]
    const result = findShapeModule.analyze(
      findShapeModule.createScene(level.sceneSeed, level.sceneOptions), level.initialProgram,
    )
    expect(result.breakingStepId).toBe('step-mono')
    expect(result.nextAction).toContain('to_grayscale')
  })

  const scans = findShapeModule.levels.flatMap((level) =>
    [0, 17, 34].map((offset) => ({ ...level, sceneSeed: level.sceneSeed + offset })),
  )
  it.each(scans)('$id (seed $sceneSeed) starts broken and has a working canonical solution', (level) => {
    const report = evaluateFindShapeLevelQa({ level, module: findShapeModule })
    for (const check of report.checks) {
      expect(check.passed, `${check.label}: ${check.detail}`).toBe(true)
    }
    const result = findShapeModule.analyze(
      findShapeModule.createScene(level.sceneSeed, level.sceneOptions), level.solutionProgram,
    )
    expect(result.lineReports.find((line) => line.stepId === 'step-target')?.state).toBe('success')
  })
})
