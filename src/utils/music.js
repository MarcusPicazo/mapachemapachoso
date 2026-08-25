// Musica de fondo (archivos reales via <audio>), separada del sistema de sfx
// sintetizados en audio.js -- ambos canales suenan a la vez sin pisarse.
let current = null
let currentSrc = null
const fadeTimers = new Set()

function clearFade(id) { clearInterval(id); fadeTimers.delete(id) }

function fadeVolume(audio, from, to, durationMs, onDone) {
  const steps = 24
  const stepMs = Math.max(16, durationMs / steps)
  let i = 0
  audio.volume = from
  const id = setInterval(() => {
    i++
    const v = from + (to - from) * (i / steps)
    audio.volume = Math.max(0, Math.min(1, v))
    if (i >= steps) { clearFade(id); if (onDone) onDone() }
  }, stepMs)
  fadeTimers.add(id)
  return id
}

export function playBackgroundMusic(src, { volume = 0.32, loop = true, fadeMs = 1800 } = {}) {
  if (currentSrc === src && current) return current
  const prev = current
  const audio = new Audio(src)
  audio.loop = loop
  audio.volume = 0
  audio.play().catch(() => {})
  fadeVolume(audio, 0, volume, fadeMs)
  if (prev) fadeVolume(prev, prev.volume, 0, fadeMs, () => prev.pause())
  current = audio
  currentSrc = src
  return audio
}

export function crossfadeTo(src, { volume = 0.4, loop = true, duration = 1800 } = {}) {
  return playBackgroundMusic(src, { volume, loop, fadeMs: duration })
}

export function stopBackgroundMusic(fadeMs = 800) {
  if (!current) return
  const prev = current
  fadeVolume(prev, prev.volume, 0, fadeMs, () => prev.pause())
  current = null
  currentSrc = null
}
