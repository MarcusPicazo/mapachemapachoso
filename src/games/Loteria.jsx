import { useMemo, useRef, useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { SYMBOLS, shuffle, SymbolMesh } from './common/symbols'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const SIZE = 4
const CARD_SPACING = 1.1

function winningLines(size) {
  const lines = []
  for (let r = 0; r < size; r++) lines.push(new Array(size).fill(0).map((_, c) => r * size + c))
  for (let c = 0; c < size; c++) lines.push(new Array(size).fill(0).map((_, r) => r * size + c))
  lines.push(new Array(size).fill(0).map((_, i) => i * size + i))
  lines.push(new Array(size).fill(0).map((_, i) => i * size + (size - 1 - i)))
  return lines
}
const LINES = winningLines(SIZE)

function hasWon(marked) {
  if (LINES.some((line) => line.every((i) => marked.has(i)))) return true
  if (marked.size >= SIZE * SIZE) return true
  return false
}

function Card({ card, marked, centerX, onCellClick, interactive }) {
  const offset = -((SIZE - 1) * CARD_SPACING) / 2
  return (
    <group position={[centerX, 0, 0]}>
      {card.map((sym, i) => {
        const col = i % SIZE
        const row = Math.floor(i / SIZE)
        const x = offset + col * CARD_SPACING
        const z = offset + row * CARD_SPACING
        const isMarked = marked.has(i)
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh
              onClick={(e) => { e.stopPropagation(); if (interactive) onCellClick(i) }}
              onPointerOver={(e) => { e.stopPropagation(); if (interactive) document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { document.body.style.cursor = 'default' }}
              castShadow receiveShadow
            >
              <boxGeometry args={[CARD_SPACING * 0.9, 0.14, CARD_SPACING * 0.9]} />
              <meshStandardMaterial color={isMarked ? '#facc15' : '#1e2333'} roughness={0.5} emissive={isMarked ? '#f59e0b' : '#000000'} emissiveIntensity={isMarked ? 0.35 : 0} />
            </mesh>
            <mesh position={[0, 0.075, 0]}>
              <boxGeometry args={[CARD_SPACING * 0.76, 0.01, CARD_SPACING * 0.76]} />
              <meshStandardMaterial color={isMarked ? '#fde68a' : '#f8fafc'} roughness={0.6} />
            </mesh>
            <group position={[0, 0.28, 0]}>
              <SymbolMesh symbol={sym} scale={0.85} />
            </group>
          </group>
        )
      })}
    </group>
  )
}

export default function Loteria({ active, onWin, onLose, onHud }) {
  const deck = useMemo(() => shuffle(SYMBOLS), [])
  const playerCard = useMemo(() => shuffle(SYMBOLS).slice(0, 16), [])
  const aiCard = useMemo(() => shuffle(SYMBOLS).slice(0, 16), [])
  const [callIndex, setCallIndex] = useState(-1)
  const [playerMarked, setPlayerMarked] = useState(() => new Set())
  const [aiMarked, setAiMarked] = useState(() => new Set())
  const finished = useRef(false)

  useEffect(() => {
    if (!active || finished.current) return
    const id = setInterval(() => {
      setCallIndex((prev) => {
        const next = prev + 1
        if (next >= deck.length) {
          if (!finished.current) { finished.current = true; setTimeout(() => onLose('¡Se cantaron las 20 cartas y nadie completó su cartilla!'), 300) }
          clearInterval(id)
          return prev
        }
        sfx.chime()
        const called = deck[next]
        setAiMarked((prevMarked) => {
          const idx = aiCard.findIndex((s) => s.key === called.key)
          // El salón no es perfecto: a veces "distrae" y no marca a tiempo,
          // para que la partida sea justa contra el reflejo manual de Jazz.
          if (idx === -1 || Math.random() < 0.22) return prevMarked
          const nm = new Set(prevMarked); nm.add(idx)
          if (hasWon(nm) && !finished.current) { finished.current = true; setTimeout(() => onLose('El salón completó su cartilla primero. ¡Otra ronda, Jazz!'), 300) }
          return nm
        })
        return next
      })
    }, 2600)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const onCellClick = (i) => {
    if (!active || finished.current || callIndex < 0) return
    const called = deck[callIndex]
    if (playerCard[i].key !== called.key || playerMarked.has(i)) { sfx.hit(); return }
    sfx.pop()
    setPlayerMarked((prev) => {
      const nm = new Set(prev); nm.add(i)
      if (hasWon(nm) && !finished.current) { finished.current = true; setTimeout(() => onWin(), 300) }
      return nm
    })
  }

  const called = callIndex >= 0 ? deck[callIndex] : null

  usePillHud(onHud, [
    { text: `Carta ${Math.max(callIndex + 1, 0)}/${deck.length}`, tone: 'gold' },
    { text: `Tú: ${playerMarked.size}/16`, tone: 'green' },
    { text: `Salón: ${aiMarked.size}/16`, tone: 'red' },
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 9.5, 6.5]} fov={48} target={[0, 0, 0]} />
      <BoardLight position={[0, 9, 3]} />

      {called && (
        <group position={[0, 0.02, 0]}>
          <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.95, 1, 0.14, 28]} />
            <meshStandardMaterial color="#1e2333" roughness={0.5} emissive="#f59e0b" emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <torusGeometry args={[0.88, 0.05, 10, 36]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.65} />
          </mesh>
          <group position={[0, 0.72, 0]}>
            <SymbolMesh symbol={called} scale={1.5} />
          </group>
        </group>
      )}

      <Html position={[-3.4, 0, 2.4]} center distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-none rounded-full bg-slate-900/80 border-2 border-emerald-400 px-3 py-1 text-[11px] font-black text-emerald-100 uppercase whitespace-nowrap">Jazz</div>
      </Html>
      <Html position={[3.4, 0, 2.4]} center distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-none rounded-full bg-slate-900/80 border-2 border-red-400 px-3 py-1 text-[11px] font-black text-red-100 uppercase whitespace-nowrap">Salón</div>
      </Html>
      <Card card={playerCard} marked={playerMarked} centerX={-3.4} onCellClick={onCellClick} interactive={active} />
      <Card card={aiCard} marked={aiMarked} centerX={3.4} interactive={false} />
    </group>
  )
}
