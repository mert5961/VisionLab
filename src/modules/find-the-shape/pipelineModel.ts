import type {
  FindShapeOperationDefinition,
  FindShapeOperationId,
  FindShapePipelineStep,
  FindShapeProgram,
} from './types'

export const findShapeOperationCatalog: Record<
  FindShapeOperationId,
  FindShapeOperationDefinition
> = {
  input_image: {
    id: 'input_image',
    token: 'input_image',
    outputType: 'source',
    inputTypes: [],
    parameters: [],
  },
  to_grayscale: {
    id: 'to_grayscale',
    token: 'to_grayscale',
    outputType: 'image',
    inputTypes: ['source'],
    parameters: [],
  },
  extract_luma: {
    id: 'extract_luma',
    token: 'extract_luma',
    outputType: 'image',
    inputTypes: ['source'],
    parameters: [],
  },
  max_channel: {
    id: 'max_channel',
    token: 'max_channel',
    outputType: 'image',
    inputTypes: ['source'],
    parameters: [],
  },
  gaussian_blur: {
    id: 'gaussian_blur',
    token: 'gaussian_blur',
    outputType: 'image',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'radius',
        label: 'radius',
        min: 0,
        max: 6,
        step: 1,
        defaultValue: 3,
        suffix: 'px',
      },
    ],
  },
  box_blur: {
    id: 'box_blur',
    token: 'box_blur',
    outputType: 'image',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'radius',
        label: 'radius',
        min: 0,
        max: 6,
        step: 1,
        defaultValue: 2,
        suffix: 'px',
      },
    ],
  },
  median_blur: {
    id: 'median_blur',
    token: 'median_blur',
    outputType: 'image',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'radius',
        label: 'radius',
        min: 0,
        max: 6,
        step: 1,
        defaultValue: 2,
        suffix: 'px',
      },
    ],
  },
  binary_threshold: {
    id: 'binary_threshold',
    token: 'binary_threshold',
    outputType: 'mask',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'level',
        label: 'level',
        min: 90,
        max: 220,
        step: 1,
        defaultValue: 166,
      },
    ],
  },
  high_pass_mask: {
    id: 'high_pass_mask',
    token: 'high_pass_mask',
    outputType: 'mask',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'level',
        label: 'level',
        min: 90,
        max: 220,
        step: 1,
        defaultValue: 182,
      },
    ],
  },
  adaptive_cutoff: {
    id: 'adaptive_cutoff',
    token: 'adaptive_cutoff',
    outputType: 'mask',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'level',
        label: 'level',
        min: 90,
        max: 220,
        step: 1,
        defaultValue: 156,
      },
    ],
  },
  sobel_edges: {
    id: 'sobel_edges',
    token: 'sobel_edges',
    outputType: 'edges',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'sensitivity',
        label: 'sensitivity',
        min: 40,
        max: 220,
        step: 1,
        defaultValue: 138,
      },
    ],
  },
  canny_edges: {
    id: 'canny_edges',
    token: 'canny_edges',
    outputType: 'edges',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'sensitivity',
        label: 'sensitivity',
        min: 40,
        max: 220,
        step: 1,
        defaultValue: 118,
      },
    ],
  },
  laplacian_edges: {
    id: 'laplacian_edges',
    token: 'laplacian_edges',
    outputType: 'edges',
    inputTypes: ['image'],
    parameters: [
      {
        key: 'sensitivity',
        label: 'sensitivity',
        min: 40,
        max: 220,
        step: 1,
        defaultValue: 124,
      },
    ],
  },
  find_contours: {
    id: 'find_contours',
    token: 'find_contours',
    outputType: 'contours',
    inputTypes: ['mask'],
    parameters: [],
  },
  trace_regions: {
    id: 'trace_regions',
    token: 'trace_regions',
    outputType: 'contours',
    inputTypes: ['mask'],
    parameters: [],
  },
  best_contour: {
    id: 'best_contour',
    token: 'best_contour',
    outputType: 'target',
    inputTypes: ['contours', 'edges'],
    parameters: [],
  },
  largest_contour: {
    id: 'largest_contour',
    token: 'largest_contour',
    outputType: 'target',
    inputTypes: ['contours', 'edges'],
    parameters: [],
  },
  cleanest_contour: {
    id: 'cleanest_contour',
    token: 'cleanest_contour',
    outputType: 'target',
    inputTypes: ['contours', 'edges'],
    parameters: [],
  },
}

export function createDefaultFindShapeProgram(): FindShapeProgram {
  return {
    steps: [
      createStep({
        id: 'step-input',
        outputVar: 'frame',
        inputVars: [],
        locked: true,
        functionId: 'input_image',
        functionOptions: ['input_image'],
      }),
      createStep({
        id: 'step-mono',
        outputVar: 'mono',
        inputVars: ['frame'],
        functionId: 'max_channel',
        functionOptions: ['to_grayscale', 'extract_luma', 'max_channel'],
      }),
      createStep({
        id: 'step-blur',
        outputVar: 'blurred',
        inputVars: ['mono'],
        functionId: 'gaussian_blur',
        functionOptions: ['gaussian_blur', 'box_blur', 'median_blur'],
      }),
      createStep({
        id: 'step-mask',
        outputVar: 'mask',
        inputVars: ['blurred'],
        functionId: null,
        functionOptions: ['binary_threshold', 'high_pass_mask', 'adaptive_cutoff'],
        parameterValues: {
          level: 168,
        },
      }),
      createStep({
        id: 'step-edges',
        outputVar: 'edges',
        inputVars: ['blurred'],
        functionId: 'sobel_edges',
        functionOptions: ['sobel_edges', 'canny_edges', 'laplacian_edges'],
      }),
      createStep({
        id: 'step-contours',
        outputVar: 'contours',
        inputVars: ['mask'],
        functionId: 'find_contours',
        functionOptions: ['find_contours', 'trace_regions'],
      }),
      createStep({
        id: 'step-target',
        outputVar: 'target',
        inputVars: ['contours', 'edges'],
        functionId: 'best_contour',
        functionOptions: ['best_contour', 'largest_contour', 'cleanest_contour'],
      }),
    ],
    display: {
      showContours: true,
      showMask: true,
      showOverlay: true,
    },
  }
}

export function createFindShapeProgramCopy(program: FindShapeProgram): FindShapeProgram {
  return {
    steps: program.steps.map((step) => ({
      ...step,
      inputVars: [...step.inputVars],
      functionOptions: [...step.functionOptions],
      parameterValues: { ...step.parameterValues },
    })),
    display: { ...program.display },
  }
}

export function createStep({
  id,
  outputVar,
  inputVars,
  functionId,
  functionOptions,
  locked = false,
  enabled = true,
  parameterValues,
}: {
  id: string
  outputVar: string
  inputVars: string[]
  functionId: FindShapeOperationId | null
  functionOptions: FindShapeOperationId[]
  locked?: boolean
  enabled?: boolean
  parameterValues?: Record<string, number | null>
}): FindShapePipelineStep {
  const resolvedValues =
    parameterValues ?? resolveDefaultParameters(functionId ?? functionOptions[0] ?? null)

  return {
    id,
    outputVar,
    inputVars,
    enabled,
    locked,
    functionId,
    functionOptions,
    parameterValues: resolvedValues,
  }
}

export function resolveDefaultParameters(functionId: FindShapeOperationId | null) {
  if (!functionId) {
    return {}
  }

  const definition = findShapeOperationCatalog[functionId]
  return Object.fromEntries(
    definition.parameters.map((parameter) => [parameter.key, parameter.defaultValue]),
  )
}
