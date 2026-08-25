import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Particles from './Particles'

// --- Suelo con variacion de color por vertice (evita el look "plastico" plano) ---
function Floor({ color = '#1e293b', size = 60, roughness = 0.95 }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 26, 26)
    const base = new THREE.Color(color)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const variance = 0.82 + Math.random() * 0.34
      const c = base.clone().multiplyScalar(variance)
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [color, size])
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={roughness} />
    </mesh>
  )
}

// --- Cielo con degradado vertical (mucho mas vivo que un color solido) ---
function GradientSky({ top, bottom, radius = 90 }) {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 24, 16)
    const colorTop = new THREE.Color(top)
    const colorBottom = new THREE.Color(bottom)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp((pos.getY(i) / radius + 1) / 2, 0, 1)
      const c = colorBottom.clone().lerp(colorTop, t)
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [top, bottom, radius])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  )
}

// --- Muro de fondo y techo: dan sensacion de recinto cerrado (mazmorra/salon/cueva) ---
function BackWall({ color = '#1f2430', width = 52, height = 30, z = -24 }) {
  return (
    <mesh position={[0, height / 2 - 3.4, z]} receiveShadow>
      <boxGeometry args={[width, height, 1]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}
function Ceiling({ color = '#0f172a', width = 46, depth = 46, y = 15 }) {
  return (
    <mesh position={[0, y, -depth / 2 + 8]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Torch({ position = [0, 0, 0] }) {
  const light = useRef()
  useFrame(({ clock }) => {
    if (!light.current) return
    light.current.intensity = 1.6 + Math.sin(clock.getElapsedTime() * 8 + position[0]) * 0.4
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.6, 6]} />
        <meshStandardMaterial color="#3f2a1a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={light} position={[0, 1.4, 0]} color="#fb923c" intensity={1.8} distance={9} />
    </group>
  )
}

function Column({ position = [0, 0, 0], height = 7, color = '#94a3b8', gold = false }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2 - 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, height, 10]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {gold && (
        <mesh position={[0, height - 3.5, 0]}>
          <torusGeometry args={[0.55, 0.08, 8, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.25} />
        </mesh>
      )}
    </group>
  )
}

function PineTree({ position, scale = 1 }) {
  const ref = useRef()
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.6 + phase) * 0.035
  })
  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh position={[0, -2.4, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 1.6, 6]} />
        <meshStandardMaterial color="#3f2a1a" />
      </mesh>
      <mesh position={[0, -0.5, 0]} castShadow>
        <coneGeometry args={[1.6, 3.2, 7]} />
        <meshStandardMaterial color="#065f46" flatShading />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[1.1, 2.4, 7]} />
        <meshStandardMaterial color="#047857" flatShading />
      </mesh>
    </group>
  )
}

function Crystal({ position, color = '#a855f7', scale = 1 }) {
  const ref = useRef()
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 0.3
    ref.current.position.y = position[1] + Math.sin(t * 0.8 + phase) * 0.15
  })
  return (
    <mesh ref={ref} position={position} scale={scale} castShadow>
      <octahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.3} />
    </mesh>
  )
}

function Stalactite({ position, scale = 1 }) {
  return (
    <mesh position={position} rotation={[Math.PI, 0, 0]} scale={scale}>
      <coneGeometry args={[0.4, 2.2, 6]} />
      <meshStandardMaterial color="#475569" roughness={0.9} />
    </mesh>
  )
}

// --- Luna con halo en capas (mas viva que una esfera plana) ---
function Moon({ position = [-30, 28, -50] }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[5, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.6, 20, 20]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[6.6, 20, 20]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  )
}

function PortalShard({ radius, height, offset, speed, color, size }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed + offset
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 1.7) * 0.4, Math.sin(t) * radius)
    ref.current.rotation.x = t * 1.4
    ref.current.rotation.y = t * 0.9
  })
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.25} metalness={0.4} />
    </mesh>
  )
}

function PortalRing() {
  const outer = useRef()
  const inner = useRef()
  const glow = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (outer.current) outer.current.rotation.z = t * 0.4
    if (inner.current) inner.current.rotation.z = -t * 0.6
    if (glow.current) glow.current.rotation.z = t * 0.15
  })
  const shardColors = ['#fbbf24', '#a78bfa', '#f472b6', '#60a5fa']
  return (
    <group position={[0, 3.5, -12]}>
      <mesh ref={glow}>
        <torusGeometry args={[4.9, 0.06, 10, 48]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.7} transparent opacity={0.55} />
      </mesh>
      <mesh ref={outer}>
        <torusGeometry args={[4.2, 0.35, 16, 48]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[3.5, 0.12, 12, 40]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={1} metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh>
        <circleGeometry args={[3.9, 48]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.35} />
      </mesh>
      {shardColors.map((c, i) => (
        <PortalShard key={i} radius={5.4 + (i % 2) * 0.5} height={(i - 1.5) * 0.6} offset={i * 1.7} speed={0.35 + i * 0.08} color={c} size={0.16 + (i % 2) * 0.06} />
      ))}
      <pointLight color="#a78bfa" intensity={3} distance={16} position={[0, 0, 2]} />
      <pointLight color="#fbbf24" intensity={1.6} distance={12} position={[0, 2.5, 1]} />
    </group>
  )
}

// --- Detalles de suelo (rocas/matorrales) via instancedMesh: un solo draw call ---
function GroundScatter({ count = 30, spread = 40, color = '#475569', geometry = 'rock', exclude = 5 }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(() => new Array(count).fill(0).map(() => {
    let x, z
    do {
      x = (Math.random() - 0.5) * spread
      z = (Math.random() - 0.5) * spread
    } while (Math.abs(x) < exclude && z > -8)
    return { x, z, scale: 0.18 + Math.random() * 0.32, rot: Math.random() * Math.PI * 2 }
  }), [count, spread, exclude])

  useLayoutEffect(() => {
    if (!meshRef.current) return
    data.forEach((d, i) => {
      dummy.position.set(d.x, -3.32, d.z)
      dummy.rotation.set(0, d.rot, 0)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [data, dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {geometry === 'rock' && <dodecahedronGeometry args={[0.5, 0]} />}
      {geometry === 'bush' && <icosahedronGeometry args={[0.5, 0]} />}
      {geometry === 'rubble' && <boxGeometry args={[0.6, 0.35, 0.5]} />}
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </instancedMesh>
  )
}

function randRange(n, spreadX, spreadZ, offsetZ = 0, exclude = 0) {
  return new Array(n).fill(0).map(() => {
    let x, z
    do {
      x = (Math.random() - 0.5) * spreadX
      z = (Math.random() - 0.5) * spreadZ + offsetZ
    } while (Math.abs(x) < exclude && z > -6)
    return [x, -3.4, z]
  })
}

export default function Biome({ type = 'dungeon' }) {
  const treePositions = useMemo(() => randRange(22, 44, 30, -8, 6), [])
  const crystalPositions = useMemo(() => new Array(14).fill(0).map(() => [
    (Math.random() - 0.5) * 30, -1 + Math.random() * 5, -10 - Math.random() * 18,
  ]), [])
  const stalPositions = useMemo(() => new Array(16).fill(0).map(() => [
    (Math.random() - 0.5) * 26, 9 + Math.random() * 2, -8 - Math.random() * 20,
  ]), [])
  const columnPositions = useMemo(() => new Array(6).fill(0).map((_, i) => {
    const side = i % 2 === 0 ? -6.5 : 6.5
    const z = -6 - Math.floor(i / 2) * 8
    return [side, 0, z]
  }), [])
  // Escalas fijadas UNA sola vez: si se calculan inline con Math.random()
  // en el render, cualquier actualizacion del HUD (que ocurre en casi cada
  // interaccion del jugador) vuelve a renderizar el bioma y hace que estos
  // elementos "salten" de tamano de golpe.
  const crystalScales = useMemo(() => crystalPositions.map(() => 0.7 + Math.random() * 0.8), [crystalPositions])
  const stalScales = useMemo(() => stalPositions.map(() => 0.8 + Math.random() * 0.8), [stalPositions])
  const treeScales = useMemo(() => treePositions.map(() => 0.8 + Math.random() * 0.6), [treePositions])

  if (type === 'dungeon') {
    return (
      <group>
        <GradientSky top="#1e293b" bottom="#0b0f1a" />
        <fogExp2 attach="fog" args={['#0b0f1a', 0.045]} />
        <ambientLight intensity={0.75} color="#94a3b8" />
        <hemisphereLight args={['#64748b', '#0b0f1a', 0.6]} />
        <Floor color="#1f2430" />
        <BackWall color="#1a2130" />
        <Ceiling color="#0a0e18" />
        <GroundScatter count={26} spread={42} color="#3f4759" geometry="rubble" />
        {columnPositions.map((p, i) => <Column key={i} position={p} height={9} color="#374151" />)}
        <Torch position={[-3, -1, -3]} />
        <Torch position={[3, -1, -3]} />
        <Torch position={[-6, -1, -10]} />
        <Torch position={[6, -1, -10]} />
        <directionalLight position={[2, 12, 8]} intensity={0.5} color="#cbd5e1" />
        <Particles count={60} color="#94a3b8" size={0.06} area={[24, 6, 20]} yBase={-1} speed={0.4} />
      </group>
    )
  }

  if (type === 'castle_hall') {
    return (
      <group>
        <GradientSky top="#4c1d95" bottom="#241b33" />
        <fogExp2 attach="fog" args={['#241b33', 0.035]} />
        <ambientLight intensity={0.85} color="#e9d8fd" />
        <hemisphereLight args={['#e9d8fd', '#241b33', 0.5]} />
        <Floor color="#3b2440" />
        <BackWall color="#2e1f3d" />
        <Ceiling color="#1a1024" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.38, -4]}>
          <planeGeometry args={[4.5, 22]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
        </mesh>
        {columnPositions.map((p, i) => <Column key={i} position={p} height={10} color="#e2c78a" gold />)}
        <pointLight position={[0, 8, -6]} color="#fde68a" intensity={2.2} distance={26} />
        <Particles count={80} color="#fcd34d" size={0.08} area={[26, 10, 22]} yBase={-1} speed={0.6} />
      </group>
    )
  }

  if (type === 'dragon_cave') {
    return (
      <group>
        <GradientSky top="#2e1065" bottom="#150826" />
        <fogExp2 attach="fog" args={['#150826', 0.04]} />
        <ambientLight intensity={0.8} color="#c4b5fd" />
        <hemisphereLight args={['#c4b5fd', '#150826', 0.55]} />
        <Floor color="#1e1033" />
        <BackWall color="#190f2b" />
        <Ceiling color="#0f081e" y={13} />
        <GroundScatter count={20} spread={38} color="#312a52" geometry="rock" />
        {crystalPositions.map((p, i) => <Crystal key={i} position={p} color={i % 2 ? '#a855f7' : '#22d3ee'} scale={crystalScales[i]} />)}
        {stalPositions.map((p, i) => <Stalactite key={i} position={p} scale={stalScales[i]} />)}
        <pointLight position={[0, 3, -6]} color="#c084fc" intensity={2.4} distance={22} />
        <Particles count={90} color="#c4b5fd" size={0.07} area={[26, 12, 22]} yBase={-1} speed={0.5} />
      </group>
    )
  }

  if (type === 'enchanted_forest') {
    return (
      <group>
        <GradientSky top="#1e3a8a" bottom="#0a1128" />
        <fogExp2 attach="fog" args={['#0a1128', 0.03]} />
        <ambientLight intensity={0.85} color="#bfdbfe" />
        <hemisphereLight args={['#bfdbfe', '#0a1128', 0.55]} />
        <Floor color="#052e2b" />
        <GroundScatter count={34} spread={44} color="#065f46" geometry="bush" />
        <Moon position={[-16, 12, -40]} />
        {treePositions.map((p, i) => <PineTree key={i} position={p} scale={treeScales[i]} />)}
        <pointLight position={[0, 6, -4]} color="#c7d2fe" intensity={1.4} distance={20} />
        <Particles count={100} color="#fcd34d" size={0.09} area={[30, 10, 24]} yBase={-1} speed={0.7} />
      </group>
    )
  }

  // portal_tower
  return (
    <group>
      <GradientSky top="#312e81" bottom="#0f0a2e" />
      <fogExp2 attach="fog" args={['#0f0a2e', 0.035]} />
      <ambientLight intensity={0.9} color="#c7d2fe" />
      <hemisphereLight args={['#c7d2fe', '#0f0a2e', 0.55]} />
      <Floor color="#1a1440" />
      <BackWall color="#160f38" z={-26} />
      <Ceiling color="#0c0824" y={17} />
      <GroundScatter count={18} spread={30} color="#3b2f7a" geometry="rock" />
      {columnPositions.map((p, i) => <Column key={i} position={p} height={11} color="#4c1d95" gold />)}
      <PortalRing />
      <Particles count={110} color="#fbbf24" size={0.09} area={[22, 14, 20]} yBase={-1} speed={1.1} />
    </group>
  )
}
