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
import { parseGameConfigFromSearch } from './lib/urlConfig';
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

  const handlePlayAgain = useCallback(() => {
    helpers.playAgain(
      selectGameQuestions(mcPool, orderPool, selectPool, defaultRng, roundCounts),
    );
  }, [helpers, roundCounts]);

  return (
    <>
      {/* mode="wait" → the exiting StartScreen finishes its scale-up +
          fade-out animation before the GameScreen mounts and plays its
          scale-in + fade-in entrance. */}
      <AnimatePresence mode="wait">
        {state.phase === 'start' && (
          <StartScreen key="start" onStart={handleStart} />
        )}
        {(state.phase === 'question' || state.phase === 'feedback') && (
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
            onPlayAgain={handlePlayAgain}
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
