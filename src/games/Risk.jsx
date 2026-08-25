import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const POSITIONS = [[-2.4, 0, -1.8], [2.4, 0, -1.8], [-2.4, 0, 1.8], [2.4, 0, 1.8]]
const NAMES = ['Norte', 'Este', 'Sur', 'Oeste']
const MAX_ATTACKS = 6

// Defensa (1-3 dados) en vez de "vida" acumulada: cada territorio se
// conquista en UN solo combate de dados, como pide el diseño original
// ("gana quien conquiste todos en 6 turnos"). Con vida acumulada era
// matematicamente imposible ganar en solo 6 intentos.
function buildTerritories() {
  return NAMES.map((name, i) => ({ id: i, name, defense: 1 + Math.floor(Math.random() * 3), owner: 'ai' }))
}

function rollDice(n) {
  return new Array(n).fill(0).map(() => 1 + Math.floor(Math.random() * 6))
}

function Banner({ owned }) {
  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = 0.55 + Math.sin(clock.getElapsedTime() * 2) * 0.04 })
  if (!owned) return null
  return (
    <mesh ref={ref} position={[0, 0.55, 0]} castShadow>
      <coneGeometry args={[0.12, 0.35, 8]} />
      <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
    </mesh>
  )
}

export default function Risk({ active, onWin, onLose, onHud }) {
  const [territories, setTerritories] = useState(buildTerritories)
  const [attacksLeft, setAttacksLeft] = useState(MAX_ATTACKS)
  const [lastResult, setLastResult] = useState('Toca un territorio rojo para atacarlo.')
  const [rolling, setRolling] = useState(false)
  const finished = useRef(false)

  const conquered = territories.filter((t) => t.owner === 'player').length

  const attack = (id) => {
    if (!active || finished.current || attacksLeft <= 0 || rolling) return
    const t = territories.find((tt) => tt.id === id)
    if (t.owner === 'player') return
    sfx.click()
    setRolling(true)
    const atkDice = rollDice(3).sort((a, b) => b - a)
    const defDice = rollDice(t.defense).sort((a, b) => b - a)
    const win = atkDice[0] > defDice[0]
    setTimeout(() => {
      sfx[win ? 'chime' : 'hit']()
      if (win) {
        setTerritories((ts) => ts.map((tt) => tt.id === id ? { ...tt, owner: 'player' } : tt))
        setLastResult(`¡${t.name} conquistado! Tu ${atkDice[0]} venció al ${defDice[0]} defensor.`)
      } else {
        setLastResult(`La defensa de ${t.name} resiste: ${defDice[0]} vs tu ${atkDice[0]}. ¡Otro asalto!`)
      }
      setAttacksLeft((a) => a - 1)
      setRolling(false)
    }, 550)
  }

  useEffect(() => {
    if (finished.current) return
    const wins = territories.filter((t) => t.owner === 'player').length
    if (wins >= 4) { finished.current = true; setTimeout(() => onWin(), 400) }
    else if (attacksLeft <= 0) { finished.current = true; setTimeout(() => onLose('¡Se agotaron los asaltos! La guardia dracónica retiene territorios.'), 500) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territories, attacksLeft])

  usePillHud(onHud, [
    { text: `Asaltos: ${attacksLeft}/${MAX_ATTACKS}`, tone: attacksLeft <= 2 ? 'red' : 'gold' },
    { text: `Conquistados: ${conquered}/4`, tone: 'green' },
  ], lastResult, 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 7, 6.5]} fov={48} target={[0, 0, 0]} />
      <BoardLight position={[0, 8, 4]} />
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.4, 6]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      {territories.map((t, i) => {
        const owned = t.owner === 'player'
        return (
          <group key={t.id} position={POSITIONS[i]}>
            <mesh
              onClick={(e) => { e.stopPropagation(); attack(t.id) }}
              onPointerOver={(e) => { e.stopPropagation(); if (!owned) document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { document.body.style.cursor = 'default' }}
              castShadow receiveShadow
            >
              <cylinderGeometry args={[1, 1.15, 0.45, 6]} />
              <meshStandardMaterial color={owned ? '#16a34a' : '#7f1d1d'} roughness={0.7} />
            </mesh>
            <Banner owned={owned} />
            <Text raycast={() => null} position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color="white" anchorX="center" anchorY="middle">
              {t.name}
            </Text>
            <Text raycast={() => null} position={[0, 0.38, 0.45]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.16} color="#fde68a" anchorX="center" anchorY="middle">
              {owned ? '¡Tuyo!' : `Defensa: ${'⚔'.repeat(t.defense)}`}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
