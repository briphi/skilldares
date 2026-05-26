import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { GameProvider } from './state/GameProvider';
import { useGameState } from './state/useGameState';
import { useHighScore } from './state/useHighScore';
import { useEndOfGameHighScorePersist } from './state/useEndOfGameHighScorePersist';
import { StartScreen } from './components/start/StartScreen';
import { GameScreen } from './components/game/GameScreen';
import { EndScreen } from './components/end/EndScreen';
import { selectGameQuestions } from './lib/questionSelection';
import { defaultRng } from './lib/rng';
import { parseGameConfigFromSearch, parseTestEndScreenFromSearch } from './lib/urlConfig';
import { gameScreenEnter, transitionFlash } from './lib/motionVariants';
import styles from './App.module.css';
import {
  MultipleChoicePoolSchema,
  SpeedOrderPoolSchema,
  SpeedSelectPoolSchema,
} from './lib/schemas/question.schema';
import rawMC from '../data/questions/multiple-choice.json';
import rawOrder from '../data/questions/speed-order.json';
import rawSelect from '../data/questions/speed-select.json';

// Validate + parse at module scope; failures throw → ErrorBoundary.
const mcPool = MultipleChoicePoolSchema.parse(rawMC);
const orderPool = SpeedOrderPoolSchema.parse(rawOrder);
const selectPool = SpeedSelectPoolSchema.parse(rawSelect);

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const { state, helpers } = useGameState();
  const { highScore, updateHighScore } = useHighScore();

  const { previousHighScore } = useEndOfGameHighScorePersist(
    state.phase,
    state.score,
    highScore,
    updateHighScore,
  );

  // Parse ?mc=N&speed=N once per mount. Re-reading on every Start would be
  // pointless: SPA, no navigation between games.
  const roundCounts = useMemo(
    () =>
      parseGameConfigFromSearch(window.location.search, {
        mc: mcPool.length,
        speed: orderPool.length + selectPool.length,
      }),
    [],
  );

  // Parse ?highScore / ?endScreen (+ optional &correct &total) once per
  // mount. When set AND the player hasn't started a real game yet, we
  // short-circuit to the appropriate EndScreen variant below. Doesn't
  // touch the persist hook so it can't pollute the player's real high
  // score. correct/total drive the grade badge so any tier is previewable.
  const testEndScreen = useMemo(
    () => parseTestEndScreenFromSearch(window.location.search),
    [],
  );

  // Drives the brief full-screen flash that pulses during the
  // Start → first question transition. Independent of game phase so
  // it can render on top of both the exiting StartScreen and the
  // entering GameScreen during the handoff.
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);

  const handleStart = useCallback(() => {
    setIsFlashing(true);
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => setIsFlashing(false), 500);
    helpers.startGame(
      selectGameQuestions(mcPool, orderPool, selectPool, defaultRng, roundCounts),
    );
  }, [helpers, roundCounts]);

  // End screen's Play Again button drops back to the Start screen so
  // the player can re-read the encouragement message and decide whether
  // to commit to another round. The actual game-start flow happens when
  // they then tap Start, which routes through handleStart above (with
  // the transition flash and fresh question selection).
  const handleReturnToStart = useCallback(() => {
    helpers.returnToStart();
  }, [helpers]);

  return (
    <>
      {/* mode="wait" → the exiting StartScreen finishes its scale-up +
          fade-out animation before the GameScreen mounts and plays its
          scale-in + fade-in entrance. */}
      <AnimatePresence mode="wait">
        {state.phase === 'start' && testEndScreen !== null && (
          // ?highScore / ?endScreen test mode — render EndScreen directly,
          // bypassing gameplay. Tapping Play Again starts a real game and
          // leaves the test mode behind (state.phase != 'start').
          //
          // Celebrating: previousPersonalBest=null forces the celebrating
          //   variant regardless of stored PB.
          // Standard: synthesize a personalBest that's > finalScore so
          //   finalScore > previousPersonalBest is false → standard variant.
          //   Bumps by 30 so the ALL-TIME BEST row shows a believable PB.
          <EndScreen
            key="test-end-screen"
            finalScore={testEndScreen.finalScore}
            personalBest={
              testEndScreen.variant === 'celebrating'
                ? testEndScreen.finalScore
                : testEndScreen.finalScore + 30
            }
            previousPersonalBest={
              testEndScreen.variant === 'celebrating'
                ? null
                : testEndScreen.finalScore + 30
            }
            correctCount={testEndScreen.correctCount}
            totalQuestions={testEndScreen.totalQuestions}
            onPlayAgain={handleStart}
          />
        )}
        {state.phase === 'start' && testEndScreen === null && (
          <StartScreen key="start" onStart={handleStart} />
        )}
        {(state.phase === 'question' ||
          state.phase === 'feedback' ||
          state.phase === 'review') && (
          <motion.div
            key="game"
            variants={gameScreenEnter}
            initial="initial"
            animate="animate"
          >
            <GameScreen />
          </motion.div>
        )}
        {state.phase === 'end' && (
          <EndScreen
            key="end"
            finalScore={state.score}
            personalBest={highScore}
            previousPersonalBest={previousHighScore}
            correctCount={state.correctCount}
            totalQuestions={state.questions.length}
            onPlayAgain={handleReturnToStart}
          />
        )}
      </AnimatePresence>

      {/* Full-screen accent-color flash. Rendered independently of the
          phase-driven AnimatePresence so it can pulse OVER the transition
          rather than waiting for one screen to leave before the other
          enters. */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            key="transition-flash"
            className={styles.transitionFlash}
            variants={transitionFlash}
            initial="initial"
            animate="animate"
            exit="exit"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
