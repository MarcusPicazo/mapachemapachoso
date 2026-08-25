# Mapache Mapachoso: La Vuelta a 2026

Aventura web en 3D (Three.js / React Three Fiber) donde Mapache Mapachoso —
atrapado en la Edad Media desde su viaje anterior por un agujero negro— debe
superar 20 minijuegos de mesa para regresar a su línea temporal en 2026,
comunicándose con Jazz en cada paso.

## Cómo jugarlo

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente `http://localhost:5173`).

## Cómo funciona

- El mapache se mantiene en 2D (SVG animado) tal como en el diseño original;
  todo lo demás —castillos, mazmorras, cuevas, bosque encantado y la torre
  del portal— es 3D real con Three.js.
- Cada uno de los 20 niveles es un minijuego de mesa jugable con reglas
  reales (Conecta 4, UNO, Dominó, Batalla Naval, Othello/Reversi con
  minimax, Mastermind, Go mini con territorio, etc.) y una IA rival.
- Al ganar un nivel aparecen uvas que se arrastran a la boca del mapache
  para avanzar al siguiente.
- El nivel 20 combina tres retos relámpago (memoria, conecta 3 y batalla
  naval) como cierre de la aventura.

## Estructura

- `src/games/` — un archivo por minijuego, más `src/games/common/` con la
  lógica reutilizable (IA minimax, mazos, tableros).
- `src/components/` — el personaje 2D, los biomas 3D, HUD, diálogos y el
  sistema de recompensa de uvas.
- `src/data/levels.js` — historia, diálogos y el mensaje final.
