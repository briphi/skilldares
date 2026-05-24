import { useCallback } from 'react';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { GameProvider } from './state/GameProvider';
import { useGameState } from './state/useGameState';
import { useHighScore } from './state/useHighScore';
import { useEndOfGameHighScorePersist } from './state/useEndOfGameHighScorePersist';
import { StartScreen } from './components/start/StartScreen';
import { GameScreen } from './components/game/GameScreen';
import { EndScreen } from './components/end/EndScreen';
import { selectEpic1Game } from './lib/gameSetup';
import { defaultRng } from './lib/rng';
import { MultipleChoicePoolSchema } from './lib/schemas/question.schema';
import rawMC from '../data/questions/multiple-choice.json';

// Validate + parse at module scope; failures throw → ErrorBoundary.
const mcPool = MultipleChoicePoolSchema.parse(rawMC);

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

  useEndOfGameHighScorePersist(state.phase, state.score, highScore, updateHighScore);

  const handleStart = useCallback(() => {
    helpers.startGame(selectEpic1Game(mcPool, defaultRng));
  }, [helpers]);

  const handlePlayAgain = useCallback(() => {
    helpers.playAgain(selectEpic1Game(mcPool, defaultRng));
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
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
}

export default App;
