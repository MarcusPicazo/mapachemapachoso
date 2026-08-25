import { forwardRef } from 'react'
import './RaccoonCharacter.css'

// Fraccion de la posicion de la boca (#mouth-smile ~ 100,105) dentro del viewBox "-40 -30 350 250"
export const MOUTH_FRACTION = { x: (100 - -40) / 390, y: (105 - -30) / 250 }

const RaccoonCharacter = forwardRef(function RaccoonCharacter({ mood = 'idle', onShieldTap }, svgRef) {
  return (
    <div className={`raccoon-wrap ${mood}`}>
      <svg id="mapache-svg" ref={svgRef} viewBox="-40 -30 350 250" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="tail-clip"><path d="M 130,150 Q 240,200 270,70 C 200,40 150,10 110,80 L 120,120 Z" /></clipPath>
        </defs>
        <g id="tail">
          <path d="M 130,150 Q 240,200 270,70 C 200,40 150,10 110,80 L 120,120 Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="7" />
          <g clipPath="url(#tail-clip)">
            <path d="M 155,105 L 195,165" stroke="#374151" strokeWidth="22" strokeLinecap="round" />
            <path d="M 185,75 L 230,135" stroke="#374151" strokeWidth="22" strokeLinecap="round" />
            <path d="M 215,50 L 255,105" stroke="#374151" strokeWidth="20" strokeLinecap="round" />
          </g>
        </g>
        <g id="body-group">
          <ellipse cx="100" cy="135" rx="55" ry="50" fill="#9ca3af" stroke="#4b5563" strokeWidth="6" />
          <ellipse cx="100" cy="140" rx="35" ry="32" fill="#f3f4f6" />
          <g id="feet">
            <path d="M 45,170 L 85,170 L 65,185 Z" fill="#6b7280" stroke="#4b5563" strokeWidth="4" />
            <path d="M 155,170 L 115,170 L 135,185 Z" fill="#6b7280" stroke="#4b5563" strokeWidth="4" />
          </g>
          <g id="head">
            <path d="M 40,50 L 20,10 L 75,30 Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="6" />
            <path d="M 38,42 L 25,18 L 65,30 Z" fill="#fbcfe8" />
            <path d="M 160,50 L 180,10 L 125,30 Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="6" />
            <path d="M 162,42 L 175,18 L 135,30 Z" fill="#fbcfe8" />
            <ellipse cx="100" cy="75" rx="70" ry="52" fill="#9ca3af" stroke="#4b5563" strokeWidth="6" />
            <path d="M 30,75 L 30,45 Q 100,60 170,45 L 170,75 Q 170,105 100,85 Q 30,105 30,75 Z" fill="#4b5563" />
            <ellipse cx="100" cy="98" rx="35" ry="25" fill="#f3f4f6" />
            <g id="eyes-group">
              <circle cx="65" cy="72" r="12" fill="#111827" /><circle cx="62" cy="68" r="4" fill="white" />
              <circle cx="135" cy="72" r="12" fill="#111827" /><circle cx="132" cy="68" r="4" fill="white" />
            </g>
            <ellipse cx="100" cy="90" rx="8" ry="6" fill="#111827" />
            <path id="mouth-smile" d="M 88,105 Q 100,118 112,105" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
            <g id="mouth-open">
              <path d="M 80,98 Q 100,138 120,98 Q 100,114 80,98 Z" fill="#7f1d1d" stroke="#111827" strokeWidth="2" />
              <path d="M 84,99 L 90,89 L 96,99 Z" fill="#f8fafc" />
              <path d="M 116,99 L 110,89 L 104,99 Z" fill="#f8fafc" />
              <ellipse cx="100" cy="119" rx="8" ry="5" fill="#fb7185" />
            </g>
          </g>
          <g id="arms">
            <path d="M 60,130 L 75,160 L 90,150" fill="none" stroke="#6b7280" strokeWidth="14" strokeLinecap="round" />
            <g id="arm-right">
              <path d="M 140,130 L 125,160 L 110,150" fill="none" stroke="#6b7280" strokeWidth="14" strokeLinecap="round" />
            </g>
          </g>
          <g id="custom-armor">
            <path d="M 35,125 Q 55,100 75,125 L 65,145 Q 45,140 35,135 Z" fill="#94a3b8" stroke="#475569" strokeWidth="4" />
            <path d="M 165,125 Q 145,100 125,125 L 135,145 Q 155,140 165,135 Z" fill="#94a3b8" stroke="#475569" strokeWidth="4" />
            <circle cx="55" cy="125" r="3" fill="#fbbf24" /><circle cx="145" cy="125" r="3" fill="#fbbf24" />

            <path d="M 45,148 C 45,133 155,133 155,148 C 155,178 120,188 100,188 C 80,188 45,178 45,148 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="4" onClick={onShieldTap} style={{ pointerEvents: onShieldTap ? 'auto' : 'none', cursor: onShieldTap ? 'default' : 'inherit' }} />
            <path d="M 55,143 C 55,136 145,136 145,143 C 145,153 100,158 55,153 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="3" />

            <g transform="translate(100, 150)">
              <path d="M -5,-12 L -5,35 L 5,35 L 5,-12 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" />
              <path d="M -25,3 L 25,3 L 25,13 L -25,13 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" />
              <circle cx="0" cy="8" r="8" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
            </g>

            <path d="M 45,148 C 45,133 155,133 155,148" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
            <path d="M 45,148 C 45,178 80,188 100,188 C 120,188 155,178 155,148" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />

            <g transform="translate(60, 155) rotate(-15) scale(0.9)">
              <ellipse cx="0" cy="5" rx="28" ry="38" fill="#000000" opacity="0.2" transform="rotate(15)" />
              <path d="M -28,-30 L 28,-30 L 28,10 C 28,35 0,55 0,55 C 0,55 -28,35 -28,10 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="4" />
              <path d="M -28,-30 L 28,-30 L 28,10 C 28,35 0,55 0,55 C 0,55 -28,35 -28,10 Z" fill="none" stroke="#fbbf24" strokeWidth="6" />
              <path d="M 0,-20 L 0,35" fill="none" stroke="#dc2626" strokeWidth="5" />
              <path d="M -15,0 L 15,0" fill="none" stroke="#dc2626" strokeWidth="5" />
              <circle cx="-22" cy="-22" r="3" fill="#b45309" /><circle cx="22" cy="-22" r="3" fill="#b45309" /><circle cx="0" cy="45" r="3" fill="#b45309" />
            </g>

            <g transform="translate(145, 155) rotate(25) scale(0.9)">
              <rect x="-4" y="-60" width="8" height="70" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              <path d="M -4,-60 L 0,-70 L 4,-60" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              <path d="M -18,10 L 18,10 L 15,18 L -15,18 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
              <rect x="-4" y="18" width="8" height="18" fill="#78350f" stroke="#451a03" strokeWidth="2" />
              <circle cx="0" cy="40" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
            </g>

            <g id="knight-helm" transform="translate(0, -2)">
              <path d="M 35,65 C 35,10 165,10 165,65 C 165,75 145,65 145,55 C 145,30 55,30 55,55 C 55,65 35,75 35,65 Z" fill="#94a3b8" stroke="#475569" strokeWidth="4" />
              <path d="M 40,65 C 60,35 140,35 160,65" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
              <path d="M 60,55 C 80,45 120,45 140,55" fill="none" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
              <circle cx="100" cy="18" r="7" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
              <path d="M 100,18 Q 120,-30 75,-45 Q 140,-15 100,18 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
})

export default RaccoonCharacter
