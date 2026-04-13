import type { Point } from '../cv/types'

interface TargetGlyphProps {
  points: Point[]
}

export function TargetGlyph({ points }: TargetGlyphProps) {
  const bounds = points.reduce(
    (accumulator, point) => ({
      minX: Math.min(accumulator.minX, point.x),
      minY: Math.min(accumulator.minY, point.y),
      maxX: Math.max(accumulator.maxX, point.x),
      maxY: Math.max(accumulator.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )

  const width = Math.max(bounds.maxX - bounds.minX, 1)
  const height = Math.max(bounds.maxY - bounds.minY, 1)
  const polygon = points
    .map((point) => {
      const x = ((point.x - bounds.minX) / width) * 72 + 14
      const y = ((point.y - bounds.minY) / height) * 72 + 14
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      className="target-glyph"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Target contour reference"
    >
      <defs>
        <linearGradient id="targetGlyphFill" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 215, 133, 0.95)" />
          <stop offset="100%" stopColor="rgba(255, 166, 66, 0.65)" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="46" fill="rgba(14, 23, 28, 0.94)" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(94, 216, 255, 0.18)" />
      <polygon
        points={polygon}
        fill="url(#targetGlyphFill)"
        stroke="rgba(255, 238, 191, 0.95)"
        strokeWidth="2.25"
      />
      <circle
        cx="50"
        cy="50"
        r="11"
        fill="none"
        stroke="rgba(255, 240, 201, 0.72)"
        strokeWidth="1.5"
      />
      <path
        d="M28 50h44M42 31l16 38M42 69l16-38"
        fill="none"
        stroke="rgba(255, 241, 210, 0.58)"
        strokeWidth="1.2"
      />
    </svg>
  )
}
