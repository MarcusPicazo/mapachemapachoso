import { create } from 'zustand'

export const TOTAL_LEVELS = 20
export const HINT_COST = 3
export const SKIP_COST = 10

export const useGameStore = create((set, get) => ({
  currentLevel: 1,
  // prologue -> intro -> playing -> won -> grape -> (next intro) | lost -> intro
  phase: 'prologue',
  loseReason: '',
  grapesTotal: 0,
  grapesPending: 0, // grapes still floating, waiting to be dragged into the mouth
  muted: false,
  ending: false,
  showInstructions: false,
  showLevelMenu: false,
  // Nivel mas alto que la jugadora ya completo (desbloquea el menu de niveles).
  maxCompleted: 0,
  // Derrotas seguidas en Conecta 4 (nivel 2): tras varias, el juego baja la
  // dificultad discretamente para que no se sienta imposible.
  conecta4LossStreak: 0,
  // Se incrementa en cada (re)inicio de nivel para forzar el remontaje total
  // del minijuego (evita que quede estado de la jugada anterior).
  attempt: 0,

  beginAdventure: () => set({ phase: 'intro' }),

  startLevel: () => set((s) => ({ phase: 'playing', loseReason: '', attempt: s.attempt + 1 })),

  winLevel: () => set((s) => ({
    phase: 'won',
    maxCompleted: Math.max(s.maxCompleted, s.currentLevel),
    conecta4LossStreak: s.currentLevel === 2 ? 0 : s.conecta4LossStreak,
  })),

  // Boton temporal de testeo: fuerza la victoria del nivel actual sin jugarlo.
  // TODO: quitar este boton y esta accion antes de publicar el juego.
  skipLevel: () => set((s) => ({ phase: 'won', maxCompleted: Math.max(s.maxCompleted, s.currentLevel) })),

  proceedToGrapes: () => set({ phase: 'grape', grapesPending: 3 }),

  eatGrape: () => set((s) => {
    const remaining = s.grapesPending - 1
    return {
      grapesPending: remaining,
      grapesTotal: s.grapesTotal + 1,
    }
  }),

  finishGrapes: () => set((s) => {
    const next = s.currentLevel + 1
    if (next > TOTAL_LEVELS) {
      return { ending: true, phase: 'ending' }
    }
    return { currentLevel: next, phase: 'intro' }
  }),

  loseLevel: (reason) => set((s) => ({
    phase: 'lost',
    loseReason: reason || '¡Inténtalo de nuevo!',
    conecta4LossStreak: s.currentLevel === 2 ? s.conecta4LossStreak + 1 : s.conecta4LossStreak,
  })),

  // Reintentar el mismo nivel desde cero (usado tanto tras perder como tras
  // ganar, si la jugadora quiere repetirlo antes de avanzar).
  retryLevel: () => set((s) => ({ phase: 'intro', loseReason: '', attempt: s.attempt + 1 })),

  // Las pistas se pagan con uvas ya ganadas. Devuelve true si alcanzo y se
  // cobro el costo, false si no habia suficientes (el llamador no debe
  // disparar la pista en ese caso).
  spendHint: () => {
    const s = get()
    if (s.grapesTotal < HINT_COST) return false
    set({ grapesTotal: s.grapesTotal - HINT_COST })
    return true
  },

  // Saltarse el nivel actual (ganarlo automaticamente) a cambio de uvas.
  // Disponible en todos los niveles, no solo los que tienen pista.
  spendSkip: () => {
    const s = get()
    if (s.grapesTotal < SKIP_COST) return false
    set({ grapesTotal: s.grapesTotal - SKIP_COST, phase: 'won', maxCompleted: Math.max(s.maxCompleted, s.currentLevel) })
    return true
  },

  toggleMuted: () => set((s) => ({ muted: !s.muted })),

  toggleInstructions: () => set((s) => ({ showInstructions: !s.showInstructions })),
  closeInstructions: () => set({ showInstructions: false }),

  openLevelMenu: () => set({ showLevelMenu: true }),
  closeLevelMenu: () => set({ showLevelMenu: false }),
  goToLevel: (id) => set((s) => {
    if (id > s.maxCompleted + 1) return {}
    return { currentLevel: id, phase: 'intro', loseReason: '', showLevelMenu: false }
  }),

  restartGame: () => set({
    currentLevel: 1, phase: 'intro', loseReason: '', grapesTotal: 0,
    grapesPending: 0, ending: false, maxCompleted: 0, attempt: 0, conecta4LossStreak: 0,
  }),
}))
