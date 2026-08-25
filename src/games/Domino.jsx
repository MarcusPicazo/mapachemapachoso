import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { dealDomino, findPlacement, placementForSide, isPlayable, pipSum } from './common/dominoLogic'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const MAX_DROP_DIST = 3.2
const ROW_LEN = 5
const ROW_GAP = 0.85
const ROW_CENTER = (ROW_LEN - 1) / 2

// Limites de la mesa cafe (mesh de 9.5 x 8.6 centrado en [0,-0.14,1.6]), con
// margen extra en el lado izquierdo para nunca invadir el area de la bruja
// (posicionada en x=-3.3, con el brazo/manga llegando hasta unos -2.7) ni el
// libro de hechizos (x=-4.5).
const TABLE_X_MIN = -2.0
const TABLE_X_MAX = 3.6
const TABLE_Z_MIN = -1.9
const TABLE_Z_MAX = 5.1

function clampToTable(p) {
  return {
    x: Math.max(TABLE_X_MIN, Math.min(TABLE_X_MAX, p.x)),
    z: Math.max(TABLE_Z_MIN, Math.min(TABLE_Z_MAX, p.z)),
  }
}

// Camino en filas: la cadena avanza en linea recta y al llegar al borde
// baja una fila y sigue en direccion contraria (como texto que se ajusta
// de renglon), SIEMPRE con la misma orientacion de ficha -- evita el bug
// de fichas que giraban 90 grados y no se podian soltar correctamente.
// Centrada en x (en vez de arrancar en 0) para que la cadena jamas se salga
// del tablero por el lado derecho al crecer.
function spiralSlot(i) {
  if (i < 0) return { x: -1.05, z: 0, rot: 0 }
  const row = Math.floor(i / ROW_LEN)
  const posInRow = i % ROW_LEN
  const z = row * ROW_GAP
  const x = (row % 2 === 0 ? posInRow : (ROW_LEN - 1 - posInRow)) - ROW_CENTER
  return { x, z, rot: 0 }
}

function slotWorld(i) {
  return spiralSlot(i)
}

function rayToGround(ray) {
  const t = (0 - ray.origin.y) / ray.direction.y
  return clampToTable({ x: ray.origin.x + ray.direction.x * t, z: ray.origin.z + ray.direction.z * t })
}

const PIP_LAYOUTS = {
  0: [],
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
}

function PipFace({ value, centerX, scale }) {
  const layout = PIP_LAYOUTS[value] || []
  const spacing = 0.1 * scale
  const r = 0.045 * scale
  return layout.map(([col, row], i) => (
    <mesh key={i} position={[centerX + col * spacing, 0.109, row * spacing]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <circleGeometry args={[r, 14]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  ))
}

function TileMesh({ left, right, position, rotationY = 0, color = '#f8fafc', onPointerDown, hoverable, small, elevated, ghost, popKey }) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef()
  const t0 = useRef(0)
  const scale = small ? 0.72 : 1
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (!t0.current) t0.current = clock.getElapsedTime()
    const t = Math.min(1, (clock.getElapsedTime() - t0.current) / 0.4)
    const ease = 1 - Math.pow(1 - t, 3)
    const bounce = Math.sin(t * Math.PI) * 0.28 * (1 - t)
    groupRef.current.scale.setScalar((ghost ? 1.1 : (hovered && hoverable ? 1.12 : 1)) * (0.5 + ease * 0.5))
    groupRef.current.position.y = (elevated ? 0.5 : 0) + bounce
  })
  return (
    <group ref={groupRef} key={popKey} position={position} rotation={[0, rotationY, 0]}>
      <mesh
        position={[0, 0.1, 0]}
        onPointerDown={(e) => { e.stopPropagation(); if (onPointerDown) onPointerDown(e) }}
        onPointerOver={(e) => { e.stopPropagation(); if (hoverable) { setHovered(true); document.body.style.cursor = 'grab' } }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[1.02 * scale, 0.4, 0.6 * scale]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.01, 0]} castShadow>
        <boxGeometry args={[0.98 * scale, 0.14, 0.56 * scale]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} transparent={ghost} opacity={ghost ? 0.7 : 1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.88 * scale, 0.16, 0.46 * scale]} />
        <meshStandardMaterial color={hovered && hoverable ? '#fde68a' : color} roughness={0.4} transparent={ghost} opacity={ghost ? 0.85 : 1} />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <boxGeometry args={[0.03, 0.02, 0.44 * scale]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <PipFace value={left} centerX={-0.23 * scale} scale={scale} />
      <PipFace value={right} centerX={0.23 * scale} scale={scale} />
    </group>
  )
}

function FloatingTile({ angle, radius, index }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * 0.6 + angle
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.3 + index) * 0.09, Math.sin(t) * radius * 0.5)
    ref.current.rotation.y = t
  })
  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[0.22, 0.05, 0.32]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.02, 0.01, 0.28]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </mesh>
  )
}

function FloatingHandCount({ count, position }) {
  const items = Math.min(count, 7)
  return (
    <group position={position}>
      {Array.from({ length: items }).map((_, i) => (
        <FloatingTile key={i} angle={(i / Math.max(1, items)) * Math.PI * 2} radius={0.48} index={i} />
      ))}
      <Text raycast={() => null} position={[0, 0.5, 0]} fontSize={0.24} color="#fde68a" fontWeight={900} outlineWidth={0.018} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">{count}</Text>
    </group>
  )
}

function Witch({ position, handCount }) {
  const ref = useRef()
  const eyesRef = useRef()
  const mouthRef = useRef()
  const browRef = useRef()
  const state = useRef({ blinkTimer: 1.5 + Math.random() * 2, blinking: 0, laughTimer: 5 + Math.random() * 4, laughing: 0 })

  useFrame(({ clock }, dt) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = position[1] + Math.sin(t * 1.4) * 0.08
    ref.current.rotation.y = Math.sin(t * 0.6) * 0.15

    const s = state.current
    s.blinkTimer -= dt
    if (s.blinkTimer <= 0 && s.blinking <= 0) { s.blinking = 0.16; s.blinkTimer = 2 + Math.random() * 3 }
    if (s.blinking > 0) s.blinking -= dt
    if (eyesRef.current) eyesRef.current.scale.y = s.blinking > 0 ? 0.12 : 1

    s.laughTimer -= dt
    if (s.laughTimer <= 0 && s.laughing <= 0) { s.laughing = 0.8; s.laughTimer = 6 + Math.random() * 6 }
    if (s.laughing > 0) s.laughing -= dt
    const openAmt = s.laughing > 0 ? Math.max(0, Math.sin((0.8 - s.laughing) / 0.8 * Math.PI)) : 0
    if (mouthRef.current) mouthRef.current.scale.set(1 + openAmt * 0.5, 1 + openAmt * 1.6, 1)
    if (browRef.current) browRef.current.position.y = 1.045 + openAmt * 0.02
  })

  return (
    <group position={position} ref={ref}>
      {/* Caldero */}
      <mesh position={[0.75, -0.35, 0.2]} castShadow>
        <cylinderGeometry args={[0.34, 0.24, 0.34, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.75, -0.16, 0.2]}>
        <torusGeometry args={[0.24, 0.05, 8, 16]} />
        <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.7} />
      </mesh>
      {/* Tunica */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <coneGeometry args={[0.62, 1.35, 12]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.75} />
      </mesh>
      {/* Brazos con manos */}
      <mesh position={[-0.45, 0.5, 0.15]} rotation={[0, 0, 0.6]}>
        <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.75} />
      </mesh>
      <group position={[-0.68, 0.22, 0.15]} rotation={[0, 0, 0.5]}>
        <mesh><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#86efac" roughness={0.6} /></mesh>
        {[-0.06, -0.02, 0.02, 0.06].map((o, i) => (
          <mesh key={i} position={[o, -0.09, 0.02]} rotation={[0.3, 0, 0]}><capsuleGeometry args={[0.018, 0.07, 3, 6]} /><meshStandardMaterial color="#86efac" roughness={0.6} /></mesh>
        ))}
      </group>
      <mesh position={[0.55, 0.55, 0.3]} rotation={[0.3, 0, -0.9]}>
        <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.75} />
      </mesh>
      <group position={[0.72, 0.32, 0.35]} rotation={[0.2, 0, -0.7]}>
        <mesh><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#86efac" roughness={0.6} /></mesh>
        {[-0.06, -0.02, 0.02, 0.06].map((o, i) => (
          <mesh key={i} position={[o, -0.09, 0.02]} rotation={[0.3, 0, 0]}><capsuleGeometry args={[0.018, 0.07, 3, 6]} /><meshStandardMaterial color="#86efac" roughness={0.6} /></mesh>
        ))}
      </group>
      {/* Cabeza */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#86efac" roughness={0.6} />
      </mesh>
      {/* Nariz larga y puntiaguda */}
      <mesh position={[0, 0.94, 0.32]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
        <coneGeometry args={[0.055, 0.42, 10]} />
        <meshStandardMaterial color="#6fbf7a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.9, 0.5]}><sphereGeometry args={[0.032, 8, 8]} /><meshStandardMaterial color="#4d8f5a" roughness={0.7} /></mesh>
      {/* Cejas */}
      <group ref={browRef} position={[0, 1.045, 0.2]}>
        <mesh position={[-0.11, 0, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.11, 0.018, 0.02]} /><meshStandardMaterial color="#1e1b4b" /></mesh>
        <mesh position={[0.11, 0, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.11, 0.018, 0.02]} /><meshStandardMaterial color="#1e1b4b" /></mesh>
      </group>
      {/* Ojos (parpadean) */}
      <group ref={eyesRef} position={[0, 0.98, 0]}>
        <mesh position={[-0.11, 0, 0.14]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} /></mesh>
        <mesh position={[-0.11, 0, 0.17]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color="#1e1b4b" /></mesh>
        <mesh position={[0.11, 0, 0.14]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} /></mesh>
        <mesh position={[0.11, 0, 0.17]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color="#1e1b4b" /></mesh>
      </group>
      {/* Boca (rie de vez en cuando) */}
      <mesh ref={mouthRef} position={[0, 0.85, 0.22]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>
      {/* Verruga en la barbilla */}
      <mesh position={[0.03, 0.8, 0.24]}><sphereGeometry args={[0.018, 6, 6]} /><meshStandardMaterial color="#4d8f5a" /></mesh>
      {/* Sombrero */}
      <group position={[0, 1.18, 0]}>
        <mesh><cylinderGeometry args={[0.34, 0.34, 0.06, 16]} /><meshStandardMaterial color="#1e1b4b" roughness={0.7} /></mesh>
        <mesh position={[0, 0.42, 0]}><coneGeometry args={[0.22, 0.85, 12]} /><meshStandardMaterial color="#312e81" roughness={0.7} /></mesh>
        <mesh position={[0, 0.62, 0]}><torusGeometry args={[0.15, 0.03, 8, 16]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} /></mesh>
      </group>
      {handCount != null && <FloatingHandCount count={handCount} position={[0, 1.95, 0]} />}
    </group>
  )
}

function SpellBook({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} castShadow>
        <boxGeometry args={[0.5, 0.38, 0.08]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <boxGeometry args={[0.42, 0.3, 0.02]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <ringGeometry args={[0.06, 0.09, 5]} />
        <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function PotionBottle({ position, color }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = 0.6 + Math.sin(clock.getElapsedTime() * 2.5 + position[0]) * 0.3
  })
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.75} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.14, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.05, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <pointLight ref={ref} color={color} intensity={0.6} distance={2} position={[0, 0.05, 0]} />
    </group>
  )
}

function Candle({ position }) {
  const flameRef = useRef()
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const t = clock.getElapsedTime()
      flameRef.current.scale.set(1, 0.9 + Math.sin(t * 9) * 0.1, 1)
    }
  })
  return (
    <group position={position}>
      <mesh castShadow><cylinderGeometry args={[0.045, 0.05, 0.26, 8]} /><meshStandardMaterial color="#fef3c7" roughness={0.7} /></mesh>
      <mesh ref={flameRef} position={[0, 0.17, 0]}><coneGeometry args={[0.03, 0.09, 8]} /><meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={1.4} /></mesh>
      <pointLight color="#fb923c" intensity={0.7} distance={2.5} position={[0, 0.2, 0]} />
    </group>
  )
}

function FloatingPointer({ position, label }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2.5) * 0.08
  })
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.13, 0.28, 4]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
      </mesh>
      <Text raycast={() => null} position={[0, 0.36, 0]} fontSize={0.15} fontWeight={900} color="#fde68a" outlineWidth={0.016} outlineColor="#451a03" anchorX="center" anchorY="middle" textAlign="center">{label}</Text>
    </group>
  )
}

function ChainTiles({ chain }) {
  return chain.map((t, i) => {
    const pos = slotWorld(i)
    return <TileMesh key={t.id} popKey={t.id} left={t.left} right={t.right} position={[pos.x, 0, pos.z]} rotationY={pos.rot} color="#f8fafc" />
  })
}

export default function Domino({ active, onWin, onLose, onHud }) {
  const initial = useMemo(() => dealDomino(), [])
  const [playerHand, setPlayerHand] = useState(initial.player)
  const [aiHand, setAiHand] = useState(initial.ai)
  const [boneyard, setBoneyard] = useState(initial.boneyard)
  const [chain, setChain] = useState([])
  const [ends, setEnds] = useState({ left: null, right: null })
  const [turn, setTurn] = useState('player')
  const [hint, setHint] = useState('Arrastra una ficha hacia el centro para iniciar la cadena.')
  const [dragTile, setDragTile] = useState(null)
  const [dragPos, setDragPos] = useState(null)
  const finished = useRef(false)
  const idCounter = useRef(0)

  const playerCanPlay = playerHand.some((t) => isPlayable(t, ends.left, ends.right))

  const placeTile = useCallback((tile, hand, setHand) => {
    const placement = findPlacement(tile, ends.left, ends.right)
    if (!placement) return false
    const tagged = { ...placement.oriented, id: idCounter.current++ }
    setHand((h) => h.filter((t) => t !== tile))
    setChain((c) => (placement.side === 'right' ? [...c, tagged] : [tagged, ...c]))
    setEnds((e) => {
      if (ends.left === null) return { left: tagged.left, right: tagged.right }
      return placement.side === 'right' ? { ...e, right: tagged.right } : { ...e, left: tagged.left }
    })
    sfx.place()
    return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ends])

  const placeAtSide = useCallback((tile, side, oriented) => {
    const tagged = { ...oriented, id: idCounter.current++ }
    setPlayerHand((h) => h.filter((t) => t !== tile))
    setChain((c) => (side === 'right' ? [...c, tagged] : [tagged, ...c]))
    setEnds((e) => (ends.left === null ? { left: tagged.left, right: tagged.right } : (side === 'right' ? { ...e, right: tagged.right } : { ...e, left: tagged.left })))
    sfx.place()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ends])

  const startDrag = (tile, e) => {
    if (!active || turn !== 'player' || finished.current) return
    e.stopPropagation()
    setDragTile(tile)
    setDragPos(null)
  }

  const onDragMove = (e) => {
    if (!dragTile) return
    e.stopPropagation()
    setDragPos(rayToGround(e.ray))
  }

  const finishDrag = useCallback(() => {
    if (!dragTile) return
    const tile = dragTile
    if (dragPos) {
      if (ends.left === null) {
        const dCenter = Math.hypot(dragPos.x, dragPos.z)
        if (dCenter <= MAX_DROP_DIST) {
          placeAtSide(tile, 'right', { left: tile.a, right: tile.b })
          setHint('')
          setTimeout(() => { if (!finished.current) setTurn('ai') }, 250)
        } else {
          setHint('Suelta la ficha cerca del centro de la mesa.')
        }
      } else {
        const leftZone = slotWorld(-1)
        const rightZone = slotWorld(chain.length)
        const dLeft = Math.hypot(dragPos.x - leftZone.x, dragPos.z - leftZone.z)
        const dRight = Math.hypot(dragPos.x - rightZone.x, dragPos.z - rightZone.z)
        const nearLeft = dLeft <= MAX_DROP_DIST
        const nearRight = dRight <= MAX_DROP_DIST
        if (!nearLeft && !nearRight) {
          setHint('Suelta la ficha cerca de un extremo de la cadena.')
        } else {
          const leftFit = placementForSide(tile, 'left', ends)
          const rightFit = placementForSide(tile, 'right', ends)
          let choice = null
          if (nearLeft && nearRight && leftFit && rightFit) choice = dLeft <= dRight ? { side: 'left', oriented: leftFit } : { side: 'right', oriented: rightFit }
          else if (nearLeft && leftFit) choice = { side: 'left', oriented: leftFit }
          else if (nearRight && rightFit) choice = { side: 'right', oriented: rightFit }
          else if (leftFit) choice = { side: 'left', oriented: leftFit }
          else if (rightFit) choice = { side: 'right', oriented: rightFit }

          if (choice) {
            placeAtSide(tile, choice.side, choice.oriented)
            setHint('')
            setTimeout(() => {
              setPlayerHand((h) => {
                if (h.length === 0 && !finished.current) { finished.current = true; setTimeout(() => onWin(), 300) }
                return h
              })
              if (!finished.current) setTurn('ai')
            }, 250)
          } else {
            sfx.hit()
            setHint('Esa ficha no calza con los extremos.')
          }
        }
      }
    }
    setDragTile(null)
    setDragPos(null)
  }, [dragTile, dragPos, ends, chain.length, placeAtSide, onWin])

  useEffect(() => {
    if (!dragTile) return
    const onUp = () => finishDrag()
    window.addEventListener('pointerup', onUp)
    return () => window.removeEventListener('pointerup', onUp)
  }, [dragTile, finishDrag])

  const drawFromBoneyard = () => {
    if (!active || turn !== 'player' || finished.current || boneyard.length === 0) return
    setBoneyard((b) => {
      if (b.length === 0) return b
      const [drawn, ...rest] = b
      setPlayerHand((h) => [...h, drawn])
      sfx.click()
      return rest
    })
  }

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    let cancelled = false
    const step = () => {
      if (cancelled || finished.current) return
      setAiHand((hand) => {
        const options = hand.filter((t) => isPlayable(t, ends.left, ends.right))
        if (options.length > 0) {
          const best = options.sort((a, b) => (b.a + b.b) - (a.a + a.b))[0]
          placeTile(best, hand, () => {})
          const newHand = hand.filter((t) => t !== best)
          setTimeout(() => {
            if (newHand.length === 0 && !finished.current) { finished.current = true; setTimeout(() => onLose('La bruja del tiempo vació su mano primero. ¡Otra partida, Jazz!'), 300); return }
            if (!finished.current) setTurn('player')
          }, 400)
          return newHand
        }
        setBoneyard((b) => {
          if (b.length > 0) {
            const [drawn, ...rest] = b
            setTimeout(step, 500)
            return rest
          }
          setTimeout(() => { if (!finished.current) setTurn('player') }, 300)
          return b
        })
        return hand
      })
    }
    const t = setTimeout(step, 800)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active])

  useEffect(() => {
    if (!active || finished.current || turn !== 'player') return
    if (boneyard.length === 0 && !playerCanPlay) {
      const aiCanPlay = aiHand.some((t) => isPlayable(t, ends.left, ends.right))
      if (!aiCanPlay) {
        finished.current = true
        const pDiff = pipSum(playerHand) <= pipSum(aiHand)
        setTimeout(() => (pDiff ? onWin() : onLose('¡Juego bloqueado! La bruja tenía menos puntos. Otra ronda, Jazz.')), 400)
      } else {
        setHint('No tienes fichas jugables ni el pozo tiene más. Pasas turno.')
        setTimeout(() => setTurn('ai'), 900)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, boneyard, playerHand])

  const handStart = -((playerHand.length - 1) * 1.15) / 2

  usePillHud(onHud, [
    { text: turn === 'player' ? 'Tu turno: arrastra una ficha' : 'Turno de la bruja...', tone: turn === 'player' ? 'green' : 'red' },
    { text: `Bruja: ${aiHand.length} fichas`, tone: 'slate' },
    { text: `Pozo: ${boneyard.length}`, tone: 'gold' },
  ], hint, 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 8.5, 8.5]} fov={50} target={[0, 0, 2.2]} />
      <BoardLight position={[0, 8, 6]} />

      {/* Mesa */}
      <mesh position={[0, -0.14, 1.6]} receiveShadow>
        <boxGeometry args={[9.5, 0.2, 8.6]} />
        <meshStandardMaterial color="#3f2a17" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.06, 1.6]} receiveShadow>
        <boxGeometry args={[9, 0.06, 8.1]} />
        <meshStandardMaterial color="#5b3a21" roughness={0.7} />
      </mesh>

      <Witch position={[-3.3, 0.1, 0.6]} handCount={aiHand.length} />
      <SpellBook position={[-4.5, 0.02, 0.6]} rotation={[0, 0.4, 0]} />
      <PotionBottle position={[3.9, 0.16, -0.6]} color="#a855f7" />
      <PotionBottle position={[4.25, 0.16, -0.9]} color="#22c55e" />
      <Candle position={[-4.4, 0.02, -2.6]} />
      <Candle position={[4.3, 0.02, -2.4]} />

      <ChainTiles chain={chain} />

      {dragTile && dragPos && (
        <TileMesh left={dragTile.a} right={dragTile.b} position={[dragPos.x, 0, dragPos.z]} color="#e0f2fe" elevated ghost />
      )}

      {dragTile && (
        <mesh position={[0, 1.2, 1.6]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={onDragMove} onPointerUp={finishDrag} onPointerLeave={finishDrag}>
          <planeGeometry args={[11, 10]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {boneyard.length > 0 && (
        <group
          position={[5.35, 0, 1.6]}
          onClick={(e) => { e.stopPropagation(); drawFromBoneyard() }}
          onPointerOver={(e) => { e.stopPropagation(); if (turn === 'player') document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
          {boneyard.slice(0, 6).map((_, i) => (
            <mesh key={i} position={[0, i * 0.05, 0]} rotation={[0, i * 0.2, 0]} castShadow>
              <boxGeometry args={[0.6, 0.16, 0.9]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          ))}
          <Text raycast={() => null} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.16} color="#fde68a" anchorX="center" anchorY="middle">POZO</Text>
        </group>
      )}
      {boneyard.length > 0 && (
        <FloatingPointer position={[5.35, 0.85, 1.6]} label={'AGARRAR\nMÁS FICHAS'} />
      )}

      <group position={[0, 0, 4.6]}>
        {playerHand.filter((t) => t !== dragTile).map((t, i) => (
          <TileMesh
            key={`${t.a}-${t.b}`}
            left={t.a} right={t.b}
            position={[handStart + i * 1.15, 0, 0]}
            color={isPlayable(t, ends.left, ends.right) ? '#e0f2fe' : '#cbd5e1'}
            hoverable={turn === 'player' && active}
            onPointerDown={(e) => startDrag(t, e)}
          />
        ))}
      </group>
    </group>
  )
}
