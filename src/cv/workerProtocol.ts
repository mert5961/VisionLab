import type { DetectionResult } from './types'
import type {
  FindShapeProgram,
  FindShapeScene,
} from '../modules/find-the-shape/types'

export type VisionWorkerRequest =
  | {
      type: 'set-scene'
      scene: FindShapeScene
    }
  | {
      type: 'analyze'
      requestId: number
      program: FindShapeProgram
    }

export type VisionWorkerResponse =
  | {
      type: 'analysis'
      requestId: number
      result: DetectionResult
    }
  | {
      type: 'error'
      requestId: number
      message: string
    }
