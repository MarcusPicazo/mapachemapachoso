import * as THREE from 'three'

const WORDS = [
  'CASA', 'ARBOL', 'SOL', 'PEZ', 'ESTRELLA', 'LUNA', 'BARCO', 'CORAZON', 'NUBE', 'FLOR',
  'MANZANA', 'PLATANO', 'SOMBRERO', 'PARAGUAS', 'GUITARRA', 'TAMBOR', 'LLAVE', 'TIJERAS', 'RELOJ', 'TAZA',
  'SILLA', 'MESA', 'PUERTA', 'VENTANA', 'CASTILLO', 'CORONA', 'ESPADA', 'ESCUDO', 'PATO', 'GATO',
  'PERRO', 'MARIPOSA', 'ABEJA', 'ARANA', 'CANGREJO', 'TORTUGA', 'RATON', 'CONEJO', 'HELADO', 'PASTEL',
  'OJO', 'LAPIZ', 'BOTA', 'ANILLO', 'DIAMANTE', 'CAMPANA', 'ZANAHORIA', 'CEREZA', 'PINA', 'BUHO',
]

function starShape2D(outerR = 0.65, innerR = 0.26, points = 5) {
  const shape = new THREE.Shape()
  const step = Math.PI / points
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = i * step - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

function moonShape2D(r = 0.68, holeR = 0.6, offsetX = 0.4) {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, r, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(offsetX, 0, holeR, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  return shape
}

export const LABELS = {
  ARANA: 'ARAÑA', PINA: 'PIÑA', CORAZON: 'CORAZÓN', ARBOL: 'ÁRBOL', RATON: 'RATÓN', BUHO: 'BÚHO',
}

export function displayLabel(word) {
  return LABELS[word] || word
}

export function pickRound(exclude = []) {
  const pool = WORDS.filter((w) => !exclude.includes(w))
  const source = pool.length > 0 ? pool : WORDS
  const word = source[Math.floor(Math.random() * source.length)]
  const distractors = shuffle(WORDS.filter((w) => w !== word)).slice(0, 3)
  return { word, options: shuffle([word, ...distractors]) }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function DrawingShape({ word }) {
  switch (word) {
    case 'CASA':
      return (
        <group>
          <mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[1.2, 1, 1.2]} /><meshStandardMaterial color="#fde68a" roughness={0.7} /></mesh>
          <mesh position={[0, 0.6, 0]} castShadow><coneGeometry args={[1, 0.8, 4]} /><meshStandardMaterial color="#dc2626" roughness={0.6} /></mesh>
          <mesh position={[0, -0.35, 0.61]}><boxGeometry args={[0.32, 0.55, 0.03]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh position={[0, -0.15, 0.63]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#fbbf24" /></mesh>
          <mesh position={[-0.4, 0.05, 0.61]}><boxGeometry args={[0.3, 0.3, 0.03]} /><meshStandardMaterial color="#38bdf8" /></mesh>
          <mesh position={[0.4, 0.05, 0.61]}><boxGeometry args={[0.3, 0.3, 0.03]} /><meshStandardMaterial color="#38bdf8" /></mesh>
          <mesh position={[0.35, 0.95, -0.15]}><boxGeometry args={[0.16, 0.45, 0.16]} /><meshStandardMaterial color="#57534e" roughness={0.8} /></mesh>
        </group>
      )
    case 'ARBOL':
      return (
        <group>
          <mesh position={[0, -0.65, 0]}><cylinderGeometry args={[0.16, 0.26, 1.1, 8]} /><meshStandardMaterial color="#78350f" roughness={0.85} /></mesh>
          <mesh position={[0, 0.35, 0]}><sphereGeometry args={[0.72, 16, 16]} /><meshStandardMaterial color="#16a34a" roughness={0.75} /></mesh>
          <mesh position={[-0.45, 0.12, 0.22]}><sphereGeometry args={[0.48, 14, 14]} /><meshStandardMaterial color="#15803d" roughness={0.75} /></mesh>
          <mesh position={[0.45, 0.12, -0.15]}><sphereGeometry args={[0.48, 14, 14]} /><meshStandardMaterial color="#22c55e" roughness={0.75} /></mesh>
          <mesh position={[0, 0.78, 0]}><sphereGeometry args={[0.42, 14, 14]} /><meshStandardMaterial color="#22c55e" roughness={0.75} /></mesh>
        </group>
      )
    case 'SOL':
      return (
        <group>
          <mesh><sphereGeometry args={[0.7, 16, 16]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} /></mesh>
          {new Array(8).fill(0).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <mesh key={i} position={[Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0]} rotation={[0, 0, a]}><coneGeometry args={[0.15, 0.4, 6]} /><meshStandardMaterial color="#facc15" /></mesh>
          })}
        </group>
      )
    case 'PEZ':
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh><coneGeometry args={[0.6, 1.3, 12]} /><meshStandardMaterial color="#38bdf8" roughness={0.35} /></mesh>
          <mesh position={[0, 0.9, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.4, 0.5, 3]} /><meshStandardMaterial color="#0284c7" /></mesh>
          <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.22, 0.34, 3]} /><meshStandardMaterial color="#0284c7" /></mesh>
          <mesh position={[0.15, -0.35, 0.1]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color="#0f172a" /></mesh>
          <mesh position={[0.18, -0.36, 0.11]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.5} /></mesh>
        </group>
      )
    case 'ESTRELLA':
      return (
        <group rotation={[0, 0, 0]}>
          <mesh castShadow position={[0, 0, -0.11]}>
            <extrudeGeometry args={[starShape2D(), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 2 }]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.45} roughness={0.35} metalness={0.1} />
          </mesh>
        </group>
      )
    case 'LUNA':
      return (
        <group rotation={[0, 0, 0]}>
          <mesh castShadow position={[0, 0, -0.1]}>
            <extrudeGeometry args={[moonShape2D(), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 2 }]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#cbd5e1" emissiveIntensity={0.25} roughness={0.4} />
          </mesh>
        </group>
      )
    case 'BARCO':
      return (
        <group>
          <mesh position={[0, -0.4, 0]} castShadow><boxGeometry args={[1.6, 0.35, 0.7]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          <mesh position={[0.62, -0.42, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.24, 0.3, 4]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          <mesh position={[0.35, -0.38, 0.36]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.08, 1, 0.08]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh position={[0.35, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.5, 0.9, 3]} /><meshStandardMaterial color="#f8fafc" roughness={0.5} /></mesh>
          <mesh position={[0.04, 0.76, 0.16]}><boxGeometry args={[0.28, 0.18, 0.02]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
      )
    case 'CORAZON':
      return (
        <group rotation={[0, 0, Math.PI]}>
          <mesh position={[-0.35, 0.25, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#ef4444" /></mesh>
          <mesh position={[0.35, 0.25, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#ef4444" /></mesh>
          <mesh position={[0, -0.35, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.75, 1.1, 4]} /><meshStandardMaterial color="#ef4444" /></mesh>
        </group>
      )
    case 'NUBE':
      return (
        <group>
          <mesh position={[-0.5, 0, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
          <mesh position={[0.5, 0, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
          <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.6, 16, 16]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
        </group>
      )
    case 'FLOR':
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.05, 0.06, 0.9, 8]} /><meshStandardMaterial color="#16a34a" roughness={0.7} /></mesh>
          {new Array(6).fill(0).map((_, i) => {
            const a = (i / 6) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0]} rotation={[0, 0, a]} scale={[0.55, 1, 0.6]}>
                <sphereGeometry args={[0.32, 12, 12]} />
                <meshStandardMaterial color="#f472b6" roughness={0.5} />
              </mesh>
            )
          })}
          <mesh position={[0, 0, 0.06]}><sphereGeometry args={[0.26, 14, 14]} /><meshStandardMaterial color="#facc15" roughness={0.4} /></mesh>
        </group>
      )
    case 'MANZANA':
      return (
        <group>
          <mesh scale={[1, 0.95, 1]}><sphereGeometry args={[0.62, 16, 16]} /><meshStandardMaterial color="#dc2626" roughness={0.4} /></mesh>
          <mesh position={[0.03, 0.62, 0]} rotation={[0, 0, 0.2]}><cylinderGeometry args={[0.035, 0.05, 0.32, 8]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          <mesh position={[0.22, 0.7, 0.05]} rotation={[0.3, 0.4, 0.6]} scale={[1, 0.5, 1.4]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#16a34a" roughness={0.6} /></mesh>
        </group>
      )
    case 'PLATANO':
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh><torusGeometry args={[0.55, 0.17, 10, 20, Math.PI * 0.9]} /><meshStandardMaterial color="#facc15" roughness={0.5} /></mesh>
          <mesh position={[0.55, 0, 0]}><coneGeometry args={[0.08, 0.18, 8]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
        </group>
      )
    case 'SOMBRERO':
      return (
        <group>
          <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.85, 0.85, 0.06, 20]} /><meshStandardMaterial color="#a16207" roughness={0.7} /></mesh>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.4, 0.45, 0.55, 16]} /><meshStandardMaterial color="#ca8a04" roughness={0.7} /></mesh>
          <mesh position={[0, 0.02, 0]}><torusGeometry args={[0.42, 0.05, 8, 20]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
        </group>
      )
    case 'PARAGUAS':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}><coneGeometry args={[0.75, 0.5, 10, 1, true]} /><meshStandardMaterial color="#dc2626" roughness={0.5} /></mesh>
          <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.03, 0.03, 1.1, 8]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh position={[0.12, -0.85, 0]} rotation={[0, 0, -1]}><torusGeometry args={[0.13, 0.03, 8, 12, Math.PI]} /><meshStandardMaterial color="#451a03" /></mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.7, 0.08, Math.sin(a) * 0.7]}><boxGeometry args={[0.03, 0.03, 0.15]} /><meshStandardMaterial color="#991b1b" /></mesh> })}
        </group>
      )
    case 'GUITARRA':
      return (
        <group rotation={[0, 0, 0.15]}>
          <mesh position={[0, -0.35, 0]} scale={[1, 1, 0.4]}><sphereGeometry args={[0.42, 16, 16]} /><meshStandardMaterial color="#92400e" roughness={0.5} /></mesh>
          <mesh position={[0, -0.05, 0]} scale={[1, 1, 0.4]}><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#92400e" roughness={0.5} /></mesh>
          <mesh position={[0, -0.35, 0.09]}><circleGeometry args={[0.14, 16]} /><meshStandardMaterial color="#1c1917" /></mesh>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.05, 0.06, 0.9, 8]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
          <mesh position={[0, 1, 0]}><boxGeometry args={[0.2, 0.16, 0.06]} /><meshStandardMaterial color="#451a03" /></mesh>
        </group>
      )
    case 'TAMBOR':
      return (
        <group>
          <mesh><cylinderGeometry args={[0.5, 0.5, 0.6, 20]} /><meshStandardMaterial color="#f8fafc" roughness={0.6} /></mesh>
          <mesh position={[0, 0.3, 0]}><torusGeometry args={[0.5, 0.04, 8, 20]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
          <mesh position={[0, -0.3, 0]}><torusGeometry args={[0.5, 0.04, 8, 20]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]} rotation={[Math.PI / 2, 0, -a]}><boxGeometry args={[0.03, 0.6, 0.03]} /><meshStandardMaterial color="#1e293b" /></mesh> })}
        </group>
      )
    case 'LLAVE':
      return (
        <group rotation={[0, 0, 0.2]}>
          <mesh position={[0, 0.5, 0]}><torusGeometry args={[0.28, 0.09, 10, 20]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[0, 0, 0]}><boxGeometry args={[0.11, 0.9, 0.06]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[0.1, -0.45, 0]}><boxGeometry args={[0.14, 0.12, 0.06]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[0.1, -0.62, 0]}><boxGeometry args={[0.1, 0.1, 0.06]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
        </group>
      )
    case 'TIJERAS':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.09, 0.9, 0.03]} /><meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[0, 0.35, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.09, 0.9, 0.03]} /><meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[-0.18, -0.35, 0]} rotation={[0, 0, 0.35]}><torusGeometry args={[0.16, 0.045, 8, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>
          <mesh position={[0.18, -0.35, 0]} rotation={[0, 0, -0.35]}><torusGeometry args={[0.16, 0.045, 8, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>
          <mesh><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
        </group>
      )
    case 'RELOJ':
      return (
        <group>
          <mesh><cylinderGeometry args={[0.6, 0.6, 0.15, 24]} /><meshStandardMaterial color="#f8fafc" roughness={0.5} /></mesh>
          <mesh position={[0, 0.15, 0.1]} rotation={[Math.PI / 2, 0, 0.3]}><boxGeometry args={[0.05, 0.3, 0.02]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.1, 0.05, 0.1]} rotation={[Math.PI / 2, 0, -0.5]}><boxGeometry args={[0.05, 0.42, 0.02]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[-0.42, 0.55, 0]} rotation={[0, 0, -0.5]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#facc15" roughness={0.4} /></mesh>
          <mesh position={[0.42, 0.55, 0]} rotation={[0, 0, 0.5]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#facc15" roughness={0.4} /></mesh>
        </group>
      )
    case 'TAZA':
      return (
        <group>
          <mesh><cylinderGeometry args={[0.45, 0.4, 0.7, 20]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
          <mesh position={[0, 0.36, 0]}><cylinderGeometry args={[0.4, 0.4, 0.04, 20]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
          <mesh position={[0.55, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.22, 0.07, 8, 16]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
        </group>
      )
    case 'SILLA':
      return (
        <group>
          <mesh><boxGeometry args={[0.7, 0.08, 0.7]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          <mesh position={[0, 0.5, -0.32]}><boxGeometry args={[0.7, 0.9, 0.08]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          {[[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].map(([x, z], i) => (
            <mesh key={i} position={[x, -0.35, z]}><cylinderGeometry args={[0.05, 0.05, 0.7, 8]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          ))}
        </group>
      )
    case 'MESA':
      return (
        <group>
          <mesh position={[0, 0.35, 0]}><boxGeometry args={[1.3, 0.08, 0.8]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          {[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0, z]}><cylinderGeometry args={[0.06, 0.06, 0.7, 8]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          ))}
        </group>
      )
    case 'PUERTA':
      return (
        <group>
          <mesh><boxGeometry args={[0.7, 1.3, 0.08]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          <mesh position={[0, 0.2, 0.05]}><boxGeometry args={[0.5, 0.4, 0.02]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          <mesh position={[0, -0.35, 0.05]}><boxGeometry args={[0.5, 0.4, 0.02]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          <mesh position={[0.25, 0, 0.06]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} /></mesh>
        </group>
      )
    case 'VENTANA':
      return (
        <group>
          <mesh><boxGeometry args={[1, 1, 0.08]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          <mesh position={[0, 0, 0.05]}><boxGeometry args={[0.85, 0.85, 0.02]} /><meshStandardMaterial color="#7dd3fc" transparent opacity={0.6} /></mesh>
          <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.04, 0.85, 0.02]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.85, 0.04, 0.02]} /><meshStandardMaterial color="#78350f" /></mesh>
        </group>
      )
    case 'CASTILLO':
      return (
        <group>
          <mesh position={[0, -0.1, 0]}><boxGeometry args={[1.1, 0.8, 0.6]} /><meshStandardMaterial color="#94a3b8" roughness={0.7} /></mesh>
          <mesh position={[-0.55, 0.15, 0]}><cylinderGeometry args={[0.22, 0.22, 0.9, 12]} /><meshStandardMaterial color="#cbd5e1" roughness={0.7} /></mesh>
          <mesh position={[0.55, 0.15, 0]}><cylinderGeometry args={[0.22, 0.22, 0.9, 12]} /><meshStandardMaterial color="#cbd5e1" roughness={0.7} /></mesh>
          <mesh position={[-0.55, 0.72, 0]}><coneGeometry args={[0.27, 0.4, 10]} /><meshStandardMaterial color="#dc2626" /></mesh>
          <mesh position={[0.55, 0.72, 0]}><coneGeometry args={[0.27, 0.4, 10]} /><meshStandardMaterial color="#dc2626" /></mesh>
          <mesh position={[0, 0.35, 0.31]}><boxGeometry args={[0.2, 0.32, 0.03]} /><meshStandardMaterial color="#451a03" /></mesh>
        </group>
      )
    case 'CORONA':
      return (
        <group>
          <mesh><cylinderGeometry args={[0.5, 0.55, 0.35, 16]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
          {[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.5, 0.25, Math.sin(a) * 0.5]}><coneGeometry args={[0.13, 0.35, 4]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh> })}
          <mesh position={[0, 0, 0.51]}><octahedronGeometry args={[0.09, 0]} /><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} /></mesh>
        </group>
      )
    case 'ESPADA':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.12, 1.1, 0.03]} /><meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.7} /></mesh>
          <mesh position={[0, -0.05, 0]}><boxGeometry args={[0.4, 0.09, 0.06]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[0, -0.32, 0]}><cylinderGeometry args={[0.05, 0.05, 0.45, 8]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
          <mesh position={[0, -0.58, 0]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} /></mesh>
        </group>
      )
    case 'ESCUDO':
      return (
        <group>
          <mesh scale={[1, 1.3, 0.25]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.3} /></mesh>
          <mesh position={[0, 0, 0.13]} scale={[0.75, 1, 1]}><circleGeometry args={[0.38, 20]} /><meshStandardMaterial color="#dc2626" roughness={0.5} /></mesh>
          <mesh position={[0, 0, 0.14]}><octahedronGeometry args={[0.12, 0]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.5} /></mesh>
        </group>
      )
    case 'PATO':
      return (
        <group>
          <mesh scale={[1, 0.85, 1.2]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#fef08a" roughness={0.6} /></mesh>
          <mesh position={[0, 0.5, 0.35]}><sphereGeometry args={[0.28, 14, 14]} /><meshStandardMaterial color="#fef08a" roughness={0.6} /></mesh>
          <mesh position={[0, 0.47, 0.62]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.12, 0.24, 8]} /><meshStandardMaterial color="#f97316" roughness={0.5} /></mesh>
          <mesh position={[-0.08, 0.58, 0.5]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.08, 0.58, 0.5]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#1e293b" /></mesh>
        </group>
      )
    case 'GATO':
      return (
        <group>
          <mesh position={[0, -0.15, 0]} scale={[1, 0.9, 1.3]}><sphereGeometry args={[0.4, 14, 14]} /><meshStandardMaterial color="#94a3b8" roughness={0.6} /></mesh>
          <mesh position={[0, 0.35, 0.2]}><sphereGeometry args={[0.32, 14, 14]} /><meshStandardMaterial color="#94a3b8" roughness={0.6} /></mesh>
          <mesh position={[-0.18, 0.62, 0.15]} rotation={[0, 0, -0.3]}><coneGeometry args={[0.12, 0.22, 4]} /><meshStandardMaterial color="#94a3b8" roughness={0.6} /></mesh>
          <mesh position={[0.18, 0.62, 0.15]} rotation={[0, 0, 0.3]}><coneGeometry args={[0.12, 0.22, 4]} /><meshStandardMaterial color="#94a3b8" roughness={0.6} /></mesh>
          <mesh position={[-0.11, 0.38, 0.45]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.11, 0.38, 0.45]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, -0.05, -0.55]} rotation={[0.6, 0, 0]}><cylinderGeometry args={[0.05, 0.08, 0.6, 8]} /><meshStandardMaterial color="#94a3b8" roughness={0.6} /></mesh>
        </group>
      )
    case 'PERRO':
      return (
        <group>
          <mesh position={[0, -0.15, 0]} scale={[1, 0.9, 1.3]}><sphereGeometry args={[0.4, 14, 14]} /><meshStandardMaterial color="#b45309" roughness={0.65} /></mesh>
          <mesh position={[0, 0.35, 0.25]}><sphereGeometry args={[0.3, 14, 14]} /><meshStandardMaterial color="#b45309" roughness={0.65} /></mesh>
          <mesh position={[0, 0.28, 0.55]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.16, 0.28, 10]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          <mesh position={[-0.28, 0.4, 0.2]} rotation={[0, 0, -0.4]} scale={[0.6, 1.3, 0.3]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
          <mesh position={[0.28, 0.4, 0.2]} rotation={[0, 0, 0.4]} scale={[0.6, 1.3, 0.3]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#78350f" roughness={0.6} /></mesh>
          <mesh position={[0, -0.05, -0.55]} rotation={[0.9, 0, 0]}><cylinderGeometry args={[0.05, 0.08, 0.5, 8]} /><meshStandardMaterial color="#b45309" roughness={0.65} /></mesh>
        </group>
      )
    case 'MARIPOSA':
      return (
        <group>
          <mesh><cylinderGeometry args={[0.045, 0.045, 0.75, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[-0.32, 0.15, 0]} rotation={[0, 0, 0.3]} scale={[1, 0.6, 0.35]}><sphereGeometry args={[0.34, 12, 12]} /><meshStandardMaterial color="#f97316" roughness={0.5} /></mesh>
          <mesh position={[0.32, 0.15, 0]} rotation={[0, 0, -0.3]} scale={[1, 0.6, 0.35]}><sphereGeometry args={[0.34, 12, 12]} /><meshStandardMaterial color="#f97316" roughness={0.5} /></mesh>
          <mesh position={[-0.24, -0.18, 0]} rotation={[0, 0, 0.2]} scale={[0.7, 0.42, 0.35]}><sphereGeometry args={[0.24, 12, 12]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} /></mesh>
          <mesh position={[0.24, -0.18, 0]} rotation={[0, 0, -0.2]} scale={[0.7, 0.42, 0.35]}><sphereGeometry args={[0.24, 12, 12]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} /></mesh>
          <mesh position={[-0.06, 0.42, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.06, 0.42, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} /><meshStandardMaterial color="#1e293b" /></mesh>
        </group>
      )
    case 'ABEJA':
      return (
        <group>
          <mesh scale={[1, 1, 1.4]}><sphereGeometry args={[0.35, 14, 14]} /><meshStandardMaterial color="#facc15" roughness={0.5} /></mesh>
          <mesh position={[0, 0, 0.1]}><boxGeometry args={[0.6, 0.6, 0.14]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, 0, -0.15]}><boxGeometry args={[0.55, 0.55, 0.14]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.18, 0.12, 0.05]} scale={[1, 0.4, 1.6]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial color="#e0f2fe" transparent opacity={0.55} /></mesh>
          <mesh position={[-0.18, 0.12, 0.05]} scale={[1, 0.4, 1.6]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial color="#e0f2fe" transparent opacity={0.55} /></mesh>
          <mesh position={[0, 0, -0.48]}><sphereGeometry args={[0.15, 10, 10]} /><meshStandardMaterial color="#1e293b" /></mesh>
        </group>
      )
    case 'ARANA':
      return (
        <group>
          <mesh><sphereGeometry args={[0.4, 14, 14]} /><meshStandardMaterial color="#1e293b" roughness={0.6} /></mesh>
          <mesh position={[0, 0.05, 0.35]}><sphereGeometry args={[0.22, 12, 12]} /><meshStandardMaterial color="#1e293b" roughness={0.6} /></mesh>
          {[0, 1, 2, 3].flatMap((i) => {
            const a = (i / 4) * 0.9 + 0.2
            return [-1, 1].map((side) => (
              <mesh key={`${i}-${side}`} position={[side * 0.3, -0.05, 0.15 - i * 0.18]} rotation={[0, 0, side * a]}>
                <cylinderGeometry args={[0.025, 0.025, 0.55, 6]} /><meshStandardMaterial color="#1e293b" />
              </mesh>
            ))
          })}
          <mesh position={[-0.08, 0.15, 0.5]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} /></mesh>
          <mesh position={[0.08, 0.15, 0.5]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} /></mesh>
        </group>
      )
    case 'CANGREJO':
      return (
        <group>
          <mesh scale={[1, 0.5, 1]}><sphereGeometry args={[0.45, 16, 16]} /><meshStandardMaterial color="#f87171" roughness={0.5} /></mesh>
          <mesh position={[-0.55, 0, 0.15]} rotation={[0, 0, 0.3]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#ef4444" roughness={0.5} /></mesh>
          <mesh position={[0.55, 0, 0.15]} rotation={[0, 0, -0.3]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#ef4444" roughness={0.5} /></mesh>
          <mesh position={[-0.35, 0, 0.35]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.06, 0.09, 0.35, 8]} /><meshStandardMaterial color="#ef4444" roughness={0.5} /></mesh>
          <mesh position={[0.35, 0, 0.35]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.06, 0.09, 0.35, 8]} /><meshStandardMaterial color="#ef4444" roughness={0.5} /></mesh>
          {[-1, 1].flatMap((s) => [0, 1, 2].map((i) => (
            <mesh key={`${s}-${i}`} position={[s * (0.35 + i * 0.05), -0.15, -0.1 - i * 0.15]} rotation={[0, 0, s * 0.8]}><cylinderGeometry args={[0.025, 0.025, 0.3, 6]} /><meshStandardMaterial color="#ef4444" /></mesh>
          )))}
          <mesh position={[-0.12, 0.2, 0.4]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.12, 0.2, 0.4]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
        </group>
      )
    case 'TORTUGA':
      return (
        <group>
          <mesh position={[0, 0.05, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#16a34a" roughness={0.6} /></mesh>
          <mesh position={[0, -0.1, 0.5]}><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color="#4ade80" roughness={0.6} /></mesh>
          {[[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]].map(([x, z], i) => (
            <mesh key={i} position={[x, -0.15, z]}><sphereGeometry args={[0.14, 10, 10]} /><meshStandardMaterial color="#4ade80" roughness={0.6} /></mesh>
          ))}
          <mesh position={[0, -0.1, -0.5]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.1, 0.25, 8]} /><meshStandardMaterial color="#4ade80" roughness={0.6} /></mesh>
        </group>
      )
    case 'RATON':
      return (
        <group>
          <mesh scale={[1, 0.9, 1.3]}><sphereGeometry args={[0.35, 14, 14]} /><meshStandardMaterial color="#cbd5e1" roughness={0.6} /></mesh>
          <mesh position={[-0.2, 0.28, 0.15]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#e2e8f0" roughness={0.6} /></mesh>
          <mesh position={[0.2, 0.28, 0.15]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#e2e8f0" roughness={0.6} /></mesh>
          <mesh position={[0, 0, 0.48]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color="#fda4af" /></mesh>
          <mesh position={[0, -0.1, -0.55]} rotation={[0.4, 0, 0]}><cylinderGeometry args={[0.02, 0.04, 0.55, 6]} /><meshStandardMaterial color="#fda4af" /></mesh>
        </group>
      )
    case 'CONEJO':
      return (
        <group>
          <mesh scale={[1, 1, 1.2]}><sphereGeometry args={[0.38, 14, 14]} /><meshStandardMaterial color="#f8fafc" roughness={0.6} /></mesh>
          <mesh position={[-0.15, 0.55, 0]} rotation={[0, 0, -0.1]}><capsuleGeometry args={[0.09, 0.5, 4, 8]} /><meshStandardMaterial color="#f8fafc" roughness={0.6} /></mesh>
          <mesh position={[0.15, 0.55, 0]} rotation={[0, 0, 0.1]}><capsuleGeometry args={[0.09, 0.5, 4, 8]} /><meshStandardMaterial color="#f8fafc" roughness={0.6} /></mesh>
          <mesh position={[0, -0.1, -0.42]}><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color="#f1f5f9" roughness={0.7} /></mesh>
          <mesh position={[0, -0.05, 0.4]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fda4af" /></mesh>
        </group>
      )
    case 'HELADO':
      return (
        <group>
          <mesh position={[0, -0.4, 0]}><coneGeometry args={[0.28, 0.7, 8]} /><meshStandardMaterial color="#d97706" roughness={0.6} /></mesh>
          <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.32, 14, 14]} /><meshStandardMaterial color="#fda4af" roughness={0.5} /></mesh>
          <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.26, 14, 14]} /><meshStandardMaterial color="#fef3c7" roughness={0.5} /></mesh>
          <mesh position={[0.05, 0.85, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
      )
    case 'PASTEL':
      return (
        <group>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.55, 0.6, 0.35, 20]} /><meshStandardMaterial color="#fbcfe8" roughness={0.5} /></mesh>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.42, 0.5, 0.35, 20]} /><meshStandardMaterial color="#f9a8d4" roughness={0.5} /></mesh>
          <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.03, 0.03, 0.25, 6]} /><meshStandardMaterial color="#fde68a" /></mesh>
          <mesh position={[0, 0.47, 0]}><coneGeometry args={[0.05, 0.12, 8]} /><meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1} /></mesh>
        </group>
      )
    case 'OJO':
      return (
        <group scale={[1.3, 1, 0.7]}>
          <mesh><sphereGeometry args={[0.5, 20, 20]} /><meshStandardMaterial color="#f8fafc" roughness={0.3} /></mesh>
          <mesh position={[0, 0, 0.44]}><sphereGeometry args={[0.24, 16, 16]} /><meshStandardMaterial color="#0ea5e9" roughness={0.3} /></mesh>
          <mesh position={[0, 0, 0.58]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color="#0f172a" /></mesh>
          <mesh position={[0.06, 0.08, 0.65]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#ffffff" /></mesh>
        </group>
      )
    case 'LAPIZ':
      return (
        <group rotation={[0, 0, 0.3]}>
          <mesh><cylinderGeometry args={[0.13, 0.13, 1.3, 6]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} /></mesh>
          <mesh position={[0, 0.75, 0]}><coneGeometry args={[0.13, 0.28, 6]} /><meshStandardMaterial color="#d6a45a" roughness={0.6} /></mesh>
          <mesh position={[0, 0.87, 0]}><coneGeometry args={[0.045, 0.1, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, -0.72, 0]}><cylinderGeometry args={[0.14, 0.14, 0.18, 10]} /><meshStandardMaterial color="#f472b6" roughness={0.6} /></mesh>
          <mesh position={[0, -0.83, 0]}><cylinderGeometry args={[0.15, 0.15, 0.08, 10]} /><meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} /></mesh>
        </group>
      )
    case 'BOTA':
      return (
        <group>
          <mesh position={[0.1, -0.35, 0]}><boxGeometry args={[0.7, 0.22, 0.35]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
          <mesh position={[-0.2, 0.05, -0.05]}><boxGeometry args={[0.35, 0.75, 0.32]} /><meshStandardMaterial color="#92400e" roughness={0.7} /></mesh>
          <mesh position={[-0.2, 0.42, -0.05]}><boxGeometry args={[0.37, 0.06, 0.34]} /><meshStandardMaterial color="#451a03" /></mesh>
        </group>
      )
    case 'ANILLO':
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh><torusGeometry args={[0.4, 0.09, 12, 24]} /><meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.6} /></mesh>
          <mesh position={[0, 0, 0.35]} rotation={[-Math.PI / 2, 0, 0]}><octahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} roughness={0.2} /></mesh>
        </group>
      )
    case 'DIAMANTE':
      return (
        <group>
          <mesh><octahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.4} roughness={0.15} metalness={0.2} /></mesh>
        </group>
      )
    case 'CAMPANA':
      return (
        <group>
          <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.45, 0.7, 16]} /><meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.5} /></mesh>
          <mesh position={[0, -0.28, 0]}><cylinderGeometry args={[0.48, 0.48, 0.08, 16]} /><meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} /></mesh>
          <mesh position={[0, -0.42, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh position={[0, 0.5, 0]}><torusGeometry args={[0.08, 0.025, 8, 12]} /><meshStandardMaterial color="#78350f" /></mesh>
        </group>
      )
    case 'ZANAHORIA':
      return (
        <group rotation={[0, 0, 0.15]}>
          <mesh position={[0, -0.3, 0]}><coneGeometry args={[0.28, 1, 10]} /><meshStandardMaterial color="#f97316" roughness={0.6} /></mesh>
          {[0, 1, 2].map((i) => { const a = -0.3 + i * 0.3; return <mesh key={i} position={[Math.sin(a) * 0.05, 0.32, 0]} rotation={[0, 0, a]}><coneGeometry args={[0.05, 0.4, 6]} /><meshStandardMaterial color="#16a34a" roughness={0.6} /></mesh> })}
        </group>
      )
    case 'CEREZA':
      return (
        <group>
          <mesh position={[-0.22, -0.3, 0]}><sphereGeometry args={[0.28, 14, 14]} /><meshStandardMaterial color="#dc2626" roughness={0.4} /></mesh>
          <mesh position={[0.22, -0.32, 0]}><sphereGeometry args={[0.26, 14, 14]} /><meshStandardMaterial color="#dc2626" roughness={0.4} /></mesh>
          <mesh position={[-0.1, 0.15, 0]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.02, 0.02, 0.6, 6]} /><meshStandardMaterial color="#16a34a" /></mesh>
          <mesh position={[0.15, 0.2, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /><meshStandardMaterial color="#16a34a" /></mesh>
          <mesh position={[0.02, 0.42, 0]} rotation={[0.3, 0.3, 0]} scale={[1, 0.5, 1.4]}><sphereGeometry args={[0.14, 10, 10]} /><meshStandardMaterial color="#16a34a" roughness={0.6} /></mesh>
        </group>
      )
    case 'PINA':
      return (
        <group>
          <mesh scale={[1, 1.3, 1]}><sphereGeometry args={[0.42, 16, 16]} /><meshStandardMaterial color="#ca8a04" roughness={0.7} /></mesh>
          {[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.08, 0.6, Math.sin(a) * 0.08]} rotation={[0.3, a, 0]}><coneGeometry args={[0.08, 0.5, 6]} /><meshStandardMaterial color="#16a34a" roughness={0.6} /></mesh> })}
        </group>
      )
    case 'BUHO':
      return (
        <group>
          <mesh scale={[1, 1.2, 0.9]}><sphereGeometry args={[0.42, 16, 16]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          <mesh position={[-0.15, 0.15, 0.32]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#fef3c7" /></mesh>
          <mesh position={[0.15, 0.15, 0.32]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#fef3c7" /></mesh>
          <mesh position={[-0.15, 0.15, 0.44]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0.15, 0.15, 0.44]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.07, 0.16, 8]} /><meshStandardMaterial color="#f97316" /></mesh>
          <mesh position={[-0.2, 0.55, 0]} rotation={[0, 0, -0.2]}><coneGeometry args={[0.09, 0.22, 4]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
          <mesh position={[0.2, 0.55, 0]} rotation={[0, 0, 0.2]}><coneGeometry args={[0.09, 0.22, 4]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
        </group>
      )
    default:
      return null
  }
}
