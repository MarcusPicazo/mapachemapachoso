import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import { buildBoard } from './common/monopolyBoard'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const N = 16
const RADIUS = 3.6

function tilePos(i) {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS]
}

function Piece({ pos3, color, height }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.position.x += (pos3[0] - ref.current.position.x) * Math.min(1, dt * 6)
    ref.current.position.z += (pos3[2] - ref.current.position.z) * Math.min(1, dt * 6)
    ref.current.position.y = height
  })
  return (
    <mesh ref={ref} position={[pos3[0], height, pos3[2]]} castShadow>
      <coneGeometry args={[0.2, 0.4, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function PropertyBuilding({ tile }) {
  const owned = !!tile.owner
  const wallColor = owned ? (tile.owner === 'player' ? '#16a34a' : '#dc2626') : tile.color
  return (
    <group>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.18, 0.42]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[0, 0.24, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.34, 0.2, 4]} />
        <meshStandardMaterial color={owned ? '#78350f' : '#451a03'} />
      </mesh>
      <Text raycast={() => null} position={[0, 0.19, 0.22]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="white" anchorX="center" anchorY="middle">{tile.price}</Text>
    </group>
  )
}

function SpecialTile({ tile }) {
  if (tile.type === 'start') {
    return (
      <group>
        <mesh position={[-0.2, 0.2, 0]}><boxGeometry args={[0.08, 0.4, 0.08]} /><meshStandardMaterial color="#fbbf24" /></mesh>
        <mesh position={[0.2, 0.2, 0]}><boxGeometry args={[0.08, 0.4, 0.08]} /><meshStandardMaterial color="#fbbf24" /></mesh>
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.56, 0.08, 0.16]} /><meshStandardMaterial color="#fbbf24" /></mesh>
      </group>
    )
  }
  if (tile.type === 'tax') {
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.03 + i * 0.06, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /><meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} /></mesh>
        ))}
      </group>
    )
  }
  if (tile.type === 'chance') {
    return (
      <group>
        <mesh position={[0, 0.14, 0]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.3, 0.28, 0.04]} /><meshStandardMaterial color="#7c3aed" /></mesh>
        <Text raycast={() => null} position={[0, 0.14, 0.05]} rotation={[0, 0.3, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">?</Text>
      </group>
    )
  }
  return (
    <group>
      <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.05, 0.05, 0.3, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[0, 0.24, 0]}><sphereGeometry args={[0.14, 12, 12]} /><meshStandardMaterial color="#16a34a" flatShading /></mesh>
    </group>
  )
}

export default function Monopoly({ active, onWin, onLose, onHud }) {
  const [tiles, setTiles] = useState(() => buildBoard())
  const [playerPos, setPlayerPos] = useState(0)
  const [aiPos, setAiPos] = useState(0)
  const [playerMoney, setPlayerMoney] = useState(1200)
  const [aiMoney, setAiMoney] = useState(1200)
  const [playerProps, setPlayerProps] = useState(0)
  const [turn, setTurn] = useState('player')
  const [event, setEvent] = useState('')
  const [totalTurns, setTotalTurns] = useState(0)
  const [buyPrompt, setBuyPrompt] = useState(null) // { idx, price, name }
  const finished = useRef(false)

  const resolveTileForAi = (idx) => {
    const tile = tiles[idx]
    let msg = ''
    if (tile.type === 'start') { setAiMoney((m) => m + 200); msg = 'El mercader pasó por la Salida. +200' }
    else if (tile.type === 'tax') { setAiMoney((m) => m - tile.amount); msg = `El mercader paga impuesto: -${tile.amount}` }
    else if (tile.type === 'chance') {
      const delta = [100, -100, 150, -50][Math.floor(Math.random() * 4)]
      setAiMoney((m) => m + delta); msg = `Carta de suerte del mercader: ${delta >= 0 ? '+' : ''}${delta}`
    } else if (tile.type === 'rest') { msg = 'El mercader descansa.' }
    else if (tile.type === 'property') {
      if (tile.owner === null) {
        if (aiMoney >= tile.price) {
          setAiMoney((m) => m - tile.price)
          setTiles((ts) => ts.map((t, i) => i === idx ? { ...t, owner: 'ai' } : t))
          msg = `El mercader compró ${tile.name}.`
        } else {
          msg = `El mercader no tiene fondos para ${tile.name}.`
        }
      } else if (tile.owner === 'player') {
        const rent = Math.round(tile.price * 0.2)
        setAiMoney((m) => m - rent)
        setPlayerMoney((m) => m + rent)
        msg = `El mercader te paga ${rent} de renta por ${tile.name}.`
      } else {
        msg = `El mercader ya tiene ${tile.name}.`
      }
    }
    setEvent(msg)
  }

  const onRoll = () => {
    if (!active || turn !== 'player' || finished.current || buyPrompt) return
    sfx.pop()
    const np = (playerPos + 1 + Math.floor(Math.random() * 6)) % N
    const tile = tiles[np]
    setPlayerPos(np)
    setTotalTurns((t) => t + 1)

    if (tile.type === 'start') { setPlayerMoney((m) => m + 200); setEvent('¡Pasaste por la Salida! +200'); setTimeout(() => setTurn('ai'), 700) }
    else if (tile.type === 'tax') { setPlayerMoney((m) => m - tile.amount); setEvent(`Impuesto: -${tile.amount}`); setTimeout(() => setTurn('ai'), 700) }
    else if (tile.type === 'chance') {
      const delta = [100, -100, 150, -50][Math.floor(Math.random() * 4)]
      setPlayerMoney((m) => m + delta); setEvent(`Carta de suerte: ${delta >= 0 ? '+' : ''}${delta}`)
      setTimeout(() => setTurn('ai'), 700)
    } else if (tile.type === 'rest') { setEvent('Descanso, no pasa nada.'); setTimeout(() => setTurn('ai'), 700) }
    else if (tile.type === 'property') {
      if (tile.owner === null) {
        setBuyPrompt({ idx: np, price: tile.price, name: tile.name })
      } else if (tile.owner === 'ai') {
        const rent = Math.round(tile.price * 0.2)
        setPlayerMoney((m) => m - rent)
        setAiMoney((m) => m + rent)
        setEvent(`Pagas ${rent} de renta por ${tile.name}.`)
        setTimeout(() => setTurn('ai'), 700)
      } else {
        setEvent(`Ya tienes ${tile.name}.`)
        setTimeout(() => setTurn('ai'), 700)
      }
    }
  }

  const confirmBuy = (buy) => {
    if (!buyPrompt) return
    if (buy) {
      setPlayerMoney((m) => m - buyPrompt.price)
      setTiles((ts) => ts.map((t, i) => i === buyPrompt.idx ? { ...t, owner: 'player' } : t))
      setPlayerProps((p) => p + 1)
      setEvent(`Compraste ${buyPrompt.name} por ${buyPrompt.price}.`)
      sfx.chime()
    } else {
      setEvent(`Decidiste no comprar ${buyPrompt.name}.`)
      sfx.click()
    }
    setBuyPrompt(null)
    setTimeout(() => setTurn('ai'), 500)
  }

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    const t = setTimeout(() => {
      sfx.pop()
      setAiPos((pos) => {
        const np = (pos + 1 + Math.floor(Math.random() * 6)) % N
        resolveTileForAi(np)
        return np
      })
      setTotalTurns((t2) => t2 + 1)
      setTimeout(() => { if (!finished.current) setTurn('player') }, 600)
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, active])

  useEffect(() => {
    if (finished.current) return
    if (playerProps >= 3) { finished.current = true; sfx.win(); setTimeout(() => onWin(), 400) }
    else if (playerMoney <= 0) { finished.current = true; setTimeout(() => onLose('¡Te quedaste sin monedas antes de comprar 3 propiedades!'), 400) }
    else if (totalTurns >= 26) { finished.current = true; setTimeout(() => onLose('Se acabó el tiempo de negociación. Otra ronda, Jazz.'), 400) }
  }, [playerProps, playerMoney, totalTurns])

  usePillHud(onHud, [
    { text: `Propiedades: ${playerProps}/3`, tone: 'gold' },
    { text: `Tú: ${playerMoney}g`, tone: playerMoney < 300 ? 'red' : 'green' },
    { text: `Mercader: ${aiMoney}g`, tone: 'slate' },
  ], event, 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 7.4, 6.4]} fov={48} target={[0, 0, 0]} />
      <BoardLight position={[0, 8, 4]} />
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RADIUS + 0.6, 48]} />
        <meshStandardMaterial color="#164e3b" roughness={0.9} />
      </mesh>
      {tiles.map((tile, i) => {
        const [x, , z] = tilePos(i)
        return (
          <group key={i} position={[x, 0, z]}>
            {tile.type === 'property' ? <PropertyBuilding tile={tile} /> : <SpecialTile tile={tile} />}
          </group>
        )
      })}
      <Piece pos3={tilePos(playerPos)} color="#22c55e" height={0.5} />
      <Piece pos3={tilePos(aiPos)} color="#ef4444" height={0.7} />
      <DiceButton onRoll={onRoll} disabled={!active || turn !== 'player' || finished.current || !!buyPrompt} />

      {buyPrompt && (
        <Html fullscreen zIndexRange={[30, 40]} style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 text-center max-w-xs">
              <p className="text-white font-black mb-1">{buyPrompt.name}</p>
              <p className="text-amber-300 font-bold mb-3">Cuesta {buyPrompt.price} monedas</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => confirmBuy(true)} disabled={playerMoney < buyPrompt.price} className="bg-green-600 disabled:bg-slate-600 text-white font-black px-4 py-2 rounded-full">Comprar</button>
                <button onClick={() => confirmBuy(false)} className="bg-slate-700 text-white font-black px-4 py-2 rounded-full">Pasar</button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

function DiceButton({ onRoll, disabled }) {
  const [hovered, setHovered] = useState(false)
  return (
    <mesh
      position={[0, 0.3, 0]}
      scale={hovered && !disabled ? 1.15 : 1}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onRoll() }}
      onPointerOver={(e) => { e.stopPropagation(); if (!disabled) { setHovered(true); document.body.style.cursor = 'pointer' } }}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={disabled ? '#94a3b8' : '#dc2626'} />
    </mesh>
  )
}
