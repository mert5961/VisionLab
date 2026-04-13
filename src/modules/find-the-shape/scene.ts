import type { Point } from '../../cv/types'
import type { FindShapeScene, FindShapeSceneOptions } from './types'

type ShapeKind = 'polygon' | 'circle' | 'roundRect'

interface ShapeSpec {
  kind: ShapeKind
  center: Point
  radius?: number
  sides?: number
  rotation?: number
  width?: number
  height?: number
  cornerRadius?: number
  fill: string
  stroke: string
  detail: string
  glow: string
  lineWidth: number
  target?: boolean
}

const WIDTH = 400
const HEIGHT = 300

export function createFindShapeScene(
  seed = 1041,
  options: FindShapeSceneOptions = {},
): FindShapeScene {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('2D canvas context is unavailable in this browser.')
  }

  const rng = createRng(seed)

  drawBackground(ctx, WIDTH, HEIGHT, rng)

  const variant = options.variant ?? 'baseline'
  const targetRadiusBase =
    variant === 'false-target' ? 42 : variant === 'crowded' ? 50 : 54

  const targetCenter = {
    x: 268 + jitter(rng, -12, 12),
    y: 154 + jitter(rng, -10, 10),
  }
  const targetRadius =
    targetRadiusBase + jitter(rng, -4, 6) + (options.targetRadiusOffset ?? 0)
  const targetOutline = regularPolygonPoints(targetCenter, targetRadius, 6, Math.PI / 6)

  const shapes: ShapeSpec[] = [
    {
      kind: 'circle',
      center: {
        x: 106 + jitter(rng, -8, 8),
        y: 96 + jitter(rng, -8, 10),
      },
      radius:
        (variant === 'false-target' ? 52 : 34) + jitter(rng, -2, 4),
      fill: 'rgba(48, 126, 162, 0.76)',
      stroke: 'rgba(132, 223, 255, 0.82)',
      detail: 'rgba(154, 236, 255, 0.5)',
      glow: 'rgba(69, 182, 255, 0.28)',
      lineWidth: 2.25,
    },
    {
      kind: 'roundRect',
      center: {
        x: 326 + jitter(rng, -8, 10),
        y: 84 + jitter(rng, -6, 6),
      },
      width: 76 + jitter(rng, -6, 8),
      height: 40 + jitter(rng, -4, 4),
      cornerRadius: 12,
      fill: 'rgba(49, 123, 110, 0.74)',
      stroke: 'rgba(122, 230, 204, 0.78)',
      detail: 'rgba(174, 255, 223, 0.36)',
      glow: 'rgba(77, 229, 180, 0.22)',
      lineWidth: 2.1,
    },
    {
      kind: 'polygon',
      center: {
        x: 124 + jitter(rng, -10, 10),
        y: 220 + jitter(rng, -8, 8),
      },
      radius:
        (variant === 'crowded' ? 38 : 42) + jitter(rng, -3, 3),
      sides: 3,
      rotation: Math.PI / 2,
      fill: 'rgba(170, 67, 86, 0.74)',
      stroke: 'rgba(255, 162, 168, 0.72)',
      detail: 'rgba(255, 210, 214, 0.4)',
      glow: 'rgba(255, 88, 110, 0.22)',
      lineWidth: 2.15,
    },
    {
      kind: 'polygon',
      center: {
        x: 322 + jitter(rng, -8, 8),
        y: 238 + jitter(rng, -8, 8),
      },
      radius: 34 + jitter(rng, -2, 4),
      sides: 5,
      rotation: Math.PI / 10,
      fill: 'rgba(75, 104, 148, 0.7)',
      stroke: 'rgba(174, 202, 255, 0.74)',
      detail: 'rgba(206, 220, 255, 0.36)',
      glow: 'rgba(127, 165, 255, 0.16)',
      lineWidth: 2.05,
    },
    {
      kind: 'polygon',
      center: targetCenter,
      radius: targetRadius,
      sides: 6,
      rotation: Math.PI / 6,
      fill: 'rgba(246, 180, 82, 0.9)',
      stroke: 'rgba(255, 229, 167, 0.94)',
      detail: 'rgba(255, 239, 202, 0.6)',
      glow: 'rgba(255, 186, 82, 0.34)',
      lineWidth: 2.35,
      target: true,
    },
  ]

  if (variant === 'crowded') {
    shapes.push(
      {
        kind: 'roundRect',
        center: {
          x: 186 + jitter(rng, -6, 6),
          y: 72 + jitter(rng, -4, 6),
        },
        width: 58 + jitter(rng, -4, 4),
        height: 30 + jitter(rng, -2, 4),
        cornerRadius: 10,
        fill: 'rgba(79, 110, 102, 0.58)',
        stroke: 'rgba(159, 215, 188, 0.52)',
        detail: 'rgba(210, 255, 231, 0.26)',
        glow: 'rgba(100, 222, 187, 0.14)',
        lineWidth: 1.8,
      },
      {
        kind: 'polygon',
        center: {
          x: 204 + jitter(rng, -7, 7),
          y: 246 + jitter(rng, -5, 5),
        },
        radius: 24 + jitter(rng, -2, 2),
        sides: 6,
        rotation: Math.PI / 6,
        fill: 'rgba(75, 104, 148, 0.5)',
        stroke: 'rgba(174, 202, 255, 0.44)',
        detail: 'rgba(206, 220, 255, 0.18)',
        glow: 'rgba(127, 165, 255, 0.12)',
        lineWidth: 1.7,
      },
    )
  }

  drawReferenceMarks(ctx, WIDTH, HEIGHT, rng)
  shapes.forEach((shape) => drawShape(ctx, shape))
  drawSignalInterference(ctx, WIDTH, HEIGHT, rng)

  const renderedFrame = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  addNoise(renderedFrame.data, rng, WIDTH, HEIGHT)

  const targetMask = rasterizeTargetMask(WIDTH, HEIGHT, targetOutline)

  return {
    seed,
    width: WIDTH,
    height: HEIGHT,
    sourceFrame: {
      width: WIDTH,
      height: HEIGHT,
      data: new Uint8ClampedArray(renderedFrame.data),
    },
    lumaFrames: buildLumaFrames(renderedFrame.data),
    targetMask,
    targetArea: countMaskPixels(targetMask),
    targetOutline,
    targetLabel: options.targetLabel ?? 'HEX relay core',
    targetCode: options.targetCode ?? 'HX-17',
  }
}

function createRng(seed: number) {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function jitter(rng: () => number, min: number, max: number) {
  return Math.round(min + (max - min) * rng())
}

function regularPolygonPoints(
  center: Point,
  radius: number,
  sides: number,
  rotation = 0,
) {
  const points: Point[] = []

  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    })
  }

  return points
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
) {
  const baseGradient = ctx.createLinearGradient(0, 0, width, height)
  baseGradient.addColorStop(0, '#061015')
  baseGradient.addColorStop(0.55, '#0b141a')
  baseGradient.addColorStop(1, '#04090d')
  ctx.fillStyle = baseGradient
  ctx.fillRect(0, 0, width, height)

  const bloom = ctx.createRadialGradient(width * 0.62, height * 0.52, 24, width * 0.62, height * 0.52, width * 0.55)
  bloom.addColorStop(0, 'rgba(61, 128, 170, 0.16)')
  bloom.addColorStop(0.55, 'rgba(21, 69, 96, 0.12)')
  bloom.addColorStop(1, 'rgba(4, 9, 13, 0)')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.strokeStyle = 'rgba(96, 174, 206, 0.08)'
  ctx.lineWidth = 1

  for (let x = 18; x < width; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 14; y < height; y += 24) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(64, 154, 190, 0.05)'
  for (let row = -height; row < height; row += 28) {
    ctx.beginPath()
    ctx.moveTo(0, row)
    ctx.lineTo(width, row + height * 0.5)
    ctx.stroke()
  }

  ctx.restore()

  const sweep = ctx.createLinearGradient(width * 0.18, 0, width * 0.65, 0)
  sweep.addColorStop(0, 'rgba(0, 0, 0, 0)')
  sweep.addColorStop(0.55, 'rgba(89, 213, 255, 0.06)')
  sweep.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = sweep
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(118, 232, 255, 0.06)'
  for (let index = 0; index < 18; index += 1) {
    const px = 24 + rng() * (width - 48)
    const py = 22 + rng() * (height - 44)
    ctx.fillRect(px, py, 2, 2)
  }
}

function drawReferenceMarks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(121, 218, 255, 0.12)'
  ctx.lineWidth = 1

  for (let index = 0; index < 6; index += 1) {
    const x = 30 + index * 62 + jitter(rng, -6, 6)
    const y = 20 + jitter(rng, -4, 6)
    ctx.beginPath()
    ctx.moveTo(x - 8, y)
    ctx.lineTo(x + 8, y)
    ctx.moveTo(x, y - 8)
    ctx.lineTo(x, y + 8)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255, 194, 108, 0.12)'
  ctx.beginPath()
  ctx.arc(width * 0.63, height * 0.52, 86, Math.PI * 0.32, Math.PI * 1.34)
  ctx.stroke()
  ctx.restore()
}

function drawShape(ctx: CanvasRenderingContext2D, shape: ShapeSpec) {
  ctx.save()
  ctx.shadowBlur = shape.target ? 24 : 18
  ctx.shadowColor = shape.glow
  ctx.fillStyle = shape.fill
  ctx.strokeStyle = shape.stroke
  ctx.lineWidth = shape.lineWidth

  traceShape(ctx, shape)
  ctx.fill()
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.strokeStyle = shape.detail
  ctx.lineWidth = 1.1

  if (shape.kind === 'circle' && shape.radius) {
    ctx.beginPath()
    ctx.arc(shape.center.x, shape.center.y, shape.radius * 0.52, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(shape.center.x - shape.radius * 0.8, shape.center.y)
    ctx.lineTo(shape.center.x + shape.radius * 0.8, shape.center.y)
    ctx.moveTo(shape.center.x, shape.center.y - shape.radius * 0.8)
    ctx.lineTo(shape.center.x, shape.center.y + shape.radius * 0.8)
    ctx.stroke()
  }

  if (shape.kind === 'roundRect' && shape.width && shape.height) {
    ctx.beginPath()
    ctx.moveTo(shape.center.x - shape.width * 0.22, shape.center.y)
    ctx.lineTo(shape.center.x + shape.width * 0.22, shape.center.y)
    ctx.moveTo(shape.center.x, shape.center.y - shape.height * 0.28)
    ctx.lineTo(shape.center.x, shape.center.y + shape.height * 0.28)
    ctx.stroke()
  }

  if (shape.kind === 'polygon' && shape.radius) {
    ctx.beginPath()
    ctx.arc(shape.center.x, shape.center.y, shape.radius * 0.28, 0, Math.PI * 2)
    ctx.stroke()

    if (shape.target) {
      ctx.beginPath()
      ctx.moveTo(shape.center.x - shape.radius * 0.5, shape.center.y)
      ctx.lineTo(shape.center.x + shape.radius * 0.5, shape.center.y)
      ctx.moveTo(shape.center.x - shape.radius * 0.2, shape.center.y - shape.radius * 0.34)
      ctx.lineTo(shape.center.x + shape.radius * 0.2, shape.center.y + shape.radius * 0.34)
      ctx.moveTo(shape.center.x - shape.radius * 0.2, shape.center.y + shape.radius * 0.34)
      ctx.lineTo(shape.center.x + shape.radius * 0.2, shape.center.y - shape.radius * 0.34)
      ctx.stroke()
    }
  }

  ctx.restore()
}

function traceShape(ctx: CanvasRenderingContext2D, shape: ShapeSpec) {
  ctx.beginPath()

  if (shape.kind === 'circle' && shape.radius) {
    ctx.arc(shape.center.x, shape.center.y, shape.radius, 0, Math.PI * 2)
    return
  }

  if (shape.kind === 'roundRect' && shape.width && shape.height) {
    const x = shape.center.x - shape.width / 2
    const y = shape.center.y - shape.height / 2
    const radius = shape.cornerRadius ?? 12
    ctx.roundRect(x, y, shape.width, shape.height, radius)
    return
  }

  if (shape.kind === 'polygon' && shape.radius && shape.sides) {
    const points = regularPolygonPoints(
      shape.center,
      shape.radius,
      shape.sides,
      shape.rotation ?? 0,
    )

    ctx.moveTo(points[0].x, points[0].y)

    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y)
    }

    ctx.closePath()
  }
}

function drawSignalInterference(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(86, 215, 255, 0.22)'
  ctx.lineWidth = 1.2

  for (let index = 0; index < 8; index += 1) {
    const y = 42 + index * 28 + jitter(rng, -3, 3)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(width * 0.22, y - 8, width * 0.58, y + 10, width, y - 4)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255, 192, 108, 0.12)'
  ctx.beginPath()
  ctx.moveTo(width * 0.54, 0)
  ctx.lineTo(width * 0.7, height)
  ctx.stroke()

  ctx.fillStyle = 'rgba(153, 233, 255, 0.18)'
  for (let index = 0; index < 14; index += 1) {
    const x = 36 + rng() * (width - 72)
    const y = 24 + rng() * (height - 48)
    ctx.fillRect(x, y, 1.5, 7 + rng() * 10)
  }

  ctx.restore()
}

function addNoise(
  data: Uint8ClampedArray,
  rng: () => number,
  width: number,
  height: number,
) {
  for (let y = 0; y < height; y += 1) {
    const scanlineFactor = y % 3 === 0 ? 0.93 : 1

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const grain = (rng() - 0.5) * 12
      const blueBoost = (rng() - 0.5) * 16

      data[index] = clampChannel((data[index] + grain + 2) * scanlineFactor)
      data[index + 1] = clampChannel((data[index + 1] + grain * 0.85 + 4) * scanlineFactor)
      data[index + 2] = clampChannel((data[index + 2] + grain * 0.65 + blueBoost + 8) * scanlineFactor)

      if (rng() > 0.998) {
        data[index] = clampChannel(data[index] + 18)
        data[index + 1] = clampChannel(data[index + 1] + 42)
        data[index + 2] = clampChannel(data[index + 2] + 48)
      }
    }
  }
}

function rasterizeTargetMask(width: number, height: number, targetOutline: Point[]) {
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height

  const maskContext = maskCanvas.getContext('2d')

  if (!maskContext) {
    throw new Error('2D mask context is unavailable in this browser.')
  }

  maskContext.fillStyle = '#ffffff'
  maskContext.beginPath()
  maskContext.moveTo(targetOutline[0].x, targetOutline[0].y)

  for (let index = 1; index < targetOutline.length; index += 1) {
    maskContext.lineTo(targetOutline[index].x, targetOutline[index].y)
  }

  maskContext.closePath()
  maskContext.fill()

  const imageData = maskContext.getImageData(0, 0, width, height).data
  const mask = new Uint8Array(width * height)

  for (let index = 0; index < mask.length; index += 1) {
    mask[index] = imageData[index * 4 + 3] > 0 ? 1 : 0
  }

  return mask
}

function countMaskPixels(mask: Uint8Array) {
  let total = 0

  for (let index = 0; index < mask.length; index += 1) {
    total += mask[index]
  }

  return total
}

function buildLumaFrames(source: Uint8ClampedArray) {
  const grayscale = new Float32Array(source.length / 4)
  const maxChannel = new Float32Array(source.length / 4)

  for (let pixel = 0; pixel < grayscale.length; pixel += 1) {
    const index = pixel * 4
    const red = source[index]
    const green = source[index + 1]
    const blue = source[index + 2]
    grayscale[pixel] = red * 0.2126 + green * 0.7152 + blue * 0.0722
    maxChannel[pixel] = Math.max(red, green, blue)
  }

  return {
    grayscale,
    maxChannel,
  }
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}
