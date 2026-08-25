import { useRef, useState } from 'react'
import { useGameStore } from './store/gameStore'
import { LEVELS, FINAL_MESSAGE } from './data/levels'
import RaccoonCharacter from './components/RaccoonCharacter'
import GameStage from './components/GameStage'
import DialogueBubble from './components/DialogueBubble'
import InstructionsBubble from './components/InstructionsBubble'
import LevelMenu from './components/LevelMenu'
import LevelTitleBanner from './components/LevelTitleBanner'
import GrapeReward from './components/GrapeReward'
import TopBar from './components/TopBar'
import HintButton from './components/HintButton'
import SkipButton from './components/SkipButton'
import EndingStage from './components/EndingStage'
import { sfx } from './utils/audio'
import { playBackgroundMusic } from './utils/music'
import './App.css'

const BG_MUSIC_SRC = '/audio/la-valse-du-jazmin.wav'

export default function App() {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const phase = useGameStore((s) => s.phase)
  const attempt = useGameStore((s) => s.attempt)
  const loseReason = useGameStore((s) => s.loseReason)
  const grapesTotal = useGameStore((s) => s.grapesTotal)
  const grapesPending = useGameStore((s) => s.grapesPending)
  const ending = useGameStore((s) => s.ending)
  const showInstructions = useGameStore((s) => s.showInstructions)
  const showLevelMenu = useGameStore((s) => s.showLevelMenu)
  const maxCompleted = useGameStore((s) => s.maxCompleted)

  const beginAdventure = useGameStore((s) => s.beginAdventure)
  const startLevel = useGameStore((s) => s.startLevel)
  const winLevel = useGameStore((s) => s.winLevel)
  const skipLevel = useGameStore((s) => s.skipLevel)
  const proceedToGrapes = useGameStore((s) => s.proceedToGrapes)
  const eatGrape = useGameStore((s) => s.eatGrape)
  const spendHint = useGameStore((s) => s.spendHint)
  const spendSkip = useGameStore((s) => s.spendSkip)
  const finishGrapes = useGameStore((s) => s.finishGrapes)
  const loseLevel = useGameStore((s) => s.loseLevel)
  const retryLevel = useGameStore((s) => s.retryLevel)
  const restartGame = useGameStore((s) => s.restartGame)
  const toggleInstructions = useGameStore((s) => s.toggleInstructions)
  const closeInstructions = useGameStore((s) => s.closeInstructions)
  const openLevelMenu = useGameStore((s) => s.openLevelMenu)
  const closeLevelMenu = useGameStore((s) => s.closeLevelMenu)
  const goToLevel = useGameStore((s) => s.goToLevel)

  const svgRef = useRef(null)
  const level = LEVELS[currentLevel - 1]
  const [chomping, setChomping] = useState(false)
  const chompTimer = useRef(null)
  const [hintRequestId, setHintRequestId] = useState(0)
  const [moodPulse, setMoodPulse] = useState(null)
  const moodTimer = useRef(null)
  const [devUnlocked, setDevUnlocked] = useState(false)
  const shieldTaps = useRef(0)
  const handleShieldTap = () => {
    shieldTaps.current += 1
    if (shieldTaps.current >= 10) setDevUnlocked(true)
  }

  const handleMood = (m, duration = 900) => {
    setMoodPulse(m)
    clearTimeout(moodTimer.current)
    moodTimer.current = setTimeout(() => setMoodPulse(null), duration)
  }

  const handleGrapeEaten = () => {
    eatGrape()
    setChomping(true)
    clearTimeout(chompTimer.current)
    chompTimer.current = setTimeout(() => setChomping(false), 550)
  }

  if (import.meta.env.DEV) window.__gameStore = useGameStore

  const handleWin = () => { sfx.win(); winLevel() }
  const handleLose = (reason) => { sfx.lose(); loseLevel(reason) }

  if (ending) {
    return <EndingStage svgRef={svgRef} message={FINAL_MESSAGE} onRestart={restartGame} />
  }

  let mood = 'idle'
  if (phase === 'prologue' || phase === 'intro' || phase === 'won' || phase === 'lost') mood = 'talking'
  if (phase === 'grape') mood = 'eating'
  if (chomping) mood = 'chomp'
  if (moodPulse) mood = moodPulse

  const showDialogue = phase === 'prologue' || phase === 'intro' || phase === 'won' || phase === 'lost'

  return (
    <div className="app-root">
      <GameStage level={level} attempt={attempt} active={phase === 'playing'} onWin={handleWin} onLose={handleLose} onMood={handleMood} hintRequestId={hintRequestId} />

      <TopBar
        level={level} grapesTotal={grapesTotal}
        showSkip={phase === 'playing' && devUnlocked} onSkip={() => { sfx.click(); skipLevel() }}
        onOpenMenu={() => { sfx.click(); openLevelMenu() }}
        onToggleInstructions={() => { sfx.click(); toggleInstructions() }}
      />

      {phase === 'playing' && !!level.hasHint && (
        <HintButton
          grapesTotal={grapesTotal}
          onHint={() => {
            if (spendHint()) { sfx.click(); setHintRequestId((n) => n + 1) }
            else sfx.hit()
          }}
        />
      )}

      {phase === 'playing' && (
        <SkipButton
          grapesTotal={grapesTotal}
          onSkip={() => { if (spendSkip()) sfx.win(); else sfx.hit() }}
        />
      )}

      {phase === 'intro' && !showInstructions && !showLevelMenu && <LevelTitleBanner level={level} />}

      <RaccoonCharacter ref={svgRef} mood={mood} onShieldTap={handleShieldTap} />

      {showInstructions ? (
        <InstructionsBubble level={level} onClose={() => { sfx.click(); closeInstructions() }} />
      ) : showDialogue && (
        <div className="dialog-bubble-wrap">
          <DialogueBubble
            phase={phase}
            level={level}
            loseReason={loseReason}
            onBeginAdventure={() => { sfx.click(); playBackgroundMusic(BG_MUSIC_SRC); beginAdventure() }}
            onStart={() => { sfx.click(); startLevel() }}
            onClaimGrapes={() => { sfx.click(); proceedToGrapes() }}
            onRetry={() => { sfx.click(); retryLevel() }}
          />
        </div>
      )}

      <GrapeReward
        active={phase === 'grape'}
        total={grapesPending || 3}
        svgRef={svgRef}
        onEatOne={handleGrapeEaten}
        onAllEaten={() => finishGrapes()}
      />

      {showLevelMenu && (
        <LevelMenu
          maxCompleted={maxCompleted}
          currentLevel={currentLevel}
          onSelect={(id) => { sfx.click(); goToLevel(id) }}
          onClose={() => { sfx.click(); closeLevelMenu() }}
        />
      )}
    </div>
  )
}
