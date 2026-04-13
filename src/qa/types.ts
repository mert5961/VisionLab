export interface QaCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

export interface GameplayQaReport {
  checks: QaCheck[]
  debugSummary: string
}

export interface UiQaReport {
  checks: QaCheck[]
  layoutShiftPx: number
}
