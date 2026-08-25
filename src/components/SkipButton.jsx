import { SKIP_COST } from '../store/gameStore'

export default function SkipButton({ onSkip, grapesTotal = 0 }) {
  const affordable = grapesTotal >= SKIP_COST
  return (
    <button className={`skip-sign${affordable ? '' : ' skip-sign-poor'}`} onClick={onSkip} title="Saltar nivel (cuesta uvas)">
      <span className="skip-sign-badge">
        <span className="skip-sign-mark">⏭</span>
        <span className="skip-sign-cost">🍇{SKIP_COST}</span>
      </span>
      <span className="skip-sign-label">SALTAR</span>
    </button>
  )
}
