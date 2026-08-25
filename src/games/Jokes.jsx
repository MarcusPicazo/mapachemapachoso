import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const JOKE_BANK = [
  { q: '¿Cómo se llama el pez más famoso del océano?', a: 'Nemo' },
  { q: '¿Qué le dice un semáforo a otro semáforo?', a: 'No me mires que me estoy cambiando' },
  { q: '¿Cuál es el animal más antiguo del mundo?', a: 'La cebra, porque está en blanco y negro' },
  { q: '¿Qué le dijo un pez a otro pez?', a: '¡Nada!' },
  { q: '¿Por qué los pájaros no usan Facebook?', a: 'Porque ya tienen Twitter' },
  { q: '¿Qué le dijo un caracol a una tortuga?', a: '¡Cómo corres!' },
  { q: '¿Cuál es el café más peligroso del mundo?', a: 'El que-mado' },
  { q: '¿Qué hace una abeja en el gimnasio?', a: 'Zum-ba' },
  { q: '¿Qué le dijo un dragón a un caballero asustado?', a: '¡No temas, solo quiero asar unos malvaviscos!' },
  { q: '¿Por qué el gnomo no jugaba Jenga con nadie?', a: 'Porque siempre tiraba la torre' },
  { q: '¿Qué le dijo una bruja a otra bruja?', a: '¡Qué bruji-linda te ves hoy!' },
  { q: '¿Cómo saluda un fantasma a otro fantasma?', a: '¿Qué hay de nuevo, viejo?' },
  { q: '¿Qué le dijo el cero al ocho?', a: '¡Bonito cinturón!' },
  { q: '¿Cuál es el colmo de un electricista?', a: 'Que le den calambres cuando ve a su esposa' },
  { q: '¿Qué hace una vaca boca abajo?', a: 'Leche condensada' },
  { q: '¿Cómo se llama un boomerang que no regresa?', a: 'Un palo' },
  { q: '¿Qué le dijo un huevo a otro huevo?', a: 'Si nos vieran juntos, ¡qué revuelo!' },
  { q: '¿Por qué la escoba llegó tarde?', a: 'Porque se quedó barriendo' },
  { q: '¿Qué le dijo un signo de pregunta a otro?', a: '¿Tú también tienes dudas?' },
  { q: '¿Cómo llaman a un dinosaurio que duerme todo el día?', a: 'Un dino-siesta' },
]

const ROUNDS = 5
const MAX_FAILS = 4

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRounds() {
  const picks = shuffle(JOKE_BANK).slice(0, ROUNDS)
  return picks.map((joke) => {
    const distractors = shuffle(JOKE_BANK.filter((j) => j !== joke)).slice(0, 3).map((j) => j.a)
    return { q: joke.q, answer: joke.a, options: shuffle([joke.a, ...distractors]) }
  })
}

function FloatingStar({ position, hex }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = position[1] + Math.sin(t * 0.9 + position[0]) * 0.15
    ref.current.rotation.z = t * 0.5
  })
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.1, 0]} />
      <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={0.8} />
    </mesh>
  )
}

function JesterHat({ position }) {
  return (
    <group position={position}>
      <mesh position={[-0.18, 0, 0]} rotation={[0, 0, -0.3]}><coneGeometry args={[0.13, 0.4, 10]} /><meshStandardMaterial color="#dc2626" roughness={0.5} /></mesh>
      <mesh position={[0.18, 0, 0]} rotation={[0, 0, 0.3]}><coneGeometry args={[0.13, 0.4, 10]} /><meshStandardMaterial color="#3b82f6" roughness={0.5} /></mesh>
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0]}><coneGeometry args={[0.13, 0.4, 10]} /><meshStandardMaterial color="#facc15" roughness={0.5} /></mesh>
      <mesh position={[-0.18, -0.22, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0.18, -0.22, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0, -0.42, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.5} /></mesh>
    </group>
  )
}

function JokeBook({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} castShadow>
        <boxGeometry args={[0.55, 0.42, 0.09]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <boxGeometry args={[0.46, 0.33, 0.02]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>
      <Text raycast={() => null} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0.15]} fontSize={0.15} color="#7f1d1d" anchorX="center" anchorY="middle">😂</Text>
    </group>
  )
}

function AnswerButton({ label, idx, onPick, disabled, state }) {
  const bg = state === 'correct' ? 'bg-emerald-600 border-emerald-300' : state === 'wrong' ? 'bg-red-600 border-red-300' : state === 'removed' ? 'bg-slate-800 border-slate-700 opacity-40' : 'bg-amber-700 hover:bg-amber-600 border-amber-300'
  return (
    <button
      onClick={() => !disabled && state !== 'removed' && onPick(idx)}
      disabled={disabled || state === 'removed'}
      className={`rounded-xl border-2 px-4 py-3 text-sm font-black text-white shadow-lg transition-colors ${bg} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </button>
  )
}

export default function Jokes({ active, onWin, onLose, onHud, onMood, hintRequestId }) {
  const rounds = useMemo(() => buildRounds(), [])
  const [idx, setIdx] = useState(0)
  const [fails, setFails] = useState(0)
  const [locked, setLocked] = useState(false)
  const [answerState, setAnswerState] = useState({})
  const finished = useRef(false)
  const lastHintId = useRef(hintRequestId)

  const current = rounds[Math.min(idx, rounds.length - 1)]

  useEffect(() => {
    setAnswerState({})
    setLocked(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  useEffect(() => {
    if (!hintRequestId || hintRequestId === lastHintId.current) return
    lastHintId.current = hintRequestId
    if (!active || finished.current || locked) return
    const wrongIdx = current.options.map((_, i) => i).filter((i) => current.options[i] !== current.answer && !answerState[i])
    if (wrongIdx.length > 0) {
      sfx.chime()
      const pick = wrongIdx[Math.floor(Math.random() * wrongIdx.length)]
      setAnswerState((s) => ({ ...s, [pick]: 'removed' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintRequestId])

  const onPick = (i) => {
    if (!active || finished.current || locked) return
    setLocked(true)
    if (current.options[i] === current.answer) {
      sfx.pop()
      if (onMood) onMood('laughing', 900)
      setAnswerState((s) => ({ ...s, [i]: 'correct' }))
      setTimeout(() => {
        if (idx + 1 >= rounds.length) {
          finished.current = true
          sfx.win()
          setTimeout(() => onWin(), 300)
        } else {
          setIdx((d) => d + 1)
        }
      }, 800)
    } else {
      sfx.hit()
      setAnswerState((s) => ({ ...s, [i]: 'wrong' }))
      setFails((f) => {
        const nf = f + 1
        setTimeout(() => {
          if (nf >= MAX_FAILS && !finished.current) {
            finished.current = true
            setTimeout(() => onLose(`¡Se acabaron tus intentos! La respuesta era: "${current.answer}"`), 400)
          } else {
            setLocked(false)
            setAnswerState((s) => ({ ...s, [i]: 'wrong' }))
          }
        }, 600)
        return nf
      })
    }
  }

  usePillHud(onHud, [
    { text: `Chiste ${idx + 1}/${rounds.length}`, tone: 'gold' },
    { text: `Fallos: ${fails}/${MAX_FAILS}`, tone: fails >= MAX_FAILS - 1 ? 'red' : 'slate' },
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 2, 6.5]} fov={46} target={[0, 0.6, 0]} />
      <BoardLight position={[0, 6, 4]} />
      <JesterHat position={[-2.6, 1.6, -1]} />
      <JokeBook position={[2.6, 0.1, -0.6]} rotation={[0, -0.4, 0]} />
      <FloatingStar position={[-1.6, 2.1, -1.6]} hex="#facc15" />
      <FloatingStar position={[1.8, 2.3, -1.4]} hex="#f472b6" />
      <FloatingStar position={[0.4, 2.6, -2]} hex="#60a5fa" />
      <Text raycast={() => null} position={[0, 1.9, -1]} fontSize={0.22} color="#fde68a" outlineWidth={0.02} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">🎭 Los Chistes del Bosque 🎭</Text>

      <Html position={[0, 0.65, 0.3]} center distanceFactor={7.5} zIndexRange={[6, 9]}>
        <div className="bg-slate-900/95 border-2 border-amber-400 rounded-2xl p-4 w-80 text-center shadow-xl">
          <p className="text-amber-100 text-sm font-bold leading-relaxed mb-4">{current.q}</p>
          <div className="grid grid-cols-1 gap-2">
            {current.options.map((opt, i) => (
              <AnswerButton key={i} label={opt} idx={i} onPick={onPick} disabled={locked} state={answerState[i]} />
            ))}
          </div>
        </div>
      </Html>
    </group>
  )
}
