export const SIZE = 8
export const SHIP_SIZES = [4, 3, 3, 2, 2]

export function emptyBoard() {
  return new Array(SIZE).fill(0).map(() => new Array(SIZE).fill(null))
}

function tryPlaceFleet() {
  const grid = emptyBoard()
  let shipId = 0
  for (const len of SHIP_SIZES) {
    let placed = false
    let attempts = 0
    while (!placed && attempts < 300) {
      attempts++
      const horizontal = Math.random() > 0.5
      const r = Math.floor(Math.random() * SIZE)
      const c = Math.floor(Math.random() * SIZE)
      const cells = []
      let ok = true
      for (let i = 0; i < len; i++) {
        const rr = horizontal ? r : r + i
        const cc = horizontal ? c + i : c
        if (rr >= SIZE || cc >= SIZE || grid[rr][cc] !== null) { ok = false; break }
        cells.push([rr, cc])
      }
      if (ok) {
        for (const [rr, cc] of cells) grid[rr][cc] = shipId
        placed = true
      }
    }
    shipId++
  }
  return grid
}

function fleetComplete(grid) {
  const seen = new Set()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] !== null) seen.add(grid[r][c])
  return seen.size === SHIP_SIZES.length
}

// Retries whole-grid generation until every ship placed — guarantees the
// enemy (and player-random) fleet always has all 5 ships to sink/be sunk.
export function placeFleet() {
  for (let tries = 0; tries < 50; tries++) {
    const grid = tryPlaceFleet()
    if (fleetComplete(grid)) return grid
  }
  return tryPlaceFleet()
}

export function canPlaceShip(grid, r, c, len, horizontal) {
  for (let i = 0; i < len; i++) {
    const rr = horizontal ? r : r + i
    const cc = horizontal ? c + i : c
    if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || grid[rr][cc] !== null) return false
  }
  return true
}

export function placeShipOnGrid(grid, r, c, len, horizontal, shipId) {
  const next = grid.map((row) => [...row])
  for (let i = 0; i < len; i++) {
    const rr = horizontal ? r : r + i
    const cc = horizontal ? c + i : c
    next[rr][cc] = shipId
  }
  return next
}

export function removeShipFromGrid(grid, shipId) {
  return grid.map((row) => row.map((v) => (v === shipId ? null : v)))
}

export function deriveFleetInfo(grid) {
  return SHIP_SIZES.map((len, id) => {
    const cells = []
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === id) cells.push([r, c])
    cells.sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const [r0, c0] = cells[0]
    const horizontal = cells.every(([r]) => r === r0)
    return { id, len, placed: true, r: r0, c: c0, horizontal }
  })
}

export function makeAI() {
  const targetQueue = []
  const shotsTaken = new Set()

  function pickShot(hitsGrid) {
    while (targetQueue.length) {
      const [r, c] = targetQueue.shift()
      const key = `${r},${c}`
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && !shotsTaken.has(key)) {
        shotsTaken.add(key)
        return [r, c]
      }
    }
    let r, c, key
    do {
      r = Math.floor(Math.random() * SIZE)
      c = Math.floor(Math.random() * SIZE)
      key = `${r},${c}`
    } while (shotsTaken.has(key))
    shotsTaken.add(key)
    return [r, c]
  }

  function reportResult(r, c, hit) {
    if (hit) {
      targetQueue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1])
    }
  }

  return { pickShot, reportResult }
}

export function shipSunk(grid, hits, shipId) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === shipId && !hits[r][c]) return false
    }
  }
  return true
}

export function allSunk(grid, hits) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== null && !hits[r][c]) return false
    }
  }
  return true
}
