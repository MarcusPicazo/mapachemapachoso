export default function LevelTitleBanner({ level }) {
  return (
    <div className="level-title-banner" key={level.id}>
      <span className="level-title-sub">Nivel {level.id}</span>
      <span className="level-title-main">{level.title}</span>
    </div>
  )
}
