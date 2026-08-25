export function emptyBoard(size) {
  return new Array(size).fill(0).map(() => new Array(size).fill(null))
}

export function scoreTerritory(grid, size) {
  const visited = new Array(size).fill(0).map(() => new Array(size).fill(false))
  let blackTerritory = 0, whiteTerritory = 0
  let blackStones = 0, whiteStones = 0
  for (const row of grid) for (const c of row) { if (c === 'B') blackStones++; else if (c === 'W') whiteStones++ }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null || visited[r][c]) continue
      const stack = [[r, c]]
      const region = []
      const borders = new Set()
      visited[r][c] = true
      while (stack.length) {
        const [cr, cc] = stack.pop()
        region.push([cr, cc])
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = cr + dr, nc = cc + dc
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
          if (grid[nr][nc] === null) {
            if (!visited[nr][nc]) { visited[nr][nc] = true; stack.push([nr, nc]) }
          } else {
            borders.add(grid[nr][nc])
          }
        }
      }
      if (borders.size === 1) {
        if (borders.has('B')) blackTerritory += region.length
        else whiteTerritory += region.length
      }
    }
  }
  return {
    black: blackStones + blackTerritory,
    white: whiteStones + whiteTerritory,
  }
}

// Evalua cada jugada posible simulando el tablero resultante con la funcion
// real de puntaje (territorio + piedras), en vez de solo contar vecinos --
// asi la IA piensa en el resultado real de la partida y no solo en jugadas
// locales, haciendola bastante mas fuerte.
export function pickAiMove(grid, size) {
  let best = null, bestScore = -Infinity
  const center = size / 2
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null) continue
      const trial = grid.map((row) => [...row])
      trial[r][c] = 'W'
      const { black, white } = scoreTerritory(trial, size)
      const centerBonus = -(Math.abs(r - center) + Math.abs(c - center)) * 0.12
      const score = (white - black) + centerBonus + Math.random() * 0.6
      if (score > bestScore) { bestScore = score; best = [r, c] }
    }
  }
  return best
}
