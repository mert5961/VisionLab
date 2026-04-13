import { useEffect, useRef, useState } from 'react'
import type { DetectionResult } from './types'
import type { VisionWorkerResponse } from './workerProtocol'
import type {
  FindShapeProgram,
  FindShapeScene,
} from '../modules/find-the-shape/types'

interface UseFindShapeAnalysisOptions {
  scene: FindShapeScene
  program: FindShapeProgram
  initialAnalysis: DetectionResult
}

export function useFindShapeAnalysis({
  scene,
  program,
  initialAnalysis,
}: UseFindShapeAnalysisOptions) {
  const [completedAnalysis, setCompletedAnalysis] = useState({
    analysis: initialAnalysis,
    scene,
    program,
  })
  const workerRef = useRef<Worker | null>(null)
  const latestRequestIdRef = useRef(0)
  const latestSceneRef = useRef(scene)
  const latestProgramRef = useRef(program)

  useEffect(() => {
    latestSceneRef.current = scene
    latestProgramRef.current = program
  }, [scene, program])

  useEffect(() => {
    const worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<VisionWorkerResponse>) => {
      const message = event.data

      if (message.type === 'error') {
        console.error(message.message)
        return
      }

      if (message.requestId !== latestRequestIdRef.current) {
        return
      }

      setCompletedAnalysis({
        analysis: message.result,
        scene: latestSceneRef.current,
        program: latestProgramRef.current,
      })
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const worker = workerRef.current

    if (!worker) {
      return
    }

    worker.postMessage({
      type: 'set-scene',
      scene,
    })
  }, [scene])

  useEffect(() => {
    const worker = workerRef.current

    if (!worker) {
      return
    }

    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId

    worker.postMessage({
      type: 'analyze',
      requestId,
      program,
    })
  }, [scene, program])

  return {
    analysis:
      completedAnalysis.scene === scene
        ? completedAnalysis.analysis
        : initialAnalysis,
    isPending:
      completedAnalysis.scene !== scene || completedAnalysis.program !== program,
  }
}
