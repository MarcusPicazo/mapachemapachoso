export const COLORS = ['red', 'blue', 'green', 'yellow']
export const COLOR_HEX = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', wild: '#1e293b' }

export function buildDeck() {
  const deck = []
  let uid = 0
  for (const color of COLORS) {
    deck.push({ id: uid++, color, type: 'number', value: '0' })
    for (let n = 1; n <= 9; n++) {
      deck.push({ id: uid++, color, type: 'number', value: String(n) })
      deck.push({ id: uid++, color, type: 'number', value: String(n) })
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uid++, color, type: 'skip', value: 'SKIP' })
      deck.push({ id: uid++, color, type: 'reverse', value: 'REV' })
      deck.push({ id: uid++, color, type: 'draw2', value: '+2' })
    }
  }
  for (let i = 0; i < 4; i++) deck.push({ id: uid++, color: 'wild', type: 'wild', value: 'WILD' })
  for (let i = 0; i < 4; i++) deck.push({ id: uid++, color: 'wild', type: 'wild4', value: '+4' })
  return deck
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function isPlayable(card, topCard, currentColor) {
  if (card.color === 'wild') return true
  if (card.color === currentColor) return true
  if (topCard && card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true
  if (topCard && card.type !== 'number' && card.type === topCard.type) return true
  return false
}

export function dealUno() {
  const deck = shuffle(buildDeck())
  const player = deck.slice(0, 7)
  const ai = deck.slice(7, 14)
  let rest = deck.slice(14)
  let discard = []
  let firstIdx = rest.findIndex((c) => c.type === 'number')
  discard.push(rest[firstIdx])
  rest = rest.filter((_, i) => i !== firstIdx)
  return { player, ai, drawPile: rest, discard }
}
