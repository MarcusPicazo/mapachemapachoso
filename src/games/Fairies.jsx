import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const TARGET = 10
const GNOME_TARGET = 10
const N_SLOTS = 5
const CATCH_RADIUS = 0.62
const AREA_X = 3.3
const AREA_Y_MIN = 0.5
const AREA_Y_MAX = 3.0
const FAIRY_Z = -1.8
const FAIRY_COLORS = ['#f472b6', '#a78bfa', '#facc15', '#34d399', '#60a5fa']

function randomSpot() {
  return {
    x: (Math.random() * 2 - 1) * AREA_X,
    y: AREA_Y_MIN + Math.random() * (AREA_Y_MAX - AREA_Y_MIN),
  }
}

function Fairy({ color, netPosRef, netActiveRef, onCatch }) {
  const ref = useRef()
  const wingLRef = useRef()
  const wingRRef = useRef()
  const caught = useRef(false)
  const state = useRef({ base: randomSpot(), phase: Math.random() * Math.PI * 2, speed: 0.55 + Math.random() * 0.4, radius: 0.45 + Math.random() * 0.35 })

  useFrame(({ clock }) => {
    if (!ref.current || caught.current) return
    const s = state.current
    const t = clock.getElapsedTime() * s.speed + s.phase
    const x = s.base.x + Math.cos(t) * s.radius
    const y = s.base.y + Math.sin(t * 1.7) * 0.4
    ref.current.position.set(x, y, FAIRY_Z)
    const flap = Math.sin(t * 15)
    if (wingLRef.current) wingLRef.current.rotation.y = 0.5 + flap * 0.6
    if (wingRRef.current) wingRRef.current.rotation.y = -0.5 - flap * 0.6
    if (netActiveRef.current) {
      const np = netPosRef.current
      const d = Math.hypot(x - np.x, y - np.y)
      if (d < CATCH_RADIUS) {
        caught.current = true
        onCatch({ x, y })
      }
    }
  })

  return (
    <group ref={ref}>
      <pointLight color={color} intensity={0.55} distance={1.6} />
      <mesh><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} /></mesh>
      <mesh ref={wingLRef} position={[-0.09, 0.02, 0]}><planeGeometry args={[0.17, 0.24]} /><meshStandardMaterial color="#f8fafc" transparent opacity={0.55} side={2} depthWrite={false} /></mesh>
      <mesh ref={wingRRef} position={[0.09, 0.02, 0]}><planeGeometry args={[0.17, 0.24]} /><meshStandardMaterial color="#f8fafc" transparent opacity={0.55} side={2} depthWrite={false} /></mesh>
    </group>
  )
}

function Burst({ x, y, color, onDone }) {
  const ref = useRef()
  const t0 = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (!t0.current) t0.current = clock.getElapsedTime()
    const t = (clock.getElapsedTime() - t0.current) / 0.55
    if (t >= 1) { onDone(); return }
    ref.current.scale.setScalar(1 + t * 2.2)
    ref.current.children.forEach((c) => { if (c.material) c.material.opacity = 0.85 * (1 - t) })
  })
  return (
    <group ref={ref} position={[x, y, FAIRY_Z + 0.05]}>
      <mesh><ringGeometry args={[0.1, 0.16, 20]} /><meshBasicMaterial color={color} transparent opacity={0.85} /></mesh>
    </group>
  )
}

function Net({ pos, active }) {
  return (
    <group position={[pos.x, pos.y, FAIRY_Z + 0.35]} scale={active ? 1.08 : 1}>
      <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.42, 0.045, 10, 24]} /><meshStandardMaterial color="#a16207" roughness={0.6} metalness={0.2} /></mesh>
      <mesh><circleGeometry args={[0.4, 24]} /><meshStandardMaterial color="#e2e8f0" transparent opacity={active ? 0.28 : 0.16} wireframe /></mesh>
      <mesh position={[0, -0.62, 0]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.7, 8]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
    </group>
  )
}

function Gnome({ position, pulse }) {
  const ref = useRef()
  const bounce = useRef(0)
  const seenPulse = useRef(pulse)
  useFrame(({ clock }, dt) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    if (seenPulse.current !== pulse) { seenPulse.current = pulse; bounce.current = 1 }
    if (bounce.current > 0) bounce.current = Math.max(0, bounce.current - dt * 3)
    const jump = Math.sin(bounce.current * Math.PI) * 0.35
    ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.05 + jump
  })
  return (
    <group position={position} ref={ref} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow><coneGeometry args={[0.26, 0.5, 12]} /><meshStandardMaterial color="#166534" roughness={0.7} /></mesh>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.28, 0.24, 0.08, 12]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
      <group position={[0, 0.62, 0]}>
        <mesh castShadow><sphereGeometry args={[0.16, 16, 16]} /><meshStandardMaterial color="#fcd9b8" roughness={0.55} /></mesh>
        <mesh position={[0, -0.01, 0.15]}><sphereGeometry args={[0.045, 10, 10]} /><meshStandardMaterial color="#f7bc94" roughness={0.6} /></mesh>
        <mesh position={[-0.06, 0.02, 0.13]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
        <mesh position={[0.06, 0.02, 0.13]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
        <mesh position={[0, -0.14, 0.09]} rotation={[0.15, 0, 0]}><coneGeometry args={[0.1, 0.28, 10]} /><meshStandardMaterial color="#f8fafc" roughness={0.8} /></mesh>
        <mesh position={[0, 0.18, -0.01]} rotation={[0.25, 0, 0]}><coneGeometry args={[0.15, 0.4, 12]} /><meshStandardMaterial color="#b91c1c" roughness={0.65} /></mesh>
      </group>
      {/* Red del gnomo */}
      <group position={[0.32, 0.55, 0.1]} rotation={[0, 0, -0.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.16, 0.02, 8, 16]} /><meshStandardMaterial color="#92400e" /></mesh>
        <mesh position={[0, -0.32, 0]}><cylinderGeometry args={[0.02, 0.02, 0.4, 6]} /><meshStandardMaterial color="#78350f" /></mesh>
      </group>
    </group>
  )
}

export default function Fairies({ active, onWin, onLose, onHud }) {
  const [slots, setSlots] = useState(() => Array.from({ length: N_SLOTS }, (_, i) => ({ id: i, gen: 0 })))
  const [playerCount, setPlayerCount] = useState(0)
  const [gnomeCount, setGnomeCount] = useState(0)
  const [bursts, setBursts] = useState([])
  const [netPos, setNetPos] = useState({ x: 0, y: 1.6 })
  const [netActive, setNetActive] = useState(false)
  const [phase, setPhase] = useState('playing') // playing | releasing | released
  const [gnomePulse, setGnomePulse] = useState(0)
  const finished = useRef(false)
  const netPosRef = useRef(netPos)
  const netActiveRef = useRef(false)
  const burstId = useRef(0)

  const onPointerDown = (e) => {
    if (!active || finished.current || phase !== 'playing') return
    e.stopPropagation()
    netActiveRef.current = true
    setNetActive(true)
    const p = { x: e.point.x, y: e.point.y }
    netPosRef.current = p
    setNetPos(p)
  }
  const onPointerMove = (e) => {
    if (!netActiveRef.current) return
    e.stopPropagation()
    const p = { x: e.point.x, y: e.point.y }
    netPosRef.current = p
    setNetPos(p)
  }
  const onPointerUp = () => { netActiveRef.current = false; setNetActive(false) }

  const onCatch = useCallback((slotId, pos) => {
    if (finished.current || phase !== 'playing') return
    sfx.chime()
    setBursts((b) => [...b, { id: burstId.current++, x: pos.x, y: pos.y, color: FAIRY_COLORS[slotId % FAIRY_COLORS.length] }])
    setSlots((s) => s.map((sl) => (sl.id === slotId ? { ...sl, gen: sl.gen + 1 } : sl)))
    setPlayerCount((c) => {
      const nc = c + 1
      if (nc >= TARGET && !finished.current) {
        finished.current = true
        setPhase('releasing')
      }
      return nc
    })
  }, [phase])

  useEffect(() => {
    if (!active || finished.current) return
    let cancelled = false
    const tick = () => {
      if (cancelled || finished.current) return
      sfx.pop()
      setGnomePulse((p) => p + 1)
      setGnomeCount((c) => {
        const nc = c + 1
        if (nc >= GNOME_TARGET && !finished.current) {
          finished.current = true
          setTimeout(() => onLose('¡El gnomo atrapó primero todas las hadas! Inténtalo de nuevo, Jazz.'), 500)
        }
        return nc
      })
      if (!cancelled && !finished.current) setTimeout(tick, 1300 + Math.random() * 1000)
    }
    const t0 = setTimeout(tick, 1600)
    return () => { cancelled = true; clearTimeout(t0) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const startRelease = () => {
    if (phase !== 'releasing') return
    sfx.win()
    setPhase('released')
    setTimeout(() => onWin(), 1900)
  }

  usePillHud(onHud, [
    { text: `Hadas: ${playerCount}/${TARGET}`, tone: 'green' },
    { text: `Gnomo: ${gnomeCount}/${GNOME_TARGET}`, tone: gnomeCount >= GNOME_TARGET - 2 ? 'red' : 'slate' },
  ], phase === 'playing' ? 'Mantén presionado y arrastra la red para atrapar hadas.' : '¡Atrapaste suficientes hadas!', 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 1.6, 4.5]} fov={48} target={[0, 1.6, FAIRY_Z]} />
      <BoardLight position={[0, 5, 2]} />

      <Gnome position={[-2.6, -0.3, -2.2]} pulse={gnomePulse} />
      <Text raycast={() => null} position={[-2.6, 1.05, -2.2]} fontSize={0.16} color="#fde68a" fontWeight={900} outlineWidth={0.014} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">{gnomeCount}</Text>

      {slots.map((s) => (
        <Fairy key={`${s.id}-${s.gen}`} color={FAIRY_COLORS[s.id % FAIRY_COLORS.length]} netPosRef={netPosRef} netActiveRef={netActiveRef} onCatch={(pos) => onCatch(s.id, pos)} />
      ))}

      {bursts.map((b) => <Burst key={b.id} x={b.x} y={b.y} color={b.color} onDone={() => setBursts((bs) => bs.filter((x) => x.id !== b.id))} />)}

      {phase === 'playing' && <Net pos={netPos} active={netActive} />}

      {phase !== 'released' && (
        <mesh
          position={[0, 1.6, FAIRY_Z]}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <planeGeometry args={[11, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {(phase === 'releasing' || phase === 'released') && (
        <ReleaseScene phase={phase} onRelease={startRelease} />
      )}
    </group>
  )
}

function ReleaseSpark({ angle, onDone }) {
  const ref = useRef()
  const t0 = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (!t0.current) t0.current = clock.getElapsedTime()
    const t = (clock.getElapsedTime() - t0.current) / 1.6
    if (t >= 1) { onDone(); return }
    const dist = t * 3.2
    ref.current.position.set(Math.cos(angle) * dist, 0.4 + Math.sin(angle) * dist * 0.7 + t * 1.4, FAIRY_Z + 0.4)
    ref.current.material.opacity = 0.9 * (1 - t)
    ref.current.scale.setScalar(1 - t * 0.4)
  })
  return (
    <mesh ref={ref} position={[0, 0.4, FAIRY_Z + 0.4]}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshBasicMaterial color={FAIRY_COLORS[Math.floor((angle * 3) % FAIRY_COLORS.length)] || '#fde68a'} transparent opacity={0.9} />
    </mesh>
  )
}

function ReleaseScene({ phase, onRelease }) {
  const [sparks, setSparks] = useState([])
  const started = useRef(false)
  useEffect(() => {
    if (phase === 'released' && !started.current) {
      started.current = true
      const arr = Array.from({ length: 14 }).map((_, i) => ({ id: i, angle: (i / 14) * Math.PI * 2 + Math.random() * 0.3 }))
      setSparks(arr)
    }
  }, [phase])

  return (
    <>
      {sparks.map((s) => <ReleaseSpark key={s.id} angle={s.angle} onDone={() => setSparks((arr) => arr.filter((x) => x.id !== s.id))} />)}
      {phase === 'releasing' && (
        <Html position={[0, 1.6, FAIRY_Z + 1]} center distanceFactor={6} zIndexRange={[6, 9]}>
          <div className="bg-slate-900/95 border-2 border-amber-400 rounded-2xl p-4 w-72 text-center shadow-xl pointer-events-auto">
            <p className="text-amber-100 text-sm font-bold leading-relaxed mb-3">¡Atrapaste 10 hadas! ¿Lista para liberarlas antes de irnos?</p>
            <button
              onClick={onRelease}
              className="rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 px-5 py-2 text-xs font-black text-white uppercase"
            >
              🧺 Liberar a las hadas
            </button>
          </div>
        </Html>
      )}
    </>
  )
}
