const PROP_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#84cc16', '#06b6d4']

export function buildBoard() {
  const tiles = []
  let propIdx = 0
  for (let i = 0; i < 16; i++) {
    if (i === 0) tiles.push({ type: 'start', name: 'Salida' })
    else if (i === 4) tiles.push({ type: 'tax', name: 'Impuesto', amount: 150 })
    else if (i === 8) tiles.push({ type: 'chance', name: 'Suerte' })
    else if (i === 12) tiles.push({ type: 'rest', name: 'Descanso' })
    else {
      tiles.push({ type: 'property', name: `Propiedad ${propIdx + 1}`, price: 100 + (propIdx % 5) * 40, color: PROP_COLORS[propIdx % PROP_COLORS.length], owner: null })
      propIdx++
    }
  }
  return tiles
}
