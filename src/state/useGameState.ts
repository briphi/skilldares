import { useContext, useMemo, type Dispatch } from 'react';
import { _GameStateContext } from './GameProvider';
import type { Action, GameQuestion, GameState } from '../lib/gameReducer';

/**
 * Skilldares — useGameState.
 *
 * Single consumer hook for game state. Components MUST go through this hook —
 * never call useContext(_GameStateContext) directly, never construct Action
 * objects directly. Helpers wrap dispatch for every action.
 */

export type GameStateHelpers = {
  startGame: (questions: GameQuestion[]) => void;
  answerQuestion: (isCorrect: boolean) => void;
  useHint: () => void;
  advanceToNext: () => void;
  finishGame: () => void;
  playAgain: (questions: GameQuestion[]) => void;
};

export type UseGameStateResult = {
  state: GameState;
  dispatch: Dispatch<Action>;
  helpers: GameStateHelpers;
};

export function useGameState(): UseGameStateResult {
  const ctx = useContext(_GameStateContext);
  if (ctx === null) {
    throw new Error('useGameState must be used inside <GameProvider>');
  }
  const { state, dispatch } = ctx;

  const helpers = useMemo<GameStateHelpers>(
    () => ({
      startGame: (questions) => dispatch({ type: 'START_GAME', payload: { questions } }),
      answerQuestion: (isCorrect) => dispatch({ type: 'ANSWER_QUESTION', payload: { isCorrect } }),
      useHint: () => dispatch({ type: 'USE_HINT' }),
      advanceToNext: () => dispatch({ type: 'ADVANCE_TO_NEXT' }),
      finishGame: () => dispatch({ type: 'FINISH_GAME' }),
      playAgain: (questions) => dispatch({ type: 'PLAY_AGAIN', payload: { questions } }),
    }),
    [dispatch],
  );

  return { state, dispatch, helpers };
}
