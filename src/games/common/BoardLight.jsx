// Luz frontal fuerte dedicada al tablero de cada minijuego, independiente
// de la ambientacion tenue del bioma de fondo, para garantizar legibilidad.
// decay=0 evita la atenuacion fisica por distancia (r150+ usa luces "reales"
// que requeririan intensidades de cientos/miles para verse a esta escala).
export default function BoardLight({ position = [0, 8, 5], intensity = 2.2, color = '#ffffff' }) {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={position} intensity={intensity} color={color} />
      <directionalLight position={[-position[0] - 2, position[1] * 0.6, position[2] + 6]} intensity={intensity * 0.5} color={color} />
      <pointLight position={[0, 3, 6]} intensity={1.4} decay={0} color={color} />
    </>
  )
}
