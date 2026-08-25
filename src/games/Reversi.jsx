import { useMemo, useRef, useState, useEffect } from 'react'
import { initialGrid, validMoves, applyMove, countPieces, makeOthelloCfg } from './common/othelloLogic'
import { minimax } from './common/minimax'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const SIZE = 6
const SPACING = 0.9
const MAX_TURNS = 10
const cfg = makeOthelloCfg(SIZE)

export default function Reversi({ active, onWin, onLose, onHud }) {
  const [grid, setGrid] = useState(() => initialGrid(SIZE))
  const [turn, setTurn] = useState('player')
  const [turnCount, setTurnCount] = useState(0)
  const [hint, setHint] = useState('')
  const finished = useRef(false)

  const { B, W } = countPieces(grid)
  const playerMoves = useMemo(() => validMoves(grid, 'B', SIZE), [grid])
  const aiMoves = useMemo(() => validMoves(grid, 'W', SIZE), [grid])

  const endIfNeeded = (nextTurnCount) => {
    if (nextTurnCount >= MAX_TURNS && !finished.current) {
      finished.current = true
      const { B: b2, W: w2 } = countPieces(grid)
      setTimeout(() => (b2 >= w2 ? onWin() : onLose('El vigía mágico domina más casillas de la torre.')), 400)
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
      if (!endIfNeeded(nt)) setTurn('ai')
      return nt
    })
  }

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    const t = setTimeout(() => {
      const moves = validMoves(grid, 'W', SIZE)
      if (moves.length === 0) { setHint('El vigía no puede mover.'); setTurn('player'); return }
      const { move } = minimax({ grid, turn: 'ai' }, 3, true, cfg)
      const chosen = move ? move.move : moves[Math.floor(Math.random() * moves.length)]
      sfx.place()
      const ng = applyMove(grid, chosen, 'W', SIZE)
      setGrid(ng)
      setTurnCount((t2) => {
        const nt = t2 + 1
        if (!endIfNeeded(nt)) setTurn('player')
        return nt
      })
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active])

  useEffect(() => {
    if (!active || turn !== 'player' || finished.current) return
    if (playerMoves.length === 0 && aiMoves.length > 0) {
      setHint('Sin movimientos. Turno del vigía.')
      setTimeout(() => { if (!finished.current) setTurn('ai') }, 800)
    } else if (playerMoves.length === 0 && aiMoves.length === 0 && !finished.current) {
      finished.current = true
      setTimeout(() => (B >= W ? onWin() : onLose('Nadie puede mover. El vigía tiene más territorio.')), 400)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, playerMoves, aiMoves, active])

  usePillHud(onHud, [
    { text: `Turno ${turnCount}/${MAX_TURNS}`, tone: 'gold' },
    { text: `Tú: ${B}`, tone: 'green' },
    { text: `Vigía: ${W}`, tone: 'red' },
    ...(hint ? [{ text: hint, tone: 'slate' }] : []),
  ])

  const offset = -((SIZE - 1) * SPACING) / 2

  return (
    <group>
      <ResponsiveCamera position={[0, 7.5, 5]} fov={48} target={[0, 0, 0]} />
      <BoardLight position={[0, 8, 3]} />
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[SIZE * SPACING + 0.3, 0.2, SIZE * SPACING + 0.3]} />
        <meshStandardMaterial color="#312e81" />
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
              <meshStandardMaterial color={isMove ? '#818cf8' : '#4338ca'} />
            </mesh>
            {cell && (
              <mesh position={[0, 0.12, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, 0.14, 20]} />
                <meshStandardMaterial color={cell === 'B' ? '#111827' : '#f8fafc'} roughness={0.3} />
              </mesh>
            )}
          </group>
        )
      }))}
    </group>
  )
}
