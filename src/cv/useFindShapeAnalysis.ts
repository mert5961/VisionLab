import { useEffect, useRef, useState } from 'react'
import { runFindShapePipeline } from './pipeline'
import type { DetectionResult } from './types'
import type { VisionWorkerResponse } from './workerProtocol'
import type { FindShapeProgram, FindShapeScene } from '../modules/find-the-shape/types'

interface UseFindShapeAnalysisOptions {
  scene: FindShapeScene
  program: FindShapeProgram
  initialAnalysis: DetectionResult
}

export function useFindShapeAnalysis({ scene, program, initialAnalysis }: UseFindShapeAnalysisOptions) {
  const [completed, setCompleted] = useState({
    analysis: initialAnalysis,
    scene,
    program,
    error: null as string | null,
  })
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false
    const requestId = ++requestIdRef.current
    let timeoutId: number
    const listeners = new AbortController()

    const complete = (analysis: DetectionResult, error: string | null = null) => {
      if (cancelled) return
      window.clearTimeout(timeoutId)
      // Bind the result to its actual inputs, never mutable "latest" references.
      setCompleted({ analysis, scene, program, error })
    }

    const fallback = () => {
      if (cancelled) return
      workerRef.current?.terminate()
      workerRef.current = null
      try {
        complete(runFindShapePipeline(scene, program))
      } catch {
        complete(initialAnalysis, 'Analysis failed. Try Restore or New Scan.')
      }
    }

    // Recover from worker startup failures, runtime errors, and unresponsive workers.
    timeoutId = window.setTimeout(fallback, 10_000)
    try {
      const worker = workerRef.current ?? new Worker(
        new URL('./analysis.worker.ts', import.meta.url), { type: 'module' },
      )
      workerRef.current = worker
      worker.addEventListener('message', (event: MessageEvent<VisionWorkerResponse>) => {
        if (cancelled || event.data.requestId !== requestId) return
        if (event.data.type === 'error') fallback()
        else complete(event.data.result)
      }, { signal: listeners.signal })
      worker.addEventListener('error', (event) => {
        event.preventDefault()
        fallback()
      }, { signal: listeners.signal })
      worker.addEventListener('messageerror', fallback, { signal: listeners.signal })
      worker.postMessage({ type: 'set-scene', scene })
      worker.postMessage({ type: 'analyze', requestId, program })
    } catch {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(fallback, 0)
    }

    return () => {
      cancelled = true
      listeners.abort()
      window.clearTimeout(timeoutId)
    }
  }, [scene, program, initialAnalysis])

  const isCurrent = completed.scene === scene && completed.program === program
  return {
    analysis: completed.scene === scene ? completed.analysis : initialAnalysis,
    isPending: !isCurrent,
    error: isCurrent ? completed.error : null,
  }
}
