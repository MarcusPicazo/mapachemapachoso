export function buildSet() {
  const set = []
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) set.push({ a, b })
  return set
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealDomino() {
  const deck = shuffle(buildSet())
  const player = deck.slice(0, 7)
  const ai = deck.slice(7, 14)
  const boneyard = deck.slice(14)
  return { player, ai, boneyard }
}

export function isPlayable(tile, leftEnd, rightEnd) {
  if (leftEnd === null) return true
  return tile.a === leftEnd || tile.b === leftEnd || tile.a === rightEnd || tile.b === rightEnd
}

// Devuelve { side, oriented } o null si no calza
export function findPlacement(tile, leftEnd, rightEnd) {
  if (leftEnd === null) return { side: 'right', oriented: { left: tile.a, right: tile.b } }
  if (tile.a === rightEnd) return { side: 'right', oriented: { left: tile.a, right: tile.b } }
  if (tile.b === rightEnd) return { side: 'right', oriented: { left: tile.b, right: tile.a } }
  if (tile.b === leftEnd) return { side: 'left', oriented: { left: tile.a, right: tile.b } }
  if (tile.a === leftEnd) return { side: 'left', oriented: { left: tile.b, right: tile.a } }
  return null
}

// Coloca una ficha en un lado especifico (izquierda o derecha) si calza ahi.
export function placementForSide(tile, side, ends) {
  if (ends.left === null) return { left: tile.a, right: tile.b }
  const target = side === 'left' ? ends.left : ends.right
  if (side === 'right') {
    if (tile.a === target) return { left: tile.a, right: tile.b }
    if (tile.b === target) return { left: tile.b, right: tile.a }
  } else {
    if (tile.b === target) return { left: tile.a, right: tile.b }
    if (tile.a === target) return { left: tile.b, right: tile.a }
  }
  return null
}

export function pipSum(hand) {
  return hand.reduce((s, t) => s + t.a + t.b, 0)
}
