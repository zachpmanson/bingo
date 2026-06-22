import type { ConfettiSource } from '#/lib/bingo.ts'
import { useEffect, useState } from 'react'
import ReactConfetti from 'react-confetti'

export type Burst = { key: number; source: ConfettiSource }

// Fires a one-shot "pop" of confetti from `burst.source` (the on-screen
// position of the completed line). The `key` remounts the canvas so every
// completed line gets a fresh burst.
export default function Confetti({ burst }: { burst: Burst | null }) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (size.width === 0 || !burst) return null

  return (
    <ReactConfetti
      key={burst.key}
      width={size.width}
      height={size.height}
      numberOfPieces={100}
      tweenDuration={1}
      recycle={false}
      gravity={0.35}
      initialVelocityX={{ min: -15, max: 15 }}
      initialVelocityY={{ min: -22, max: 12 }}
      confettiSource={burst.source}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}
    />
  )
}
