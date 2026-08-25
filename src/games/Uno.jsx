import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import { dealUno, isPlayable, shuffle, COLOR_HEX } from './common/unoLogic'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const GLYPH = { skip: '⊘', reverse: '⇄', draw2: '+2', wild: '★', wild4: '+4' }
const QUAD_COLORS = ['red', 'blue', 'green', 'yellow']

function CardMesh({ card, position, onClick, hoverable }) {
  const [hovered, setHovered] = useState(false)
  const innerRef = useRef()
  const t0 = useRef(0)
  const mountedKey = useRef(null)
  const isWild = card.color === 'wild'
  const glyph = GLYPH[card.type] || card.value
  const glyphColor = isWild ? '#f8fafc' : COLOR_HEX[card.color]

  // Animacion soft de "llegada": cada vez que esta instancia muestra una
  // carta NUEVA (nace o cambia el id, como en el mazo de descarte al
  // apilar una carta encima), rebota suavemente al aparecer.
  useFrame(({ clock }) => {
    if (!innerRef.current) return
    if (mountedKey.current !== card.id) { mountedKey.current = card.id; t0.current = clock.getElapsedTime() }
    const t = Math.min(1, (clock.getElapsedTime() - t0.current) / 0.3)
    const ease = 1 - Math.pow(1 - t, 3)
    const bounce = Math.sin(t * Math.PI) * 0.22 * (1 - t)
    const hoverScale = hovered && hoverable ? 1.15 : 1
    innerRef.current.scale.setScalar(hoverScale * (0.4 + ease * 0.6))
    innerRef.current.position.y = bounce
  })

  return (
    <group position={position}>
      <group ref={innerRef}>
        <mesh
          onClick={(e) => { e.stopPropagation(); if (onClick) onClick() }}
          onPointerOver={(e) => { e.stopPropagation(); if (hoverable) { setHovered(true); document.body.style.cursor = 'pointer' } }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
          castShadow
        >
          <boxGeometry args={[0.92, 0.07, 1.26]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {isWild ? (
          <group position={[0, 0.045, 0]}>
            {QUAD_COLORS.map((c, i) => (
              <mesh key={c} position={[(i % 2 === 0 ? -1 : 1) * 0.205, 0, (i < 2 ? -1 : 1) * 0.28]}>
                <boxGeometry args={[0.41, 0.05, 0.56]} />
                <meshStandardMaterial color={COLOR_HEX[c]} roughness={0.4} emissive={hovered && hoverable ? COLOR_HEX[c] : '#000000'} emissiveIntensity={0.3} />
              </mesh>
            ))}
          </group>
        ) : (
          <mesh position={[0, 0.045, 0]}>
            <boxGeometry args={[0.82, 0.05, 1.12]} />
            <meshStandardMaterial color={hovered && hoverable ? '#fef3c7' : COLOR_HEX[card.color]} roughness={0.4} />
          </mesh>
        )}
        <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.62, 0.82, 1]}>
          <circleGeometry args={[0.32, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <Text raycast={() => null} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.38} color={glyphColor} fontWeight={900} outlineWidth={0.012} outlineColor="#0f172a" anchorX="center" anchorY="middle">
          {glyph}
        </Text>
        <Text raycast={() => null} position={[-0.32, 0.082, -0.48]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color="#f8fafc" outlineWidth={0.008} outlineColor="#0f172a" anchorX="center" anchorY="middle">
          {glyph}
        </Text>
        <Text raycast={() => null} position={[0.32, 0.082, 0.48]} rotation={[-Math.PI / 2, 0, Math.PI]} fontSize={0.15} color="#f8fafc" outlineWidth={0.008} outlineColor="#0f172a" anchorX="center" anchorY="middle">
          {glyph}
        </Text>
      </group>
    </group>
  )
}

function DragonLeg({ position, scaleY = 1 }) {
  return (
    <group position={position} scale={[1, scaleY, 1]}>
      <mesh rotation={[0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.42, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.24, 0.05]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.24]} />
        <meshStandardMaterial color="#166534" roughness={0.6} />
      </mesh>
      {[-0.06, 0, 0.06].map((x, i) => (
        <mesh key={i} position={[x, -0.28, 0.17]} rotation={[Math.PI / 2.4, 0, 0]}>
          <coneGeometry args={[0.028, 0.13, 6]} />
          <meshStandardMaterial color="#fde68a" roughness={0.35} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function DragonWing({ side }) {
  const flap = useRef()
  useFrame(({ clock }) => {
    if (!flap.current) return
    flap.current.rotation.z = side * (0.08 + Math.sin(clock.getElapsedTime() * 0.9) * 0.035)
  })
  const fingers = [
    { rot: -0.55, len: 0.95 },
    { rot: -0.15, len: 1.15 },
    { rot: 0.3, len: 1.0 },
    { rot: 0.68, len: 0.72 },
  ]
  return (
    <group ref={flap} position={[side * 0.32, 0.5, -0.15]} rotation={[0, 0, side * 0.5]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[side * 0.28, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.56, 6]} />
        <meshStandardMaterial color="#14532d" roughness={0.6} />
      </mesh>
      {fingers.map((f, i) => (
        <group key={i} position={[side * 0.56, 0, 0]} rotation={[0, 0, side * f.rot]}>
          <mesh position={[side * f.len * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.028, f.len, 5]} />
            <meshStandardMaterial color="#166534" roughness={0.55} />
          </mesh>
          {i > 0 && (
            <mesh position={[side * f.len * 0.32, -side * 0.14, -0.01]} rotation={[0, 0, side * -0.3]}>
              <planeGeometry args={[f.len * 0.85, 0.32]} />
              <meshStandardMaterial color="#0f3d24" roughness={0.7} transparent opacity={0.88} side={2} emissive="#052e16" emissiveIntensity={0.3} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function FloatingCard({ angle, radius, index }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * 0.6 + angle
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.3 + index) * 0.09, Math.sin(t) * radius * 0.5)
    ref.current.rotation.y = t
  })
  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[0.16, 0.03, 0.24]} />
      <meshStandardMaterial color="#7c2d12" roughness={0.4} />
    </mesh>
  )
}

function DragonHandCount({ count, position }) {
  const items = Math.min(count, 7)
  return (
    <group position={position}>
      {Array.from({ length: items }).map((_, i) => (
        <FloatingCard key={i} angle={(i / Math.max(1, items)) * Math.PI * 2} radius={0.45} index={i} />
      ))}
      <Text raycast={() => null} position={[0, 0.5, 0]} fontSize={0.24} color="#fde68a" fontWeight={900} outlineWidth={0.018} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">{count}</Text>
    </group>
  )
}

function Dragon({ position, handCount }) {
  const ref = useRef()
  const jawRef = useRef()
  const emberRef = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = position[1] + Math.sin(t * 1.1) * 0.07
    ref.current.rotation.y = Math.sin(t * 0.45) * 0.14
    if (jawRef.current) jawRef.current.rotation.x = 0.08 + Math.max(0, Math.sin(t * 0.7)) * 0.05
    if (emberRef.current) emberRef.current.intensity = 1 + Math.sin(t * 6) * 0.5
  })
  return (
    <group position={position} ref={ref} rotation={[0, 0.5, 0]}>
      {/* Piernas */}
      <DragonLeg position={[-0.32, -0.32, 0.15]} />
      <DragonLeg position={[0.32, -0.32, 0.15]} />
      <DragonLeg position={[-0.26, -0.32, -0.35]} scaleY={0.85} />
      <DragonLeg position={[0.26, -0.32, -0.35]} scaleY={0.85} />

      {/* Cuerpo */}
      <mesh position={[0, 0, -0.05]} rotation={[0.12, 0, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.7, 4, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.34 + i * 0.02, -0.4 + i * 0.24]}>
          <boxGeometry args={[0.14 - i * 0.015, 0.07, 0.1]} />
          <meshStandardMaterial color="#052e16" roughness={0.6} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, -0.28, -0.22 + i * 0.14]}>
          <boxGeometry args={[0.26, 0.05, 0.1]} />
          <meshStandardMaterial color="#4ade80" roughness={0.5} />
        </mesh>
      ))}

      {/* Alas */}
      <DragonWing side={-1} />
      <DragonWing side={1} />

      {/* Cola */}
      <group position={[0, -0.02, -0.42]} rotation={[0.1, 0.3, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin(i * 0.5) * 0.1, -Math.sin(i * 0.3) * 0.05, -i * 0.22]} rotation={[0, i * 0.15, 0]}>
            <cylinderGeometry args={[0.13 - i * 0.02, 0.15 - i * 0.02, 0.24, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.55} />
          </mesh>
        ))}
        <mesh position={[0.12, 0.02, -1.08]} rotation={[0, 0.7, Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.22, 4]} />
          <meshStandardMaterial color="#052e16" roughness={0.6} />
        </mesh>
      </group>

      {/* Cuello */}
      <mesh position={[0, 0.32, 0.42]} rotation={[-0.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 0.55, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} />
      </mesh>

      {/* Cabeza */}
      <group position={[0, 0.66, 0.68]} rotation={[-0.2, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color="#22c55e" roughness={0.45} />
        </mesh>
        {/* Hocico */}
        <mesh position={[0, -0.06, 0.32]} castShadow>
          <coneGeometry args={[0.16, 0.42, 10]} />
          <meshStandardMaterial color="#22c55e" roughness={0.45} />
        </mesh>
        {/* Mandibula inferior */}
        <group ref={jawRef} position={[0, -0.16, 0.1]}>
          <mesh position={[0, -0.02, 0.22]}>
            <coneGeometry args={[0.11, 0.3, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.5} />
          </mesh>
          {[-0.06, 0.06].map((x, i) => (
            <mesh key={i} position={[x, 0.02, 0.3]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.02, 0.08, 6]} />
              <meshStandardMaterial color="#fef9c3" roughness={0.3} />
            </mesh>
          ))}
        </group>
        {/* Dientes superiores */}
        {[-0.08, -0.03, 0.03, 0.08].map((x, i) => (
          <mesh key={i} position={[x, -0.13, 0.34]}>
            <coneGeometry args={[0.018, 0.07, 6]} />
            <meshStandardMaterial color="#fef9c3" roughness={0.3} />
          </mesh>
        ))}
        {/* Fosas nasales */}
        <mesh position={[-0.06, 0.03, 0.5]}><sphereGeometry args={[0.02, 6, 6]} /><meshStandardMaterial color="#052e16" /></mesh>
        <mesh position={[0.06, 0.03, 0.5]}><sphereGeometry args={[0.02, 6, 6]} /><meshStandardMaterial color="#052e16" /></mesh>
        {/* Ceja / cresta */}
        <mesh position={[-0.12, 0.16, 0.2]} rotation={[0, 0, -0.4]}><boxGeometry args={[0.16, 0.03, 0.05]} /><meshStandardMaterial color="#052e16" /></mesh>
        <mesh position={[0.12, 0.16, 0.2]} rotation={[0, 0, 0.4]}><boxGeometry args={[0.16, 0.03, 0.05]} /><meshStandardMaterial color="#052e16" /></mesh>
        {/* Ojos brillantes */}
        <mesh position={[-0.13, 0.08, 0.24]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#fbbf24" emissive="#f97316" emissiveIntensity={1.2} /></mesh>
        <mesh position={[0.13, 0.08, 0.24]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#fbbf24" emissive="#f97316" emissiveIntensity={1.2} /></mesh>
        <mesh position={[-0.13, 0.08, 0.29]}><sphereGeometry args={[0.022, 8, 8]} /><meshStandardMaterial color="#1e1b4b" /></mesh>
        <mesh position={[0.13, 0.08, 0.29]}><sphereGeometry args={[0.022, 8, 8]} /><meshStandardMaterial color="#1e1b4b" /></mesh>
        {/* Cuernos dorados (par frontal + par trasero) */}
        <mesh position={[-0.15, 0.24, -0.02]} rotation={[0.3, 0, -0.35]}><coneGeometry args={[0.045, 0.32, 8]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.5} /></mesh>
        <mesh position={[0.15, 0.24, -0.02]} rotation={[0.3, 0, 0.35]}><coneGeometry args={[0.045, 0.32, 8]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.5} /></mesh>
        <mesh position={[-0.09, 0.27, -0.14]} rotation={[0.6, 0, -0.2]}><coneGeometry args={[0.032, 0.2, 8]} /><meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} /></mesh>
        <mesh position={[0.09, 0.27, -0.14]} rotation={[0.6, 0, 0.2]}><coneGeometry args={[0.032, 0.2, 8]} /><meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} /></mesh>
        {/* Brasas en la garganta */}
        <pointLight ref={emberRef} position={[0, -0.1, 0.35]} color="#fb923c" intensity={1} distance={2.2} />
      </group>
      {handCount != null && <DragonHandCount count={handCount} position={[0, 1.35, 0.68]} />}
    </group>
  )
}

function TurnOrb({ target }) {
  const ref = useRef()
  const ringRef = useRef()
  useFrame(({ clock }, dt) => {
    if (!ref.current) return
    ref.current.position.x += (target[0] - ref.current.position.x) * Math.min(1, dt * 4)
    ref.current.position.y += (target[1] - ref.current.position.y) * Math.min(1, dt * 4) + Math.sin(clock.getElapsedTime() * 2.5) * 0.001
    ref.current.position.z += (target[2] - ref.current.position.z) * Math.min(1, dt * 4)
    if (ringRef.current) {
      ringRef.current.position.copy(ref.current.position)
      ringRef.current.rotation.y += dt * 1.5
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15
      ringRef.current.scale.set(s, s, s)
    }
  })
  return (
    <>
      <mesh ref={ref} position={target}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.6} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.025, 8, 20]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1} transparent opacity={0.7} />
      </mesh>
      <pointLight position={target} color="#fde047" intensity={1.2} distance={2.5} />
    </>
  )
}

export default function Uno({ active, onWin, onLose, onHud }) {
  const initial = useMemo(() => dealUno(), [])
  const [playerHand, setPlayerHand] = useState(initial.player)
  const [aiHand, setAiHand] = useState(initial.ai)
  const [drawPile, setDrawPile] = useState(initial.drawPile)
  const [discard, setDiscard] = useState(initial.discard)
  const [currentColor, setCurrentColor] = useState(initial.discard[0].color)
  const [turn, setTurn] = useState('player')
  const [pendingWild, setPendingWild] = useState(null) // {card}
  const [hint, setHint] = useState('')
  const finished = useRef(false)

  const topCard = discard[discard.length - 1]

  // Espejos siempre-al-dia del pozo/descarte para poder calcular robos de
  // forma sincrona sin anidar un setState dentro de otro (ese anidamiento
  // causaba robos duplicados/gigantes). Se sincronizan tras cada render.
  const drawPileRef = useRef(drawPile)
  const discardRef = useRef(discard)
  const topCardRef = useRef(topCard)
  const colorRef = useRef(currentColor)
  useEffect(() => { drawPileRef.current = drawPile }, [drawPile])
  useEffect(() => { discardRef.current = discard }, [discard])
  useEffect(() => { topCardRef.current = topCard }, [topCard])
  useEffect(() => { colorRef.current = currentColor }, [currentColor])

  const drawCards = useCallback((n, setHand) => {
    let pile = [...drawPileRef.current]
    let discCopy = [...discardRef.current]
    const drawn = []
    while (drawn.length < n) {
      if (pile.length === 0) {
        if (discCopy.length <= 1) break
        const top = discCopy[discCopy.length - 1]
        pile = shuffle(discCopy.slice(0, -1))
        discCopy = [top]
      }
      drawn.push(pile.pop())
    }
    drawPileRef.current = pile
    discardRef.current = discCopy
    setDrawPile(pile)
    setDiscard(discCopy)
    if (drawn.length > 0) setHand((h) => [...h, ...drawn])
    return drawn
  }, [])

  const finishPlayerCard = (card, hand, setHand) => {
    setHand((h) => h.filter((c) => c.id !== card.id))
    setDiscard((d) => [...d, card])
    sfx.place()
  }

  // Turno del dragon: elige la mejor carta jugable o roba si no tiene ninguna.
  // Se expone como funcion propia (no solo dentro de un useEffect) para poder
  // encadenar turnos extra (tras Salto/Reversa/+2/+4) sin depender de que el
  // estado "turn" cambie de valor, ya que seguir en 'ai' no dispara efectos.
  const runAiTurn = useCallback(() => {
    setAiHand((hand) => {
      const tc = topCardRef.current
      const cc = colorRef.current
      const options = hand.filter((c) => isPlayable(c, tc, cc))
      if (options.length === 0) {
        drawCards(1, setAiHand)
        setHint('El dragón roba una carta.')
        setTimeout(() => { if (!finished.current) setTurn('player') }, 500)
        return hand
      }
      const counts = {}
      for (const c of hand) counts[c.color] = (counts[c.color] || 0) + 1
      const best = options.sort((a, b) => (counts[b.color] || 0) - (counts[a.color] || 0))[0]
      const newHand = hand.filter((c) => c.id !== best.id)
      setDiscard((d) => [...d, best])
      sfx.place()
      let chosenColor = best.color
      if (best.color === 'wild') {
        const cc2 = {}
        for (const c of newHand) cc2[c.color] = (cc2[c.color] || 0) + 1
        chosenColor = Object.keys(cc2).sort((a, b) => cc2[b] - cc2[a])[0] || 'red'
      }
      setCurrentColor(chosenColor)
      setTimeout(() => {
        if (newHand.length === 0 && !finished.current) { finished.current = true; setTimeout(() => onLose('¡El dragón se quedó sin cartas primero!'), 300); return }
        if (!finished.current) applyEffectAndPassTurn(best, 'ai')
      }, 50)
      return newHand
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLose])

  const applyEffectAndPassTurn = (card, playedBy) => {
    const rivalIsAi = playedBy === 'player'
    let aiContinues = false
    if (card.type === 'skip' || card.type === 'reverse') {
      setHint(rivalIsAi ? 'El dragón pierde turno.' : 'Pierdes turno.')
      setTurn(playedBy)
      aiContinues = playedBy === 'ai'
    } else if (card.type === 'draw2') {
      drawCards(2, rivalIsAi ? setAiHand : setPlayerHand)
      setHint(rivalIsAi ? 'El dragón roba 2 y pierde turno.' : 'Robas 2 y pierdes turno.')
      setTurn(playedBy)
      aiContinues = playedBy === 'ai'
    } else if (card.type === 'wild4') {
      drawCards(4, rivalIsAi ? setAiHand : setPlayerHand)
      setHint(rivalIsAi ? 'El dragón roba 4 y pierde turno.' : 'Robas 4 y pierdes turno.')
      setTurn(playedBy)
      aiContinues = playedBy === 'ai'
    } else {
      setTurn(rivalIsAi ? 'ai' : 'player')
    }
    // Si el dragon jugo la carta y le toca seguir (al rival le tocaba perder
    // turno), programamos su siguiente jugada explicitamente: cambiar
    // "turn" de 'ai' a 'ai' no vuelve a disparar el useEffect de turno.
    if (aiContinues) {
      setTimeout(() => { if (!finished.current) runAiTurn() }, 900)
    }
  }

  const onPlayerCardClick = (card) => {
    if (!active || turn !== 'player' || finished.current || pendingWild) return
    if (!isPlayable(card, topCard, currentColor)) { sfx.hit(); setHint('Esa carta no combina.'); return }
    if (card.color === 'wild') { setPendingWild(card); return }
    finishPlayerCard(card, playerHand, setPlayerHand)
    setCurrentColor(card.color)
    setHint('')
    setTimeout(() => {
      setPlayerHand((h) => {
        if (h.length === 0 && !finished.current) { finished.current = true; setTimeout(() => onWin(), 300) }
        return h
      })
      if (!finished.current) applyEffectAndPassTurn(card, 'player')
    }, 50)
  }

  const chooseWildColor = (color) => {
    const card = pendingWild
    setPendingWild(null)
    finishPlayerCard(card, playerHand, setPlayerHand)
    setCurrentColor(color)
    setTimeout(() => {
      setPlayerHand((h) => {
        if (h.length === 0 && !finished.current) { finished.current = true; setTimeout(() => onWin(), 300) }
        return h
      })
      if (!finished.current) applyEffectAndPassTurn(card, 'player')
    }, 50)
  }

  const drawingLock = useRef(false)
  const drawVoluntary = () => {
    if (!active || turn !== 'player' || finished.current || pendingWild || drawingLock.current) return
    const canPlay = playerHand.some((c) => isPlayable(c, topCard, currentColor))
    if (canPlay) { setHint('Ya tienes una carta jugable.'); return }
    drawingLock.current = true
    drawCards(1, setPlayerHand)
    sfx.click()
    setHint('Robaste una carta. Turno del dragón.')
    setTimeout(() => { drawingLock.current = false; setTurn('ai') }, 400)
  }

  useEffect(() => {
    if (!active || turn !== 'ai' || finished.current) return
    const t = setTimeout(() => runAiTurn(), 800)
    return () => clearTimeout(t)
  }, [turn, active, runAiTurn])

  const handStart = -((playerHand.length - 1) * 1.05) / 2

  usePillHud(onHud, [
    { text: turn === 'player' ? 'Tu turno' : 'Turno del dragón...', tone: turn === 'player' ? 'green' : 'red' },
    { text: `Dragón: ${aiHand.length} cartas`, tone: 'slate' },
    { text: `Color: ${currentColor}`, tone: 'gold' },
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 8.5, 9]} fov={50} target={[0, 0, 1.8]} />
      <BoardLight position={[0, 8, 5]} />

      <mesh position={[0, -0.14, 1.4]} receiveShadow>
        <boxGeometry args={[8.5, 0.2, 7.6]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.06, 1.4]} receiveShadow>
        <boxGeometry args={[8, 0.06, 7.1]} />
        <meshStandardMaterial color="#9a3412" roughness={0.7} />
      </mesh>

      <Dragon position={[-2.6, 0.3, -0.2]} handCount={aiHand.length} />
      <TurnOrb target={turn === 'player' ? [0, 1.1, 4.6] : [-2.6, 1.35, 0.2]} />

      {hint && (
        <group position={[0, 2.6, 0]}>
          <Text raycast={() => null} fontSize={0.26} color="#fde68a" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#451a03">{hint}</Text>
        </group>
      )}

      {/* Descarte */}
      <CardMesh card={topCard} position={[0, 0, 0]} hoverable={false} />

      {/* Mazo de robo: las cajas apiladas son solo visuales; un unico
          catcher invisible por encima recibe el clic (evita que una sola
          pulsacion dispare el robo varias veces por las cajas superpuestas) */}
      <group position={[-1.6, 0, 0]}>
        {drawPile.slice(0, 6).map((_, i) => (
          <group key={i} position={[i * 0.025, i * 0.045, -i * 0.02]} rotation={[0, (i % 2 ? 1 : -1) * 0.02, 0]}>
            <mesh>
              <boxGeometry args={[0.72, 0.16, 1.0]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.081, 0]}>
              <boxGeometry args={[0.62, 0.01, 0.9]} />
              <meshStandardMaterial color="#7c3aed" roughness={0.4} />
            </mesh>
          </group>
        ))}
        <Text raycast={() => null} position={[0.1, 0.55, 0]} fontSize={0.15} fontWeight={900} color="#fde68a" outlineWidth={0.018} outlineColor="#451a03" anchorX="center" anchorY="middle" textAlign="center">{'AGARRAR\nMÁS CARTAS'}</Text>
        <mesh
          position={[0, 0.3, 0]}
          onClick={(e) => { e.stopPropagation(); drawVoluntary() }}
          onPointerOver={(e) => { e.stopPropagation(); if (turn === 'player') document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
          <boxGeometry args={[0.9, 0.6, 1.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* Mano del jugador */}
      <group position={[0, 0, 3.6]}>
        {playerHand.map((c, i) => (
          <CardMesh key={c.id} card={c} position={[handStart + i * 0.85, 0, 0]} onClick={() => onPlayerCardClick(c)} hoverable={turn === 'player' && active && !pendingWild} />
        ))}
      </group>

      {pendingWild && (
        <Html fullscreen zIndexRange={[30, 40]} style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 text-center">
              <p className="text-white font-black mb-3 uppercase text-sm">Elige un color</p>
              <div className="flex gap-3">
                {['red', 'blue', 'green', 'yellow'].map((c) => (
                  <button key={c} onClick={() => chooseWildColor(c)} className="w-12 h-12 rounded-full border-2 border-white" style={{ background: COLOR_HEX[c] }} />
                ))}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
