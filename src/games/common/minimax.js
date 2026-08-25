// Minimax genérico con poda alfa-beta, reutilizado por Conecta4, Othello, Reversi, Go mini.
// cfg: { getMoves(state, maximizing), applyMove(state, move, maximizing), isTerminal(state), evaluate(state) }
export function minimax(state, depth, maximizing, cfg, alpha = -Infinity, beta = Infinity) {
  if (depth === 0 || cfg.isTerminal(state)) {
    return { score: cfg.evaluate(state), move: null }
  }
  const moves = cfg.getMoves(state, maximizing)
  if (moves.length === 0) {
    return { score: cfg.evaluate(state), move: null }
  }
  let bestMove = moves[0]
  if (maximizing) {
    let best = -Infinity
    for (const move of moves) {
      const next = cfg.applyMove(state, move, maximizing)
      const { score } = minimax(next, depth - 1, false, cfg, alpha, beta)
      if (score > best) { best = score; bestMove = move }
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return { score: best, move: bestMove }
  } else {
    let best = Infinity
    for (const move of moves) {
      const next = cfg.applyMove(state, move, maximizing)
      const { score } = minimax(next, depth - 1, true, cfg, alpha, beta)
      if (score < best) { best = score; bestMove = move }
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return { score: best, move: bestMove }
  }
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
