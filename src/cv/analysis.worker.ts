/// <reference lib="webworker" />

import { runFindShapePipeline } from './pipeline'
import type { VisionWorkerRequest, VisionWorkerResponse } from './workerProtocol'
import type {
  FindShapeProgram,
  FindShapeScene,
} from '../modules/find-the-shape/types'

const workerScope = self as DedicatedWorkerGlobalScope

let currentScene: FindShapeScene | null = null
let queuedAnalysis: {
  requestId: number
  program: FindShapeProgram
} | null = null
let isProcessing = false

workerScope.onmessage = (event: MessageEvent<VisionWorkerRequest>) => {
  const message = event.data

  if (message.type === 'set-scene') {
    currentScene = message.scene
    return
  }

  queuedAnalysis = {
    requestId: message.requestId,
    program: message.program,
  }

  void processQueue()
}

async function processQueue() {
  if (isProcessing || !currentScene || !queuedAnalysis) {
    return
  }

  isProcessing = true

  while (queuedAnalysis && currentScene) {
    const nextAnalysis = queuedAnalysis
    queuedAnalysis = null

    try {
      const result = runFindShapePipeline(currentScene, nextAnalysis.program)

      workerScope.postMessage({
        type: 'analysis',
        requestId: nextAnalysis.requestId,
        result,
      } satisfies VisionWorkerResponse)
    } catch (error) {
      workerScope.postMessage({
        type: 'error',
        requestId: nextAnalysis.requestId,
        message:
          error instanceof Error ? error.message : 'Vision analysis failed.',
      } satisfies VisionWorkerResponse)
    }

    await Promise.resolve()
  }

  isProcessing = false
}

export {}
