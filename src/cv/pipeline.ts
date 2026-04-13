import type {
  BoundingBox,
  DetectionResult,
  DetectionSystemState,
  DetectionMetrics,
  PipelineLineReport,
} from './types'
import { findShapeOperationCatalog } from '../modules/find-the-shape/pipelineModel'
import type {
  FindShapeProgram,
  FindShapeScene,
  FindShapeOperationId,
} from '../modules/find-the-shape/types'

interface BasicContour {
  label: number
  pixels: number[]
  area: number
  boundary: number[]
  bounds: BoundingBox
  centroidX: number
  centroidY: number
}

interface ScoredContour extends BasicContour {
  coverage: number
  purity: number
  edgeScore: number
  sizeScore: number
  confidence: number
}

type PipelineArtifact =
  | {
      type: 'source'
    }
  | {
      type: 'image'
      data: Float32Array
    }
  | {
      type: 'mask'
      data: Uint8Array
    }
  | {
      type: 'edges'
      data: Uint8Array
      edgePixels: number
    }
  | {
      type: 'contours'
      components: BasicContour[]
      labels: Int32Array
      boundaryLabels: Int32Array
      sourceMask: Uint8Array
    }
  | {
      type: 'target'
      component: ScoredContour | null
      labels: Int32Array
      boundaryLabels: Int32Array
      sourceMask: Uint8Array
      edges: Uint8Array
      sourceContours: BasicContour[]
    }

interface RuntimeState {
  latestImage: Float32Array
  latestMask: Uint8Array | null
  latestEdges: Uint8Array | null
  latestEdgePixels: number
  latestContours: {
    components: BasicContour[]
    labels: Int32Array
    boundaryLabels: Int32Array
    sourceMask: Uint8Array
  } | null
  latestTarget: PipelineArtifact & { type: 'target' } | null
  activeStageLabel: string
}

export function runFindShapePipeline(
  scene: FindShapeScene,
  program: FindShapeProgram,
): DetectionResult {
  const environment = new Map<string, PipelineArtifact>()
  const lineReports: PipelineLineReport[] = []
  const runtime: RuntimeState = {
    latestImage: scene.lumaFrames.maxChannel,
    latestMask: null,
    latestEdges: null,
    latestEdgePixels: 0,
    latestContours: null,
    latestTarget: null,
    activeStageLabel: 'RAW INPUT',
  }

  for (const [index, step] of program.steps.entries()) {
    if (!step.enabled) {
      lineReports.push({
        stepId: step.id,
        state: 'disabled',
        message: `L${String(index + 1).padStart(2, '0')} bypassed.`,
      })
      continue
    }

    if (!step.functionId) {
      lineReports.push({
        stepId: step.id,
        state: 'failed',
        message: `${step.outputVar} has no operation assigned.`,
      })
      continue
    }

    const definition = findShapeOperationCatalog[step.functionId]
    const inputArtifacts: PipelineArtifact[] = []
    let dependencyError: string | null = null

    for (let inputIndex = 0; inputIndex < step.inputVars.length; inputIndex += 1) {
      const inputVar = step.inputVars[inputIndex]
      const artifact = environment.get(inputVar)

      if (!artifact) {
        dependencyError = `${definition.token} is waiting on ${inputVar}.`
        break
      }

      if (artifact.type !== definition.inputTypes[inputIndex]) {
        dependencyError = `${definition.token} expected ${definition.inputTypes[inputIndex]}, received ${artifact.type}.`
        break
      }

      inputArtifacts.push(artifact)
    }

    if (dependencyError) {
      lineReports.push({
        stepId: step.id,
        state: 'failed',
        message: dependencyError,
      })
      continue
    }

    const artifact = executeOperation(
      scene,
      step.functionId,
      inputArtifacts,
      step.parameterValues,
    )

    environment.set(step.outputVar, artifact)
    updateRuntime(runtime, artifact, step.outputVar, definition.token)

    lineReports.push({
      stepId: step.id,
      state: resolveLineState(step.functionId, step.parameterValues),
      message: resolveLineMessage(step.functionId, step.parameterValues),
    })
  }

  const bestContour = runtime.latestTarget?.component ?? null
  const targetStep = program.steps.find((step) => step.outputVar === 'target')
  const upstreamLockedForTargetLesson = program.steps
    .filter((step) => step.outputVar !== 'target')
    .every((step) => step.locked)
  const success =
    bestContour !== null &&
    (
      upstreamLockedForTargetLesson
        ? targetStep?.functionId === 'best_contour' &&
          bestContour.coverage >= 0.8 &&
          bestContour.purity >= 0.76 &&
          bestContour.sizeScore >= 0.68
        : bestContour.coverage >= 0.84 &&
          bestContour.purity >= 0.82 &&
          bestContour.edgeScore >= 0.46 &&
          bestContour.sizeScore >= 0.7
    )

  const confidence = bestContour?.confidence ?? 0
  const componentCount = runtime.latestContours?.components.length ?? 0
  const statusText = resolveStatus(success, confidence, componentCount)
  const activePixels = runtime.latestMask ? countActivePixels(runtime.latestMask) : 0
  const metrics: DetectionMetrics = {
    coverage: bestContour?.coverage ?? 0,
    purity: bestContour?.purity ?? 0,
    edgeScore: bestContour?.edgeScore ?? 0,
    activePixels,
    edgePixels: runtime.latestEdgePixels,
  }

  const feedback = buildDiagnostics({
    lineReports,
    bestContour,
    componentCount,
    program,
    success,
    activePixels,
    edgePixels: runtime.latestEdgePixels,
    totalPixels: scene.width * scene.height,
  })

  const errorCount = lineReports.filter((line) => line.state === 'failed').length
  const warningCount = lineReports.filter((line) => line.state === 'weak').length
  const latestLabels =
    runtime.latestTarget?.labels ?? runtime.latestContours?.labels ?? new Int32Array(scene.width * scene.height)
  const latestBoundaryLabels =
    runtime.latestTarget?.boundaryLabels ??
    runtime.latestContours?.boundaryLabels ??
    new Int32Array(scene.width * scene.height)
  const latestMask =
    runtime.latestTarget?.sourceMask ??
    runtime.latestContours?.sourceMask ??
    runtime.latestMask ??
    new Uint8Array(scene.width * scene.height)
  const latestEdges = runtime.latestTarget?.edges ?? runtime.latestEdges ?? new Uint8Array(scene.width * scene.height)

  return {
    processedFrame: renderProcessedFrame({
      width: scene.width,
      height: scene.height,
      baseImage: runtime.latestImage,
      mask: latestMask,
      edges: latestEdges,
      labels: latestLabels,
      boundaryLabels: latestBoundaryLabels,
      bestLabel: bestContour?.label ?? 0,
      display: program.display,
    }),
    overlayFrame: program.display.showOverlay
      ? renderOverlayFrame({
          source: scene.sourceFrame.data,
          width: scene.width,
          height: scene.height,
          labels: latestLabels,
          boundaryLabels: latestBoundaryLabels,
          bestLabel: bestContour?.label ?? 0,
          showMask: program.display.showMask,
          showContours: program.display.showContours,
          success,
        })
      : scene.sourceFrame,
    componentCount,
    bestContour: bestContour
      ? {
          label: bestContour.label,
          area: bestContour.area,
          boundarySize: bestContour.boundary.length,
          centroid: {
            x: bestContour.centroidX,
            y: bestContour.centroidY,
          },
          bounds: bestContour.bounds,
          coverage: bestContour.coverage,
          purity: bestContour.purity,
          edgeScore: bestContour.edgeScore,
          sizeScore: bestContour.sizeScore,
          confidence: bestContour.confidence,
        }
      : null,
    confidence,
    statusText,
    systemState: feedback.systemState,
    success,
    primaryIssue: feedback.primaryIssue,
    nextAction: feedback.nextAction,
    breakingStepId: feedback.breakingStepId,
    diagnostics: feedback.messages,
    metrics,
    lineReports,
    errorCount,
    warningCount,
    activeStageLabel: runtime.activeStageLabel,
  }
}

function executeOperation(
  scene: FindShapeScene,
  operationId: FindShapeOperationId,
  inputs: PipelineArtifact[],
  parameterValues: Record<string, number | null>,
): PipelineArtifact {
  switch (operationId) {
    case 'input_image':
      return { type: 'source' }

    case 'to_grayscale':
    case 'extract_luma':
      return {
        type: 'image',
        data: scene.lumaFrames.grayscale,
      }

    case 'max_channel':
      return {
        type: 'image',
        data: scene.lumaFrames.maxChannel,
      }

    case 'gaussian_blur':
      return {
        type: 'image',
        data: boxBlur(
          readImage(inputs[0]),
          scene.width,
          scene.height,
          clampParameter(parameterValues.radius, 0, 6),
        ),
      }

    case 'box_blur':
      return {
        type: 'image',
        data: boxBlur(
          readImage(inputs[0]),
          scene.width,
          scene.height,
          clampParameter(parameterValues.radius, 0, 6),
        ),
      }

    case 'median_blur':
      return {
        type: 'image',
        data: approximateMedianBlur(
          readImage(inputs[0]),
          scene.width,
          scene.height,
          clampParameter(parameterValues.radius, 0, 6),
        ),
      }

    case 'binary_threshold':
      return {
        type: 'mask',
        data: morphOpen(
          morphClose(
            buildThresholdMask(
              readImage(inputs[0]),
              clampParameter(parameterValues.level, 90, 220),
            ),
            scene.width,
            scene.height,
          ),
          scene.width,
          scene.height,
        ),
      }

    case 'high_pass_mask': {
      const baseMask = buildThresholdMask(
        readImage(inputs[0]),
        clampParameter(parameterValues.level, 90, 220) + 14,
      )
      return {
        type: 'mask',
        data: morphOpen(baseMask, scene.width, scene.height),
      }
    }

    case 'adaptive_cutoff': {
      const source = readImage(inputs[0])
      const localMean = boxBlur(source, scene.width, scene.height, 4)
      const mask = new Uint8Array(source.length)
      const offset = (clampParameter(parameterValues.level, 90, 220) - 128) * 0.45

      for (let index = 0; index < source.length; index += 1) {
        mask[index] = source[index] >= localMean[index] + offset ? 1 : 0
      }

      return {
        type: 'mask',
        data: morphOpen(mask, scene.width, scene.height),
      }
    }

    case 'sobel_edges': {
      const { edgeMask, edgePixels } = buildEdgeMask(
        readImage(inputs[0]),
        scene.width,
        scene.height,
        clampParameter(parameterValues.sensitivity, 40, 220),
      )
      return {
        type: 'edges',
        data: edgeMask,
        edgePixels,
      }
    }

    case 'canny_edges': {
      const { edgeMask, edgePixels } = buildEdgeMask(
        readImage(inputs[0]),
        scene.width,
        scene.height,
        Math.round(clampParameter(parameterValues.sensitivity, 40, 220) * 0.82),
      )
      return {
        type: 'edges',
        data: edgeMask,
        edgePixels,
      }
    }

    case 'laplacian_edges': {
      const { edgeMask, edgePixels } = buildLaplacianEdges(
        readImage(inputs[0]),
        scene.width,
        scene.height,
        clampParameter(parameterValues.sensitivity, 40, 220),
      )
      return {
        type: 'edges',
        data: edgeMask,
        edgePixels,
      }
    }

    case 'find_contours':
    case 'trace_regions': {
      const contourSet = extractContours(readMask(inputs[0]), scene.width, scene.height)
      return {
        type: 'contours',
        ...contourSet,
      }
    }

    case 'best_contour':
    case 'largest_contour':
    case 'cleanest_contour': {
      const contours = readContours(inputs[0])
      const edges = readEdges(inputs[1])
      const scoredContours = contours.components.map((component) =>
        scoreContour(component, scene.targetMask, scene.targetArea, edges, scene.width, scene.height),
      )

      const component =
        operationId === 'largest_contour'
          ? [...scoredContours].sort((left, right) => right.area - left.area)[0] ?? null
          : operationId === 'cleanest_contour'
            ? [...scoredContours].sort(
                (left, right) =>
                  right.edgeScore * 0.72 +
                  right.purity * 0.28 -
                  (left.edgeScore * 0.72 + left.purity * 0.28),
              )[0] ?? null
            : [...scoredContours].sort((left, right) => right.confidence - left.confidence)[0] ?? null

      return {
        type: 'target',
        component,
        labels: contours.labels,
        boundaryLabels: contours.boundaryLabels,
        sourceMask: contours.sourceMask,
        edges,
        sourceContours: scoredContours,
      }
    }
  }
}

function updateRuntime(
  runtime: RuntimeState,
  artifact: PipelineArtifact,
  outputVar: string,
  token: string,
) {
  runtime.activeStageLabel = `${outputVar} / ${token}`

  if (artifact.type === 'image') {
    runtime.latestImage = artifact.data
  }

  if (artifact.type === 'mask') {
    runtime.latestMask = artifact.data
  }

  if (artifact.type === 'edges') {
    runtime.latestEdges = artifact.data
    runtime.latestEdgePixels = artifact.edgePixels
  }

  if (artifact.type === 'contours') {
    runtime.latestContours = artifact
    runtime.latestMask = artifact.sourceMask
  }

  if (artifact.type === 'target') {
    runtime.latestTarget = artifact
    runtime.latestMask = artifact.sourceMask
    runtime.latestEdges = artifact.edges
  }
}

function resolveLineState(
  operationId: FindShapeOperationId,
  parameterValues: Record<string, number | null>,
): PipelineLineReport['state'] {
  if (operationId === 'max_channel') {
    return 'weak'
  }

  if (
    (operationId === 'high_pass_mask' && clampParameter(parameterValues.level, 90, 220) > 170) ||
    (operationId === 'largest_contour' || operationId === 'cleanest_contour')
  ) {
    return 'weak'
  }

  return 'success'
}

function resolveLineMessage(
  operationId: FindShapeOperationId,
  parameterValues: Record<string, number | null>,
) {
  switch (operationId) {
    case 'max_channel':
      return 'Wrong grayscale feed.'
    case 'high_pass_mask':
      return clampParameter(parameterValues.level, 90, 220) > 170
        ? 'Noise still dominating the mask.'
        : 'Mask stage online.'
    case 'largest_contour':
      return 'Wrong contour selected.'
    case 'cleanest_contour':
      return 'Target selection unstable.'
    default:
      return `${findShapeOperationCatalog[operationId].token} stable.`
  }
}

function buildDiagnostics({
  lineReports,
  bestContour,
  componentCount,
  program,
  success,
  activePixels,
  edgePixels,
  totalPixels,
}: {
  lineReports: PipelineLineReport[]
  bestContour: ScoredContour | null
  componentCount: number
  program: FindShapeProgram
  success: boolean
  activePixels: number
  edgePixels: number
  totalPixels: number
}) {
  const messages: string[] = []
  const firstFailure = lineReports.find((line) => line.state === 'failed')
  const firstWeak = lineReports.find((line) => line.state === 'weak')
  const monoStep = program.steps.find((step) => step.outputVar === 'mono')
  const maskStep = program.steps.find((step) => step.outputVar === 'mask')
  const edgeStep = program.steps.find((step) => step.outputVar === 'edges')
  const targetStep = program.steps.find((step) => step.outputVar === 'target')
  const upstreamLockedForTargetLesson = program.steps
    .filter((step) => step.outputVar !== 'target')
    .every((step) => step.locked)
  const activeRatio = totalPixels === 0 ? 0 : activePixels / totalPixels
  const edgeRatio = totalPixels === 0 ? 0 : edgePixels / totalPixels
  let primaryIssue = ''
  let nextAction = ''
  let breakingStepId: string | null = firstFailure?.stepId ?? null

  if (success) {
    primaryIssue = 'Target contour isolated successfully.'
    nextAction = 'Overlay is stable. Load a new scan or optimize the script for a cleaner lock.'
  } else if (firstFailure) {
    primaryIssue = normalizeDiagnosticMessage(firstFailure.message)
    nextAction = resolveNextAction({
      stepId: firstFailure.stepId,
      program,
      activeRatio,
      edgeRatio,
    })
  } else if (!maskStep?.functionId) {
    primaryIssue = 'Mask operation missing.'
    nextAction = 'Assign a threshold function to mask = ... before tracing contours.'
    breakingStepId = maskStep?.id ?? null
  } else if (componentCount === 0) {
    primaryIssue = 'No contours detected.'
    nextAction =
      activeRatio < 0.02
        ? 'Lower the mask threshold or use a less aggressive cutoff.'
        : 'Clean up the mask so contour tracing has a solid region to follow.'
    breakingStepId = maskStep?.id ?? null
  } else if (activeRatio > 0.34 || componentCount > 14) {
    primaryIssue = 'Noise still dominating the mask.'
    nextAction = 'Raise the threshold or switch to a cleaner mono feed before contour tracing.'
    breakingStepId = maskStep?.id ?? null
  } else if (
    upstreamLockedForTargetLesson &&
    targetStep &&
    (!targetStep.functionId || targetStep.functionId === 'largest_contour')
  ) {
    primaryIssue = !targetStep.functionId
      ? 'Target selector missing.'
      : 'Wrong contour selected.'
    nextAction = !targetStep.functionId
      ? 'Choose the selector that best matches the real target shape.'
      : 'Switch target = ... to best_contour to reject the distractor.'
    breakingStepId = targetStep.id
  } else if (edgeRatio < 0.018 || (bestContour && bestContour.edgeScore < 0.5)) {
    primaryIssue = 'Edges are too fragmented.'
    nextAction = 'Lower edge sensitivity or smooth the image before edge detection.'
    breakingStepId = edgeStep?.id ?? null
  } else if (bestContour && bestContour.coverage < 0.72) {
    primaryIssue = 'Detected contour only covers part of the target.'
    nextAction = 'Improve the mask first, then re-check the contour selection step.'
    breakingStepId = maskStep?.id ?? targetStep?.id ?? null
  } else if (bestContour && bestContour.purity < 0.78) {
    primaryIssue = targetStep?.functionId === 'largest_contour'
      ? 'Wrong contour selected.'
      : 'Target selection unstable.'
    nextAction = 'Reduce mask spill or use a selector that prioritizes target identity.'
    breakingStepId = targetStep?.id ?? maskStep?.id ?? null
  } else {
    primaryIssue = 'Target selection unstable.'
    nextAction = resolveNextAction({
      stepId: firstWeak?.stepId ?? targetStep?.id ?? null,
      program,
      activeRatio,
      edgeRatio,
    })
    breakingStepId = firstWeak?.stepId ?? targetStep?.id ?? null
  }

  messages.push(primaryIssue)

  if (!success && monoStep?.functionId === 'max_channel') {
    messages.push('Mono feed still uses max_channel and keeps channel spill.')
  }

  if (!maskStep?.functionId) {
    messages.push('Mask operation missing.')
  } else if (activeRatio < 0.02) {
    messages.push('Threshold is too high. The mask is nearly empty.')
  } else if (activeRatio > 0.34) {
    messages.push('Noise still dominating the mask.')
  }

  if (componentCount === 0 && maskStep?.functionId) {
    messages.push('No contours detected.')
  } else if (componentCount > 14) {
    messages.push('Too many small regions are breaking the contour stage.')
  }

  if (!success && (edgeRatio < 0.018 || bestContour?.edgeScore === undefined || bestContour.edgeScore < 0.5)) {
    messages.push('Edges are too fragmented.')
  }

  if (bestContour && !success && bestContour.purity < 0.78) {
    messages.push(
      targetStep?.functionId === 'largest_contour'
        ? 'Wrong contour selected.'
        : 'Target selection unstable.',
    )
  }

  if (success) {
    messages.push('Detected area is highlighted in the overlay.')
  }

  return {
    messages: dedupeMessages(messages).slice(0, 4),
    primaryIssue,
    nextAction,
    breakingStepId,
    systemState: resolveSystemState({
      success,
      confidence: bestContour?.confidence ?? 0,
      hasFailure: Boolean(firstFailure),
      componentCount,
    }),
  }
}

function resolveNextAction({
  stepId,
  program,
  activeRatio,
  edgeRatio,
}: {
  stepId: string | null
  program: FindShapeProgram
  activeRatio: number
  edgeRatio: number
}) {
  const step = program.steps.find((candidate) => candidate.id === stepId)

  switch (step?.outputVar) {
    case 'mono':
      return 'Switch the mono conversion to to_grayscale or extract_luma.'
    case 'mask':
      if (!step.functionId) {
        return 'Assign a threshold function to the mask line.'
      }

      if (activeRatio < 0.02) {
        return 'Lower the threshold level so the target survives the mask stage.'
      }

      if (activeRatio > 0.34) {
        return 'Raise the threshold level or use adaptive_cutoff to remove noise.'
      }

      return 'Tune the mask until one clean target region remains.'
    case 'edges':
      return edgeRatio < 0.018
        ? 'Lower edge sensitivity or reduce blur so the boundary survives.'
        : 'Stabilize the edge map before final target selection.'
    case 'contours':
      return 'Feed the contour stage with a cleaner binary mask.'
    case 'target':
      return 'Use best_contour once the mask and edge map are stable.'
    default:
      return 'Fix the failing line, then re-check the processed and overlay views.'
  }
}

function normalizeDiagnosticMessage(message: string) {
  if (message.includes('has no operation assigned')) {
    return 'Mask operation missing.'
  }

  if (message.includes('waiting on')) {
    return 'Wrong operation order.'
  }

  if (message.includes('expected')) {
    return 'Wrong operation order.'
  }

  return message
}

function dedupeMessages(messages: string[]) {
  return Array.from(new Set(messages.filter(Boolean)))
}

function resolveSystemState({
  success,
  confidence,
  hasFailure,
  componentCount,
}: {
  success: boolean
  confidence: number
  hasFailure: boolean
  componentCount: number
}): DetectionSystemState {
  if (success) {
    return 'stable'
  }

  if (hasFailure || componentCount === 0 || confidence < 0.22) {
    return 'failed'
  }

  return 'unstable'
}

function resolveStatus(success: boolean, confidence: number, componentCount: number) {
  if (success) {
    return 'TARGET LOCK'
  }

  if (componentCount === 0) {
    return 'NO RETURN'
  }

  if (confidence >= 0.66) {
    return 'TRACE HOLD'
  }

  if (confidence >= 0.28) {
    return 'PARTIAL LOCK'
  }

  return 'SCATTER'
}

function readImage(artifact: PipelineArtifact) {
  if (artifact.type !== 'image') {
    throw new Error('Pipeline type mismatch: expected image artifact.')
  }

  return artifact.data
}

function readMask(artifact: PipelineArtifact) {
  if (artifact.type !== 'mask') {
    throw new Error('Pipeline type mismatch: expected mask artifact.')
  }

  return artifact.data
}

function readEdges(artifact: PipelineArtifact) {
  if (artifact.type !== 'edges') {
    throw new Error('Pipeline type mismatch: expected edges artifact.')
  }

  return artifact.data
}

function readContours(artifact: PipelineArtifact) {
  if (artifact.type !== 'contours') {
    throw new Error('Pipeline type mismatch: expected contour artifact.')
  }

  return artifact
}

function clampParameter(value: number | null | undefined, min: number, max: number) {
  const resolved = value ?? min
  return Math.max(min, Math.min(max, Math.round(resolved)))
}

function boxBlur(
  source: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  if (radius <= 0) {
    return source.slice()
  }

  const horizontal = new Float32Array(source.length)
  const output = new Float32Array(source.length)
  const kernelSize = radius * 2 + 1

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width
    let sum = 0

    for (let sample = -radius; sample <= radius; sample += 1) {
      sum += source[rowStart + clamp(sample, 0, width - 1)]
    }

    for (let x = 0; x < width; x += 1) {
      horizontal[rowStart + x] = sum / kernelSize
      const removeX = clamp(x - radius, 0, width - 1)
      const addX = clamp(x + radius + 1, 0, width - 1)
      sum += source[rowStart + addX] - source[rowStart + removeX]
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0

    for (let sample = -radius; sample <= radius; sample += 1) {
      sum += horizontal[clamp(sample, 0, height - 1) * width + x]
    }

    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / kernelSize
      const removeY = clamp(y - radius, 0, height - 1)
      const addY = clamp(y + radius + 1, 0, height - 1)
      sum += horizontal[addY * width + x] - horizontal[removeY * width + x]
    }
  }

  return output
}

function approximateMedianBlur(
  source: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  if (radius <= 0) {
    return source.slice()
  }

  return boxBlur(source, width, height, Math.max(1, Math.round(radius * 0.66)))
}

function buildThresholdMask(source: Float32Array, threshold: number) {
  const mask = new Uint8Array(source.length)

  for (let index = 0; index < source.length; index += 1) {
    mask[index] = source[index] >= threshold ? 1 : 0
  }

  return mask
}

function buildEdgeMask(
  source: Float32Array,
  width: number,
  height: number,
  sensitivity: number,
) {
  const edgeMask = new Uint8Array(source.length)
  let edgePixels = 0

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      const topLeft = source[index - width - 1]
      const top = source[index - width]
      const topRight = source[index - width + 1]
      const left = source[index - 1]
      const right = source[index + 1]
      const bottomLeft = source[index + width - 1]
      const bottom = source[index + width]
      const bottomRight = source[index + width + 1]

      const gradientX =
        -topLeft -
        left * 2 -
        bottomLeft +
        topRight +
        right * 2 +
        bottomRight
      const gradientY =
        -topLeft -
        top * 2 -
        topRight +
        bottomLeft +
        bottom * 2 +
        bottomRight

      const magnitude = Math.min(255, Math.hypot(gradientX, gradientY) / 4)

      if (magnitude >= sensitivity) {
        edgeMask[index] = 1
        edgePixels += 1
      }
    }
  }

  return { edgeMask, edgePixels }
}

function buildLaplacianEdges(
  source: Float32Array,
  width: number,
  height: number,
  sensitivity: number,
) {
  const edgeMask = new Uint8Array(source.length)
  let edgePixels = 0

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      const response =
        source[index - width] +
        source[index - 1] +
        source[index + 1] +
        source[index + width] -
        source[index] * 4

      if (Math.abs(response) >= sensitivity) {
        edgeMask[index] = 1
        edgePixels += 1
      }
    }
  }

  return { edgeMask, edgePixels }
}

function morphClose(mask: Uint8Array, width: number, height: number) {
  return erode(dilate(mask, width, height), width, height)
}

function morphOpen(mask: Uint8Array, width: number, height: number) {
  return dilate(erode(mask, width, height), width, height)
}

function dilate(mask: Uint8Array, width: number, height: number) {
  const output = new Uint8Array(mask.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let active = 0

      for (let offsetY = -1; offsetY <= 1 && !active; offsetY += 1) {
        const nextY = y + offsetY
        if (nextY < 0 || nextY >= height) {
          continue
        }

        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const nextX = x + offsetX
          if (nextX < 0 || nextX >= width) {
            continue
          }

          if (mask[nextY * width + nextX]) {
            active = 1
            break
          }
        }
      }

      output[y * width + x] = active
    }
  }

  return output
}

function erode(mask: Uint8Array, width: number, height: number) {
  const output = new Uint8Array(mask.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let active = 1

      for (let offsetY = -1; offsetY <= 1 && active; offsetY += 1) {
        const nextY = y + offsetY
        if (nextY < 0 || nextY >= height) {
          active = 0
          continue
        }

        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const nextX = x + offsetX
          if (nextX < 0 || nextX >= width || !mask[nextY * width + nextX]) {
            active = 0
            break
          }
        }
      }

      output[y * width + x] = active
    }
  }

  return output
}

function extractContours(mask: Uint8Array, width: number, height: number) {
  const labels = new Int32Array(mask.length)
  const components: BasicContour[] = []
  let label = 1

  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index] || labels[index]) {
      continue
    }

    const queue = [index]
    const pixels: number[] = []
    let pointer = 0
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let sumX = 0
    let sumY = 0

    labels[index] = label

    while (pointer < queue.length) {
      const current = queue[pointer]
      pointer += 1
      pixels.push(current)

      const x = current % width
      const y = Math.floor(current / width)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      sumX += x
      sumY += y

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) {
            continue
          }

          const nextX = x + offsetX
          const nextY = y + offsetY

          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            continue
          }

          const nextIndex = nextY * width + nextX
          if (mask[nextIndex] && labels[nextIndex] === 0) {
            labels[nextIndex] = label
            queue.push(nextIndex)
          }
        }
      }
    }

    if (pixels.length < 42) {
      for (const pixel of pixels) {
        labels[pixel] = 0
      }
      continue
    }

    components.push({
      label,
      pixels,
      area: pixels.length,
      boundary: findBoundaryPixels(mask, pixels, width, height),
      bounds: {
        minX,
        minY,
        maxX,
        maxY,
      },
      centroidX: sumX / pixels.length,
      centroidY: sumY / pixels.length,
    })
    label += 1
  }

  const boundaryLabels = new Int32Array(mask.length)
  for (const component of components) {
    for (const pixel of component.boundary) {
      boundaryLabels[pixel] = component.label
    }
  }

  return {
    components,
    labels,
    boundaryLabels,
    sourceMask: mask,
  }
}

function findBoundaryPixels(
  mask: Uint8Array,
  pixels: number[],
  width: number,
  height: number,
) {
  const boundary: number[] = []

  for (const pixel of pixels) {
    const x = pixel % width
    const y = Math.floor(pixel / width)
    let isBoundary = false

    for (let offsetY = -1; offsetY <= 1 && !isBoundary; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue
        }

        const nextX = x + offsetX
        const nextY = y + offsetY

        if (
          nextX < 0 ||
          nextX >= width ||
          nextY < 0 ||
          nextY >= height ||
          !mask[nextY * width + nextX]
        ) {
          isBoundary = true
          break
        }
      }
    }

    if (isBoundary) {
      boundary.push(pixel)
    }
  }

  return boundary
}

function scoreContour(
  component: BasicContour,
  targetMask: Uint8Array,
  targetArea: number,
  edges: Uint8Array,
  width: number,
  height: number,
): ScoredContour {
  const overlap = countTargetOverlap(component.pixels, targetMask)
  const coverage = overlap / targetArea
  const purity = overlap / component.pixels.length
  const edgeScore = computeEdgeScore(component.boundary, edges, width, height, component.bounds)
  const sizeScore = clamp01(
    1 - Math.abs(component.area - targetArea) / Math.max(targetArea, component.area),
  )
  const contourBase = coverage * 0.46 + purity * 0.24 + sizeScore * 0.14
  const confidence = clamp01(contourBase * (0.45 + edgeScore * 0.55) + edgeScore * 0.16)

  return {
    ...component,
    coverage,
    purity,
    edgeScore,
    sizeScore,
    confidence,
  }
}

function countTargetOverlap(pixels: number[], targetMask: Uint8Array) {
  let overlap = 0

  for (const pixel of pixels) {
    overlap += targetMask[pixel]
  }

  return overlap
}

function computeEdgeScore(
  boundary: number[],
  edges: Uint8Array,
  width: number,
  height: number,
  bounds: BoundingBox,
) {
  if (boundary.length === 0) {
    return 0
  }

  let supportedBoundary = 0
  for (const pixel of boundary) {
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (hasEdgeNeighbor(edges, width, height, x, y)) {
      supportedBoundary += 1
    }
  }

  const boundarySupport = supportedBoundary / boundary.length
  let edgePixelsInBox = 0
  const minX = clamp(bounds.minX - 4, 0, width - 1)
  const minY = clamp(bounds.minY - 4, 0, height - 1)
  const maxX = clamp(bounds.maxX + 4, 0, width - 1)
  const maxY = clamp(bounds.maxY + 4, 0, height - 1)

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      edgePixelsInBox += edges[y * width + x]
    }
  }

  const edgeFocus = supportedBoundary / Math.max(edgePixelsInBox, supportedBoundary, 1)
  return clamp01(boundarySupport * 0.58 + edgeFocus * 0.42)
}

function hasEdgeNeighbor(
  edges: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const nextX = x + offsetX
      const nextY = y + offsetY

      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
        continue
      }

      if (edges[nextY * width + nextX]) {
        return true
      }
    }
  }

  return false
}

function countActivePixels(mask: Uint8Array) {
  let total = 0

  for (const pixel of mask) {
    total += pixel
  }

  return total
}

function renderProcessedFrame({
  width,
  height,
  baseImage,
  mask,
  edges,
  labels,
  boundaryLabels,
  bestLabel,
  display,
}: {
  width: number
  height: number
  baseImage: Float32Array
  mask: Uint8Array
  edges: Uint8Array
  labels: Int32Array
  boundaryLabels: Int32Array
  bestLabel: number
  display: FindShapeProgram['display']
}) {
  const output = new Uint8ClampedArray(width * height * 4)

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const outputIndex = pixel * 4
    const intensity = baseImage[pixel] / 255
    const label = labels[pixel]
    let red = 6 + intensity * 22
    let green = 12 + intensity * 28
    let blue = 18 + intensity * 32

    if (display.showMask && mask[pixel]) {
      red += 18
      green += 34
      blue += 42
    }

    if (label === bestLabel && bestLabel !== 0) {
      red = red * 0.35 + 164
      green = green * 0.28 + 108
      blue = blue * 0.18 + 26
    } else if (display.showMask && label !== 0) {
      red += 12
      green += 6
      blue += 3
    }

    if (edges[pixel]) {
      red += 8
      green += 48
      blue += 72
    }

    if (display.showContours && boundaryLabels[pixel]) {
      if (boundaryLabels[pixel] === bestLabel) {
        red = 255
        green = 202
        blue = 108
      } else {
        red = 110
        green = 214
        blue = 255
      }
    }

    output[outputIndex] = clampChannel(red)
    output[outputIndex + 1] = clampChannel(green)
    output[outputIndex + 2] = clampChannel(blue)
    output[outputIndex + 3] = 255
  }

  return {
    width,
    height,
    data: output,
  }
}

function renderOverlayFrame({
  source,
  width,
  height,
  labels,
  boundaryLabels,
  bestLabel,
  showMask,
  showContours,
  success,
}: {
  source: Uint8ClampedArray
  width: number
  height: number
  labels: Int32Array
  boundaryLabels: Int32Array
  bestLabel: number
  showMask: boolean
  showContours: boolean
  success: boolean
}) {
  const output = new Uint8ClampedArray(source)
  const bestBoundaryColor = success ? [128, 255, 190] : [255, 191, 99]

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const outputIndex = pixel * 4
    const label = labels[pixel]

    if (showMask && label !== 0) {
      const alpha = label === bestLabel ? 0.18 : 0.08
      const fill = label === bestLabel ? [255, 190, 108] : [92, 208, 255]
      output[outputIndex] = blendChannel(output[outputIndex], fill[0], alpha)
      output[outputIndex + 1] = blendChannel(output[outputIndex + 1], fill[1], alpha)
      output[outputIndex + 2] = blendChannel(output[outputIndex + 2], fill[2], alpha)
    }

    if (showContours && boundaryLabels[pixel]) {
      const stroke =
        boundaryLabels[pixel] === bestLabel ? bestBoundaryColor : [112, 226, 255]
      output[outputIndex] = stroke[0]
      output[outputIndex + 1] = stroke[1]
      output[outputIndex + 2] = stroke[2]
    }
  }

  return {
    width,
    height,
    data: output,
  }
}

function blendChannel(base: number, overlay: number, alpha: number) {
  return clampChannel(base * (1 - alpha) + overlay * alpha)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function clamp01(value: number) {
  return clamp(value, 0, 1)
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}
