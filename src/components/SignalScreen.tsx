import { memo, useEffect, useRef } from 'react'
import type { VisionFrame } from '../cv/types'

interface SignalScreenProps {
  title: string
  kicker: string
  note: string
  accent?: 'cyan' | 'amber' | 'green'
  frame: VisionFrame
}

function SignalScreenInner({
  title,
  kicker,
  note,
  accent = 'cyan',
  frame,
}: SignalScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    canvas.width = frame.width
    canvas.height = frame.height
    context.putImageData(
      new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height),
      0,
      0,
    )
  }, [frame])

  return (
    <section className={`screen screen--${accent}`}>
      <header className="screen__header">
        <div>
          <p className="screen__kicker">{kicker}</p>
          <h3 className="screen__title">{title}</h3>
        </div>
        <span className="screen__note">{note}</span>
      </header>

      <div className="screen__canvas-frame">
        <canvas ref={canvasRef} className="screen__canvas" />
      </div>
    </section>
  )
}

export const SignalScreen = memo(SignalScreenInner)
