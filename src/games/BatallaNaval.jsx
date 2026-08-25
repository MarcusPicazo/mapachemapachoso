import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import {
  SIZE, SHIP_SIZES, emptyBoard, placeFleet, makeAI, shipSunk, allSunk,
  canPlaceShip, placeShipOnGrid, removeShipFromGrid, deriveFleetInfo,
} from './common/battleship'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import Particles from '../components/biome/Particles'
import { sfx } from '../utils/audio'

const SPACING = 0.64
const GAP = 1.7
const boardW = (SIZE - 1) * SPACING
const LEFT_CX = -(boardW + GAP) / 2
const RIGHT_CX = (boardW + GAP) / 2
const TRAY_Z = boardW / 2 + 1.9
const TRAY_SLOTS = [-1.7, -0.85, 0, 0.85, 1.7]
const CELL_HALF = SPACING * 0.44
const FRAME_T = 0.22
const FRAME_MARGIN = 0.07
const FRAME_HALF = boardW / 2 + CELL_HALF + FRAME_MARGIN + FRAME_T / 2

function markGridInit() { return new Array(SIZE).fill(0).map(() => new Array(SIZE).fill(null)) }

function cellWorld(centerX, r, c) {
  const x = centerX + c * SPACING - ((SIZE - 1) * SPACING) / 2
  const z = r * SPACING - ((SIZE - 1) * SPACING) / 2
  return [x, z]
}

function rayToCell(centerX, ray) {
  const t = (0 - ray.origin.y) / ray.direction.y
  const x = ray.origin.x + ray.direction.x * t
  const z = ray.origin.z + ray.direction.z * t
  return worldToCell(centerX, x, z)
}

function worldToCell(centerX, x, z) {
  const c = Math.round((x - centerX + ((SIZE - 1) * SPACING) / 2) / SPACING)
  const r = Math.round((z + ((SIZE - 1) * SPACING) / 2) / SPACING)
  return { r: Math.max(0, Math.min(SIZE - 1, r)), c: Math.max(0, Math.min(SIZE - 1, c)) }
}

function shipCenter(centerX, r, c, len, horizontal) {
  const [x0, z0] = cellWorld(centerX, r, c)
  if (horizontal) return [x0 + ((len - 1) * SPACING) / 2, 0, z0]
  return [x0, 0, z0 + ((len - 1) * SPACING) / 2]
}

function ShipHull({ len, horizontal, color = '#64748b', ghost = false, sunk = false }) {
  const length = len * SPACING - SPACING * 0.18
  const width = SPACING * 0.6
  const hullColor = sunk ? '#1e293b' : color
  return (
    <group rotation={[0, horizontal ? 0 : Math.PI / 2, 0]} position={[0, sunk ? -0.1 : 0, 0]}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[length - width * 0.7, 0.22, width]} />
        <meshStandardMaterial color={hullColor} roughness={0.5} transparent={ghost} opacity={ghost ? 0.55 : 1} />
      </mesh>
      <mesh position={[length / 2 - width * 0.35, 0.13, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[width / 2, width * 0.7, 4]} />
        <meshStandardMaterial color={hullColor} roughness={0.5} transparent={ghost} opacity={ghost ? 0.55 : 1} />
      </mesh>
      <mesh position={[-length / 2 + width * 0.35, 0.13, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[width / 2, width * 0.7, 4]} />
        <meshStandardMaterial color={hullColor} roughness={0.5} transparent={ghost} opacity={ghost ? 0.55 : 1} />
      </mesh>
      {!ghost && len >= 3 && (
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
          <meshStandardMaterial color={sunk ? '#1e293b' : '#3f2a17'} />
        </mesh>
      )}
      {sunk && (
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

function FleetTracker({ position, label, tone, grid, marks }) {
  const hitsBool = marks.map((row) => row.map((v) => v === 'hit'))
  const glow = tone === 'blue' ? '#60a5fa' : '#f87171'
  const border = tone === 'blue' ? '#3b82f6' : '#ef4444'
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
      <div className="pointer-events-none rounded-xl bg-slate-900/85 border-2 px-2 py-1.5 flex flex-col items-center gap-1" style={{ borderColor: border }}>
        <div className="text-[9px] font-black uppercase tracking-wide" style={{ color: glow }}>{label}</div>
        <div className="flex gap-1.5">
          {SHIP_SIZES.map((len, id) => {
            const sunk = shipSunk(grid, hitsBool, id)
            return (
              <div key={id} className="flex flex-col gap-[1.5px]">
                {Array.from({ length: len }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-1.5 rounded-sm"
                    style={sunk ? { background: '#334155' } : { background: glow, boxShadow: `0 0 5px ${glow}` }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </Html>
  )
}

function Gull({ position, speed, radius }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed
    ref.current.position.set(position[0] + Math.cos(t) * radius, position[1] + Math.sin(t * 2) * 0.3, position[2] + Math.sin(t) * radius)
    ref.current.rotation.y = -t
  })
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, 0.3]}><coneGeometry args={[0.03, 0.5, 3]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh rotation={[0, 0, -0.3]} position={[0.15, 0, 0]}><coneGeometry args={[0.03, 0.5, 3]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>
  )
}

function Driftwood({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.08, 0.9, 8]} /><meshStandardMaterial color="#78350f" roughness={0.9} /></mesh>
    </group>
  )
}

function Lighthouse({ position }) {
  const lightRef = useRef()
  useFrame(({ clock }) => {
    if (lightRef.current) lightRef.current.intensity = 1.4 + Math.sin(clock.getElapsedTime() * 3) * 0.6
  })
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.35, 0.5, 2.4, 12]} /><meshStandardMaterial color="#e2e8f0" roughness={0.6} /></mesh>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.36, 0.36, 0.4, 12]} /><meshStandardMaterial color="#dc2626" roughness={0.5} /></mesh>
      <mesh position={[0, 2.55, 0]}><cylinderGeometry args={[0.28, 0.28, 0.35, 10]} /><meshStandardMaterial color="#facc15" emissive="#fbbf24" emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 2.85, 0]}><coneGeometry args={[0.32, 0.3, 10]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
      <pointLight ref={lightRef} position={[0, 2.55, 0]} color="#fde68a" intensity={1.6} distance={10} />
    </group>
  )
}

function Fire({ x, z }) {
  const ref = useRef()
  const seed = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * 8 + seed
    ref.current.scale.setScalar(0.82 + Math.sin(t) * 0.16 + Math.sin(t * 2.3) * 0.08)
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.3
  })
  return (
    <group position={[x, 0.14, z]} ref={ref}>
      <mesh position={[0, 0.05, 0]}>
        <coneGeometry args={[0.15, 0.42, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.5} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <coneGeometry args={[0.09, 0.26, 8]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={2} transparent opacity={0.88} />
      </mesh>
    </group>
  )
}

function CellTile({ x, z, y, color, onClick, onOver, onOut }) {
  return (
    <mesh
      position={[x, y, z]}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      <boxGeometry args={[SPACING * 0.88, 0.14, SPACING * 0.88]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  )
}

function Board({ centerX, grid, marks, ownFleet, onCellClick, disabled }) {
  const hitsBool = useMemo(() => marks.map((row) => row.map((v) => v === 'hit')), [marks])
  const cells = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const [x, z] = cellWorld(centerX, r, c)
      const mark = marks[r][c]
      const shipId = grid[r][c]
      const sunkHere = mark === 'hit' && shipId !== null && shipSunk(grid, hitsBool, shipId)
      let color = '#1d4ed8'
      if (mark === 'miss') color = '#0ea5e9'
      if (mark === 'hit') color = sunkHere ? '#7c2d12' : '#dc2626'
      cells.push(
        <CellTile
          key={`${r}-${c}`}
          x={x} z={z} y={mark ? 0.05 : 0} color={color}
          onClick={(e) => { e.stopPropagation(); if (!disabled && !mark) onCellClick(r, c) }}
          onOver={(e) => { e.stopPropagation(); if (!disabled && !mark) document.body.style.cursor = 'pointer' }}
          onOut={() => { document.body.style.cursor = 'default' }}
        />
      )
      if (mark === 'hit') {
        if (sunkHere) {
          cells.push(<Fire key={`fire-${r}-${c}`} x={x} z={z} />)
        } else {
          cells.push(
            <mesh key={`hit-${r}-${c}`} position={[x, 0.32, z]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
            </mesh>
          )
        }
      }
      if (mark === 'miss') {
        cells.push(
          <mesh key={`miss-${r}-${c}`} position={[x, 0.22, z]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} />
          </mesh>
        )
      }
    }
  }
  return <group>{cells}</group>
}

function BoardFrame({ centerX }) {
  const half = FRAME_HALF
  const t = FRAME_T
  const span = half * 2 + t
  return (
    <group position={[centerX, -0.02, 0]}>
      <mesh position={[0, 0, -half]}><boxGeometry args={[span, 0.22, t]} /><meshStandardMaterial color="#5b3a21" roughness={0.8} /></mesh>
      <mesh position={[0, 0, half]}><boxGeometry args={[span, 0.22, t]} /><meshStandardMaterial color="#5b3a21" roughness={0.8} /></mesh>
      <mesh position={[-half, 0, 0]}><boxGeometry args={[t, 0.22, span]} /><meshStandardMaterial color="#5b3a21" roughness={0.8} /></mesh>
      <mesh position={[half, 0, 0]}><boxGeometry args={[t, 0.22, span]} /><meshStandardMaterial color="#5b3a21" roughness={0.8} /></mesh>
    </group>
  )
}

function Ocean() {
  return (
    <mesh position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 14]} />
      <meshStandardMaterial color="#0c4a6e" roughness={0.35} metalness={0.15} />
    </mesh>
  )
}

function Buoy({ position }) {
  const ref = useRef()
  return (
    <group position={position} ref={ref}>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.14, 0.18, 0.32, 10]} /><meshStandardMaterial color="#dc2626" roughness={0.5} /></mesh>
      <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color="#f8fafc" roughness={0.5} /></mesh>
    </group>
  )
}

export default function BatallaNaval({ active, onWin, onLose, onHud }) {
  const aiGrid = useMemo(() => placeFleet(), [])
  const aiBrain = useMemo(() => makeAI(), [])

  const [placementPhase, setPlacementPhase] = useState(true)
  const [playerGrid, setPlayerGrid] = useState(() => emptyBoard())
  const [fleet, setFleet] = useState(() => SHIP_SIZES.map((len, id) => ({ id, len, placed: false, r: null, c: null, horizontal: true })))
  const [dragId, setDragId] = useState(null)
  const [dragPos, setDragPos] = useState(null)
  const [dragHorizontal, setDragHorizontal] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const [enemyMarks, setEnemyMarks] = useState(markGridInit)
  const [ownMarks, setOwnMarks] = useState(markGridInit)
  const [turn, setTurn] = useState('player')
  const [message, setMessage] = useState('')
  const finished = useRef(false)

  const gridForCheck = useMemo(() => (dragId != null ? removeShipFromGrid(playerGrid, dragId) : playerGrid), [dragId, playerGrid])

  const startDrag = (id, e) => {
    if (!active || !placementPhase) return
    e.stopPropagation()
    const f = fleet.find((x) => x.id === id)
    setDragHorizontal(f.horizontal)
    setDragId(id)
    setSelectedId(id)
    setDragPos(f.placed ? { r: f.r, c: f.c } : null)
    sfx.click()
  }

  const onDragMove = (e) => {
    if (dragId == null) return
    e.stopPropagation()
    setDragPos(rayToCell(LEFT_CX, e.ray))
  }

  const finishDrag = useCallback(() => {
    if (dragId == null) return
    const f = fleet.find((x) => x.id === dragId)
    if (dragPos && f && canPlaceShip(gridForCheck, dragPos.r, dragPos.c, f.len, dragHorizontal)) {
      setPlayerGrid(placeShipOnGrid(gridForCheck, dragPos.r, dragPos.c, f.len, dragHorizontal, dragId))
      setFleet((fs) => fs.map((x) => (x.id === dragId ? { ...x, placed: true, r: dragPos.r, c: dragPos.c, horizontal: dragHorizontal } : x)))
      sfx.place()
    } else {
      sfx.pop()
    }
    setDragId(null)
    setDragPos(null)
  }, [dragId, dragPos, dragHorizontal, fleet, gridForCheck])

  useEffect(() => {
    if (dragId == null) return
    const onUp = () => finishDrag()
    window.addEventListener('pointerup', onUp)
    return () => window.removeEventListener('pointerup', onUp)
  }, [dragId, finishDrag])

  const rotateTarget = dragId != null ? dragId : (selectedId != null ? selectedId : fleet.find((f) => !f.placed)?.id)
  const rotate = () => {
    if (dragId != null) { setDragHorizontal((h) => !h); return }
    if (rotateTarget == null) return
    const f = fleet.find((x) => x.id === rotateTarget)
    if (!f) return
    if (!f.placed) {
      setFleet((fs) => fs.map((x) => (x.id === rotateTarget ? { ...x, horizontal: !x.horizontal } : x)))
      sfx.click()
      return
    }
    // Ficha ya colocada: rota en su lugar si el nuevo giro sigue cabiendo.
    const baseGrid = removeShipFromGrid(playerGrid, rotateTarget)
    const newHorizontal = !f.horizontal
    if (canPlaceShip(baseGrid, f.r, f.c, f.len, newHorizontal)) {
      setPlayerGrid(placeShipOnGrid(baseGrid, f.r, f.c, f.len, newHorizontal, rotateTarget))
      setFleet((fs) => fs.map((x) => (x.id === rotateTarget ? { ...x, horizontal: newHorizontal } : x)))
      sfx.click()
    } else {
      sfx.pop()
    }
  }

  const randomizeFleet = () => {
    const grid = placeFleet()
    setPlayerGrid(grid)
    setFleet(deriveFleetInfo(grid))
    setDragId(null)
    setDragPos(null)
    sfx.place()
  }

  const allPlaced = fleet.every((f) => f.placed)
  const startBattle = () => {
    if (!allPlaced) return
    setPlacementPhase(false)
    sfx.chime()
  }

  const onPlayerShot = useCallback((r, c) => {
    if (!active || turn !== 'player' || finished.current || enemyMarks[r][c]) return
    const hit = aiGrid[r][c] !== null
    setEnemyMarks((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = hit ? 'hit' : 'miss'
      const hitsBool = next.map((row) => row.map((v) => v === 'hit'))
      if (hit) {
        sfx.hit()
        if (shipSunk(aiGrid, hitsBool, aiGrid[r][c])) setMessage('¡Barco enemigo hundido!')
        if (allSunk(aiGrid, hitsBool)) {
          finished.current = true
          setTimeout(() => onWin(), 400)
        }
      } else {
        sfx.pop()
        setMessage('')
      }
      return next
    })
    if (!hit) setTurn('ai')
  }, [active, turn, enemyMarks, aiGrid, onWin])

  useEffect(() => {
    if (!active || placementPhase || turn !== 'ai' || finished.current) return
    let cancelled = false
    const shoot = () => {
      if (cancelled || finished.current) return
      const [r, c] = aiBrain.pickShot()
      const hit = playerGrid[r][c] !== null
      aiBrain.reportResult(r, c, hit)
      setOwnMarks((prev) => {
        const next = prev.map((row) => [...row])
        next[r][c] = hit ? 'hit' : 'miss'
        const hitsBool = next.map((row) => row.map((v) => v === 'hit'))
        if (hit) {
          sfx.hit()
          if (allSunk(playerGrid, hitsBool)) {
            finished.current = true
            setTimeout(() => onLose('La flota fantasma hundió toda nuestra armada. ¡Reagrupemos, Jazz!'), 400)
          }
        } else {
          sfx.pop()
        }
        return next
      })
      setTimeout(() => {
        if (cancelled || finished.current) return
        if (hit) shoot()
        else setTurn('player')
      }, 550)
    }
    const t = setTimeout(shoot, 500)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active, placementPhase])

  const countSunk = (grid, marks) => {
    const hitsBool = marks.map((row) => row.map((v) => v === 'hit'))
    let n = 0
    for (let id = 0; id < SHIP_SIZES.length; id++) if (shipSunk(grid, hitsBool, id)) n++
    return n
  }
  const enemySunk = countSunk(aiGrid, enemyMarks)
  const ownSunk = countSunk(playerGrid, ownMarks)

  usePillHud(onHud, placementPhase
    ? [
      { text: `Barcos colocados: ${fleet.filter((f) => f.placed).length}/${SHIP_SIZES.length}`, tone: 'gold' },
      { text: dragHorizontal ? 'Orientación: ↔ horizontal' : 'Orientación: ↕ vertical', tone: 'blue' },
    ]
    : [
      { text: turn === 'player' ? 'Tu turno: dispara' : 'La flota fantasma ataca...', tone: turn === 'player' ? 'green' : 'red' },
      { text: `Hundidos tuyos: ${ownSunk}/5`, tone: 'red' },
      { text: `Hundidos enemigo: ${enemySunk}/5`, tone: 'green' },
      ...(message ? [{ text: message, tone: 'gold' }] : []),
    ])

  return (
    <group>
      <ResponsiveCamera position={[0, 13.5, 10.5]} fov={52} target={[0, 0, placementPhase ? 2 : -0.5]} maxFov={122} />
      <BoardLight position={[0, 9, 4]} />
      <Ocean />
      <Particles count={70} color="#e0f2fe" size={0.045} area={[16, 1.2, 12]} yBase={-0.1} speed={0.5} />
      <Buoy position={[-6.5, 0, -3]} />
      <Buoy position={[6.3, 0, 2.6]} />
      <Buoy position={[-5.8, 0, 3.2]} />
      <Driftwood position={[6.6, -0.08, -2.4]} rotation={[0, 0.6, 0]} />
      <Driftwood position={[-6.8, -0.08, 1.4]} rotation={[0, -0.4, 0]} />
      <Lighthouse position={[7.6, -0.2, -4.2]} />
      <Gull position={[-2, 3.6, -3]} speed={0.25} radius={3.2} />
      <Gull position={[2, 4.1, -2]} speed={0.32} radius={2.4} />

      <Html position={[LEFT_CX, 0, ((SIZE - 1) * SPACING) / 2 + 0.9]} center distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-none rounded-full bg-slate-900/80 border-2 border-blue-400 px-3 py-1 text-[11px] font-black text-blue-100 uppercase whitespace-nowrap">Tu flota</div>
      </Html>
      {!placementPhase && (
        <Html position={[RIGHT_CX, 0, ((SIZE - 1) * SPACING) / 2 + 0.9]} center distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
          <div className="pointer-events-none rounded-full bg-slate-900/80 border-2 border-red-400 px-3 py-1 text-[11px] font-black text-red-100 uppercase whitespace-nowrap">Flota enemiga</div>
        </Html>
      )}

      <BoardFrame centerX={LEFT_CX} />
      {!placementPhase && <BoardFrame centerX={RIGHT_CX} />}

      <Board centerX={LEFT_CX} grid={playerGrid} marks={ownMarks} ownFleet={!placementPhase} disabled />
      {!placementPhase && (
        <Board centerX={RIGHT_CX} grid={aiGrid} marks={enemyMarks} ownFleet={false} disabled={turn !== 'player' || !active} onCellClick={onPlayerShot} />
      )}

      {fleet.filter((f) => f.placed && f.id !== dragId).map((f) => {
        const sunk = !placementPhase && shipSunk(playerGrid, ownMarks.map((row) => row.map((v) => v === 'hit')), f.id)
        return (
          <group key={f.id} position={shipCenter(LEFT_CX, f.r, f.c, f.len, f.horizontal)} onPointerDown={(e) => placementPhase && startDrag(f.id, e)}>
            {placementPhase && f.id === selectedId && (
              <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, f.horizontal ? 0 : Math.PI / 2]}>
                <planeGeometry args={[f.len * SPACING - SPACING * 0.1, SPACING * 0.9]} />
                <meshBasicMaterial color="#facc15" transparent opacity={0.4} />
              </mesh>
            )}
            <ShipHull len={f.len} horizontal={f.horizontal} sunk={sunk} />
          </group>
        )
      })}

      {!placementPhase && (
        <>
          <FleetTracker position={[LEFT_CX - boardW / 2 - 1.1, 0, 0]} label="Tu flota" tone="blue" grid={playerGrid} marks={ownMarks} />
          <FleetTracker position={[RIGHT_CX + boardW / 2 + 1.1, 0, 0]} label="Flota enemiga" tone="red" grid={aiGrid} marks={enemyMarks} />
        </>
      )}

      {placementPhase && (
        <>
          {fleet.filter((f) => !f.placed && f.id !== dragId).map((f) => (
            <group
              key={f.id}
              position={[LEFT_CX + TRAY_SLOTS[f.id], 0, TRAY_Z]}
              onPointerDown={(e) => startDrag(f.id, e)}
            >
              <ShipHull len={f.len} horizontal={false} color="#0e7490" />
            </group>
          ))}

          {dragId != null && dragPos && (() => {
            const f = fleet.find((x) => x.id === dragId)
            const valid = canPlaceShip(gridForCheck, dragPos.r, dragPos.c, f.len, dragHorizontal)
            return (
              <group position={shipCenter(LEFT_CX, dragPos.r, dragPos.c, f.len, dragHorizontal)}>
                <ShipHull len={f.len} horizontal={dragHorizontal} color={valid ? '#22c55e' : '#dc2626'} ghost />
              </group>
            )
          })()}

          {dragId != null && (
            <mesh
              position={[LEFT_CX, 1.2, 1]}
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerMove={onDragMove}
              onPointerUp={finishDrag}
              onPointerLeave={finishDrag}
            >
              <planeGeometry args={[boardW + 6, boardW + 12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          )}

          <Html position={[LEFT_CX, 0, TRAY_Z + 1.55]} center distanceFactor={9} zIndexRange={[5, 9]} style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center gap-1 pointer-events-none">
              <div className="rounded-full bg-amber-900/85 border-2 border-amber-300 px-3 py-1 text-[10px] font-black text-amber-50 uppercase whitespace-nowrap">
                Arrastra tus barcos al tablero
              </div>
            </div>
          </Html>

          <Html position={[LEFT_CX, 0, TRAY_Z + 2.3]} center distanceFactor={9} zIndexRange={[5, 9]}>
            <div className="flex gap-2 pointer-events-auto">
              <button onClick={rotate} className="rounded-full bg-sky-700 hover:bg-sky-600 border-2 border-sky-300 px-3 py-1.5 text-[11px] font-black text-white uppercase whitespace-nowrap">
                🔄 Girar
              </button>
              <button onClick={randomizeFleet} className="rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-400 px-3 py-1.5 text-[11px] font-black text-white uppercase whitespace-nowrap">
                🎲 Azar
              </button>
              <button
                onClick={startBattle}
                disabled={!allPlaced}
                className={`rounded-full border-2 px-4 py-1.5 text-[11px] font-black uppercase whitespace-nowrap ${allPlaced ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-300 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 cursor-not-allowed'}`}
              >
                ⚔️ Comenzar batalla
              </button>
            </div>
          </Html>
        </>
      )}
    </group>
  )
}
