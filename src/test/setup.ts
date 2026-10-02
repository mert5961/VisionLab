import { createCanvas } from '@napi-rs/canvas'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// Render real pixels with Skia so canonical solutions exercise the full CV pipeline.
const installCanvas = () => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: function (this: HTMLCanvasElement, type: string) {
      return type === '2d' ? createCanvas(this.width, this.height).getContext('2d') : null
    },
  })
}
installCanvas()
beforeEach(installCanvas)
