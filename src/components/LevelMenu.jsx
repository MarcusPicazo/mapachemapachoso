import { LEVELS } from '../data/levels'

const GAME_ICON = {
  memorama: '🧠', conecta4: '🔴', batallaNaval: '🚢', domino: '🀄', loteria: '🎴',
  uno: '🃏', serpientes: '🐍', scrabble: '🔤', pictionary: '🎨', twister: '🌀',
  clue: '🔍', othello: '⚫', mastermind: '🎯', jenga: '🧱', go: '⚪',
  archery: '🏹', monopoly: '🏠', risk: '⚔️', loteriaAvanzada: '🎴', mixChallenge: '✨',
}

export default function LevelMenu({ maxCompleted, currentLevel, onSelect, onClose }) {
  const pct = Math.round((maxCompleted / LEVELS.length) * 100)
  return (
    <div className="level-menu-overlay" onClick={onClose}>
      <div className="level-menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="level-menu-header">
          <h2>🗺️ Mapa de Aventuras</h2>
          <button className="level-menu-close" onClick={onClose}>✕</button>
        </div>
        <div className="level-menu-progress-row">
          <div className="level-menu-progress-track">
            <div className="level-menu-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="level-menu-progress-label">{maxCompleted}/{LEVELS.length}</span>
        </div>
        <div className="level-menu-grid">
          {LEVELS.map((lvl) => {
            const unlocked = lvl.id <= maxCompleted + 1
            const completed = lvl.id <= maxCompleted
            const isCurrent = lvl.id === currentLevel
            return (
              <button
                key={lvl.id}
                className={`level-menu-item ${unlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''} ${completed ? 'completed' : ''}`}
                disabled={!unlocked}
                onClick={() => unlocked && onSelect(lvl.id)}
              >
                {completed && <span className="level-menu-badge">✓</span>}
                {isCurrent && <span className="level-menu-here">¡AQUÍ!</span>}
                <span className="level-menu-icon">{unlocked ? GAME_ICON[lvl.game] || '🎮' : '🔒'}</span>
                <span className="level-menu-num">{lvl.id}</span>
                <span className="level-menu-name">{unlocked ? lvl.title : 'Bloqueado'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
