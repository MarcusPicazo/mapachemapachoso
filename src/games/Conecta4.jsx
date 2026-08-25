import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { COLS, ROWS, emptyGrid, dropRow, cloneGrid, checkWinner, isFull, connect4Cfg } from './common/connect4logic'
import { minimax } from './common/minimax'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'
import { useGameStore } from '../store/gameStore'

const SPACING = 1.05
const OFFSET_X = -((COLS - 1) * SPACING) / 2
const BOARD_Y = -1.6
const TOP_Y = ROWS * SPACING + 0.6

function rowY(row) { return BOARD_Y + row * SPACING }

function Disc({ col, row, player }) {
  const ref = useRef()
  const started = useRef(false)
  const vel = useRef(0)
  const phase = useRef('falling') // 'falling' | 'settled'
  const bounces = useRef(0)
  const targetY = rowY(row)
  const x = OFFSET_X + col * SPACING

  useFrame((_, dt) => {
    if (!ref.current) return
    if (!started.current) {
      started.current = true
      ref.current.position.set(x, TOP_Y, 0.28)
    }
    if (phase.current === 'settled') return
    const p = ref.current.position
    vel.current -= 17 * dt
    p.y += vel.current * dt
    if (p.y <= targetY) {
      p.y = targetY
      if (bounces.current < 2 && Math.abs(vel.current) > 1.1) {
        vel.current = -vel.current * 0.3
        bounces.current++
      } else {
        vel.current = 0
        phase.current = 'settled'
      }
    }
    const squash = Math.max(0.8, 1 - Math.abs(vel.current) * 0.014)
    const stretch = 1 + (1 - squash) * 0.6
    ref.current.scale.set(stretch, squash, stretch)
  })

  return (
    <mesh ref={ref} position={[x, TOP_Y, 0.28]} castShadow>
      <cylinderGeometry args={[0.455, 0.455, 0.22, 28]} />
      <meshStandardMaterial color={player === 'P' ? '#ef4444' : '#facc15'} metalness={0.25} roughness={0.35} />
    </mesh>
  )
}

export default function Conecta4({ active, onWin, onLose, onHud }) {
  const [grid, setGrid] = useState(() => emptyGrid())
  const [discs, setDiscs] = useState([])
  const [turn, setTurn] = useState('player')
  const finished = useRef(false)
  const discId = useRef(0)
  // Tras varias derrotas seguidas el guardian "se cansa" un poco: piensa menos
  // pasos adelante y a veces suelta una jugada floja, sin que sea obvio.
  const lossStreak = useGameStore((s) => s.conecta4LossStreak)
  const easyMode = lossStreak >= 4

  const playMove = useCallback((col, player) => {
    setGrid((g) => {
      const row = dropRow(g, col)
      if (row === -1) return g
      const ng = cloneGrid(g)
      ng[row][col] = player
      sfx.place()
      setDiscs((ds) => [...ds, { id: discId.current++, col, row, player }])

      const winner = checkWinner(ng)
      if (winner && !finished.current) {
        finished.current = true
        setTimeout(() => {
          if (winner === 'P') { sfx.win(); onWin() } else { sfx.hit(); onLose('El guardián de piedra alineó 4 fichas. ¡Otra vez será, Jazz!') }
        }, 500)
      } else if (isFull(ng) && !finished.current) {
        finished.current = true
        setTimeout(() => onLose('¡Tablero lleno! Empate contra el guardián. Intentémoslo de nuevo.'), 400)
      } else {
        setTurn(player === 'P' ? 'ai' : 'player')
      }
      return ng
    })
  }, [onWin, onLose])

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    const t = setTimeout(() => {
      let move
      if (easyMode && Math.random() < 0.4) {
        const open = []
        for (let c = 0; c < COLS; c++) if (dropRow(grid, c) !== -1) open.push(c)
        move = open.length > 0 ? open[Math.floor(Math.random() * open.length)] : null
      } else {
        move = minimax({ grid }, easyMode ? 2 : 5, true, connect4Cfg).move
      }
      if (move !== null && move !== undefined) playMove(move, 'E')
    }, 650)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active, easyMode])

  const onColumnClick = (col) => {
    if (!active || turn !== 'player' || finished.current) return
    if (dropRow(grid, col) === -1) return
    playMove(col, 'P')
  }

  const holes = useMemo(() => {
    const arr = []
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) arr.push([c, r])
    return arr
  }, [])

  usePillHud(onHud, [
    { text: turn === 'player' ? 'Tu turno' : 'Turno del guardián...', tone: turn === 'player' ? 'green' : 'red' },
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 1.8, 10.5]} fov={45} target={[0, 0.8, 0]} />
      <BoardLight position={[0, 6, 6]} />

      {/* Backboard */}
      <mesh position={[0, rowY(ROWS / 2 - 0.5), 0]} receiveShadow>
        <boxGeometry args={[COLS * SPACING + 0.6, ROWS * SPACING + 0.6, 0.4]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
      </mesh>
      {holes.map(([c, r]) => (
        <mesh key={`${c}-${r}`} position={[OFFSET_X + c * SPACING, rowY(r), 0.22]}>
          <cylinderGeometry args={[0.48, 0.48, 0.15, 28]} />
          <meshStandardMaterial color="#0b1230" />
        </mesh>
      ))}

      {discs.map((d) => <Disc key={d.id} col={d.col} row={d.row} player={d.player} />)}

      {/* Zonas clicables por columna */}
      {new Array(COLS).fill(0).map((_, c) => (
        <mesh
          key={c}
          position={[OFFSET_X + c * SPACING, rowY(ROWS / 2 - 0.5) + 0.3, 0.6]}
          onClick={(e) => { e.stopPropagation(); onColumnClick(c) }}
          onPointerOver={(e) => { e.stopPropagation(); if (turn === 'player') document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
          visible={false}
        >
          <boxGeometry args={[SPACING * 0.95, ROWS * SPACING + 1.2, 1.2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}
