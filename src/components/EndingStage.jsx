import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { PerspectiveCamera, Line } from '@react-three/drei'
import Biome from './biome/Biome'
import RaccoonCharacter from './RaccoonCharacter'
import Particles from './biome/Particles'
import { crossfadeTo } from '../utils/music'

const END_MUSIC_SRC = '/audio/endmapache.wav'

function PortalSigils({ radius, count, speed, size, color }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * speed })
  return (
    <group ref={ref}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]} rotation={[0, 0, a]}>
            <octahedronGeometry args={[size, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
          </mesh>
        )
      })}
    </group>
  )
}

function SpiralArm({ rotationSpeed, color, radius, turns = 2.4 }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * rotationSpeed })
  const points = useMemo(() => {
    const pts = []
    const n = 48
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const angle = t * Math.PI * 2 * turns
      const r = t * radius
      pts.push([Math.cos(angle) * r, Math.sin(angle) * r, 0])
    }
    return pts
  }, [radius, turns])
  return (
    <group ref={ref}>
      <Line points={points} color={color} lineWidth={2.5} transparent opacity={0.75} />
    </group>
  )
}

function EmberSpark({ radius, speed, offset, height }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed + offset
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t) * radius * 0.4, -6 + Math.sin(t * 1.7) * 0.6)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 6, 6]} />
      <meshStandardMaterial color="#fed7aa" emissive="#f97316" emissiveIntensity={1.8} />
    </mesh>
  )
}

function MysticPortal({ position = [0, 3.2, -6] }) {
  const outerRef = useRef()
  const midRef = useRef()
  const glowRef = useRef()
  useFrame(({ clock }, dt) => {
    if (outerRef.current) outerRef.current.rotation.z += dt * 0.16
    if (midRef.current) midRef.current.rotation.z -= dt * 0.26
    if (glowRef.current) glowRef.current.material.opacity = 0.12 + Math.sin(clock.getElapsedTime() * 1.4) * 0.05
  })
  return (
    <group position={position}>
      <mesh ref={glowRef}><circleGeometry args={[4.7, 48]} /><meshBasicMaterial color="#fb923c" transparent opacity={0.14} /></mesh>
      <mesh><circleGeometry args={[3.6, 48]} /><meshBasicMaterial color="#1e1b4b" transparent opacity={0.6} /></mesh>

      <SpiralArm rotationSpeed={0.55} color="#fb923c" radius={3.4} turns={2.2} />
      <SpiralArm rotationSpeed={-0.4} color="#f59e0b" radius={3.0} turns={1.8} />
      <SpiralArm rotationSpeed={0.5} color="#fde047" radius={2.3} turns={2.6} />

      <group ref={midRef}>
        <mesh><torusGeometry args={[3.5, 0.06, 8, 56]} /><meshStandardMaterial color="#fdba74" emissive="#f97316" emissiveIntensity={0.9} /></mesh>
        <PortalSigils radius={3.5} count={12} speed={0.32} size={0.09} color="#fed7aa" />
      </group>

      <group ref={outerRef}>
        <mesh><torusGeometry args={[4.05, 0.15, 10, 60]} /><meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.9} metalness={0.4} roughness={0.3} /></mesh>
        <PortalSigils radius={4.05} count={16} speed={-0.22} size={0.06} color="#fdba74" />
      </group>

      {Array.from({ length: 14 }).map((_, i) => (
        <EmberSpark key={i} radius={3.6 + Math.random() * 1.4} speed={0.25 + Math.random() * 0.3} offset={Math.random() * Math.PI * 2} height={3.2} />
      ))}

      <pointLight color="#f97316" intensity={4.5} distance={16} />
      <pointLight color="#fde047" intensity={1.5} distance={10} position={[0, 0, 1]} />
    </group>
  )
}

const CONFETTI_COLORS = ['#fde68a', '#fb923c', '#f472b6', '#4ade80', '#60a5fa', '#c4b5fd', '#f87171']

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2.4,
    duration: 3.2 + Math.random() * 2.4,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    drift: (Math.random() * 2 - 1) * 60,
    round: Math.random() < 0.5,
  })), [])
  return (
    <div className="confetti-layer">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

function Fireworks() {
  const bursts = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    left: 12 + Math.random() * 76,
    top: 8 + Math.random() * 40,
    delay: Math.random() * 3,
    color: CONFETTI_COLORS[(i * 2) % CONFETTI_COLORS.length],
  })), [])
  return (
    <div className="fireworks-layer">
      {bursts.map((b) => (
        <span key={b.id} className="firework-burst" style={{ left: `${b.left}%`, top: `${b.top}%`, animationDelay: `${b.delay}s`, '--fw-color': b.color }} />
      ))}
    </div>
  )
}

export default function EndingStage({ svgRef, message, onRestart }) {
  // dialogue -> waving -> walking -> flash -> celebrate
  const [stage, setStage] = useState('dialogue')

  // Justo cuando aparece el letrero final de despedida, la musica de fondo
  // se apaga con fundido y entra la pista de cierre con fundido de entrada.
  useEffect(() => {
    crossfadeTo(END_MUSIC_SRC, { volume: 0.45, duration: 1800 })
  }, [])

  const handleAyoosh = () => {
    setStage('waving')
    setTimeout(() => setStage('walking'), 1300)
  }

  useEffect(() => {
    if (stage !== 'walking') return
    const t = setTimeout(() => setStage('flash'), 2300)
    return () => clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'flash') return
    const t = setTimeout(() => setStage('celebrate'), 650)
    return () => clearTimeout(t)
  }, [stage])

  const mood = stage === 'waving' ? 'waving' : stage === 'walking' ? 'walking-to-portal' : 'talking'
  const showRaccoon = stage !== 'flash' && stage !== 'celebrate'

  return (
    <div className="app-root">
      <div className="canvas-layer">
        <Canvas flat dpr={[1, 1.75]}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 2, 13]} fov={45} />
            <Biome type="portal_tower" />
            <MysticPortal position={[0, 3.2, -6]} />
            <Particles count={160} color="#fde68a" size={0.1} area={[24, 16, 20]} yBase={-2} speed={1.3} />
          </Suspense>
        </Canvas>
      </div>

      {showRaccoon && <RaccoonCharacter ref={svgRef} mood={mood} />}

      {stage === 'dialogue' && (
        <div className="dialog-bubble-wrap" style={{ bottom: '30vh' }}>
          <div className="dialog-bubble ending-bubble">
            <div className="name-badge">Mapache Mapachoso</div>
            <h2 className="ending-title text-xl text-amber-900 mt-2 mb-2">¡2026, aquí estamos! 🚀</h2>
            <div className="text-sm text-amber-950 leading-relaxed text-left max-h-[34vh] overflow-y-auto px-1 pr-2">
              {message.split(/\n+/).map((p, i) => <p key={i} className="mb-2">{p}</p>)}
            </div>
            <button className="btn-action w-auto px-8 py-3 mt-3" onClick={handleAyoosh}>¡Ayoosh! 🍇</button>
          </div>
        </div>
      )}

      {stage === 'flash' && <div className="portal-flash" />}

      {stage === 'celebrate' && (
        <div className="celebrate-screen">
          <Confetti />
          <Fireworks />
          <div className="celebrate-emoji-row" aria-hidden="true">🎉 🍇 ✨ 🎊 🥳 ✨ 🍇 🎉</div>
          <h1 className="celebrate-title">¡Felicidades, ganaste! 🏆</h1>
          <div className="celebrate-image-wrap">
            <img src="/images/mapacheend.jpg" alt="Mapache Mapachoso" className="celebrate-image" />
          </div>
          <button className="btn-action w-auto px-8 py-3 mt-2" style={{ position: 'relative', zIndex: 2 }} onClick={onRestart}>🔄 Jugar otra vez</button>
        </div>
      )}
    </div>
  )
}
