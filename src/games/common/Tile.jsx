import { useState } from 'react'

export function Tile({ position, size = [0.9, 0.9, 0.15], color = '#475569', hoverColor, onClick, disabled, rotation, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(e) }}
      onPointerOver={(e) => { e.stopPropagation(); if (!disabled) { setHovered(true); document.body.style.cursor = 'pointer' } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      castShadow receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={hovered && !disabled ? (hoverColor || '#fbbf24') : color} roughness={0.55} />
      {children}
    </mesh>
  )
}

export function ClickableGroup({ position, onClick, disabled, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group
      position={position}
      scale={hovered && !disabled ? 1.08 : 1}
      onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(e) }}
      onPointerOver={(e) => { e.stopPropagation(); if (!disabled) { setHovered(true); document.body.style.cursor = 'pointer' } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      {children}
    </group>
  )
}
