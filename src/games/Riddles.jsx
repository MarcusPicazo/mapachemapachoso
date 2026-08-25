import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import { shuffle } from './common/symbols'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const RIDDLE_BANK = [
  { q: 'Vuelo sin alas, silbo sin boca, no me ves pero me sientes cuando toco tu cara. ¿Qué soy?', options: ['El viento', 'La lluvia', 'El fuego', 'Un fantasma'], answer: 0 },
  { q: 'Cuanto más grande soy, menos peso. ¿Qué soy?', options: ['Una piedra', 'Un agujero', 'Una nube', 'Un globo'], answer: 1 },
  { q: 'Tengo ciudades, pero no casas; bosques, pero no árboles; ríos, pero no agua. ¿Qué soy?', options: ['Un libro', 'Un sueño', 'Un mapa', 'Un cuadro'], answer: 2 },
  { q: 'No tengo ojos y veo todo el reino: cuelgo del muro y reflejo tu cara. ¿Qué soy?', options: ['Una ventana', 'Un espejo', 'Un cuadro', 'Una moneda'], answer: 1 },
  { q: 'Tengo dientes pero no muerdo, y peino tu cabello cada mañana. ¿Qué soy?', options: ['Un cepillo', 'Una sierra', 'Un peine', 'Un tenedor'], answer: 2 },
  { q: 'Camino todo el día sobre mi cabeza y jamás me canso. ¿Qué soy?', options: ['Un clavo', 'Un sombrero', 'Un caracol', 'Una hormiga'], answer: 0 },
  { q: 'Blanca por dentro, verde por fuera; si quieres saber qué fruta soy, espera. ¿Qué soy?', options: ['La manzana', 'El limón', 'La pera', 'La sandía'], answer: 2 },
  { q: 'Soy redonda como la luna, brillante como el sol, y en un cofre del tesoro suelo vivir yo. ¿Qué soy?', options: ['Un anillo', 'Una estrella', 'Una moneda', 'Un botón'], answer: 2 },
  { q: 'Tengo agujas y no coso, doy la hora sin hablar. ¿Qué soy?', options: ['Una brújula', 'Un reloj', 'Un mapa', 'Una vela'], answer: 1 },
  { q: 'Cuanto más me lavan, más sucia me pongo. ¿Qué soy?', options: ['La escoba', 'La esponja', 'El agua', 'La ropa'], answer: 2 },
  { q: 'No tengo boca pero hablo, no tengo oídos pero escucho; en las paredes de castillos antiguos siempre me encuentro. ¿Qué soy?', options: ['Un fantasma', 'Un eco', 'Un libro', 'Un espejo'], answer: 1 },
  { q: 'Subo y bajo sin moverme, marco el ritmo del mar y su vaivén constante. ¿Qué soy?', options: ['El viento', 'Una ola', 'La marea', 'La luna'], answer: 2 },
  { q: 'Tengo hojas pero no soy árbol, tengo lomo pero no soy un animal. ¿Qué soy?', options: ['Una revista', 'Un cuaderno', 'Un libro', 'Un periódico'], answer: 2 },
  { q: 'Cuantos más años tengo, más anillos guardo por dentro. ¿Qué soy?', options: ['Un árbol', 'Una cebolla', 'Un caracol', 'Una vela'], answer: 0 },
  { q: 'Tengo una corona de hojas pero no soy rey, vivo en el huerto y doy manzanas. ¿Qué soy?', options: ['Un rey', 'Un manzano', 'Una flor', 'Un castillo'], answer: 1 },
  { q: 'No tengo patas pero siempre corro entre montañas hasta llegar al mar. ¿Qué soy?', options: ['Un río', 'El tiempo', 'Un caballo', 'El viento'], answer: 0 },
  { q: 'Oro parece, plata no es. ¿Qué es?', options: ['El plátano', 'El oro', 'Una moneda', 'El maíz'], answer: 0 },
  { q: 'Agua pasa por mi casa, cate de mi corazón. ¿Qué fruta soy?', options: ['El aguacate', 'El limón', 'El coco', 'La papaya'], answer: 0 },
  { q: 'Verde por fuera, roja por dentro, con semillas negras que nadie cuenta. ¿Qué soy?', options: ['La sandía', 'El tomate', 'La granada', 'La manzana'], answer: 0 },
  { q: 'Tan pequeño y agujereado que no se puede tapar, por más que le pongas parches, sigue sin cerrar. ¿Qué soy?', options: ['Un colador', 'Una red', 'Un plato', 'Una taza'], answer: 0 },
  { q: 'Salgo del mar y lloro sin parar, y en la cocina me usan para condimentar. ¿Qué soy?', options: ['La sal', 'El agua', 'El pescado', 'La ola'], answer: 0 },
  { q: 'Voy por el aire y no soy ave, tengo cola larga y no soy animal. ¿Qué soy?', options: ['Un avión', 'Una cometa', 'Un pájaro', 'Una nube'], answer: 1 },
  { q: 'Tengo un ojo pero no veo, y por él pasa un hilo cada día. ¿Qué soy?', options: ['Un alfiler', 'Una aguja', 'Un botón', 'Un dedal'], answer: 1 },
  { q: 'Brillo en el cielo de noche, guío a los marineros y a veces cumplo deseos. ¿Qué soy?', options: ['El sol', 'La luna', 'Una estrella', 'Un cometa'], answer: 2 },
  { q: 'Soy redonda, giro en el cielo y cambio de forma cada noche. ¿Qué soy?', options: ['La luna', 'El sol', 'Un planeta', 'Una estrella'], answer: 0 },
  { q: 'Tengo escamas pero no soy pez, vivo en el castillo y a veces escupo fuego. ¿Qué soy?', options: ['Una serpiente', 'Un dragón', 'Un lagarto', 'Un cocodrilo'], answer: 1 },
  { q: 'Soy de metal, protejo el pecho del caballero, y brillo bajo el sol. ¿Qué soy?', options: ['Un escudo', 'Una espada', 'Una armadura', 'Un casco'], answer: 2 },
  { q: 'Guardo tesoros bajo llave, y sin la correcta, nunca me abrirás. ¿Qué soy?', options: ['Un cofre', 'Una puerta', 'Un mapa', 'Un candado'], answer: 0 },
  { q: 'Floto en el cielo del castillo, brillo de colores y llevo magia de un mundo a otro. ¿Qué soy?', options: ['Un arcoíris', 'Un portal', 'Una estrella fugaz', 'Un hechizo'], answer: 1 },
  { q: 'Tengo dientes pero no como, y corto la madera del bosque. ¿Qué soy?', options: ['Un hacha', 'Una sierra', 'Un cuchillo', 'Un martillo'], answer: 1 },
  { q: 'Cuanto más trabajo, más me desgasto, y sin mí el caballo no puede galopar en el camino de piedra. ¿Qué soy?', options: ['Una silla de montar', 'Una herradura', 'Un estribo', 'Una espuela'], answer: 1 },
]

const ROUNDS = 20
const MAX_FAILS = 6

function FloatingOrb({ position, hex }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = position[1] + Math.sin(t * 0.9 + position[0]) * 0.18
    ref.current.material.emissiveIntensity = 0.7 + Math.sin(t * 2 + position[0]) * 0.3
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={0.8} transparent opacity={0.85} />
    </mesh>
  )
}

function CrystalBall({ position }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.3
  })
  return (
    <group position={position}>
      <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.42, 0.5, 0.16, 16]} /><meshStandardMaterial color="#451a03" roughness={0.7} /></mesh>
      <mesh ref={ref} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.5} transparent opacity={0.55} roughness={0.1} metalness={0.2} />
      </mesh>
      <pointLight color="#c084fc" intensity={1.2} distance={4} position={[0, 0.15, 0]} />
    </group>
  )
}

function OpenBook({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[-Math.PI / 2, 0, 0.12]}><boxGeometry args={[0.7, 0.5, 0.06]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0.12]}><boxGeometry args={[0.6, 0.4, 0.02]} /><meshStandardMaterial color="#fef3c7" roughness={0.8} /></mesh>
    </group>
  )
}

function AnswerButton({ label, idx, onPick, disabled, state }) {
  const bg = state === 'correct' ? 'bg-emerald-600 border-emerald-300' : state === 'wrong' ? 'bg-red-600 border-red-300' : state === 'removed' ? 'bg-slate-800 border-slate-700 opacity-40' : 'bg-indigo-700 hover:bg-indigo-600 border-indigo-300'
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

export default function Riddles({ active, onWin, onLose, onHud, hintRequestId }) {
  const riddles = useMemo(() => shuffle(RIDDLE_BANK).slice(0, ROUNDS), [])
  const [idx, setIdx] = useState(0)
  const [fails, setFails] = useState(0)
  const [locked, setLocked] = useState(false)
  const [answerState, setAnswerState] = useState({}) // { optionIdx: 'correct'|'wrong'|'removed' }
  const finished = useRef(false)
  const lastHintId = useRef(hintRequestId)

  const current = riddles[Math.min(idx, riddles.length - 1)]

  useEffect(() => {
    setAnswerState({})
    setLocked(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  useEffect(() => {
    if (!hintRequestId || hintRequestId === lastHintId.current) return
    lastHintId.current = hintRequestId
    if (!active || finished.current || locked) return
    const wrongIdx = current.options.map((_, i) => i).filter((i) => i !== current.answer && !answerState[i])
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
    if (i === current.answer) {
      sfx.pop()
      setAnswerState((s) => ({ ...s, [i]: 'correct' }))
      setTimeout(() => {
        if (idx + 1 >= riddles.length) {
          finished.current = true
          sfx.win()
          setTimeout(() => onWin(), 300)
        } else {
          setIdx((d) => d + 1)
        }
      }, 700)
    } else {
      sfx.hit()
      setAnswerState((s) => ({ ...s, [i]: 'wrong' }))
      setFails((f) => {
        const nf = f + 1
        setTimeout(() => {
          if (nf >= MAX_FAILS && !finished.current) {
            finished.current = true
            setTimeout(() => onLose(`¡Se acabaron tus intentos! La respuesta era "${current.options[current.answer]}".`), 400)
          } else {
            setLocked(false)
            setAnswerState((s) => ({ ...s, [i]: 'wrong' }))
          }
        }, 500)
        return nf
      })
    }
  }

  usePillHud(onHud, [
    { text: `Adivinanza ${idx + 1}/${riddles.length}`, tone: 'gold' },
    { text: `Fallos: ${fails}/${MAX_FAILS}`, tone: fails >= MAX_FAILS - 1 ? 'red' : 'slate' },
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 2, 6.5]} fov={46} target={[0, 0.6, 0]} />
      <BoardLight position={[0, 6, 4]} />
      <CrystalBall position={[-2.7, 0.3, -0.8]} />
      <OpenBook position={[2.6, 0.1, -0.6]} rotation={[0, -0.4, 0]} />
      <FloatingOrb position={[-1.6, 1.9, -1.6]} hex="#c084fc" />
      <FloatingOrb position={[1.8, 2.2, -1.4]} hex="#fbbf24" />
      <FloatingOrb position={[0.4, 2.6, -2]} hex="#60a5fa" />
      <Text raycast={() => null} position={[0, 1.9, -1]} fontSize={0.22} color="#fde68a" outlineWidth={0.02} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">🦉 El Sabio de las Adivinanzas 🦉</Text>

      <Html position={[0, 0.65, 0.3]} center distanceFactor={7.5} zIndexRange={[6, 9]}>
        <div className="bg-slate-900/95 border-2 border-amber-400 rounded-2xl p-4 w-80 text-center shadow-xl">
          <p className="text-amber-100 text-sm font-bold leading-relaxed mb-4">{current.q}</p>
          <div className="grid grid-cols-2 gap-2">
            {current.options.map((opt, i) => (
              <AnswerButton key={i} label={opt} idx={i} onPick={onPick} disabled={locked} state={answerState[i]} />
            ))}
          </div>
        </div>
      </Html>
    </group>
  )
}
