import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const N = 4
const MAX_MOVES = 22
const PEG_X = [-1.7, 0, 1.7]
const DISK_H = 0.24
const DISK_COLORS = ['#f87171', '#fbbf24', '#4ade80', '#60a5fa']
const DRAG_LIFT = 2.4

function initialPegs() {
  const a = []
  for (let i = N - 1; i >= 0; i--) a.push(i)
  return [a, [], []]
}

function diskY(stackIdx) { return 0.108 + stackIdx * DISK_H }

function rayToGround(ray) {
  const t = (0 - ray.origin.y) / ray.direction.y
  return { x: ray.origin.x + ray.direction.x * t, z: ray.origin.z + ray.direction.z * t }
}

function closestPeg(x) {
  let best = 0, bestD = Infinity
  PEG_X.forEach((px, i) => { const d = Math.abs(px - x); if (d < bestD) { bestD = d; best = i } })
  return best
}

function Peg({ x, highlight, valid }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.material.emissiveIntensity = highlight ? 0.6 + Math.sin(clock.getElapsedTime() * 6) * 0.3 : 0
  })
  const baseColor = highlight ? (valid ? '#166534' : '#7f1d1d') : '#5b3a21'
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>
      <mesh ref={ref} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 2.2, 12]} />
        <meshStandardMaterial color="#92400e" emissive="#fbbf24" emissiveIntensity={0} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Disk({ x, y, z = 0, size, held, error, hovered }) {
  const ref = useRef()
  const cur = useRef(null)
  const wasHeld = useRef(held)
  const landT = useRef(0)
  useFrame((_, dt) => {
    if (!ref.current) return
    if (!cur.current) cur.current = { x, y, z }
    const speed = held ? 22 : 9
    const k = Math.min(1, dt * speed)
    cur.current.x += (x - cur.current.x) * k
    cur.current.y += (y - cur.current.y) * k
    cur.current.z += (z - cur.current.z) * k
    let px = cur.current.x
    if (error) px += Math.sin(performance.now() * 0.03) * 0.06
    ref.current.position.set(px, cur.current.y, cur.current.z)
    // Al soltar un disco (held true -> false) dispara un rebote/aplastado
    // breve que se lee como "cae y encaja" en el palo de la torre.
    if (wasHeld.current && !held) landT.current = 0.28
    wasHeld.current = held
    if (landT.current > 0) landT.current = Math.max(0, landT.current - dt)
    const squash = landT.current > 0 ? 1 - Math.sin((landT.current / 0.28) * Math.PI) * 0.24 : 1
    const targetScale = (held ? 1.12 : 1) * (hovered && !held ? 1.08 : 1)
    ref.current.scale.x += (targetScale - ref.current.scale.x) * Math.min(1, dt * 10)
    ref.current.scale.z = ref.current.scale.x
    ref.current.scale.y = squash
  })
  const radius = 0.32 + size * 0.16
  const color = error ? '#ef4444' : DISK_COLORS[size % DISK_COLORS.length]
  return (
    <mesh ref={ref} position={[x, y, z]} castShadow>
      <cylinderGeometry args={[radius, radius, DISK_H * 0.9, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={held ? 0.6 : (hovered ? 0.55 : 0.35)} roughness={0.4} />
    </mesh>
  )
}

export default function RuneTowers({ active, onWin, onLose, onHud }) {
  const [pegs, setPegs] = useState(initialPegs)
  const [moves, setMoves] = useState(0)
  const [errorPeg, setErrorPeg] = useState(-1)
  const [hint, setHint] = useState('Toca y arrastra el disco de arriba de una torre hacia otra torre para moverlo.')
  const [dragFrom, setDragFrom] = useState(null)
  const [dragPos, setDragPos] = useState(null)
  const [hoveredPeg, setHoveredPeg] = useState(-1)
  const finished = useRef(false)
  const pegsRef = useRef(pegs)
  const dragFromRef = useRef(null)
  const dragPosRef = useRef(null)
  pegsRef.current = pegs

  const hoverPeg = dragFrom != null && dragPos != null ? closestPeg(dragPos.x) : -1
  const dragDisk = dragFrom != null ? pegs[dragFrom][pegs[dragFrom].length - 1] : null
  const hoverValid = dragDisk != null && hoverPeg >= 0 && (pegs[hoverPeg].length === 0 || pegs[hoverPeg][pegs[hoverPeg].length - 1] > dragDisk)

  const startDrag = (i, e) => {
    if (!active || finished.current || pegs[i].length === 0) return
    e.stopPropagation()
    dragFromRef.current = i
    dragPosRef.current = { x: PEG_X[i], z: 0 }
    setDragFrom(i)
    setDragPos(dragPosRef.current)
    sfx.click()
  }

  const onDragMove = (e) => {
    if (dragFromRef.current == null) return
    e.stopPropagation()
    const p = rayToGround(e.ray)
    dragPosRef.current = p
    setDragPos(p)
  }

  // dragFrom/dragPos/pegs viven tambien en refs para que finishDrag pueda
  // leerlos de forma sincrona: llamar un setState desde DENTRO del updater
  // de otro (el patron anterior) desordenaba las actualizaciones.
  const finishDrag = useCallback(() => {
    const from = dragFromRef.current
    const pos = dragPosRef.current
    dragFromRef.current = null
    dragPosRef.current = null
    setDragFrom(null)
    setDragPos(null)
    if (from == null || !pos || finished.current) return
    const dest = closestPeg(pos.x)
    if (dest === from) return
    const curPegs = pegsRef.current
    const disk = curPegs[from][curPegs[from].length - 1]
    const destTop = curPegs[dest][curPegs[dest].length - 1]
    if (destTop === undefined || disk < destTop) {
      sfx.place()
      const next = curPegs.map((p) => [...p])
      next[from].pop()
      next[dest].push(disk)
      setPegs(next)
      const nm = moves + 1
      setMoves(nm)
      if (next[2].length === N) {
        finished.current = true
        sfx.win()
        setTimeout(() => onWin(), 400)
      } else if (nm >= MAX_MOVES) {
        finished.current = true
        setTimeout(() => onLose('¡Se agotaron los movimientos mágicos! Las runas volvieron a su lugar.'), 500)
      }
      setHint('Sigue moviendo discos: nunca un disco grande sobre uno chico.')
    } else {
      sfx.hit()
      setErrorPeg(dest)
      setTimeout(() => setErrorPeg(-1), 300)
      setHint('¡Ese disco es más grande! No puede ir sobre uno más chico. Intenta de nuevo.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onWin, onLose, moves])

  useEffect(() => {
    if (dragFrom == null) return
    window.addEventListener('pointerup', finishDrag)
    return () => window.removeEventListener('pointerup', finishDrag)
  }, [dragFrom, finishDrag])

  usePillHud(onHud, [
    { text: `Movimientos: ${moves}/${MAX_MOVES}`, tone: moves >= MAX_MOVES - 5 ? 'red' : 'gold' },
    { text: 'Lleva todos los discos a la torre 3', tone: 'green' },
  ], hint, 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 3.6, 5.6]} fov={48} target={[0, 0.8, 0]} />
      <BoardLight position={[0, 6, 4]} />

      <mesh position={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[5.6, 0.2, 2]} />
        <meshStandardMaterial color="#3f2a17" roughness={0.8} />
      </mesh>

      {PEG_X.map((x, i) => (
        <group key={i}>
          <Peg x={x} highlight={(dragFrom != null && hoverPeg === i) || errorPeg === i} valid={hoverValid} />
          <Text raycast={() => null} position={[x, -0.5, 0.9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.18} color="#fde68a" fontWeight={900} anchorX="center" anchorY="middle">TORRE {i + 1}</Text>
          {/* Zona de agarre grande sobre el disco de arriba de cada torre */}
          {pegs[i].length > 0 && dragFrom == null && (
            <mesh
              position={[x, diskY(pegs[i].length - 1), 0]}
              onPointerDown={(e) => startDrag(i, e)}
              onPointerOver={(e) => { e.stopPropagation(); setHoveredPeg(i); document.body.style.cursor = 'grab' }}
              onPointerOut={() => { setHoveredPeg((h) => (h === i ? -1 : h)); document.body.style.cursor = 'default' }}
            >
              <cylinderGeometry args={[0.6, 0.6, 0.5, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}

      {pegs.map((peg, pegIdx) =>
        peg.map((size, stackIdx) => {
          const isHeld = dragFrom === pegIdx && stackIdx === peg.length - 1
          const isTop = stackIdx === peg.length - 1
          if (isHeld && dragPos) {
            return <Disk key={`${pegIdx}-${size}`} x={dragPos.x} y={DRAG_LIFT} z={dragPos.z} size={size} held />
          }
          return <Disk key={`${pegIdx}-${size}`} x={PEG_X[pegIdx]} y={diskY(stackIdx)} size={size} error={errorPeg === pegIdx && isTop} hovered={dragFrom == null && hoveredPeg === pegIdx && isTop} />
        })
      )}

      {dragFrom != null && (
        <mesh
          position={[0, 1.2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={onDragMove}
          onPointerUp={finishDrag}
          onPointerLeave={finishDrag}
        >
          <planeGeometry args={[9, 7]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}
