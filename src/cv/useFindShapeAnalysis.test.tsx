import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findShapeModule } from '../modules/find-the-shape/module'
import { createFindShapeProgramCopy } from '../modules/find-the-shape/pipelineModel'
import { useFindShapeAnalysis } from './useFindShapeAnalysis'
import type { VisionWorkerRequest, VisionWorkerResponse } from './workerProtocol'

class TestWorker extends EventTarget {
  static instances: TestWorker[] = []
  messages: VisionWorkerRequest[] = []
  terminate = vi.fn()
  constructor() {
    super()
    TestWorker.instances.push(this)
  }
  postMessage(message: VisionWorkerRequest) { this.messages.push(message) }
  reply(response: VisionWorkerResponse) {
    this.dispatchEvent(new MessageEvent('message', { data: response }))
  }
  get requestId() {
    const request = this.messages.findLast((message) => message.type === 'analyze')
    if (!request || request.type !== 'analyze') throw new Error('Missing request')
    return request.requestId
  }
}

const level = findShapeModule.levels[0]
const scene = findShapeModule.createScene(level.sceneSeed, level.sceneOptions)
const program = level.initialProgram
const initialAnalysis = findShapeModule.analyze(scene, program)
const solved = findShapeModule.analyze(scene, level.solutionProgram)

beforeEach(() => {
  TestWorker.instances = []
  vi.stubGlobal('Worker', TestWorker)
})

describe('worker analysis', () => {
  it('ignores out-of-order replies and binds results to the requested program', () => {
    const { result, rerender } = renderHook(useFindShapeAnalysis, { initialProps: { scene, program, initialAnalysis } })
    const worker = TestWorker.instances[0]
    const oldId = worker.requestId
    rerender({ scene, program: level.solutionProgram, initialAnalysis })
    expect(result.current.isPending).toBe(true)
    act(() => worker.reply({ type: 'analysis', requestId: oldId, result: solved }))
    expect(result.current.isPending).toBe(true)
    expect(result.current.analysis.success).toBe(false)
    act(() => worker.reply({ type: 'analysis', requestId: worker.requestId, result: solved }))
    expect(result.current.isPending).toBe(false)
    expect(result.current.analysis.success).toBe(true)
  })

  it('uses the new scene baseline while its worker result is pending', () => {
    const { result, rerender } = renderHook(useFindShapeAnalysis, { initialProps: { scene, program, initialAnalysis } })
    const worker = TestWorker.instances[0]
    act(() => worker.reply({ type: 'analysis', requestId: worker.requestId, result: solved }))
    const nextScene = findShapeModule.createScene(level.sceneSeed + 17, level.sceneOptions)
    const nextAnalysis = findShapeModule.analyze(nextScene, program)
    rerender({ scene: nextScene, program, initialAnalysis: nextAnalysis })
    expect(result.current.analysis).toBe(nextAnalysis)
    expect(result.current.isPending).toBe(true)
  })

  it.each(['response', 'runtime', 'message'])('recovers from a %s error', (kind) => {
    const { result, rerender } = renderHook(useFindShapeAnalysis, { initialProps: { scene, program, initialAnalysis } })
    rerender({ scene, program: level.solutionProgram, initialAnalysis })
    const worker = TestWorker.instances[0]
    act(() => {
      if (kind === 'response') worker.reply({ type: 'error', requestId: worker.requestId, message: 'failed' })
      else worker.dispatchEvent(new Event(kind === 'runtime' ? 'error' : 'messageerror', { cancelable: true }))
    })
    expect(result.current.isPending).toBe(false)
    expect(result.current.analysis.success).toBe(true)
    expect(worker.terminate).toHaveBeenCalled()
  })

  it('recovers when Worker construction is unavailable', async () => {
    vi.stubGlobal('Worker', class { constructor() { throw new Error('unsupported') } })
    const { result } = renderHook(useFindShapeAnalysis, {
      initialProps: { scene, program: level.solutionProgram, initialAnalysis },
    })
    await waitFor(() => expect(result.current.analysis.success).toBe(true))
    expect(result.current.isPending).toBe(false)
  })

  it('recovers from an unresponsive worker and cleans up on unmount', () => {
    vi.useFakeTimers()
    const { result, rerender, unmount } = renderHook(useFindShapeAnalysis, { initialProps: { scene, program, initialAnalysis } })
    rerender({ scene, program: level.solutionProgram, initialAnalysis })
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.isPending).toBe(false)
    expect(result.current.analysis.success).toBe(true)
    rerender({ scene, program: createFindShapeProgramCopy(program), initialAnalysis })
    const worker = TestWorker.instances.at(-1)!
    unmount()
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('recreates the worker during Strict Mode effect replay', () => {
    const { result, rerender } = renderHook(useFindShapeAnalysis, {
      initialProps: { scene, program, initialAnalysis },
      reactStrictMode: true,
    })
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce()
    rerender({ scene, program: level.solutionProgram, initialAnalysis })
    const worker = TestWorker.instances.at(-1)!
    act(() => worker.reply({ type: 'analysis', requestId: worker.requestId, result: solved }))
    expect(result.current.isPending).toBe(false)
    expect(result.current.analysis.success).toBe(true)
  })
})
