import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback } from 'react'
import Biome from './biome/Biome'
import GameHudOverlay from './GameHudOverlay'
import { GAMES } from '../games'

export default function GameStage({ level, attempt, active, onWin, onLose, onMood, hintRequestId }) {
  const GameComponent = GAMES[level.game]
  const [hud, setHud] = useState(null)
  const onHud = useCallback((h) => setHud(h), [])

  return (
    <>
      <div className="canvas-layer">
        <Canvas shadows flat dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}>
            <Biome type={level.biome} />
            {GameComponent && (
              <GameComponent key={`${level.id}-${attempt}`} active={active} onWin={onWin} onLose={onLose} onHud={onHud} onMood={onMood} hintRequestId={hintRequestId} />
            )}
          </Suspense>
        </Canvas>
      </div>
      <GameHudOverlay hud={hud} />
    </>
  )
}
