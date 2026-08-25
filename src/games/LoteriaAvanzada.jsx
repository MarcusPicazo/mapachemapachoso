import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { SYMBOLS, shuffle, SymbolMesh } from './common/symbols'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

// El tablero tiene 20 casillas (a completar), pero el mazo trae las 30
// figuras del pool completo -- las 20 propias mas 10 "de relleno" que jamas
// calzan con la cartilla, dando margen real para desperdiciar sin que la
// partida sea imposible (las 20 propias SIEMPRE terminan saliendo, pues el
// mazo es el pool entero barajado).
const COLS = 5
const ROWS = 4
const CARD_SPACING = 1.0
const TOTAL = COLS * ROWS

function TwinklingStar({ position, scale }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const s = scale * (0.7 + Math.sin(t * 2 + position[0]) * 0.3)
    ref.current.scale.setScalar(Math.max(0.1, s))
  })
  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <octahedronGeometry args={[0.09, 0]} />
      <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.9} />
    </mesh>
  )
}

function StarField() {
  const stars = useMemo(() => Array.from({ length: 24 }).map(() => [
    (Math.random() - 0.5) * 12,
    1 + Math.random() * 4,
    -3 - Math.random() * 5,
  ]), [])
  return <>{stars.map((p, i) => <TwinklingStar key={i} position={p} scale={0.3 + Math.random() * 0.5} />)}</>
}

export default function LoteriaAvanzada({ active, onWin, onLose, onHud }) {
  // Cada simbolo se canta una unica vez: el mazo es el pool completo
  // barajado, sin repeticiones, para que lo ya cantado nunca vuelva a salir.
  const deck = useMemo(() => shuffle(SYMBOLS), [])
  const playerCard = useMemo(() => shuffle(SYMBOLS).slice(0, TOTAL), [])
  const [callIndex, setCallIndex] = useState(-1)
  const [playerMarked, setPlayerMarked] = useState(() => new Set())
  const finished = useRef(false)

  useEffect(() => {
    if (!active || finished.current) return
    const id = setInterval(() => {
      setCallIndex((prev) => {
        const next = prev + 1
        if (next >= deck.length) {
          if (!finished.current) { finished.current = true; setTimeout(() => onLose('¡Se cantaron todas las cartas y la cartilla quedó incompleta!'), 300) }
          clearInterval(id)
          return prev
        }
        sfx.chime()
        return next
      })
    }, 2000)
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
      if (nm.size >= TOTAL && !finished.current) { finished.current = true; setTimeout(() => onWin(), 300) }
      return nm
    })
  }

  const called = callIndex >= 0 ? deck[callIndex] : null

  usePillHud(onHud, [
    { text: `Carta ${Math.max(callIndex + 1, 0)}/${deck.length}`, tone: 'gold' },
    { text: `Cartilla: ${playerMarked.size}/${TOTAL}`, tone: 'green' },
  ])

  const offsetX = -((COLS - 1) * CARD_SPACING) / 2
  const offsetZ = -((ROWS - 1) * CARD_SPACING) / 2

  return (
    <group>
      <ResponsiveCamera position={[0, 8.5, 5.5]} fov={48} target={[0, 0, 0.5]} />
      <BoardLight position={[0, 8, 3]} />
      <StarField />

      {called && (
        <group position={[0, 1.7, -1.5]}>
          <mesh>
            <boxGeometry args={[1.1, 0.15, 1.1]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <group position={[0, 0.26, 0]}>
            <SymbolMesh symbol={called} scale={1.1} />
          </group>
        </group>
      )}

      <group position={[0, 0, 0.8]}>
        {playerCard.map((sym, i) => {
          const col = i % COLS
          const row = Math.floor(i / COLS)
          const x = offsetX + col * CARD_SPACING
          const z = offsetZ + row * CARD_SPACING
          const isMarked = playerMarked.has(i)
          return (
            <group key={i} position={[x, 0, z]}>
              <mesh
                onClick={(e) => { e.stopPropagation(); onCellClick(i) }}
                onPointerOver={(e) => { e.stopPropagation(); if (active) document.body.style.cursor = 'pointer' }}
                onPointerOut={() => { document.body.style.cursor = 'default' }}
                castShadow receiveShadow
              >
                <boxGeometry args={[CARD_SPACING * 0.9, 0.14, CARD_SPACING * 0.9]} />
                <meshStandardMaterial color={isMarked ? '#facc15' : '#1e2333'} roughness={0.5} emissive={isMarked ? '#f59e0b' : '#000000'} emissiveIntensity={isMarked ? 0.35 : 0} />
              </mesh>
              <mesh position={[0, 0.075, 0]}>
                <boxGeometry args={[CARD_SPACING * 0.78, 0.01, CARD_SPACING * 0.78]} />
                <meshStandardMaterial color={isMarked ? '#fde68a' : '#f8fafc'} roughness={0.6} />
              </mesh>
              <group position={[0, 0.26, 0]}>
                <SymbolMesh symbol={sym} scale={0.72} />
              </group>
            </group>
          )
        })}
      </group>
    </group>
  )
}
