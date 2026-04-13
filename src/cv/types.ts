export interface VisionFrame {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface Point {
  x: number
  y: number
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface DetectionMetrics {
  coverage: number
  purity: number
  edgeScore: number
  activePixels: number
  edgePixels: number
}

export interface DetectionContour {
  label: number
  area: number
  boundarySize: number
  centroid: Point
  bounds: BoundingBox
  coverage: number
  purity: number
  edgeScore: number
  sizeScore: number
  confidence: number
}

export type PipelineLineState = 'success' | 'weak' | 'failed' | 'disabled'

export interface PipelineLineReport {
  stepId: string
  state: PipelineLineState
  message: string
}

export type DetectionSystemState = 'stable' | 'unstable' | 'failed'

export interface DetectionResult {
  processedFrame: VisionFrame
  overlayFrame: VisionFrame
  componentCount: number
  bestContour: DetectionContour | null
  confidence: number
  statusText: string
  systemState: DetectionSystemState
  success: boolean
  primaryIssue: string
  nextAction: string
  breakingStepId: string | null
  diagnostics: string[]
  metrics: DetectionMetrics
  lineReports: PipelineLineReport[]
  errorCount: number
  warningCount: number
  activeStageLabel: string
}
