import { createContext, useReducer, type ReactNode } from 'react';
import { gameReducer, initialGameState, type Action, type GameState } from '../lib/gameReducer';

type GameStateContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

/**
 * Internal context — imported only by `useGameState`. Components MUST consume
 * game state via the hook so the Context can be swapped or wrapped without
 * touching every callsite.
 */
export const _GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  return (
    <_GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </_GameStateContext.Provider>
  );
}
