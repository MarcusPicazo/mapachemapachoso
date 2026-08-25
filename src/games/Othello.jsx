import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { initialGrid, validMoves, applyMove, countPieces, makeOthelloCfg } from './common/othelloLogic'
import { minimax } from './common/minimax'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const SIZE = 6
const SPACING = 0.9
const MAX_TURNS = 12
const cfg = makeOthelloCfg(SIZE)

function Piece({ owner }) {
  const ref = useRef()
  const born = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (!born.current) born.current = clock.getElapsedTime()
    const t = Math.min(1, (clock.getElapsedTime() - born.current) / 0.35)
    const eased = 1 - Math.pow(1 - t, 3)
    const bounce = t < 1 ? 1 + Math.sin(t * Math.PI) * 0.18 : 1
    ref.current.scale.setScalar(eased * bounce)
    ref.current.rotation.y += 0.006
  })
  return (
    <mesh ref={ref} position={[0, 0.12, 0]} castShadow scale={0}>
      <cylinderGeometry args={[0.35, 0.35, 0.14, 20]} />
      <meshStandardMaterial color={owner === 'B' ? '#111827' : '#f8fafc'} roughness={0.3} />
    </mesh>
  )
}

function Mushroom({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow><cylinderGeometry args={[0.05, 0.06, 0.22, 8]} /><meshStandardMaterial color="#fef3c7" roughness={0.6} /></mesh>
      <mesh position={[0, 0.14, 0]}><sphereGeometry args={[0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#dc2626" roughness={0.5} /></mesh>
      <mesh position={[-0.04, 0.16, 0.05]}><sphereGeometry args={[0.02, 6, 6]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      <mesh position={[0.05, 0.17, -0.03]}><sphereGeometry args={[0.018, 6, 6]} /><meshStandardMaterial color="#fef3c7" /></mesh>
    </group>
  )
}

function ForestFirefly({ radius, speed, offset, height }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed + offset
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2.1) * 0.25, Math.sin(t) * radius)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 6, 6]} />
      <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.5} />
    </mesh>
  )
}

export default function Othello({ active, onWin, onLose, onHud }) {
  const [grid, setGrid] = useState(() => initialGrid(SIZE))
  const [turn, setTurn] = useState('player')
  const [turnCount, setTurnCount] = useState(0)
  const [hint, setHint] = useState('')
  const finished = useRef(false)

  const { B, W } = countPieces(grid)
  const playerMoves = useMemo(() => validMoves(grid, 'B', SIZE), [grid])
  const aiMoves = useMemo(() => validMoves(grid, 'W', SIZE), [grid])

  const endIfNeeded = (nextTurnCount, finalGrid) => {
    if (nextTurnCount >= MAX_TURNS && !finished.current) {
      finished.current = true
      const { B: b2, W: w2 } = countPieces(finalGrid)
      setTimeout(() => (b2 >= w2 ? onWin() : onLose('El espíritu del bosque domina más territorio.')), 400)
      return true
    }
    return false
  }

  const onCellClick = (r, c) => {
    if (!active || turn !== 'player' || finished.current) return
    if (!playerMoves.some(([mr, mc]) => mr === r && mc === c)) { sfx.hit(); return }
    sfx.place()
    const ng = applyMove(grid, [r, c], 'B', SIZE)
    setGrid(ng)
    setTurnCount((t) => {
      const nt = t + 1
      if (!endIfNeeded(nt, ng)) setTurn('ai')
      return nt
    })
  }

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    const t = setTimeout(() => {
      const moves = validMoves(grid, 'W', SIZE)
      if (moves.length === 0) {
        setHint('El espíritu no puede mover. Turno de vuelta.')
        setTurn('player')
        return
      }
      // Dificultad suavizada: profundidad menor y a veces un movimiento
      // valido al azar en vez del optimo, para que sea vencible por Jazz.
      // Dificultad "facil": casi siempre mueve al azar entre las opciones
      // validas, solo ocasionalmente juega con algo de estrategia.
      let chosen
      if (Math.random() < 0.8) {
        chosen = moves[Math.floor(Math.random() * moves.length)]
      } else {
        const { move } = minimax({ grid, turn: 'ai' }, 1, true, cfg)
        chosen = move ? move.move : moves[Math.floor(Math.random() * moves.length)]
      }
      sfx.place()
      const ng = applyMove(grid, chosen, 'W', SIZE)
      setGrid(ng)
      setTurnCount((t2) => {
        const nt = t2 + 1
        if (!endIfNeeded(nt, ng)) setTurn('player')
        return nt
      })
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active])

  useEffect(() => {
    if (!active || turn !== 'player' || finished.current) return
    if (playerMoves.length === 0 && aiMoves.length > 0) {
      setHint('No tienes movimientos válidos. Turno del espíritu.')
      setTimeout(() => { if (!finished.current) setTurn('ai') }, 800)
    } else if (playerMoves.length === 0 && aiMoves.length === 0 && !finished.current) {
      finished.current = true
      setTimeout(() => (B >= W ? onWin() : onLose('Nadie puede mover. El espíritu tiene más territorio.')), 400)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, playerMoves, aiMoves, active])

  usePillHud(onHud, [
    { text: `Turno ${turnCount}/${MAX_TURNS}`, tone: 'gold' },
    { text: `Tú: ${B}`, tone: 'green' },
    { text: `Espíritu: ${W}`, tone: 'red' },
    ...(hint ? [{ text: hint, tone: 'slate' }] : []),
  ])

  const offset = -((SIZE - 1) * SPACING) / 2

  return (
    <group>
      <ResponsiveCamera position={[0, 7.5, 5]} fov={48} target={[0, 0, 0]} />
      <BoardLight position={[0, 8, 3]} />
      <Mushroom position={[-3.6, -0.2, -2]} scale={1.3} />
      <Mushroom position={[-3.2, -0.2, -1.3]} scale={0.9} />
      <Mushroom position={[3.5, -0.2, 1.8]} scale={1.1} />
      <Mushroom position={[3.1, -0.2, 2.3]} scale={0.7} />
      {Array.from({ length: 8 }).map((_, i) => (
        <ForestFirefly key={i} radius={4.2 + Math.random() * 1.5} speed={0.15 + Math.random() * 0.2} offset={Math.random() * Math.PI * 2} height={0.8 + Math.random()} />
      ))}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[SIZE * SPACING + 0.3, 0.2, SIZE * SPACING + 0.3]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      {grid.map((row, r) => row.map((cell, c) => {
        const isMove = turn === 'player' && playerMoves.some(([mr, mc]) => mr === r && mc === c)
        return (
          <group key={`${r}-${c}`} position={[offset + c * SPACING, 0, offset + r * SPACING]}>
            <mesh
              onClick={(e) => { e.stopPropagation(); onCellClick(r, c) }}
              onPointerOver={(e) => { e.stopPropagation(); if (isMove) document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { document.body.style.cursor = 'default' }}
            >
              <boxGeometry args={[SPACING * 0.92, 0.05, SPACING * 0.92]} />
              <meshStandardMaterial color={isMove ? '#22c55e' : '#15803d'} />
            </mesh>
            {cell && <Piece key={`${r}-${c}-${cell}`} owner={cell} />}
          </group>
        )
      }))}
    </group>
  )
}
