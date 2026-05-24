import { useCallback } from 'react';
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

  const handleStart = useCallback(() => {
    helpers.startGame(selectGameQuestions(mcPool, orderPool, selectPool, defaultRng));
  }, [helpers]);

  const handlePlayAgain = useCallback(() => {
    helpers.playAgain(selectGameQuestions(mcPool, orderPool, selectPool, defaultRng));
  }, [helpers]);

  if (state.phase === 'start') {
    return <StartScreen onStart={handleStart} />;
  }
  if (state.phase === 'question' || state.phase === 'feedback') {
    return <GameScreen />;
  }
  if (state.phase === 'end') {
    return (
      <EndScreen
        finalScore={state.score}
        personalBest={highScore}
        previousPersonalBest={previousHighScore}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
}

export default App;
