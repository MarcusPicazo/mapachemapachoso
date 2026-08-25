import { useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { emptyBoard, scoreTerritory, pickAiMove } from './common/goLogic'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const SIZE = 7
const SPACING = 0.85
const MAX_MOVES = 16

function Stone({ owner }) {
  const ref = useRef()
  const born = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (!born.current) born.current = clock.getElapsedTime()
    const t = Math.min(1, (clock.getElapsedTime() - born.current) / 0.4)
    const eased = 1 - Math.pow(1 - t, 3)
    ref.current.position.y = 0.16 + (1 - eased) * 1.4
    const bounce = t < 1 ? 1 + Math.sin(t * Math.PI) * 0.15 : 1
    ref.current.scale.setScalar(eased * bounce)
  })
  return (
    <mesh ref={ref} position={[0, 1.5, 0]} castShadow scale={0}>
      <sphereGeometry args={[0.32, 16, 16]} />
      <meshStandardMaterial color={owner === 'B' ? '#111827' : '#f8fafc'} roughness={0.25} />
    </mesh>
  )
}

function Fish({ radius, speed, offset, color, y }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed + offset
    ref.current.position.set(Math.cos(t) * radius, y, Math.sin(t) * radius * 0.6)
    ref.current.rotation.y = -t + Math.PI / 2
  })
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.06, 0.2, 6]} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
      <mesh position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.05, 0.07, 4]} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
    </group>
  )
}

function Firefly({ radius, speed, offset, height }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed + offset
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2.3) * 0.3, Math.sin(t) * radius)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 6, 6]} />
      <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.6} />
    </mesh>
  )
}

function PondDecor({ boardHalf }) {
  return (
    <group>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[boardHalf + 0.35, boardHalf + 1.9, 48]} />
        <meshStandardMaterial color="#155e75" roughness={0.3} metalness={0.2} transparent opacity={0.85} />
      </mesh>
      {[0.6, 0.75, 0.9].map((f, i) => (
        <Fish key={i} radius={(boardHalf + 1.1) * f} speed={0.22 + i * 0.08} offset={i * 2.1} color={i === 1 ? '#f97316' : '#fb923c'} y={-0.15} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <Firefly key={i} radius={boardHalf + 1.5 + Math.random() * 1.5} speed={0.15 + Math.random() * 0.2} offset={Math.random() * Math.PI * 2} height={0.6 + Math.random() * 1.2} />
      ))}
    </group>
  )
}

export default function GoMini({ active, onWin, onLose, onHud }) {
  const [grid, setGrid] = useState(() => emptyBoard(SIZE))
  const [turn, setTurn] = useState('player')
  const [moveCount, setMoveCount] = useState(0)
  const finished = useRef(false)

  const finishGame = (g) => {
    finished.current = true
    const { black, white } = scoreTerritory(g, SIZE)
    // Empate favorece a la jugadora (compensacion justa: ambos colocan la
    // misma cantidad de piedras, asi que un empate exacto ya es un buen
    // resultado y no deberia contarse como derrota).
    setTimeout(() => (black >= white ? onWin() : onLose(`El bosque controla más territorio (${white} vs ${black}).`)), 500)
  }

  const onCellClick = (r, c) => {
    if (!active || turn !== 'player' || finished.current || grid[r][c] !== null) return
    sfx.place()
    const ng = grid.map((row) => [...row])
    ng[r][c] = 'B'
    setGrid(ng)
    setMoveCount((m) => {
      const nm = m + 1
      if (nm >= MAX_MOVES) finishGame(ng)
      else setTurn('ai')
      return nm
    })
  }

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    const t = setTimeout(() => {
      const move = pickAiMove(grid, SIZE)
      if (!move) { setTurn('player'); return }
      sfx.place()
      const ng = grid.map((row) => [...row])
      ng[move[0]][move[1]] = 'W'
      setGrid(ng)
      setMoveCount((m) => {
        const nm = m + 1
        if (nm >= MAX_MOVES) finishGame(ng)
        else setTurn('player')
        return nm
      })
    }, 650)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active])

  const { black, white } = scoreTerritory(grid, SIZE)

  usePillHud(onHud, [
    { text: `Jugada ${moveCount}/${MAX_MOVES}`, tone: 'gold' },
    { text: `Tú: ${black}`, tone: 'green' },
    { text: `Bosque: ${white}`, tone: 'red' },
  ])

  const offset = -((SIZE - 1) * SPACING) / 2

  return (
    <group>
      <ResponsiveCamera position={[0, 8, 5]} fov={48} target={[0, 0, 0]} />
      <BoardLight position={[0, 8, 3]} />
      <PondDecor boardHalf={(SIZE * SPACING) / 2} />
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[SIZE * SPACING + 0.3, 0.15, SIZE * SPACING + 0.3]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      {grid.map((row, r) => row.map((cell, c) => (
        <group key={`${r}-${c}`} position={[offset + c * SPACING, 0, offset + r * SPACING]}>
          <mesh
            onClick={(e) => { e.stopPropagation(); onCellClick(r, c) }}
            onPointerOver={(e) => { e.stopPropagation(); if (!cell && turn === 'player') document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'default' }}
          >
            <boxGeometry args={[SPACING * 0.94, 0.04, SPACING * 0.94]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
          {cell && <Stone owner={cell} />}
        </group>
      )))}
    </group>
  )
}
