import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { SYMBOLS, shuffle, SymbolMesh } from './common/symbols'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const COLS = 5
const ROWS = 5
const TOTAL_CELLS = COLS * ROWS // 25
const CENTER_IDX = 12 // celda decorativa fija en el centro del tablero
const TOTAL_PAIRS = (TOTAL_CELLS - 1) / 2 // 12
const SPACING = 1.05
const OFFSET_X = -((COLS - 1) * SPACING) / 2
const OFFSET_Z = -((ROWS - 1) * SPACING) / 2

function buildDeck() {
  const pairs = SYMBOLS.slice(0, TOTAL_PAIRS)
  const cards = shuffle(pairs.flatMap((s, i) => [{ ...s, pairId: i }, { ...s, pairId: i }]))
  const deck = []
  let ci = 0
  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    if (idx === CENTER_IDX) deck.push({ special: true, idx })
    else deck.push({ ...cards[ci++], idx })
  }
  return deck
}

function CardTile({ card, col, row, state, onFlip }) {
  const groupRef = useRef()
  const revealed = state === 'flipped' || state === 'matched' || state === 'peek'
  const targetY = revealed ? 0.32 : -0.4
  useFrame((_, dt) => {
    if (!groupRef.current) return
    const cur = groupRef.current.position.y
    groupRef.current.position.y += (targetY - cur) * Math.min(1, dt * 10)
    if (revealed) groupRef.current.rotation.y += dt * 1.2
  })

  const baseColor = state === 'matched' ? '#facc15' : state === 'peek' ? '#86efac' : state === 'flipped' ? '#e2e8f0' : '#3f2a1a'

  if (card.special) {
    return (
      <group position={[OFFSET_X + col * SPACING, 0, OFFSET_Z + row * SPACING]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.15, 0.92]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} emissive="#f59e0b" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.32, 24]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[0, 0.145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 20]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.4} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={[OFFSET_X + col * SPACING, 0, OFFSET_Z + row * SPACING]}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onFlip(card.idx) }}
        onPointerOver={(e) => { e.stopPropagation(); if (state === 'hidden') document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
        castShadow receiveShadow
      >
        <boxGeometry args={[0.92, 0.15, 0.92]} />
        <meshStandardMaterial color={baseColor} roughness={0.55} emissive={state === 'matched' ? '#f59e0b' : '#000000'} emissiveIntensity={state === 'matched' ? 0.4 : 0} />
      </mesh>
      <group ref={groupRef} position={[0, -0.4, 0]} visible={revealed}>
        <SymbolMesh symbol={card} />
      </group>
    </group>
  )
}

export default function Memorama({ active, onWin, onHud, hintRequestId }) {
  const deck = useMemo(() => buildDeck(), [])
  const [cardStates, setCardStates] = useState(() => deck.map((c) => (c.special ? 'matched' : 'hidden')))
  const [matchedCount, setMatchedCount] = useState(0)
  const busy = useRef(false)
  const flippedRef = useRef([])
  const finished = useRef(false)
  // hintRequestId es un contador global compartido entre niveles: se inicia
  // con su valor actual para no consumir una pista sola al montar el nivel.
  const lastHintId = useRef(hintRequestId)

  useEffect(() => {
    if (!hintRequestId || hintRequestId === lastHintId.current) return
    lastHintId.current = hintRequestId
    if (busy.current || flippedRef.current.length > 0 || finished.current) return
    const byPair = {}
    cardStates.forEach((s, i) => {
      if (s !== 'hidden') return
      const pid = deck[i].pairId
        ; (byPair[pid] ||= []).push(i)
    })
    const pairEntry = Object.values(byPair).find((arr) => arr.length === 2)
    if (!pairEntry) return
    const [a, b] = pairEntry
    sfx.chime()
    setCardStates((prev) => { const n = [...prev]; n[a] = 'peek'; n[b] = 'peek'; return n })
    setTimeout(() => {
      setCardStates((prev) => {
        const n = [...prev]
        if (n[a] === 'peek') n[a] = 'hidden'
        if (n[b] === 'peek') n[b] = 'hidden'
        return n
      })
    }, 1200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintRequestId])

  const onFlip = useCallback((idx) => {
    if (!active || busy.current || finished.current || deck[idx].special) return
    setCardStates((prev) => {
      if (prev[idx] !== 'hidden') return prev
      const next = [...prev]
      next[idx] = 'flipped'
      flippedRef.current = [...flippedRef.current, idx]
      sfx.pop()

      if (flippedRef.current.length === 2) {
        busy.current = true
        const [a, b] = flippedRef.current
        const match = deck[a].pairId === deck[b].pairId
        if (match) {
          sfx.chime()
          setTimeout(() => {
            setCardStates((p2) => {
              const n2 = [...p2]
              n2[a] = 'matched'; n2[b] = 'matched'
              return n2
            })
            setMatchedCount((c) => {
              const nc = c + 1
              if (nc === TOTAL_PAIRS && !finished.current) {
                finished.current = true
                setTimeout(() => onWin(), 300)
              }
              return nc
            })
            flippedRef.current = []
            busy.current = false
          }, 350)
        } else {
          setTimeout(() => {
            setCardStates((p2) => {
              const n2 = [...p2]
              n2[a] = 'hidden'; n2[b] = 'hidden'
              return n2
            })
            flippedRef.current = []
            busy.current = false
          }, 750)
        }
      }
      return next
    })
  }, [active, deck, onWin])

  usePillHud(onHud, [
    { text: `Parejas ${matchedCount}/${TOTAL_PAIRS}`, tone: 'gold' },
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 6.4, 4.8]} fov={46} target={[0, 0, 0]} />
      <BoardLight position={[0, 9, 3]} />
      <group position={[0, 0.2, 0]}>
        {deck.map((card, idx) => (
          <CardTile key={idx} card={card} col={idx % COLS} row={Math.floor(idx / COLS)} state={cardStates[idx]} onFlip={onFlip} />
        ))}
      </group>
    </group>
  )
}
