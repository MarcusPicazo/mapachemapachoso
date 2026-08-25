import { useState, useRef, useEffect } from 'react'
import { Text } from '@react-three/drei'
import { generateRack, isValidWord, letterValue, findFormableWord, CLUES } from './common/scrabbleWords'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

function LetterTile({ id, letter, position, onClick, dimmed, glow }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={position} scale={hovered ? 1.1 : 1}>
      <mesh
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
        castShadow
      >
        <boxGeometry args={[0.62, 0.18, 0.62]} />
        <meshStandardMaterial color={dimmed ? '#94a3b8' : '#fde68a'} emissive={glow ? '#22c55e' : '#000000'} emissiveIntensity={glow ? 0.6 : 0} roughness={0.4} />
      </mesh>
      <Text raycast={() => null} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#451a03" anchorX="center" anchorY="middle">{letter}</Text>
      <Text raycast={() => null} position={[0.2, 0.12, 0.2]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#78350f" anchorX="center" anchorY="middle">{letterValue(letter)}</Text>
    </group>
  )
}

function BookStack({ position, rotation }) {
  const colors = ['#7f1d1d', '#78350f', '#14532d', '#1e3a8a']
  return (
    <group position={position} rotation={rotation}>
      {colors.map((c, i) => (
        <mesh key={i} position={[0, i * 0.13, 0]} rotation={[0, i * 0.15, 0]} castShadow>
          <boxGeometry args={[0.85, 0.12, 0.6]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function InkAndQuill({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.14, 0.16, 0.14, 12]} /><meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.3} /></mesh>
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.1, 0.1, 0.02, 12]} /><meshStandardMaterial color="#0f172a" roughness={0.3} /></mesh>
      <mesh position={[0.06, 0.35, -0.02]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.012, 0.02, 0.5, 6]} /><meshStandardMaterial color="#fef3c7" roughness={0.6} /></mesh>
      <mesh position={[0.22, 0.55, -0.1]} rotation={[0.3, 0, -0.5]}><coneGeometry args={[0.09, 0.28, 6]} /><meshStandardMaterial color="#f8fafc" roughness={0.6} /></mesh>
    </group>
  )
}

function Scroll({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.9, 10]} /><meshStandardMaterial color="#d6c9a3" roughness={0.7} /></mesh>
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.09, 0.09, 0.06, 10]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.09, 0.09, 0.06, 10]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
    </group>
  )
}

export default function Scrabble({ active, onWin, onHud, hintRequestId }) {
  const [rack, setRack] = useState(() => generateRack())
  const [wordSlots, setWordSlots] = useState([])
  const [wordsFormed, setWordsFormed] = useState(0)
  const [feedback, setFeedback] = useState({ text: '', tone: 'gold' })
  const [hintWord, setHintWord] = useState('')
  const finished = useRef(false)
  // hintRequestId es un contador global compartido entre niveles: se inicia
  // con su valor actual para no disparar una pista sola al montar el nivel.
  const lastHintId = useRef(hintRequestId)

  const addToWord = (tile) => {
    if (!active || finished.current) return
    sfx.click()
    setRack((r) => r.filter((t) => t.id !== tile.id))
    setWordSlots((w) => [...w, tile])
    setHintWord('')
  }

  const removeFromWord = (tile) => {
    setWordSlots((w) => w.filter((t) => t.id !== tile.id))
    setRack((r) => [...r, tile])
  }

  const confirmWord = () => {
    if (!active || finished.current || wordSlots.length < 2) return
    const word = wordSlots.map((t) => t.letter).join('')
    if (isValidWord(word)) {
      sfx.chime()
      setFeedback({ text: `¡"${word}" es válida! +${wordSlots.reduce((s, t) => s + letterValue(t.letter), 0)} pts`, tone: 'green' })
      setWordSlots([])
      setRack(generateRack())
      setHintWord('')
      setWordsFormed((w) => {
        const nw = w + 1
        if (nw >= 5 && !finished.current) { finished.current = true; setTimeout(() => onWin(), 400) }
        return nw
      })
    } else {
      sfx.hit()
      setFeedback({ text: `"${word}" no está en el diccionario del dragón.`, tone: 'red' })
      setRack((r) => [...r, ...wordSlots])
      setWordSlots([])
    }
  }

  useEffect(() => {
    if (!hintRequestId || hintRequestId === lastHintId.current) return
    lastHintId.current = hintRequestId
    const all = [...rack.map((t) => t.letter), ...wordSlots.map((t) => t.letter)]
    const found = findFormableWord(all)
    if (found) {
      setHintWord(found)
      const riddle = CLUES[found] || 'Piensa en algo del reino de los caballeros...'
      setFeedback({ text: `Acertijo (${found.length} letras): ${riddle}`, tone: 'gold' })
      sfx.chime()
    } else {
      setFeedback({ text: 'No veo ninguna palabra clara con estas letras... ¡confía en tu instinto!', tone: 'slate' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintRequestId])

  const rackStart = -((rack.length - 1) * 0.75) / 2
  const wordStart = -((wordSlots.length - 1) * 0.75) / 2
  const hintLetters = hintWord ? hintWord.split('') : []

  usePillHud(onHud, [
    { text: `Tus palabras: ${wordsFormed}/5`, tone: 'green' },
  ], feedback.text, feedback.tone)

  return (
    <group>
      <ResponsiveCamera position={[0, 7, 7.5]} fov={48} target={[0, 0, 1.5]} />
      <BoardLight position={[0, 8, 5]} />
      <BookStack position={[-3.6, -0.3, 1.5]} rotation={[0, 0.3, 0]} />
      <InkAndQuill position={[3.5, -0.35, 0.4]} />
      <Scroll position={[-3.4, -0.32, -1]} rotation={[0, 0.6, 0.15]} />
      <Scroll position={[3.6, -0.3, 2.4]} rotation={[0, -0.4, -0.1]} />

      {/* Palabra en construccion */}
      <group position={[0, 0, -0.8]}>
        {wordSlots.map((t, i) => (
          <LetterTile key={t.id} id={t.id} letter={t.letter} position={[wordStart + i * 0.75, 0, 0]} onClick={() => removeFromWord(t)} />
        ))}
        {wordSlots.length === 0 && (
          <Text raycast={() => null} fontSize={0.2} color="#94a3b8" anchorX="center" anchorY="middle">Toca letras para formar una palabra</Text>
        )}
      </group>

      {/* Boton confirmar */}
      <ConfirmButton onClick={confirmWord} disabled={wordSlots.length < 2} />

      {/* Rack de letras */}
      <group position={[0, 0, 2.6]}>
        {rack.map((t, i) => (
          <LetterTile key={t.id} id={t.id} letter={t.letter} position={[rackStart + i * 0.75, 0, 0]} onClick={() => addToWord(t)} glow={hintLetters.includes(t.letter)} />
        ))}
      </group>
    </group>
  )
}

function ConfirmButton({ onClick, disabled }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={[0, 0, 1.1]} scale={hovered && !disabled ? 1.08 : 1}>
      <mesh
        onClick={(e) => { e.stopPropagation(); if (!disabled) onClick() }}
        onPointerOver={(e) => { e.stopPropagation(); if (!disabled) { setHovered(true); document.body.style.cursor = 'pointer' } }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.2, 0.2, 0.55]} />
        <meshStandardMaterial color={disabled ? '#475569' : '#16a34a'} />
      </mesh>
      <Text raycast={() => null} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">CONFIRMAR</Text>
    </group>
  )
}
