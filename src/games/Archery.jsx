import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const MAX_ARROWS = 16
const NEED_HITS = 10
const TARGET_Z = -8.5
const BASE_Y = 1.3
const MAX_PULL = 1.7
const AIM_RANGE_X = 2.3
const AIM_RANGE_Y = 1.6
const TARGET_RANGE_X = 1.9
const TARGET_RANGE_Y = 1.3
const BOW_POS = [0.9, 0.6, 3.3]

const RINGS = [
  { r: 0.28, pts: 10, color: '#eab308' },
  { r: 0.58, pts: 7, color: '#f8fafc' },
  { r: 0.95, pts: 4, color: '#3b82f6' },
  { r: 1.4, pts: 1, color: '#dc2626' },
]

function randomTargetPos() {
  return [
    (Math.random() * 2 - 1) * TARGET_RANGE_X,
    BASE_Y + (Math.random() * 2 - 1) * TARGET_RANGE_Y,
  ]
}

function Target({ pos }) {
  const reversed = [...RINGS].reverse()
  return (
    <group position={[pos[0], pos[1], TARGET_Z]}>
      <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.55, 1.55, 0.15, 32]} /><meshStandardMaterial color="#78350f" /></mesh>
      {reversed.map((ring, i) => (
        <mesh key={i} position={[0, 0, i * 0.01]}>
          <circleGeometry args={[ring.r, 32]} />
          <meshStandardMaterial color={ring.color} />
        </mesh>
      ))}
    </group>
  )
}

function Arrow({ start, end, onDone }) {
  const ref = useRef()
  const t0 = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (!t0.current) t0.current = clock.getElapsedTime()
    const t = Math.min(1, (clock.getElapsedTime() - t0.current) / 0.55)
    const x = start[0] + (end[0] - start[0]) * t
    const y = start[1] + (end[1] - start[1]) * t + Math.sin(t * Math.PI) * 0.6
    const z = start[2] + (end[2] - start[2]) * t
    ref.current.position.set(x, y, z)
    ref.current.lookAt(end[0], end[1], end[2])
    if (t >= 1 && !ref.current.userData.done) { ref.current.userData.done = true; onDone() }
  })
  return (
    <group ref={ref} position={start}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 0, 0.38]}><coneGeometry args={[0.05, 0.14, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.2} /></mesh>
      <mesh position={[0, 0, -0.3]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.06, 0.1, 4]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 0, -0.3]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.06, 0.1, 4]} /><meshStandardMaterial color="#dc2626" /></mesh>
    </group>
  )
}

function Bow({ power, showArrow }) {
  const pull = power * 0.5
  return (
    <group position={BOW_POS} rotation={[0, -0.35, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.55, 0.035, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      <Line points={[[0, 0.55, 0], [pull, 0, 0], [0, -0.55, 0]]} color="#e2e8f0" lineWidth={1.5} />
      {showArrow && (
        <group position={[pull, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.58, 6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 0, 0.32]}><coneGeometry args={[0.045, 0.12, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.2} /></mesh>
          <mesh position={[0, 0, -0.27]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.06, 0.1, 4]} /><meshStandardMaterial color="#dc2626" /></mesh>
          <mesh position={[0, 0, -0.27]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.06, 0.1, 4]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
      )}
    </group>
  )
}

export default function Archery({ active, onWin, onLose, onHud }) {
  const [targetPos, setTargetPos] = useState(() => randomTargetPos())
  const [arrowsLeft, setArrowsLeft] = useState(MAX_ARROWS)
  const [hits, setHits] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [aim, setAim] = useState([0, BASE_Y])
  const [power, setPower] = useState(0)
  const [flying, setFlying] = useState(null) // {start, end, hit}
  const [lastMsg, setLastMsg] = useState('Presiona y arrastra en cualquier dirección para apuntar, luego suelta para disparar.')
  const start = useRef([0, 0])
  const finished = useRef(false)
  const targetPosRef = useRef(targetPos)
  // Espejos en ref: los listeners globales de respaldo (window) necesitan
  // leer el valor MAS RECIENTE de forma sincrona, sin depender de closures
  // de React que podrian quedar obsoletas.
  const draggingRef = useRef(false)
  const aimRef = useRef([0, BASE_Y])
  const powerRef = useRef(0)

  useEffect(() => { targetPosRef.current = targetPos }, [targetPos])

  const onPointerDown = (e) => {
    if (!active || finished.current || flying) return
    e.stopPropagation()
    start.current = [e.point.x, e.point.y]
    draggingRef.current = true
    setDragging(true)
  }
  const onPointerMove = (e) => {
    if (!draggingRef.current || flying) return
    e.stopPropagation()
    const dx = e.point.x - start.current[0]
    const dy = e.point.y - start.current[1]
    const nextAim = [
      Math.max(-AIM_RANGE_X, Math.min(AIM_RANGE_X, dx * 1.1)),
      Math.max(BASE_Y - AIM_RANGE_Y, Math.min(BASE_Y + AIM_RANGE_Y, BASE_Y + dy * 0.9)),
    ]
    // La potencia depende de que tan lejos arrastraste desde donde
    // presionaste, sin importar la direccion -- asi se puede apuntar y
    // disparar hacia cualquier lado, no solo tirando hacia abajo.
    const dist = Math.sqrt(dx * dx + dy * dy)
    const nextPower = Math.max(0, Math.min(1, dist / MAX_PULL))
    aimRef.current = nextAim
    powerRef.current = nextPower
    setAim(nextAim)
    setPower(nextPower)
  }

  const fireArrow = useCallback(() => {
    const aimNow = aimRef.current
    const powerNow = powerRef.current
    // A maxima potencia (arco bien tensado) la precision es total: si
    // apuntaste bien al centro amarillo, siempre le das ahi. El unico reto
    // real es que la diana cambia de lugar en cada tiro.
    const jitter = (1 - powerNow) * 0.7
    const landX = aimNow[0] + (Math.random() - 0.5) * jitter
    const landY = aimNow[1] + (Math.random() - 0.5) * jitter
    const tp = targetPosRef.current
    const dx = landX - tp[0]
    const dy = landY - tp[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ring = RINGS.find((r) => dist <= r.r)
    const isYellow = !!ring && ring === RINGS[0]
    setFlying({ start: [BOW_POS[0], BOW_POS[1] + 0.3, BOW_POS[2]], end: [landX, landY, TARGET_Z + 0.05], hit: isYellow })
    aimRef.current = [0, BASE_Y]
    powerRef.current = 0
    setAim([0, BASE_Y])
    setPower(0)
  }, [])

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    if (powerRef.current < 0.12) {
      powerRef.current = 0
      setPower(0)
      aimRef.current = [0, BASE_Y]
      setAim([0, BASE_Y])
      return
    }
    fireArrow()
  }, [fireArrow])

  // Respaldo global: si el puntero se suelta fuera del plano invisible (o
  // el gesto es muy rapido en movil), esto garantiza que el disparo igual
  // se complete en vez de quedarse "atorado" tensando el arco para siempre.
  useEffect(() => {
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
    return () => {
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [finishDrag])

  const onArrowDone = () => {
    const hit = flying?.hit || false
    setFlying(null)
    sfx[hit ? 'chime' : 'hit']()
    setHits((h) => {
      const nh = hit ? h + 1 : h
      setLastMsg(hit ? '¡Diste en el centro! +1 acierto.' : '¡No caíste en el círculo amarillo!')
      const remaining = arrowsLeft - 1
      setArrowsLeft(remaining)
      if (!finished.current) {
        if (nh >= NEED_HITS) { finished.current = true; sfx.win(); setTimeout(() => onWin(), 500) }
        else if (remaining <= 0) { finished.current = true; setTimeout(() => onLose('¡Se acabaron las flechas! El vigía no te deja pasar todavía.'), 500) }
        else if (remaining > 0 && NEED_HITS - nh > remaining) { finished.current = true; setTimeout(() => onLose(`Ya no puedes alcanzar los ${NEED_HITS} aciertos con las flechas que quedan.`), 500) }
      }
      return nh
    })
    setTargetPos(randomTargetPos())
  }

  const liveMsg = dragging
    ? (power >= 0.12 ? '¡Suelta para disparar!' : 'Apunta... sigue arrastrando para tensar el arco')
    : lastMsg

  usePillHud(onHud, [
    { text: `Flechas: ${arrowsLeft}/${MAX_ARROWS}`, tone: 'gold' },
    { text: `Aciertos: ${hits}/${NEED_HITS}`, tone: 'green' },
    { text: `Fuerza: ${Math.round(power * 100)}%`, tone: power > 0.7 ? 'green' : 'slate' },
  ], liveMsg, dragging && power >= 0.12 ? 'green' : 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 1.4, 6.2]} fov={44} target={[0, 1.2, -2.5]} />
      <BoardLight position={[0, 6, 2]} />

      <Target pos={targetPos} />
      <Bow power={power} showArrow={!flying} />

      {/* Mirilla / reticula */}
      {!flying && (
        <group position={[aim[0], aim[1], TARGET_Z + 1]}>
          <Line points={[[-0.18, 0, 0], [0.18, 0, 0]]} color="#f8fafc" lineWidth={2} />
          <Line points={[[0, -0.18, 0], [0, 0.18, 0]]} color="#f8fafc" lineWidth={2} />
          <mesh rotation={[0, 0, 0]}><ringGeometry args={[0.13, 0.15, 24]} /><meshBasicMaterial color="#f8fafc" transparent opacity={0.85} /></mesh>
        </group>
      )}

      {/* Linea de direccion */}
      {!flying && power > 0.05 && (
        <Line points={[[BOW_POS[0], BOW_POS[1] + 0.3, BOW_POS[2]], [aim[0], aim[1], TARGET_Z + 1]]} color="#fbbf24" lineWidth={1.5} dashed dashSize={0.2} gapSize={0.12} />
      )}

      {flying && <Arrow start={flying.start} end={flying.end} onDone={onArrowDone} />}

      {/* Catcher invisible para el gesto de arrastre (generoso para no
          perder el gesto en pantallas angostas de celular) */}
      <mesh
        position={[0, 1, 4]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerLeave={finishDrag}
      >
        <planeGeometry args={[16, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
