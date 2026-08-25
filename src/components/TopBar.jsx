import { TOTAL_LEVELS } from '../store/gameStore'

export default function TopBar({ level, grapesTotal, showSkip, onSkip, onOpenMenu, onToggleInstructions }) {
  const pct = Math.round(((level.id - 1) / TOTAL_LEVELS) * 100)
  return (
    <div className="top-bar">
      <button className="hud-icon-btn levels" onClick={onOpenMenu} title="Mapa de niveles">🗺️</button>
      <div className="level-chip">
        <span>Nivel {level.id}/{TOTAL_LEVELS}</span>
      </div>
      <button className="hud-icon-btn instructions" onClick={onToggleInstructions} title="¿Cómo se juega?">❓</button>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="grape-counter">
        <span>🍇 {grapesTotal}</span>
      </div>
      {showSkip && (
        <button className="skip-test-btn" onClick={onSkip} title="Botón temporal de testeo">
          ⏭ Saltar (test)
        </button>
      )}
    </div>
  )
}
