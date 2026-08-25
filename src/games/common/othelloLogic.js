const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]

export function initialGrid(size) {
  const g = new Array(size).fill(0).map(() => new Array(size).fill(null))
  const c = size / 2
  g[c - 1][c - 1] = 'W'; g[c - 1][c] = 'B'
  g[c][c - 1] = 'B'; g[c][c] = 'W'
  return g
}

function flipsFor(grid, r, c, player, size) {
  const opp = player === 'B' ? 'W' : 'B'
  if (grid[r][c] !== null) return []
  let all = []
  for (const [dr, dc] of DIRS) {
    let rr = r + dr, cc = c + dc
    const line = []
    while (rr >= 0 && rr < size && cc >= 0 && cc < size && grid[rr][cc] === opp) {
      line.push([rr, cc]); rr += dr; cc += dc
    }
    if (line.length > 0 && rr >= 0 && rr < size && cc >= 0 && cc < size && grid[rr][cc] === player) {
      all = all.concat(line)
    }
  }
  return all
}

export function validMoves(grid, player, size) {
  const moves = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null) continue
      if (flipsFor(grid, r, c, player, size).length > 0) moves.push([r, c])
    }
  }
  return moves
}

export function applyMove(grid, move, player, size) {
  const [r, c] = move
  const flips = flipsFor(grid, r, c, player, size)
  const ng = grid.map((row) => [...row])
  ng[r][c] = player
  for (const [fr, fc] of flips) ng[fr][fc] = player
  return ng
}

export function countPieces(grid) {
  let B = 0, W = 0
  for (const row of grid) for (const cell of row) { if (cell === 'B') B++; else if (cell === 'W') W++ }
  return { B, W }
}

export function makeOthelloCfg(size) {
  return {
    getMoves: (state) => validMoves(state.grid, state.turn === 'ai' ? 'W' : 'B', size).map((m) => ({ move: m })),
    applyMove: (state, moveWrap, maximizing) => {
      const player = maximizing ? 'W' : 'B'
      const ng = applyMove(state.grid, moveWrap.move, player, size)
      return { grid: ng, turn: maximizing ? 'player' : 'ai' }
    },
    isTerminal: (state) => validMoves(state.grid, 'B', size).length === 0 && validMoves(state.grid, 'W', size).length === 0,
    evaluate: (state) => {
      const { B, W } = countPieces(state.grid)
      const corners = [[0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1]]
      let cornerScore = 0
      for (const [r, c] of corners) { if (state.grid[r][c] === 'W') cornerScore += 5; else if (state.grid[r][c] === 'B') cornerScore -= 5 }
      return (W - B) + cornerScore
    },
  }
}
