// 25 símbolos únicos (5 formas MUY distintas entre sí x 5 colores) usados por
// Memorama, Lotería y Mix Challenge. Se eligieron siluetas muy diferentes
// (estrella, corazón, luna, gema, gota) para que sean fáciles de diferenciar
// a simple vista, incluso en ángulo o con el mismo color.
const SHAPES = ['star', 'heart', 'moon', 'diamond', 'drop']
const COLORS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'gold', hex: '#f59e0b' },
  { name: 'purple', hex: '#a855f7' },
]

export const SYMBOLS = SHAPES.flatMap((shape) => COLORS.map((c) => ({ shape, color: c.hex, key: `${shape}-${c.name}` })))

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SymbolMesh({ symbol, scale = 1 }) {
  const c = symbol.color
  const mat = <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} roughness={0.3} metalness={0.15} />

  switch (symbol.shape) {
    case 'star':
      return (
        <group scale={scale}>
          {new Array(5).fill(0).map((_, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0]} rotation={[0, 0, a + Math.PI / 2]}>
                <coneGeometry args={[0.13, 0.34, 4]} />
                {mat}
              </mesh>
            )
          })}
          <mesh><octahedronGeometry args={[0.15, 0]} />{mat}</mesh>
        </group>
      )
    case 'heart':
      return (
        <group scale={scale} rotation={[0, 0, Math.PI]}>
          <mesh position={[-0.13, 0.09, 0]}><sphereGeometry args={[0.17, 14, 14]} />{mat}</mesh>
          <mesh position={[0.13, 0.09, 0]}><sphereGeometry args={[0.17, 14, 14]} />{mat}</mesh>
          <mesh position={[0, -0.13, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.26, 0.4, 4]} />{mat}</mesh>
        </group>
      )
    case 'moon':
      return (
        <group scale={scale}>
          <mesh><sphereGeometry args={[0.27, 20, 20]} />{mat}</mesh>
          <mesh position={[0.16, 0, 0.17]}><sphereGeometry args={[0.25, 20, 20]} /><meshStandardMaterial color="#0f172a" /></mesh>
        </group>
      )
    case 'diamond':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.09, 0]}><coneGeometry args={[0.23, 0.26, 6]} />{mat}</mesh>
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.23, 0.17, 6]} />{mat}</mesh>
        </group>
      )
    case 'drop':
      return (
        <group scale={scale}>
          <mesh position={[0, -0.07, 0]}><sphereGeometry args={[0.2, 16, 16]} />{mat}</mesh>
          <mesh position={[0, 0.15, 0]}><coneGeometry args={[0.16, 0.3, 12]} />{mat}</mesh>
        </group>
      )
    default:
      return null
  }
}
