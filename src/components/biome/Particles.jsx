import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getSoftDotTexture } from './softDotTexture'

export default function Particles({ count = 120, area = [30, 14, 30], color = '#fcd34d', size = 0.12, speed = 1, yBase = 2, twinkle = true }) {
  const ref = useRef()
  const texture = useMemo(() => getSoftDotTexture(), [])
  const { positions, phases, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const scales = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area[0]
      positions[i * 3 + 1] = yBase + Math.random() * area[1]
      positions[i * 3 + 2] = (Math.random() - 0.5) * area[2]
      phases[i] = Math.random() * Math.PI * 2
      scales[i] = 0.6 + Math.random() * 0.8
    }
    return { positions, phases, scales }
  }, [count, area, yBase])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * speed
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t + phases[i]) * 0.0015
      arr[i * 3] += Math.cos(t * 0.5 + phases[i]) * 0.0008
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    if (twinkle) {
      ref.current.material.opacity = 0.55 + Math.sin(t * 1.6) * 0.15
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture} color={color} size={size} transparent opacity={0.8}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
