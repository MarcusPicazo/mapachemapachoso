import { useRef, useState, useCallback, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { usePillHud } from './common/GameHud'
import BoardLight from './common/BoardLight'
import ResponsiveCamera from './common/ResponsiveCamera'
import { sfx } from '../utils/audio'

const PALETTE = [
  { name: 'ROJO', hex: '#dc2626' },
  { name: 'AZUL', hex: '#2563eb' },
  { name: 'VERDE', hex: '#16a34a' },
  { name: 'AMARILLO', hex: '#eab308' },
  { name: 'MORADO', hex: '#9333ea' },
  { name: 'NARANJA', hex: '#ea580c' },
  { name: 'CAFÉ', hex: '#78350f' },
  { name: 'NEGRO', hex: '#1e293b' },
]
const ROUNDS = 6
const PAPER = '#fbf1d9'
const IDEAS = [
  'Pinta lo que tú quieras: ¡un animal, un paisaje, un objeto, lo que se te ocurra!',
  'Prueba dibujando un animal.',
  'Ahora un paisaje: montañas, un bosque, el mar... ¡lo que imagines!',
  'Dibuja un objeto mágico.',
  'Pinta tu personaje o criatura favorita.',
  '¡Última hoja! Pinta lo que más te guste.',
]

export default function Painting({ active, onWin, onLose, onHud }) {
  const [round, setRound] = useState(1)
  const [selected, setSelected] = useState(PALETTE[0].hex)
  const [eraser, setEraser] = useState(false)
  const [reminder, setReminder] = useState(false)
  const finished = useRef(false)
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // El canvas vive dentro de un <Html> portal de drei; un useEffect normal a
  // veces corre antes de que el nodo final quede montado en el DOM visible,
  // dejando el pergamino transparente. El ref-callback garantiza pintarlo
  // justo cuando el nodo REAL queda disponible.
  const setCanvasRef = useCallback((el) => {
    canvasRef.current = el
    if (el) {
      const ctx = el.getContext('2d')
      ctx.globalAlpha = 1
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, el.width, el.height)
    }
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (e) => {
    if (!active || finished.current || reminder) return
    e.preventDefault()
    drawing.current = true
    last.current = getPos(e)
  }
  const moveDraw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const p = getPos(e)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 42
      ctx.globalAlpha = 1
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 22
      ctx.globalAlpha = 0.85
      ctx.strokeStyle = selected
    }
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const endDraw = () => { drawing.current = false }

  useEffect(() => {
    window.addEventListener('pointerup', endDraw)
    return () => window.removeEventListener('pointerup', endDraw)
  }, [])

  const onDone = () => {
    if (!active || finished.current || reminder) return
    sfx.chime()
    setReminder(true)
  }

  const onReminderContinue = () => {
    sfx.click()
    if (round >= ROUNDS) {
      finished.current = true
      sfx.win()
      setTimeout(() => onWin(), 400)
      return
    }
    setRound((r) => r + 1)
    setEraser(false)
    setReminder(false)
    clearCanvas()
  }

  usePillHud(onHud, [
    { text: `Pergamino ${round}/${ROUNDS}`, tone: 'gold' },
  ], IDEAS[round - 1], 'slate')

  return (
    <group>
      <ResponsiveCamera position={[0, 1.5, 6]} fov={46} target={[0, 0.5, 0]} />
      <BoardLight position={[0, 5, 4]} />

      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '26vh', paddingTop: '8vh' }}>
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            <div className="rounded-2xl border-[10px] shadow-2xl" style={{ borderColor: '#92400e', background: '#78350f' }}>
              <canvas
                ref={setCanvasRef}
                width={480}
                height={320}
                style={{ display: 'block', borderRadius: '4px', touchAction: 'none', cursor: eraser ? 'cell' : 'crosshair', width: 'min(70vw, 480px)', height: 'auto' }}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[90vw]">
              {PALETTE.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setSelected(c.hex); setEraser(false) }}
                  title={c.name}
                  className="w-9 h-9 rounded-full border-2 transition-transform"
                  style={{ background: c.hex, borderColor: selected === c.hex && !eraser ? '#fde68a' : '#1e293b', transform: selected === c.hex && !eraser ? 'scale(1.2)' : 'scale(1)' }}
                />
              ))}
              <button
                onClick={() => { setEraser(true) }}
                title="Borrador"
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-base bg-slate-200"
                style={{ borderColor: eraser ? '#fde68a' : '#1e293b', transform: eraser ? 'scale(1.2)' : 'scale(1)' }}
              >🧹</button>
              <button onClick={clearCanvas} className="rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-400 px-3 py-1.5 text-[11px] font-black text-white uppercase whitespace-nowrap">
                Limpiar
              </button>
              <button onClick={onDone} className="rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 px-4 py-1.5 text-[11px] font-black text-white uppercase whitespace-nowrap">
                ¡Listo!
              </button>
            </div>
          </div>
        </div>
      </Html>

      {reminder && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ background: 'rgba(2,6,23,0.55)' }}>
            <div className="bg-amber-50 border-4 border-amber-900 rounded-3xl px-6 py-5 max-w-sm text-center shadow-2xl">
              <div className="text-[11px] font-black uppercase tracking-wide text-amber-800 mb-1">🦝 Mapache Mapachoso</div>
              <p className="text-amber-950 font-bold text-sm leading-relaxed mb-4">
                ¡Qué obra de arte, Jazz! No olvides tomarte una captura de pantalla para mandársela a Marcus.
              </p>
              <button onClick={onReminderContinue} className="rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 px-6 py-2 text-xs font-black text-white uppercase">
                {round >= ROUNDS ? '¡Listo!' : 'Continuar'}
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
