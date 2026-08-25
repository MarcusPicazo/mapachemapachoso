import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { SYMBOLS, shuffle, SymbolMesh } from './common/symbols'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx, tone } from '../utils/audio'

function useCountdown(seconds, active, onExpire) {
  const [left, setLeft] = useState(seconds)
  const expired = useRef(false)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setLeft((t) => {
        const nt = t - 1
        if (nt <= 0 && !expired.current) { expired.current = true; clearInterval(id); onExpire() }
        return Math.max(0, nt)
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  return left
}

// ---------- Reto 1: Memorama relampago (3 pares, 8s) ----------
function MiniMemory({ onDone, onFail }) {
  const deck = useMemo(() => {
    const pairs = shuffle(SYMBOLS).slice(0, 3)
    return shuffle(pairs.flatMap((s, i) => [{ ...s, pairId: i, idx: i * 2 }, { ...s, pairId: i, idx: i * 2 + 1 }]))
      .map((c, idx) => ({ ...c, idx }))
  }, [])
  const [states, setStates] = useState(() => new Array(6).fill('hidden'))
  const [matched, setMatched] = useState(0)
  const flipped = useRef([])
  const busy = useRef(false)
  const done = useRef(false)
  const timeLeft = useCountdown(8, !done.current, () => { if (!done.current) { done.current = true; onFail() } })

  const onFlip = (idx) => {
    if (busy.current || done.current || states[idx] !== 'hidden') return
    sfx.pop()
    setStates((prev) => { const n = [...prev]; n[idx] = 'flipped'; return n })
    flipped.current.push(idx)
    if (flipped.current.length === 2) {
      busy.current = true
      const [a, b] = flipped.current
      if (deck[a].pairId === deck[b].pairId) {
        sfx.chime()
        setTimeout(() => {
          setStates((p) => { const n = [...p]; n[a] = 'matched'; n[b] = 'matched'; return n })
          setMatched((m) => {
            const nm = m + 1
            if (nm >= 3 && !done.current) { done.current = true; setTimeout(onDone, 300) }
            return nm
          })
          flipped.current = []; busy.current = false
        }, 300)
      } else {
        setTimeout(() => {
          setStates((p) => { const n = [...p]; n[a] = 'hidden'; n[b] = 'hidden'; return n })
          flipped.current = []; busy.current = false
        }, 600)
      }
    }
  }

  return (
    <group>
      <Text raycast={() => null} position={[0, 0.05, -1.45]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.24} fontWeight={900} color="#fde68a" outlineWidth={0.02} outlineColor="#451a03" anchorX="center" anchorY="middle">Reto 1: Memoria — encuentra los 3 pares</Text>
      <Text raycast={() => null} position={[0, 0.05, -1.12]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} fontWeight={900} color={timeLeft <= 3 ? '#f87171' : '#f8fafc'} outlineWidth={0.018} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">⏱ {timeLeft}s</Text>
      {deck.map((c, i) => {
        const col = i % 3, row = Math.floor(i / 3)
        const revealed = states[i] === 'flipped' || states[i] === 'matched'
        return (
          <group key={i} position={[(col - 1) * 1.05, 0, (row - 0.5) * 1.05]}>
            <mesh onClick={(e) => { e.stopPropagation(); onFlip(i) }} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
              <boxGeometry args={[0.92, 0.15, 0.92]} />
              <meshStandardMaterial color={states[i] === 'matched' ? '#facc15' : revealed ? '#e2e8f0' : '#3f2a1a'} />
            </mesh>
            {revealed && <group position={[0, 0.28, 0]}><SymbolMesh symbol={c} scale={0.8} /></group>}
          </group>
        )
      })}
    </group>
  )
}

// ---------- Reto 2: Conecta 4 relampago (45s, fichas caen suave) ----------
// El reto SOLO puede terminar de dos formas: Jazz conecta 4 (gana y avanza)
// o se agota el cronometro (pierde). Ninguna otra condicion debe cortarlo.
const C3_COLS = 6, C3_ROWS = 5
function checkFour(grid, player) {
  for (let r = 0; r < C3_ROWS; r++) for (let c = 0; c <= C3_COLS - 4; c++) if (grid[r][c] === player && grid[r][c + 1] === player && grid[r][c + 2] === player && grid[r][c + 3] === player) return true
  for (let c = 0; c < C3_COLS; c++) for (let r = 0; r <= C3_ROWS - 4; r++) if (grid[r][c] === player && grid[r + 1][c] === player && grid[r + 2][c] === player && grid[r + 3][c] === player) return true
  for (let r = 0; r <= C3_ROWS - 4; r++) for (let c = 0; c <= C3_COLS - 4; c++) if (grid[r][c] === player && grid[r + 1][c + 1] === player && grid[r + 2][c + 2] === player && grid[r + 3][c + 3] === player) return true
  for (let r = 3; r < C3_ROWS; r++) for (let c = 0; c <= C3_COLS - 4; c++) if (grid[r][c] === player && grid[r - 1][c + 1] === player && grid[r - 2][c + 2] === player && grid[r - 3][c + 3] === player) return true
  return false
}
function MiniDisc({ col, row, player }) {
  const ref = useRef()
  const vel = useRef(0)
  const bounces = useRef(0)
  const phase = useRef('falling')
  const x = (col - (C3_COLS - 1) / 2) * 0.85
  const targetY = (row - (C3_ROWS - 1) / 2) * 0.85
  useFrame((_, dt) => {
    if (!ref.current) return
    if (phase.current === 'settled') return
    vel.current -= 12 * dt
    ref.current.position.y += vel.current * dt
    if (ref.current.position.y <= targetY) {
      ref.current.position.y = targetY
      if (bounces.current < 2 && Math.abs(vel.current) > 0.8) {
        vel.current = -vel.current * 0.32
        bounces.current++
      } else {
        vel.current = 0
        phase.current = 'settled'
      }
    }
  })
  return (
    <mesh ref={ref} position={[x, 3, 0.02]} castShadow>
      <cylinderGeometry args={[0.36, 0.36, 0.16, 20]} />
      <meshStandardMaterial color={player === 'P' ? '#ef4444' : '#facc15'} metalness={0.2} roughness={0.4} />
    </mesh>
  )
}
function MiniConnect({ onDone, onFail }) {
  const gridRef = useRef(new Array(C3_ROWS).fill(0).map(() => new Array(C3_COLS).fill(null)))
  const [, forceRender] = useState(0)
  const [discs, setDiscs] = useState([])
  const [turn, setTurn] = useState('player')
  const done = useRef(false)
  const discId = useRef(0)
  const timeLeft = useCountdown(45, !done.current, () => { if (!done.current) { done.current = true; onFail() } })

  // Grid vive en un ref (siempre al dia, sin depender de que React ya haya
  // re-renderizado) para que dos caidas seguidas (jugador + rival) nunca
  // lean un tablero desactualizado -- esa era la causa de que el reto
  // terminara de golpe casi al iniciar.
  const dropIn = (col, player) => {
    if (done.current) return false
    const grid = gridRef.current
    let row = -1
    for (let r = 0; r < C3_ROWS; r++) if (!grid[r][col]) { row = r; break }
    if (row === -1) return false
    const ng = grid.map((r) => [...r])
    ng[row][col] = player
    gridRef.current = ng
    forceRender((n) => n + 1)
    setDiscs((d) => [...d, { id: discId.current++, col, row, player }])
    if (player === 'P' && checkFour(ng, 'P')) {
      done.current = true
      sfx.chime()
      setTimeout(onDone, 400)
      return true
    }
    setTurn(player === 'P' ? 'ai' : 'player')
    return true
  }

  useEffect(() => {
    if (turn !== 'ai' || done.current) return
    const t = setTimeout(() => {
      if (done.current) return
      const grid = gridRef.current
      const cols = [...Array(C3_COLS).keys()].filter((c) => grid.some((r) => !r[c]))
      if (cols.length === 0) { setTurn('player'); return }
      sfx.place()
      dropIn(cols[Math.floor(Math.random() * cols.length)], 'E')
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn])

  const grid = gridRef.current

  return (
    <group>
      <Text raycast={() => null} position={[0, 2.3, 0]} fontSize={0.25} fontWeight={900} color="#fde68a" outlineWidth={0.02} outlineColor="#451a03" anchorX="center" anchorY="middle">Reto 2: Conecta 4 — {turn === 'player' ? 'Tu turno' : 'Turno rival...'}</Text>
      <Text raycast={() => null} position={[0, 2.0, 0]} fontSize={0.2} fontWeight={900} color={timeLeft <= 8 ? '#f87171' : '#f8fafc'} outlineWidth={0.018} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">⏱ {timeLeft}s</Text>
      {grid.map((row, r) => row.map((cell, c) => (
        <mesh key={`${r}-${c}`} position={[(c - (C3_COLS - 1) / 2) * 0.85, (r - (C3_ROWS - 1) / 2) * 0.85, -0.1]}
          onClick={(e) => { e.stopPropagation(); if (turn === 'player' && !done.current) { sfx.place(); dropIn(c, 'P') } }}
          onPointerOver={(e) => { e.stopPropagation(); if (turn === 'player') document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
          <cylinderGeometry args={[0.36, 0.36, 0.06, 20]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      )))}
      {discs.map((d) => <MiniDisc key={d.id} col={d.col} row={d.row} player={d.player} />)}
    </group>
  )
}

// ---------- Reto 3: Secuencia magica (repite el orden de colores) ----------
const SEQ_COLORS = [
  { hex: '#ef4444', glow: '#fca5a5', note: 523.25 },
  { hex: '#3b82f6', glow: '#93c5fd', note: 659.25 },
  { hex: '#22c55e', glow: '#86efac', note: 784.0 },
  { hex: '#eab308', glow: '#fde68a', note: 1046.5 },
]
function MiniGem({ index, color, active, justPicked, onPick, disabled }) {
  const ref = useRef()
  const pop = useRef(0)
  useFrame((_, dt) => {
    if (!ref.current) return
    if (pop.current > 0) pop.current = Math.max(0, pop.current - dt * 3.2)
    const target = (active ? 1.3 : 1) + pop.current * 0.35
    ref.current.scale.x += (target - ref.current.scale.x) * Math.min(1, dt * 14)
    ref.current.scale.y = ref.current.scale.x
    ref.current.scale.z = ref.current.scale.x
  })
  useEffect(() => { if (justPicked) pop.current = 1 }, [justPicked])
  return (
    <group position={[(index - 1.5) * 1.05, 0, 0]} ref={ref}>
      <mesh
        onPointerDown={(e) => { e.stopPropagation(); if (!disabled) onPick(index) }}
        onPointerOver={(e) => { e.stopPropagation(); if (!disabled) document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[0.48, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={color.hex} emissive={active || justPicked ? color.glow : color.hex} emissiveIntensity={active || justPicked ? 1.1 : 0.35} roughness={0.35} />
      </mesh>
    </group>
  )
}
function MiniSequence({ onDone, onFail }) {
  const sequence = useMemo(() => Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 4)), [])
  const [showIdx, setShowIdx] = useState(-1)
  const [phase, setPhase] = useState('showing')
  const [inputIdx, setInputIdx] = useState(0)
  const [pickedIdx, setPickedIdx] = useState(-1)
  const done = useRef(false)
  const timeLeft = useCountdown(12, phase === 'input' && !done.current, () => { if (!done.current) { done.current = true; onFail() } })

  useEffect(() => {
    let i = -1
    const id = setInterval(() => {
      i++
      if (i >= sequence.length) {
        clearInterval(id)
        setShowIdx(-1)
        setPhase('input')
        return
      }
      tone(SEQ_COLORS[sequence[i]].note, 'sine', 0.35, 0.12)
      setShowIdx(sequence[i])
    }, 700)
    return () => clearInterval(id)
  }, [sequence])

  const onPick = (ci) => {
    if (phase !== 'input' || done.current) return
    tone(SEQ_COLORS[ci].note, 'triangle', 0.22, 0.13)
    setPickedIdx(ci)
    setTimeout(() => setPickedIdx((p) => (p === ci ? -1 : p)), 260)
    if (ci === sequence[inputIdx]) {
      const ni = inputIdx + 1
      setInputIdx(ni)
      if (ni >= sequence.length) { done.current = true; sfx.chime(); setTimeout(onDone, 300) }
    } else {
      sfx.hit()
      done.current = true
      setTimeout(() => onFail(), 300)
    }
  }

  return (
    <group>
      <Text raycast={() => null} position={[0, 2, -1]} fontSize={0.25} fontWeight={900} color="#fde68a" outlineWidth={0.02} outlineColor="#451a03" anchorX="center" anchorY="middle">Reto 3: Secuencia Mágica</Text>
      <Text raycast={() => null} position={[0, 1.65, -1]} fontSize={0.19} fontWeight={900} color="#f8fafc" outlineWidth={0.016} outlineColor="#1e1b4b" anchorX="center" anchorY="middle">
        {phase === 'showing' ? 'Memoriza el orden de las runas...' : `Repite el orden (${inputIdx}/${sequence.length}) · ⏱ ${timeLeft}s`}
      </Text>
      {SEQ_COLORS.map((c, i) => (
        <MiniGem key={i} index={i} color={c} active={showIdx === i} justPicked={pickedIdx === i || showIdx === i} onPick={onPick} disabled={phase !== 'input'} />
      ))}
    </group>
  )
}

export default function MixChallenge({ active, onWin, onLose, onHud }) {
  const [stage, setStage] = useState(1)
  const finished = useRef(false)

  const fail = (msg) => { if (!finished.current) { finished.current = true; setTimeout(() => onLose(msg), 400) } }
  const advance = () => setStage((s) => {
    if (s >= 3) { if (!finished.current) { finished.current = true; sfx.win(); setTimeout(() => onWin(), 400) }; return s }
    return s + 1
  })

  usePillHud(onHud, [
    { text: `Etapa ${stage}/3`, tone: 'gold' },
  ])

  return (
    <group>
      {stage === 1 ? (
        <ResponsiveCamera position={[0, 4.6, 0.4]} fov={50} target={[0, 0, 0]} />
      ) : (
        <ResponsiveCamera position={[0, 1, 7]} fov={48} target={[0, 0, 0]} />
      )}
      <BoardLight position={[0, 6, 5]} />
      {active && stage === 1 && <MiniMemory onDone={advance} onFail={() => fail('¡Se acabó el tiempo para encontrar los pares!')} />}
      {active && stage === 2 && <MiniConnect onDone={advance} onFail={() => fail('¡Se acabó el tiempo, no lograste el conecta 4!')} />}
      {active && stage === 3 && <MiniSequence onDone={advance} onFail={() => fail('¡La secuencia mágica se rompió!')} />}
    </group>
  )
}
