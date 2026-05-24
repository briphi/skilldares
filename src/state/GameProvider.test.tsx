import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider } from './GameProvider';
import { useGameState } from './useGameState';
import { TOTAL_ROUNDS, type GameQuestion } from '../lib/gameReducer';
import type { MultipleChoiceQuestion } from '../lib/schemas/question.schema';

const mcFixture: MultipleChoiceQuestion = {
  prompt: 'Test prompt',
  options: ['a', 'b', 'c', 'd'],
  correctIndex: 0,
  funnyWrongIndex: 1,
  menuRefs: [],
};

function makeQuestions(count: number): GameQuestion[] {
  return Array.from({ length: count }, () => ({ type: 'mc', question: mcFixture }));
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

describe('useGameState', () => {
  it('throws a clear error when used outside <GameProvider>', () => {
    // Suppress React's console.error noise from the thrown render error.
    const originalError = console.error;
    console.error = () => {};
    try {
      expect(() => renderHook(() => useGameState())).toThrow(
        /useGameState must be used inside <GameProvider>/,
      );
    } finally {
      console.error = originalError;
    }
  });

  it('returns initialGameState when first mounted inside the provider', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    expect(result.current.state.phase).toBe('start');
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.streak).toBe(0);
    expect(result.current.state.questions).toEqual([]);
  });

  it('helpers.startGame transitions to question phase with seeded questions', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const qs = makeQuestions(TOTAL_ROUNDS);

    act(() => {
      result.current.helpers.startGame(qs);
    });

    expect(result.current.state.phase).toBe('question');
    expect(result.current.state.questions).toHaveLength(TOTAL_ROUNDS);
    expect(result.current.state.roundIndex).toBe(0);
  });

  it('useHint then answerQuestion(true) awards 2 points', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });

    act(() => {
      result.current.helpers.startGame(makeQuestions(TOTAL_ROUNDS));
    });
    act(() => {
      result.current.helpers.useHint();
    });
    expect(result.current.state.usedHintThisQuestion).toBe(true);

    act(() => {
      result.current.helpers.answerQuestion(true);
    });
    expect(result.current.state.score).toBe(2);
    expect(result.current.state.phase).toBe('feedback');
    expect(result.current.state.lastFeedback).toEqual({ isCorrect: true, pool: 'right-no-streak' });
  });

  it('drives a full mini-game loop: start → answer → advance → … → finish → playAgain', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });

    // Start
    act(() => {
      result.current.helpers.startGame(makeQuestions(TOTAL_ROUNDS));
    });
    expect(result.current.state.phase).toBe('question');

    // Answer round 1 correctly, advance
    act(() => {
      result.current.helpers.answerQuestion(true);
    });
    expect(result.current.state.score).toBe(5);

    act(() => {
      result.current.helpers.advanceToNext();
    });
    expect(result.current.state.roundIndex).toBe(1);
    expect(result.current.state.phase).toBe('question');

    // Answer round 2 wrong
    act(() => {
      result.current.helpers.answerQuestion(false);
    });
    expect(result.current.state.score).toBe(5);
    expect(result.current.state.streak).toBe(-1);

    // Advance from feedback (round 1) to question phase round 2
    act(() => {
      result.current.helpers.advanceToNext();
    });
    expect(result.current.state.roundIndex).toBe(2);

    // Walk to the last round — each helper pair in its own act so state updates flush
    for (let i = result.current.state.roundIndex; i < TOTAL_ROUNDS - 1; i++) {
      act(() => {
        result.current.helpers.answerQuestion(true);
      });
      act(() => {
        result.current.helpers.advanceToNext();
      });
    }
    expect(result.current.state.roundIndex).toBe(TOTAL_ROUNDS - 1);
    expect(result.current.state.phase).toBe('question');

    // Final answer + finish
    act(() => {
      result.current.helpers.answerQuestion(true);
    });
    expect(result.current.state.phase).toBe('feedback');

    act(() => {
      result.current.helpers.finishGame();
    });
    expect(result.current.state.phase).toBe('end');

    const finalScore = result.current.state.score;
    expect(finalScore).toBeGreaterThan(0);

    // Play again wipes the slate
    act(() => {
      result.current.helpers.playAgain(makeQuestions(TOTAL_ROUNDS));
    });
    expect(result.current.state.phase).toBe('question');
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.streak).toBe(0);
    expect(result.current.state.roundIndex).toBe(0);
  });

  it('helpers have stable identity across re-renders', () => {
    const { result, rerender } = renderHook(() => useGameState(), { wrapper });
    const helpersBefore = result.current.helpers;
    rerender();
    expect(result.current.helpers).toBe(helpersBefore);
  });
});
