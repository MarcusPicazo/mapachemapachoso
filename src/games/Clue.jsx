import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html, Line } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const SUSPECTS = ['Herrero', 'Bruja', 'Bardo', 'Caballero']
const WEAPONS = ['Espada', 'Veneno', 'Ballesta', 'Maza']
const ROOMS = ['Torre', 'Mazmorra', 'Salón', 'Jardín']
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308']

// Varios casos distintos con una historia y pistas que, leidas con calma,
// determinan una unica solucion por eliminacion (no es al azar puro: cada
// pista descarta un sospechoso y una habitacion a la vez, y la ultima pista
// aisla el arma). Al perder y reintentar, se sortea un caso diferente.
const CASES = [
  {
    title: 'La Corona Desaparecida',
    intro: 'Durante el banquete real, la corona se esfumó del salón del trono. El mapache reunió los testimonios de esa noche...',
    clues: [
      'El Caballero pasó la noche vigilando la Torre y jura que ahí no pasó nada raro.',
      'El Bardo estuvo cantando frente a todos en el Salón durante toda la fiesta.',
      'El Herrero se quedó encerrado en la Mazmorra afilando su espada y no vio a nadie entrar.',
      'Entre las flores del Jardín se halló un frasquito vacío; ninguna arma de metal tenía golpes ni sangre.',
    ],
    solution: { suspect: 1, weapon: 1, room: 3 },
  },
  {
    title: 'El Robo del Tesoro',
    intro: 'El cofre del tesoro apareció forzado al amanecer. Los guardias interrogaron a todos los sospechosos habituales...',
    clues: [
      'La Bruja estuvo toda la noche preparando pociones en el Jardín, rodeada de testigos.',
      'El Bardo tocaba su laúd sin parar en la Torre; todos lo escuchaban cantar.',
      'El Herrero se quedó dormido en el Salón después de tanto comer.',
      'Cerca del cofre se encontró una maza abollada; no había flechas ni rastro de veneno, y la espada real seguía intacta en su vitrina.',
    ],
    solution: { suspect: 3, weapon: 3, room: 1 },
  },
  {
    title: 'El Secreto de la Ventana Rota',
    intro: 'Alguien entró por la ventana más alta del castillo y desapareció sin dejar huellas claras. Solo quedaron unas pistas...',
    clues: [
      'La Bruja preparaba pociones en la Mazmorra sin parar; decenas de gnomos la vieron.',
      'El Bardo cantaba en el Jardín para las hadas toda la noche.',
      'El Caballero custodiaba la puerta del Salón; nadie entró ni salió sin que él lo viera.',
      'En la Torre se halló una flecha rota junto a la ventana; ni la espada ni la maza habían sido tocadas, y no quedaba olor a veneno.',
    ],
    solution: { suspect: 0, weapon: 2, room: 0 },
  },
  {
    title: 'El Enigma del Trono Vacío',
    intro: 'El rey encontró su trono manchado a la mañana siguiente del festín. El mapache debe descubrir quién estuvo ahí...',
    clues: [
      'El Herrero trabajaba sin descanso en la Mazmorra; el eco de su martillo se oía desde lejos.',
      'La Bruja leía hechizos antiguos encerrada en la Torre más alta.',
      'El Caballero patrullaba el Jardín toda la noche, pisando cada rincón.',
      'Junto al trono del Salón quedó una espada con el filo manchado; la ballesta seguía en su soporte, la maza intacta, y no había ni gota de veneno.',
    ],
    solution: { suspect: 2, weapon: 0, room: 2 },
  },
]

function OptionCard({ label, color, selected, onClick, position }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef()
  const target = useRef(1)
  target.current = selected ? 1.14 : (hovered ? 1.08 : 1)
  useFrame((_, dt) => {
    if (!ref.current) return
    const s = ref.current.scale.x + (target.current - ref.current.scale.x) * Math.min(1, dt * 10)
    ref.current.scale.setScalar(s)
  })
  return (
    <group ref={ref} position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[0.85, 0.85, 0.14]} />
        <meshStandardMaterial color={selected ? '#fde68a' : color} emissive={selected ? '#fbbf24' : '#000000'} emissiveIntensity={selected ? 0.4 : 0} />
      </mesh>
      <Text raycast={() => null} position={[0, 0, 0.09]} fontSize={0.15} color={selected ? '#451a03' : 'white'} anchorX="center" anchorY="middle" maxWidth={0.8}>{label}</Text>
      {selected && (
        <Text raycast={() => null} position={[0, 0, -0.09]} rotation={[0, Math.PI, 0]} fontSize={0.2} color="#451a03" anchorX="center" anchorY="middle">✓</Text>
      )}
    </group>
  )
}

function MagnifyingGlass({ position }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.15
  })
  return (
    <group ref={ref} position={position} rotation={[0, 0, 0.3]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.32, 0.05, 12, 24]} /><meshStandardMaterial color="#78350f" roughness={0.5} metalness={0.4} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.3, 24]} /><meshStandardMaterial color="#7dd3fc" transparent opacity={0.35} roughness={0.1} metalness={0.3} /></mesh>
      <mesh position={[0, -0.55, 0]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.05, 0.06, 0.5, 8]} /><meshStandardMaterial color="#451a03" roughness={0.6} /></mesh>
    </group>
  )
}

function DetectiveHat({ position }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <mesh><cylinderGeometry args={[0.42, 0.46, 0.06, 20]} /><meshStandardMaterial color="#292524" roughness={0.6} /></mesh>
      <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.26, 0.28, 0.24, 20]} /><meshStandardMaterial color="#1c1917" roughness={0.6} /></mesh>
      <mesh position={[0, 0.05, 0]}><torusGeometry args={[0.27, 0.03, 8, 20]} /><meshStandardMaterial color="#7f1d1d" roughness={0.5} /></mesh>
    </group>
  )
}

function CorkBoard({ position }) {
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <mesh><boxGeometry args={[1.6, 1.1, 0.06]} /><meshStandardMaterial color="#a16207" roughness={0.8} /></mesh>
      {[[-0.45, 0.25], [0.1, 0.3], [0.4, -0.1], [-0.2, -0.25]].map(([x, y], i) => (
        <group key={i} position={[x, y, 0.04]}>
          <mesh><planeGeometry args={[0.32, 0.24]} /><meshStandardMaterial color="#fef3c7" roughness={0.8} /></mesh>
          <mesh position={[0, 0, 0.005]}><circleGeometry args={[0.02, 8]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
      ))}
      <Line points={[[-0.45, 0.25, 0.04], [0.4, -0.1, 0.04]]} color="#dc2626" lineWidth={1} />
      <Line points={[[0.1, 0.3, 0.04], [-0.2, -0.25, 0.04]]} color="#dc2626" lineWidth={1} />
    </group>
  )
}

function Row({ title, items, selectedIdx, onSelect, z, hinted }) {
  const start = -((items.length - 1) * 1.05) / 2
  return (
    <group position={[0, 0, z]}>
      <Text raycast={() => null} position={[-3.4, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} fontWeight={900} color={hinted ? '#4ade80' : '#fde68a'} outlineWidth={hinted ? 0.015 : 0} outlineColor="#052e16" anchorX="left" anchorY="middle">{hinted ? `💡 ${title}` : title}</Text>
      {items.map((label, i) => (
        <OptionCard key={label} label={label} color={COLORS[i]} selected={selectedIdx === i} onClick={() => onSelect(i)} position={[start + i * 1.05, 0.1, 0]} />
      ))}
    </group>
  )
}

export default function Clue({ active, onWin, onLose, onHud, hintRequestId }) {
  const kase = useMemo(() => CASES[Math.floor(Math.random() * CASES.length)], [])
  const solution = kase.solution
  const [sel, setSel] = useState({ suspect: 0, weapon: 0, room: 0 })
  const [turnsLeft, setTurnsLeft] = useState(6)
  const [feedback, setFeedback] = useState(null)
  const [history, setHistory] = useState([])
  const [showCase, setShowCase] = useState(true)
  const [hintCat, setHintCat] = useState(null)
  const finished = useRef(false)
  const lastHintId = useRef(hintRequestId)

  useEffect(() => {
    if (!hintRequestId || hintRequestId === lastHintId.current) return
    lastHintId.current = hintRequestId
    if (!active || finished.current) return
    const wrong = ['suspect', 'weapon', 'room'].filter((cat) => sel[cat] !== solution[cat])
    if (wrong.length === 0) return
    const cat = wrong[Math.floor(Math.random() * wrong.length)]
    sfx.chime()
    setSel((s) => ({ ...s, [cat]: solution[cat] }))
    setHintCat(cat)
    setTimeout(() => setHintCat(null), 1600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintRequestId])

  const accuse = () => {
    if (!active || finished.current || turnsLeft <= 0) return
    sfx.click()
    const fb = {
      suspect: sel.suspect === solution.suspect,
      weapon: sel.weapon === solution.weapon,
      room: sel.room === solution.room,
    }
    setFeedback(fb)
    setHistory((h) => [...h, { sel: { ...sel }, fb }])
    if (fb.suspect && fb.weapon && fb.room) {
      finished.current = true
      sfx.win()
      setTimeout(() => onWin(), 500)
      return
    }
    sfx.hit()
    setTurnsLeft((t) => {
      const nt = t - 1
      if (nt <= 0 && !finished.current) {
        finished.current = true
        setTimeout(() => onLose(`Se acabaron los turnos. Era ${SUSPECTS[solution.suspect]}, con ${WEAPONS[solution.weapon]}, en ${ROOMS[solution.room]}.`), 600)
      }
      return nt
    })
  }

  usePillHud(onHud, [
    { text: `Turnos restantes: ${turnsLeft}/6`, tone: turnsLeft <= 2 ? 'red' : 'gold' },
    ...(feedback ? [
      { text: `Sospechoso ${feedback.suspect ? '✓' : '✗'}`, tone: feedback.suspect ? 'green' : 'red' },
      { text: `Arma ${feedback.weapon ? '✓' : '✗'}`, tone: feedback.weapon ? 'green' : 'red' },
      { text: `Habitación ${feedback.room ? '✓' : '✗'}`, tone: feedback.room ? 'green' : 'red' },
    ] : []),
  ])

  return (
    <group>
      <ResponsiveCamera position={[0, 6.5, 5.5]} fov={50} target={[0, 0, 0]} />
      <BoardLight position={[0, 8, 4]} />
      <MagnifyingGlass position={[-4.4, 1.6, -0.5]} />
      <DetectiveHat position={[4.3, 1.3, 0.8]} />
      <CorkBoard position={[4.3, 0.5, -1.6]} />
      <Row title="Sospechoso" items={SUSPECTS} selectedIdx={sel.suspect} onSelect={(i) => setSel((s) => ({ ...s, suspect: i }))} z={-1.6} hinted={hintCat === 'suspect'} />
      <Row title="Arma" items={WEAPONS} selectedIdx={sel.weapon} onSelect={(i) => setSel((s) => ({ ...s, weapon: i }))} z={0} hinted={hintCat === 'weapon'} />
      <Row title="Habitación" items={ROOMS} selectedIdx={sel.room} onSelect={(i) => setSel((s) => ({ ...s, room: i }))} z={1.6} hinted={hintCat === 'room'} />

      <Html position={[-3.55, 0, 2.75]} distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-none rounded-xl bg-slate-900/85 border-2 border-amber-400 px-3 py-2 text-[10px] font-black text-amber-50 uppercase w-40">
          <div className="mb-1 text-amber-300">Tu acusación:</div>
          <div>{SUSPECTS[sel.suspect]}</div>
          <div>{WEAPONS[sel.weapon]}</div>
          <div>{ROOMS[sel.room]}</div>
        </div>
      </Html>

      {history.length > 0 && (
        <Html position={[3.55, 0, -1.6]} distanceFactor={9} zIndexRange={[5, 8]} style={{ pointerEvents: 'none' }}>
          <div className="pointer-events-none rounded-xl bg-slate-900/85 border-2 border-sky-400 px-3 py-2 text-[10px] font-black text-sky-50 uppercase w-44 max-h-40 overflow-hidden">
            <div className="mb-1 text-sky-300">Pistas anteriores:</div>
            {history.slice(-5).map((h, i) => (
              <div key={i} className="mb-0.5 whitespace-nowrap">
                {SUSPECTS[h.sel.suspect][0]}{WEAPONS[h.sel.weapon][0]}{ROOMS[h.sel.room][0]} → {h.fb.suspect ? '✓' : '✗'}{h.fb.weapon ? '✓' : '✗'}{h.fb.room ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </Html>
      )}

      <Html position={[3.3, 0.1, 0.9]} center distanceFactor={9} zIndexRange={[6, 9]}>
        <button
          onClick={() => { if (!(!active || turnsLeft <= 0)) accuse() }}
          disabled={!active || turnsLeft <= 0}
          className={`rounded-full border-2 px-6 py-2.5 text-sm font-black uppercase tracking-wide whitespace-nowrap shadow-lg ${(!active || turnsLeft <= 0) ? 'bg-slate-700 border-slate-500 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 border-red-300 text-white'}`}
        >
          🔍 ¡Acusar!
        </button>
      </Html>

      <Html position={[-3.3, 0.1, -2.0]} center distanceFactor={9} zIndexRange={[6, 9]}>
        <button
          onClick={() => setShowCase(true)}
          className="rounded-full border-2 border-amber-300 bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg whitespace-nowrap"
        >
          📖 Ver caso
        </button>
      </Html>

      {showCase && (
        <Html fullscreen zIndexRange={[30, 40]} style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 max-w-sm mx-4 text-left">
              <p className="text-amber-300 font-black uppercase text-sm mb-1">{kase.title}</p>
              <p className="text-slate-200 text-xs mb-3 leading-relaxed">{kase.intro}</p>
              <p className="text-amber-200 font-black uppercase text-[11px] mb-1">Testimonios:</p>
              <ul className="text-slate-100 text-xs leading-relaxed list-disc list-inside space-y-1 mb-4">
                {kase.clues.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              <button onClick={() => setShowCase(false)} className="w-full rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 py-2 text-sm font-black uppercase text-white">
                Entendido, ¡a deducir!
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
