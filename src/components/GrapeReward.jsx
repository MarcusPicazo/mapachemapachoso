import { useEffect, useRef, useState, useCallback } from 'react'
import { MOUTH_FRACTION } from './RaccoonCharacter'
import { sfx } from '../utils/audio'

function getMouthScreenPosition(svgEl) {
  if (!svgEl) return null
  const rect = svgEl.getBoundingClientRect()
  return {
    x: rect.left + rect.width * MOUTH_FRACTION.x,
    y: rect.top + rect.height * MOUTH_FRACTION.y,
  }
}

function Sparkle({ x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="grape-sparkle" style={{ left: x, top: y }}>
      <span>😋</span>
      <span className="spark spark-a">✨</span>
      <span className="spark spark-b">💜</span>
      <span className="spark spark-c">✨</span>
    </div>
  )
}

const GRAPE_DOTS = [
  [20, 30], [35, 25], [50, 30],
  [15, 46], [35, 43], [55, 46],
  [23, 62], [47, 62],
  [35, 76],
]

function GrapeBunchSvg({ id }) {
  const gradId = `grapeGrad-${id}`
  const shineId = `grapeShine-${id}`
  return (
    <svg viewBox="0 0 70 92" className="grape-svg">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="55%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#581c87" />
        </radialGradient>
        <radialGradient id={shineId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Tallo */}
      <path d="M 35,4 C 33,10 34,15 35,22" fill="none" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Hoja */}
      <path d="M 35,6 C 20,2 8,10 10,22 C 22,24 34,18 35,6 Z" fill="#4d7c0f" stroke="#365314" strokeWidth="1.2" />
      <path d="M 35,6 C 26,9 16,14 11,21" fill="none" stroke="#84cc16" strokeWidth="1" opacity="0.7" />
      {/* Racimo de uvas */}
      {GRAPE_DOTS.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="9.2" fill={`url(#${gradId})`} stroke="#4c1d95" strokeWidth="1" />
          <ellipse cx={cx - 2.6} cy={cy - 3.2} rx="3" ry="2" fill={`url(#${shineId})`} />
        </g>
      ))}
    </svg>
  )
}

function Grape({ id, x, y, delay, onEaten, onSparkle, mouthRef }) {
  const nodeRef = useRef(null)
  const pos = useRef({ x, y, startX: x, startY: y })
  const dragging = useRef(false)
  const eaten = useRef(false)

  const setTransform = (dx, dy) => {
    if (nodeRef.current) nodeRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${dragging.current ? 1.15 : 1})`
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    dragging.current = true
    nodeRef.current.setPointerCapture?.(e.pointerId)
    sfx.click()
  }

  const onPointerMove = useCallback((e) => {
    if (!dragging.current || eaten.current) return
    pos.current.x = e.clientX
    pos.current.y = e.clientY
    setTransform(pos.current.x - pos.current.startX, pos.current.y - pos.current.startY)
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current || eaten.current) return
    dragging.current = false
    const mouth = getMouthScreenPosition(mouthRef.current)
    if (mouth) {
      const dx = pos.current.x - mouth.x
      const dy = pos.current.y - mouth.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 70) {
        eaten.current = true
        sfx.bite()
        onSparkle(mouth)
        if (nodeRef.current) {
          nodeRef.current.style.transition = 'transform 0.15s ease, opacity 0.15s ease'
          nodeRef.current.style.opacity = '0'
          nodeRef.current.style.transform = `translate3d(${mouth.x - pos.current.startX}px, ${mouth.y - pos.current.startY}px, 0) scale(0.2)`
        }
        setTimeout(() => onEaten(id), 150)
        return
      }
    }
    // snap back
    if (nodeRef.current) {
      nodeRef.current.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'
      setTransform(0, 0)
      setTimeout(() => { if (nodeRef.current) nodeRef.current.style.transition = '' }, 260)
    }
    pos.current.x = pos.current.startX
    pos.current.y = pos.current.startY
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, onEaten])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  return (
    <div
      ref={nodeRef}
      onPointerDown={onPointerDown}
      onAnimationEnd={() => { if (nodeRef.current) nodeRef.current.style.animation = 'none' }}
      className="grape-item grape-spawn"
      style={{ left: x, top: y, animationDelay: `${delay}ms` }}
    >
      <div className="grape-magic-ring" style={{ animationDelay: `${delay}ms` }} />
      <GrapeBunchSvg id={id} />
    </div>
  )
}

export default function GrapeReward({ active, total, svgRef, onEatOne, onAllEaten }) {
  const [grapes, setGrapes] = useState([])
  const [sparkles, setSparkles] = useState([])
  const startedRef = useRef(false)
  const sparkleId = useRef(0)

  const addSparkle = useCallback((pos) => {
    const id = sparkleId.current++
    setSparkles((s) => [...s, { id, x: pos.x, y: pos.y }])
  }, [])
  const removeSparkle = useCallback((id) => {
    setSparkles((s) => s.filter((sp) => sp.id !== id))
  }, [])

  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true
      const w = window.innerWidth
      const centerX = w / 2
      const baseY = window.innerHeight * 0.38
      const spread = Math.min(240, w * 0.5)
      const list = new Array(total).fill(0).map((_, i) => {
        const t = total === 1 ? 0.5 : i / (total - 1)
        return {
          id: i,
          x: centerX - spread / 2 + spread * t,
          y: baseY + (i % 2 === 0 ? -10 : 10),
          delay: i * 140,
        }
      })
      setGrapes(list)
    }
    if (!active) startedRef.current = false
  }, [active, total])

  const handleEaten = (id) => {
    const next = grapes.filter((g) => g.id !== id)
    setGrapes(next)
    onEatOne()
    if (next.length === 0) {
      setTimeout(() => onAllEaten(), 400)
    }
  }

  if (!active) return null

  return (
    <div className="grape-layer">
      <div className="grape-hint">¡Arrastra las uvas a la boca de Mapache Mapachoso!</div>
      {grapes.map((g) => (
        <Grape key={g.id} id={g.id} x={g.x} y={g.y} delay={g.delay} onEaten={handleEaten} onSparkle={addSparkle} mouthRef={svgRef} />
      ))}
      {sparkles.map((s) => (
        <Sparkle key={s.id} x={s.x} y={s.y} onDone={() => removeSparkle(s.id)} />
      ))}
    </div>
  )
}
