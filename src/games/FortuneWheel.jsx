import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const VALUES = [2, 5, 3, 8, 1, 6, 4, 10]
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#ec4899']
const N = VALUES.length
const SEG = (Math.PI * 2) / N
const TARGET_SCORE = 25
const SPIN_SPEED = 6.5
const DECEL_RATE = 4.5
// Angulo que se sigue acumulando durante la frenada, desde el momento en que
// se suelta "Detener" hasta que la rueda queda en reposo (area bajo la curva
// de velocidad, con desaceleracion constante).
const DECEL_ANGLE = (SPIN_SPEED * SPIN_SPEED) / (2 * DECEL_RATE)

function predictFinalAngle(startAngle, delaySeconds) {
  return startAngle + SPIN_SPEED * delaySeconds + DECEL_ANGLE
}

function segmentAt(angle) {
  const normalized = (((-angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  return Math.floor(normalized / SEG) % N
}

function ScorePopup({ value, color, position, onDone }) {
  const ref = useRef()
  const start = useRef(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (start.current == null) start.current = clock.getElapsedTime()
    const t = clock.getElapsedTime() - start.current
    ref.current.position.y = position[1] + t * 0.9
    const pop = t < 0.25 ? 1 + (0.25 - t) * 1.6 : 1
    ref.current.scale.setScalar(pop)
  })
  useEffect(() => {
    const tm = setTimeout(onDone, 1000)
    return () => clearTimeout(tm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <group ref={ref} position={position}>
      <Text fontSize={0.34} fontWeight={900} color={color} outlineWidth={0.022} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">
        {`+${value}`}
      </Text>
    </group>
  )
}

function SpinStopButton({ canStop, onPress }) {
  const ref = useRef()
  const pressT = useRef(0)
  const [pulses, setPulses] = useState([])
  const pulseId = useRef(0)
  useFrame((_, dt) => {
    if (!ref.current) return
    if (pressT.current > 0) pressT.current = Math.max(0, pressT.current - dt * 5)
    const squish = 1 - pressT.current * 0.22
    ref.current.scale.set(squish, 1, squish)
    ref.current.position.y = -pressT.current * 0.05
  })
  const handlePress = () => {
    pressT.current = 1
    sfx.click()
    setPulses((p) => [...p, pulseId.current++])
    onPress()
  }
  return (
    <group position={[1.5, 0, 0.3]} rotation={[0, -0.35, 0]}>
      <group ref={ref}
        onClick={(e) => { e.stopPropagation(); handlePress() }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <mesh>
          <boxGeometry args={[1.6, 0.2, 0.6]} />
          <meshStandardMaterial color={canStop ? '#dc2626' : '#16a34a'} />
        </mesh>
        <Text raycast={() => null} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
          {canStop ? '¡DETENER!' : '¡GIRAR!'}
        </Text>
      </group>
      {pulses.map((id) => (
        <PressPulse key={id} onDone={() => setPulses((p) => p.filter((x) => x !== id))} />
      ))}
    </group>
  )
}

function PressPulse({ onDone }) {
  const ref = useRef()
  const t0 = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (!t0.current) t0.current = clock.getElapsedTime()
    const t = (clock.getElapsedTime() - t0.current) / 0.45
    if (t >= 1) { onDone(); return }
    ref.current.scale.setScalar(1 + t * 1.4)
    ref.current.material.opacity = 0.7 * (1 - t)
  })
  return (
    <mesh ref={ref} position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.68, 24]} />
      <meshBasicMaterial color="#fde68a" transparent opacity={0.7} />
    </mesh>
  )
}

function Wheel({ wheelRef }) {
  return (
    <group ref={wheelRef}>
      {VALUES.map((v, i) => {
        const mid = i * SEG + SEG / 2
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} castShadow>
              <circleGeometry args={[1.5, 8, i * SEG, SEG]} />
              <meshStandardMaterial color={COLORS[i % COLORS.length]} roughness={0.5} />
            </mesh>
            <Text
              position={[Math.cos(mid) * 1.0, 0.06, -Math.sin(mid) * 1.0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.3}
              fontWeight={900}
              color="white"
              outlineWidth={0.018}
              outlineColor="#1e1b4b"
              anchorX="center"
              anchorY="middle"
            >
              {v}
            </Text>
          </group>
        )
      })}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.5} metalness={0.4} />
      </mesh>
    </group>
  )
}

function WizardEnemy({ position, turn, pulse }) {
  const ref = useRef()
  const armRef = useRef()
  const bounce = useRef(0)
  const seenPulse = useRef(pulse)
  useFrame(({ clock }, dt) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    if (seenPulse.current !== pulse) { seenPulse.current = pulse; bounce.current = 1 }
    if (bounce.current > 0) bounce.current = Math.max(0, bounce.current - dt * 2.5)
    ref.current.position.y = position[1] + Math.sin(t * 1.1) * 0.05 + Math.sin(bounce.current * Math.PI) * 0.18
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.1
    if (armRef.current) armRef.current.rotation.z = turn === 'ai' ? -0.5 + Math.sin(t * 3) * 0.25 : -0.2
  })
  return (
    <group position={position} ref={ref} rotation={[0, 0.6, 0]}>
      {/* Capa azul */}
      <mesh position={[0, 0.35, -0.05]} castShadow>
        <coneGeometry args={[0.42, 1.05, 12]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.65} />
      </mesh>
      {/* Tunica interior */}
      <mesh position={[0, 0.25, 0.05]}>
        <coneGeometry args={[0.32, 0.85, 12]} />
        <meshStandardMaterial color="#312e81" roughness={0.7} />
      </mesh>
      {/* Brazo */}
      <group ref={armRef} position={[0.28, 0.55, 0.1]}>
        <mesh rotation={[0, 0, -0.3]}><capsuleGeometry args={[0.055, 0.42, 4, 8]} /><meshStandardMaterial color="#1e3a8a" roughness={0.65} /></mesh>
        <mesh position={[0.15, -0.32, 0]}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color="#e0c9a6" roughness={0.6} /></mesh>
      </group>
      <mesh position={[-0.26, 0.5, 0.1]} rotation={[0, 0, 0.35]}><capsuleGeometry args={[0.055, 0.36, 4, 8]} /><meshStandardMaterial color="#1e3a8a" roughness={0.65} /></mesh>
      {/* Cabeza */}
      <mesh position={[0, 0.92, 0]} castShadow><sphereGeometry args={[0.17, 16, 16]} /><meshStandardMaterial color="#e0c9a6" roughness={0.55} /></mesh>
      {/* Barba larga */}
      <mesh position={[0, 0.72, 0.09]} rotation={[0.1, 0, 0]}><coneGeometry args={[0.13, 0.5, 10]} /><meshStandardMaterial color="#f8fafc" roughness={0.85} /></mesh>
      {/* Ojos */}
      <mesh position={[-0.06, 0.94, 0.15]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
      <mesh position={[0.06, 0.94, 0.15]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
      {/* Sombrero azul picudo */}
      <group position={[0, 1.02, 0]}>
        <mesh><cylinderGeometry args={[0.2, 0.2, 0.05, 16]} /><meshStandardMaterial color="#1e3a8a" roughness={0.6} /></mesh>
        <mesh position={[0, 0.5, -0.03]} rotation={[0.12, 0, 0]}><coneGeometry args={[0.15, 1.0, 12]} /><meshStandardMaterial color="#1e40af" roughness={0.6} /></mesh>
        <mesh position={[0, 0.06, 0]}><torusGeometry args={[0.19, 0.025, 8, 16]} /><meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.5} /></mesh>
      </group>
    </group>
  )
}

export default function FortuneWheel({ active, onWin, onLose, onHud }) {
  const wheelRef = useRef()
  const phase = useRef('ready') // ready | spinning | stopping | settled
  const speed = useRef(0)
  const [turn, setTurn] = useState('player')
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [msg, setMsg] = useState('Toca "¡Girar!" y luego "¡Detener!" en el momento justo.')
  const [canStop, setCanStop] = useState(false)
  const finished = useRef(false)
  const round = useRef(0)
  const [popups, setPopups] = useState([])
  const popupId = useRef(0)
  const [wizardPulse, setWizardPulse] = useState(0)

  const playerScoreRef = useRef(0)
  const aiScoreRef = useRef(0)

  const applyResult = useCallback((value, who) => {
    const id = popupId.current++
    setPopups((p) => [...p, { id, value, color: who === 'player' ? '#4ade80' : '#f87171', position: who === 'player' ? [0, 0.7, 2.0] : [-1.1, 0.7, -0.6] }])
    if (who === 'player') {
      const ns = playerScoreRef.current + value
      playerScoreRef.current = ns
      setPlayerScore(ns)
      checkEnd(ns, aiScoreRef.current)
    } else {
      setWizardPulse((n) => n + 1)
      const ns = aiScoreRef.current + value
      aiScoreRef.current = ns
      setAiScore(ns)
      checkEnd(playerScoreRef.current, ns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkEnd = (p, a) => {
    round.current += 1
    if (finished.current) return
    if (p >= TARGET_SCORE || a >= TARGET_SCORE || round.current >= 12) {
      finished.current = true
      setTimeout(() => (p >= a ? onWin() : onLose(`El mago dorado sumó más puntos (${a} vs ${p}).`)), 500)
    } else {
      setTimeout(() => { if (!finished.current) setTurn((t) => (t === 'player' ? 'ai' : 'player')) }, 900)
    }
  }

  useFrame((_, dt) => {
    if (!wheelRef.current) return
    if (phase.current === 'spinning') {
      speed.current = SPIN_SPEED
      wheelRef.current.rotation.y += speed.current * dt
    } else if (phase.current === 'stopping') {
      speed.current = Math.max(0, speed.current - dt * 4.5)
      wheelRef.current.rotation.y += speed.current * dt
      if (speed.current <= 0.02) {
        phase.current = 'settled'
        const idx = segmentAt(wheelRef.current.rotation.y)
        const value = VALUES[idx]
        sfx.chime()
        setMsg(`¡Cayó en ${value} punto${value === 1 ? '' : 's'}!`)
        applyResult(value, turnRef.current)
        setCanStop(false)
      }
    }
  })

  const turnRef = useRef('player')
  useEffect(() => { turnRef.current = turn }, [turn])

  const startSpin = () => {
    if (!active || finished.current || phase.current !== 'ready' || turn !== 'player') return
    sfx.click()
    phase.current = 'spinning'
    setCanStop(true)
    setMsg('¡Girando! Toca "¡Detener!" cuando quieras.')
  }
  const stopSpin = () => {
    if (phase.current !== 'spinning') return
    phase.current = 'stopping'
  }

  // Turno de la IA: gira y se detiene tras un tiempo elegido a proposito.
  // En vez de un delay puramente al azar, el mago prueba varios momentos de
  // parada posibles, calcula en cual segmento caeria cada uno (con la misma
  // fisica que usa la rueda real) y se inclina por uno de los mejores -- sin
  // ser perfecto, para que no se sienta imposible de ganarle.
  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    setMsg('El mago dorado gira la rueda...')
    phase.current = 'spinning'
    const startAngle = wheelRef.current ? wheelRef.current.rotation.y : 0
    const candidates = Array.from({ length: 16 }).map(() => 550 + Math.random() * 1550)
    const scored = candidates
      .map((d) => ({ d, value: VALUES[segmentAt(predictFinalAngle(startAngle, d / 1000))] }))
      .sort((a, b) => b.value - a.value)
    const pick = scored[Math.floor(Math.random() * Math.min(4, scored.length))]
    const t = setTimeout(() => { if (phase.current === 'spinning') phase.current = 'stopping' }, pick.d)
    return () => clearTimeout(t)
  }, [turn, active])

  useEffect(() => {
    if (phase.current === 'settled' && !finished.current) {
      phase.current = 'ready'
    }
  }, [playerScore, aiScore])

  usePillHud(onHud, [
    { text: `Ronda ${Math.min(round.current + 1, 12)}/12`, tone: 'gold' },
    { text: `Tú: ${playerScore}`, tone: 'green' },
    { text: `Mago: ${aiScore}`, tone: 'red' },
    { text: turn === 'player' ? 'Tu turno' : 'Turno del mago...', tone: turn === 'player' ? 'green' : 'red' },
  ], msg, 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 4.4, 3.2]} fov={46} target={[0, 0, 0]} />
      <BoardLight position={[0, 6, 3]} />

      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[1.9, 2, 0.2, 32]} />
        <meshStandardMaterial color="#3f2a17" roughness={0.7} />
      </mesh>

      <Wheel wheelRef={wheelRef} />
      <WizardEnemy position={[-1.5, -0.05, -1.1]} turn={turn} pulse={wizardPulse} />

      {/* Puntero fijo */}
      <mesh position={[1.65, 0.15, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.14, 0.3, 4]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
      </mesh>

      {turn === 'player' && active && (
        <SpinStopButton canStop={canStop} onPress={() => { if (!canStop) startSpin(); else stopSpin() }} />
      )}

      {popups.map((p) => (
        <ScorePopup key={p.id} value={p.value} color={p.color} position={p.position} onDone={() => setPopups((ps) => ps.filter((x) => x.id !== p.id))} />
      ))}
    </group>
  )
}
