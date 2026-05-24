import { describe, it, expect } from 'vitest';
import {
  gameReducer,
  initialGameState,
  TOTAL_ROUNDS,
  type GameQuestion,
  type GameState,
} from './gameReducer';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

// ---------- Inline fixtures (no JSON imports per architecture line 319) ----------

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

function playing(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'question',
    questions: makeQuestions(TOTAL_ROUNDS),
    roundIndex: 0,
    score: 0,
    streak: 0,
    usedHintThisQuestion: false,
    lastFeedback: null,
    ...overrides,
  };
}

function feedback(overrides: Partial<GameState> = {}): GameState {
  return playing({ phase: 'feedback', lastFeedback: { isCorrect: true, pool: 'right-no-streak' }, ...overrides });
}

// ---------- Initial state ----------

describe('initialGameState', () => {
  it('starts in start phase with zeros', () => {
    expect(initialGameState).toEqual({
      phase: 'start',
      questions: [],
      roundIndex: 0,
      score: 0,
      streak: 0,
      usedHintThisQuestion: false,
      lastFeedback: null,
    });
  });
});

// ---------- START_GAME ----------

describe('gameReducer: START_GAME', () => {
  it('transitions start → question and seeds questions', () => {
    const qs = makeQuestions(30);
    const result = gameReducer(initialGameState, { type: 'START_GAME', payload: { questions: qs } });
    expect(result.phase).toBe('question');
    expect(result.questions).toBe(qs);
    expect(result.roundIndex).toBe(0);
    expect(result.score).toBe(0);
    expect(result.streak).toBe(0);
    expect(result.usedHintThisQuestion).toBe(false);
    expect(result.lastFeedback).toBeNull();
  });

  it('is a no-op when not in start phase', () => {
    const state = playing();
    const result = gameReducer(state, { type: 'START_GAME', payload: { questions: makeQuestions(30) } });
    expect(result).toBe(state);
  });
});

// ---------- USE_HINT ----------

describe('gameReducer: USE_HINT', () => {
  it('sets the flag in question phase', () => {
    const result = gameReducer(playing(), { type: 'USE_HINT' });
    expect(result.usedHintThisQuestion).toBe(true);
  });

  it('is a no-op (returns same ref) when already used', () => {
    const state = playing({ usedHintThisQuestion: true });
    const result = gameReducer(state, { type: 'USE_HINT' });
    expect(result).toBe(state);
  });

  it('is a no-op outside question phase', () => {
    const state = feedback();
    const result = gameReducer(state, { type: 'USE_HINT' });
    expect(result).toBe(state);
  });
});

// ---------- ANSWER_QUESTION — scoring ----------

describe('gameReducer: ANSWER_QUESTION scoring', () => {
  it('correct without hint awards 5 points', () => {
    const result = gameReducer(playing(), { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(result.score).toBe(5);
    expect(result.phase).toBe('feedback');
  });

  it('correct with hint awards 2 points', () => {
    const result = gameReducer(
      playing({ usedHintThisQuestion: true }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: true } },
    );
    expect(result.score).toBe(2);
  });

  it('wrong awards 0 points (no hint)', () => {
    const result = gameReducer(playing(), { type: 'ANSWER_QUESTION', payload: { isCorrect: false } });
    expect(result.score).toBe(0);
  });

  it('wrong awards 0 points even when hint was used', () => {
    const result = gameReducer(
      playing({ usedHintThisQuestion: true }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: false } },
    );
    expect(result.score).toBe(0);
  });

  it('accumulates score across multiple correct answers', () => {
    let state = playing();
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    state = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(state.score).toBe(10);
  });

  it('is a no-op outside question phase', () => {
    const state = feedback();
    const result = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(result).toBe(state);
  });
});

// ---------- ANSWER_QUESTION — streak ----------

describe('gameReducer: ANSWER_QUESTION streak', () => {
  it('0 → +1 on correct', () => {
    const result = gameReducer(playing(), { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(result.streak).toBe(1);
  });

  it('0 → -1 on wrong', () => {
    const result = gameReducer(playing(), { type: 'ANSWER_QUESTION', payload: { isCorrect: false } });
    expect(result.streak).toBe(-1);
  });

  it('+2 → +3 on correct (crosses on-fire threshold)', () => {
    const result = gameReducer(
      playing({ streak: 2 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: true } },
    );
    expect(result.streak).toBe(3);
  });

  it('+5 → -1 on wrong (resets positive streak)', () => {
    const result = gameReducer(
      playing({ streak: 5 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: false } },
    );
    expect(result.streak).toBe(-1);
  });

  it('-3 → +1 on correct (resets negative streak)', () => {
    const result = gameReducer(
      playing({ streak: -3 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: true } },
    );
    expect(result.streak).toBe(1);
  });
});

// ---------- ANSWER_QUESTION — pool selection (FR38) ----------

describe('gameReducer: ANSWER_QUESTION pool selection', () => {
  it('right-no-streak when correct from streak 0', () => {
    const result = gameReducer(playing(), { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(result.lastFeedback).toEqual({ isCorrect: true, pool: 'right-no-streak' });
  });

  it('on-fire when correct pushes streak to >=3', () => {
    const result = gameReducer(
      playing({ streak: 2 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: true } },
    );
    expect(result.lastFeedback?.pool).toBe('on-fire');
  });

  it('comeback when correct from streak <= -3', () => {
    const result = gameReducer(
      playing({ streak: -3 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: true } },
    );
    expect(result.lastFeedback?.pool).toBe('comeback');
  });

  it('wrong-no-streak when wrong from streak 0', () => {
    const result = gameReducer(playing(), { type: 'ANSWER_QUESTION', payload: { isCorrect: false } });
    expect(result.lastFeedback).toEqual({ isCorrect: false, pool: 'wrong-no-streak' });
  });

  it('streak-broken when wrong from streak >= 3', () => {
    const result = gameReducer(
      playing({ streak: 3 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: false } },
    );
    expect(result.lastFeedback?.pool).toBe('streak-broken');
  });

  it('doing-bad when wrong pushes streak to <= -3', () => {
    const result = gameReducer(
      playing({ streak: -2 }),
      { type: 'ANSWER_QUESTION', payload: { isCorrect: false } },
    );
    expect(result.lastFeedback?.pool).toBe('doing-bad');
  });
});

// ---------- ADVANCE_TO_NEXT ----------

describe('gameReducer: ADVANCE_TO_NEXT', () => {
  it('advances mid-game and resets per-question flags', () => {
    const state = feedback({ roundIndex: 5, usedHintThisQuestion: true });
    const result = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    expect(result.phase).toBe('question');
    expect(result.roundIndex).toBe(6);
    expect(result.usedHintThisQuestion).toBe(false);
    expect(result.lastFeedback).toBeNull();
  });

  it('is a no-op on the last round (use FINISH_GAME)', () => {
    const state = feedback({ roundIndex: TOTAL_ROUNDS - 1 });
    const result = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    expect(result).toBe(state);
  });

  it('is a no-op outside feedback phase', () => {
    const state = playing();
    const result = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    expect(result).toBe(state);
  });
});

// ---------- FINISH_GAME ----------

describe('gameReducer: FINISH_GAME', () => {
  it('transitions feedback → end on the last round', () => {
    const state = feedback({ roundIndex: TOTAL_ROUNDS - 1, score: 42 });
    const result = gameReducer(state, { type: 'FINISH_GAME' });
    expect(result.phase).toBe('end');
    expect(result.score).toBe(42);
  });

  it('is a no-op before the last round', () => {
    const state = feedback({ roundIndex: 10 });
    const result = gameReducer(state, { type: 'FINISH_GAME' });
    expect(result).toBe(state);
  });

  it('is a no-op outside feedback phase', () => {
    const state = playing({ roundIndex: TOTAL_ROUNDS - 1 });
    const result = gameReducer(state, { type: 'FINISH_GAME' });
    expect(result).toBe(state);
  });
});

// ---------- PLAY_AGAIN ----------

describe('gameReducer: PLAY_AGAIN', () => {
  it('resets game state and seeds fresh questions from end phase', () => {
    const state: GameState = {
      phase: 'end',
      questions: makeQuestions(TOTAL_ROUNDS),
      roundIndex: TOTAL_ROUNDS - 1,
      score: 87,
      streak: -2,
      usedHintThisQuestion: true,
      lastFeedback: { isCorrect: false, pool: 'wrong-no-streak' },
    };
    const fresh = makeQuestions(TOTAL_ROUNDS);
    const result = gameReducer(state, { type: 'PLAY_AGAIN', payload: { questions: fresh } });
    expect(result.phase).toBe('question');
    expect(result.questions).toBe(fresh);
    expect(result.roundIndex).toBe(0);
    expect(result.score).toBe(0);
    expect(result.streak).toBe(0);
    expect(result.usedHintThisQuestion).toBe(false);
    expect(result.lastFeedback).toBeNull();
  });

  it('is a no-op outside end phase', () => {
    const state = playing();
    const result = gameReducer(state, { type: 'PLAY_AGAIN', payload: { questions: makeQuestions(30) } });
    expect(result).toBe(state);
  });
});

// ---------- Immutability ----------

describe('gameReducer: immutability', () => {
  it('does not mutate the input state on ANSWER_QUESTION', () => {
    const state = playing({ score: 10, streak: 1 });
    const snapshot = { ...state };
    gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(state).toEqual(snapshot);
  });

  it('returns a new object reference on state-changing actions', () => {
    const state = playing();
    const result = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(result).not.toBe(state);
  });
});

// ---------- Phase-flow integration ----------

describe('gameReducer: short mini-game flow', () => {
  it('walks start → 2 rounds → end correctly', () => {
    let state = initialGameState;
    const qs = makeQuestions(TOTAL_ROUNDS);

    state = gameReducer(state, { type: 'START_GAME', payload: { questions: qs } });
    expect(state.phase).toBe('question');
    expect(state.roundIndex).toBe(0);

    // Round 1: correct
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(state.phase).toBe('feedback');
    expect(state.score).toBe(5);

    state = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    expect(state.phase).toBe('question');
    expect(state.roundIndex).toBe(1);

    // Jump to the last round to test FINISH_GAME
    state = { ...state, roundIndex: TOTAL_ROUNDS - 1 };
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: false } });
    state = gameReducer(state, { type: 'FINISH_GAME' });
    expect(state.phase).toBe('end');
  });
});

// ---------- Variable round count (regression guard for Story 1.17 latent bug) ----------

describe('gameReducer: variable round count uses state.questions.length, not TOTAL_ROUNDS', () => {
  it('Epic-1-style 5-question game advances through all rounds and FINISH_GAME fires on the last', () => {
    const qs = makeQuestions(5);
    let state = gameReducer(initialGameState, { type: 'START_GAME', payload: { questions: qs } });
    expect(state.phase).toBe('question');

    // Walk through 4 rounds: answer + advance.
    for (let r = 0; r < 4; r++) {
      state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
      state = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    }
    // Now on round 5 (roundIndex=4, last round); answer it.
    expect(state.roundIndex).toBe(4);
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    expect(state.phase).toBe('feedback');

    // ADVANCE_TO_NEXT on last round is a no-op (uses questions.length, not TOTAL_ROUNDS).
    const noOpAdvance = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    expect(noOpAdvance).toBe(state);

    // FINISH_GAME works on the last round.
    state = gameReducer(state, { type: 'FINISH_GAME' });
    expect(state.phase).toBe('end');
  });

  it('FINISH_GAME is a no-op when roundIndex !== questions.length - 1 (mid-game)', () => {
    const qs = makeQuestions(5);
    let state = gameReducer(initialGameState, { type: 'START_GAME', payload: { questions: qs } });
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
    // roundIndex=0, questions.length=5; FINISH_GAME should not fire.
    const noOp = gameReducer(state, { type: 'FINISH_GAME' });
    expect(noOp).toBe(state);
  });
});
