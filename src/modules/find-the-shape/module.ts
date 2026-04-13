import type { DetectionResult } from '../../cv/types'
import { runFindShapePipeline } from '../../cv/pipeline'
import { createFindShapeScene } from './scene'
import { findShapeChapter } from './chapter'
import { findShapeOperationCatalog } from './pipelineModel'
import type {
  FindShapeProgram,
  FindShapeScene,
  FindShapeSceneOptions,
} from './types'

export const findShapeModule = {
  code: findShapeChapter.code,
  title: findShapeChapter.title,
  subtitle: findShapeChapter.subtitle,
  levels: findShapeChapter.levels,
  operationCatalog: findShapeOperationCatalog,
  defaultProgram: findShapeChapter.levels[0].initialProgram,
  initialSeed: findShapeChapter.levels[0].sceneSeed,
  createScene: (seed?: number, options?: FindShapeSceneOptions) =>
    createFindShapeScene(seed, options),
  analyze: (scene: FindShapeScene, program: FindShapeProgram): DetectionResult =>
    runFindShapePipeline(scene, program),
}
