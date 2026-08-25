export const COLS = 7
export const ROWS = 6

export function emptyGrid() {
  return new Array(ROWS).fill(0).map(() => new Array(COLS).fill(null))
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row])
}

export function heightsOf(grid) {
  return new Array(COLS).fill(0).map((_, c) => grid.reduce((n, row) => n + (row[c] ? 1 : 0), 0))
}

export function dropRow(grid, col) {
  for (let r = 0; r < ROWS; r++) if (!grid[r][col]) return r
  return -1
}

function windows(grid) {
  const list = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) list.push([grid[r][c], grid[r][c + 1], grid[r][c + 2], grid[r][c + 3]])
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) list.push([grid[r][c], grid[r + 1][c], grid[r + 2][c], grid[r + 3][c]])
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) list.push([grid[r][c], grid[r + 1][c + 1], grid[r + 2][c + 2], grid[r + 3][c + 3]])
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) list.push([grid[r][c], grid[r - 1][c + 1], grid[r - 2][c + 2], grid[r - 3][c + 3]])
  }
  return list
}

export function checkWinner(grid) {
  for (const w of windows(grid)) {
    if (w[0] && w[0] === w[1] && w[1] === w[2] && w[2] === w[3]) return w[0]
  }
  return null
}

export function isFull(grid) {
  return grid[ROWS - 1].every((cell) => cell !== null)
}

function scoreWindow(w, letter) {
  const opp = letter === 'E' ? 'P' : 'E'
  const own = w.filter((x) => x === letter).length
  const oppN = w.filter((x) => x === opp).length
  const empty = w.filter((x) => x === null).length
  if (own > 0 && oppN > 0) return 0
  if (own === 4) return 100000
  if (own === 3 && empty === 1) return 60
  if (own === 2 && empty === 2) return 8
  if (oppN === 4) return -100000
  if (oppN === 3 && empty === 1) return -90
  if (oppN === 2 && empty === 2) return -8
  return 0
}

export const connect4Cfg = {
  getMoves: (state) => {
    const h = heightsOf(state.grid)
    return h.map((v, c) => (v < ROWS ? c : -1)).filter((c) => c >= 0)
  },
  applyMove: (state, move, maximizing) => {
    const grid = cloneGrid(state.grid)
    const row = dropRow(grid, move)
    grid[row][move] = maximizing ? 'E' : 'P'
    return { grid }
  },
  isTerminal: (state) => !!checkWinner(state.grid) || isFull(state.grid),
  evaluate: (state) => {
    const w = checkWinner(state.grid)
    if (w === 'E') return 100000
    if (w === 'P') return -100000
    let score = 0
    for (const win of windows(state.grid)) score += scoreWindow(win, 'E')
    for (let r = 0; r < ROWS; r++) if (state.grid[r][3] === 'E') score += 4
    return score
  },
}
