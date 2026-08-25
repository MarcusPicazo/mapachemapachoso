let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function tone(freq, type = 'sine', duration = 0.15, vol = 0.12, delay = 0) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + delay)
    osc.connect(gain)
    gain.connect(c.destination)
    gain.gain.setValueAtTime(vol, c.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration)
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + duration)
  } catch (e) { /* audio not available */ }
}

export const sfx = {
  pop: () => tone(600, 'sine', 0.1),
  click: () => tone(420, 'triangle', 0.08),
  hit: () => tone(180, 'square', 0.15, 0.15),
  win: () => { tone(660, 'triangle', 0.15); tone(880, 'triangle', 0.25, 0.12, 0.1); tone(1100, 'triangle', 0.3, 0.12, 0.2) },
  lose: () => { tone(300, 'sawtooth', 0.2, 0.15); tone(180, 'sawtooth', 0.35, 0.15, 0.15) },
  place: () => tone(500, 'square', 0.08, 0.1),
  chime: () => tone(900, 'sine', 0.4, 0.1),
  bite: () => { tone(220, 'square', 0.08, 0.15); tone(340, 'square', 0.1, 0.12, 0.06) },
  swoosh: () => tone(150, 'sawtooth', 0.15, 0.06),
}
