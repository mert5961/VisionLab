import type { Point, VisionFrame } from '../../cv/types'

export type FindShapeArtifactType =
  | 'source'
  | 'image'
  | 'mask'
  | 'edges'
  | 'contours'
  | 'target'

export type FindShapeOperationId =
  | 'input_image'
  | 'to_grayscale'
  | 'extract_luma'
  | 'max_channel'
  | 'gaussian_blur'
  | 'box_blur'
  | 'median_blur'
  | 'binary_threshold'
  | 'high_pass_mask'
  | 'adaptive_cutoff'
  | 'sobel_edges'
  | 'canny_edges'
  | 'laplacian_edges'
  | 'find_contours'
  | 'trace_regions'
  | 'best_contour'
  | 'largest_contour'
  | 'cleanest_contour'

export interface FindShapeParameterDefinition {
  key: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  suffix?: string
}

export interface FindShapeOperationDefinition {
  id: FindShapeOperationId
  token: string
  outputType: FindShapeArtifactType
  inputTypes: FindShapeArtifactType[]
  parameters: FindShapeParameterDefinition[]
}

export interface FindShapePipelineStep {
  id: string
  outputVar: string
  inputVars: string[]
  enabled: boolean
  locked: boolean
  functionId: FindShapeOperationId | null
  functionOptions: FindShapeOperationId[]
  parameterValues: Record<string, number | null>
}

export interface FindShapeDisplayState {
  showContours: boolean
  showMask: boolean
  showOverlay: boolean
}

export interface FindShapeProgram {
  steps: FindShapePipelineStep[]
  display: FindShapeDisplayState
}

export interface FindShapeSceneOptions {
  variant?: 'baseline' | 'crowded' | 'false-target'
  targetRadiusOffset?: number
  targetCode?: string
  targetLabel?: string
}

export interface FindShapeScene {
  seed: number
  width: number
  height: number
  sourceFrame: VisionFrame
  lumaFrames: {
    grayscale: Float32Array
    maxChannel: Float32Array
  }
  targetMask: Uint8Array
  targetArea: number
  targetOutline: Point[]
  targetLabel: string
  targetCode: string
}
