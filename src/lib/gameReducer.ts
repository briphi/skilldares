/**
 * Skilldares — Game reducer (pure).
 *
 * State machine for the 30-round game loop. Pure: no React, no DOM, no I/O,
 * no random decisions (all randomness happens elsewhere — question selection
 * in Story 2.3, message selection in the FeedbackOverlay component).
 *
 * Composes existing pure modules on ANSWER_QUESTION:
 *   - computePoints (scoring.ts) — 5 / 2 / 0
 *   - pickPool      (picker.ts)  — uses the PRE-update streak per FR38
 *   - nextStreak    (streak.ts)  — signed streak transitions
 *
 * Invalid-phase actions return the state unchanged (same reference) — easy to
 * test (`expect(result).toBe(state)`), easy to debug. The reducer is the ONLY
 * place that produces new GameState values; useReducer(gameReducer) in
 * GameProvider is its ONLY caller.
 */

import type { GameQuestion } from './schemas/question.schema';
import type { MessagePoolId } from './schemas/message.schema';
import { computePoints } from './scoring';
import { nextStreak } from './streak';
import { pickPool } from './picker';

/**
 * Documentary constant for the full-game round count (Epic 2 production game).
 * The reducer's round-advance / finish guards use `state.questions.length`
 * instead — supports both the Epic 1 milestone (15-question games) and full
 * 30-round games without code change.
 */
export const TOTAL_ROUNDS = 30;

// Re-export so existing import sites (useGameState, gameSetup, tests) keep working.
export type { GameQuestion } from './schemas/question.schema';

export type GamePhase = 'start' | 'question' | 'feedback' | 'end';

export type Feedback = {
  isCorrect: boolean;
  pool: MessagePoolId;
};

export type GameState = {
  phase: GamePhase;
  questions: GameQuestion[];
  roundIndex: number;
  score: number;
  streak: number;
  usedHintThisQuestion: boolean;
  lastFeedback: Feedback | null;
};

export type Action =
  | { type: 'START_GAME'; payload: { questions: GameQuestion[] } }
  | { type: 'ANSWER_QUESTION'; payload: { isCorrect: boolean } }
  | { type: 'USE_HINT' }
  | { type: 'ADVANCE_TO_NEXT' }
  | { type: 'FINISH_GAME' }
  | { type: 'PLAY_AGAIN'; payload: { questions: GameQuestion[] } };

export const initialGameState: GameState = {
  phase: 'start',
  questions: [],
  roundIndex: 0,
  score: 0,
  streak: 0,
  usedHintThisQuestion: false,
  lastFeedback: null,
};

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      if (state.phase !== 'start') return state;
      return {
        phase: 'question',
        questions: action.payload.questions,
        roundIndex: 0,
        score: 0,
        streak: 0,
        usedHintThisQuestion: false,
        lastFeedback: null,
      };
    }

    case 'ANSWER_QUESTION': {
      if (state.phase !== 'question') return state;
      const { isCorrect } = action.payload;
      const points = computePoints(isCorrect, state.usedHintThisQuestion);
      const pool = pickPool(state.streak, isCorrect);
      const newStreak = nextStreak(state.streak, isCorrect);
      return {
        ...state,
        phase: 'feedback',
        score: state.score + points,
        streak: newStreak,
        lastFeedback: { isCorrect, pool },
      };
    }

    case 'USE_HINT': {
      if (state.phase !== 'question') return state;
      if (state.usedHintThisQuestion) return state;
      return { ...state, usedHintThisQuestion: true };
    }

    case 'ADVANCE_TO_NEXT': {
      if (state.phase !== 'feedback') return state;
      // Use state.questions.length so the guard works for both Epic 1's
      // 15-question milestone games AND full 30-round games.
      if (state.roundIndex >= state.questions.length - 1) return state;
      return {
        ...state,
        phase: 'question',
        roundIndex: state.roundIndex + 1,
        usedHintThisQuestion: false,
        lastFeedback: null,
      };
    }

    case 'FINISH_GAME': {
      if (state.phase !== 'feedback') return state;
      // Use state.questions.length (see ADVANCE_TO_NEXT comment).
      if (state.roundIndex !== state.questions.length - 1) return state;
      return { ...state, phase: 'end' };
    }

    case 'PLAY_AGAIN': {
      if (state.phase !== 'end') return state;
      return {
        phase: 'question',
        questions: action.payload.questions,
        roundIndex: 0,
        score: 0,
        streak: 0,
        usedHintThisQuestion: false,
        lastFeedback: null,
      };
    }
  }
}
