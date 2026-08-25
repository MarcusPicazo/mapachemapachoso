import { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { pickRound, DrawingShape, displayLabel } from './common/pictionaryShapes'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

function SpinningShape({ word }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.8 })
  return <group ref={ref} position={[0, 0.6, 0]}><DrawingShape word={word} /></group>
}

function OptionButton({ label, onClick, position }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={position} scale={hovered ? 1.08 : 1}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[2.1, 0.2, 0.6]} />
        <meshStandardMaterial color={hovered ? '#fde68a' : '#1e293b'} />
      </mesh>
      <Text raycast={() => null} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color={hovered ? '#451a03' : 'white'} anchorX="center" anchorY="middle">{displayLabel(label)}</Text>
    </group>
  )
}

export default function Pictionary({ active, onWin, onLose, onHud }) {
  const [round, setRound] = useState(1)
  const [correctCount, setCorrectCount] = useState(0)
  const [current, setCurrent] = useState(() => pickRound())
  const [resolved, setResolved] = useState(false)
  const usedWords = useRef([])
  const finished = useRef(false)
  const totalRounds = 15

  const nextRound = () => {
    setRound((r) => r + 1)
    setCurrent(pickRound(usedWords.current))
    setResolved(false)
  }

  const handleFail = (msg) => {
    sfx.hit()
    if (!finished.current) { finished.current = true; setTimeout(() => onLose(msg), 500) }
  }

  const onOptionClick = (opt) => {
    if (!active || resolved || finished.current) return
    setResolved(true)
    if (opt === current.word) {
      sfx.chime()
      usedWords.current = [...usedWords.current, current.word]
      setCorrectCount((c) => {
        const nc = c + 1
        if (nc >= totalRounds && !finished.current) { finished.current = true; setTimeout(() => onWin(), 400) }
        else setTimeout(() => nextRound(), 800)
        return nc
      })
    } else {
      handleFail(`¡Casi! Era "${displayLabel(current.word)}".`)
    }
  }

  usePillHud(onHud, [
    { text: `Ronda ${round}/${totalRounds}`, tone: 'gold' },
    { text: `Aciertos: ${correctCount}`, tone: 'green' },
  ])

  const optPositions = [[-2.6, 0, 2.6], [2.6, 0, 2.6], [-2.6, 0, 3.4], [2.6, 0, 3.4]]

  return (
    <group>
      <ResponsiveCamera position={[0, 3, 7]} fov={48} target={[0, 0.6, 2]} />
      <BoardLight position={[0, 6, 4]} />
      <SpinningShape key={current.word} word={current.word} />
      {current.options.map((opt, i) => (
        <OptionButton key={opt} label={opt} position={optPositions[i]} onClick={() => onOptionClick(opt)} />
      ))}
    </group>
  )
}
