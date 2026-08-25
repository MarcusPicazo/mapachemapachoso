// HUD del minijuego renderizado como HTML normal FUERA del Canvas 3D.
// Evita depender de la proyeccion de camara (drei <Html> anclado en 3D
// puede terminar fuera de pantalla segun el angulo de cada juego).
export default function GameHudOverlay({ hud }) {
  if (!hud) return null
  return (
    <>
      {hud.pills && hud.pills.length > 0 && (
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center px-2 w-full z-40">
          {hud.pills.map((p, i) => (
            <div key={i} className={`hud-pill hud-tone-${p.tone || 'slate'}`}>
              {p.text}
            </div>
          ))}
        </div>
      )}
      {hud.message && (
        <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 px-3 w-full max-w-xl flex justify-center z-40">
          <div className={`hud-message hud-tone-${hud.messageTone || 'gold'}`}>
            {hud.message}
          </div>
        </div>
      )}
    </>
  )
}
