const WIN_LINES = [
  '¡Lo logramos, Jazz! Sabía que tú podías.',
  '¡Excelente! Un obstáculo menos entre nosotros y 2026.',
  '¡Increíble, Jazz! Tu mente brilla más que cualquier runa.',
  '¡Perfecto! Vamos un paso más cerca de casa.',
  '¡Así se hace! Contigo esto es pan comido.',
]

const PROLOGUE_MESSAGE = `¡Jazz! Escúchame con atención porque esto es importante. ¿Recuerdas que hace unos días caímos en un agujero negro? Pues bien, ese agujero nos escupió aquí: ¡en pleno reino medieval, cientos de años en el pasado!

Encontré unos pergaminos mágicos que dicen que, si superamos 20 desafíos repartidos por 5 reinos distintos (una mazmorra, un castillo, una cueva de dragón, un bosque encantado y una torre con un portal), podremos reunir la magia suficiente para abrir un portal y regresar a casa, a nuestra línea de tiempo.

Cada desafío es un juego distinto: memoria, estrategia, adivinanzas, puntería y muchos más. Cuando ganes uno, ¡te vas a ganar un racimo de uvas mágicas! Arrástralas hasta mi boca para dármelas de comer, y esas uvas se guardan para ti.

¿Y para qué sirven las uvas? Cada 3 uvas te alcanzan para pedirme una pista cuando te atores en un desafío, ¡y cada 10 uvas te alcanzan para saltarte un desafío completo, por si alguno se pone muy difícil! Así que guárdalas bien. Si en algún momento se te acaban y necesitas más, puedes abrir el mapa de niveles (el botón 🗺️ arriba) y rejugar cualquier desafío que ya hayas superado antes: ¡vuelve a ganarlo y ganas más uvas!

Sé que son muchas misiones, pero confío en ti más que en nadie. ¿Lista para esta aventura, Jazz?`

export default function DialogueBubble({ phase, level, loseReason, onStart, onClaimGrapes, onRetry, onBeginAdventure }) {
  if (phase === 'prologue') {
    const paragraphs = PROLOGUE_MESSAGE.split(/\n+/)
    return (
      <div className="dialog-bubble">
        <div className="name-badge">Mapache Mapachoso</div>
        <div className="dialog-bubble-scroll max-h-[42vh] overflow-y-auto pr-1">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm italic mb-2 text-amber-900 leading-relaxed font-bold">&ldquo;{p}&rdquo;</p>
          ))}
        </div>
        <button className="btn-action w-auto px-10 py-3" onClick={onBeginAdventure}>¡Vamos, Jazz!</button>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="dialog-bubble">
        <div className="name-badge">Mapache Mapachoso</div>
        <div className="dialog-bubble-scroll">
          <p className="text-sm italic mb-2 text-amber-900 leading-relaxed font-bold">&ldquo;{level.dialogue}&rdquo;</p>
          <p className="text-xs font-bold mb-1 text-amber-700 uppercase tracking-wide">{level.subtitle}</p>
        </div>
        <button className="btn-action w-auto px-10 py-3" onClick={onStart}>¡Empezar!</button>
      </div>
    )
  }

  if (phase === 'won') {
    const line = WIN_LINES[level.id % WIN_LINES.length]
    return (
      <div className="dialog-bubble">
        <div className="name-badge">Mapache Mapachoso</div>
        <div className="dialog-bubble-scroll">
          <p className="text-base italic mb-3 text-amber-900 leading-relaxed font-bold">&ldquo;{line}&rdquo;</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button className="btn-action w-auto px-8 py-3" onClick={onClaimGrapes}>🍇 Recibir uvas</button>
          <button className="btn-action secondary w-auto px-6 py-3" onClick={onRetry}>🔄 Reintentar</button>
        </div>
      </div>
    )
  }

  if (phase === 'lost') {
    return (
      <div className="dialog-bubble">
        <div className="name-badge">Mapache Mapachoso</div>
        <div className="dialog-bubble-scroll">
          <p className="text-base italic mb-3 text-red-800 leading-relaxed font-bold">&ldquo;{loseReason}&rdquo;</p>
        </div>
        <button className="btn-action w-auto px-10 py-3" onClick={onRetry}>🔄 Reintentar</button>
      </div>
    )
  }

  return null
}
