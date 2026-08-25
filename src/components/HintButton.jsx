import { HINT_COST } from '../store/gameStore'

export default function HintButton({ onHint, grapesTotal = 0 }) {
  const affordable = grapesTotal >= HINT_COST
  return (
    <button className={`hint-sign${affordable ? '' : ' hint-sign-poor'}`} onClick={onHint} title="Pista (cuesta uvas)">
      <span className="hint-sign-glow" />
      <span className="hint-sign-badge">
        <span className="hint-sign-mark">?</span>
        <span className="hint-sign-spark hint-sign-spark-a">✦</span>
        <span className="hint-sign-spark hint-sign-spark-b">✦</span>
        <span className="hint-sign-cost">🍇{HINT_COST}</span>
      </span>
      <span className="hint-sign-post" />
      <span className="hint-sign-label">PISTA</span>
    </button>
  )
}
