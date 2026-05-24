import { describe, it, expect } from 'vitest';
import { render, screen, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider } from '../../state/GameProvider';
import { useGameState } from '../../state/useGameState';
import { GameScreen } from './GameScreen';
import type { GameQuestion } from '../../lib/gameReducer';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';
import { uiStrings } from '../../content/uiStrings';

const mcFixture: MultipleChoiceQuestion = {
  prompt: 'Test prompt',
  options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  correctIndex: 0,
  funnyWrongIndex: 2,
  menuRefs: [],
};

function makeMCQuestions(count: number): GameQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'mc',
    question: {
      ...mcFixture,
      prompt: `Question ${i + 1}`,
    },
  }));
}

/**
 * Synchronous bootstrap: dispatches START_GAME during render the first time it
 * mounts. Subsequent renders are no-ops (phase will be 'question', not 'start').
 */
function StartGameOnMount({ questions }: { questions: GameQuestion[] }) {
  const { state, helpers } = useGameState();
  if (state.phase === 'start' && state.questions.length === 0) {
    helpers.startGame(questions);
  }
  return null;
}

function setupGameScreen(questions: GameQuestion[]): RenderResult {
  return render(
    <GameProvider>
      <StartGameOnMount questions={questions} />
      {/* Sync reveal in tests — production defaults give the two-stage reveal (1500ms correct / 3000ms wrong). */}
      <GameScreen
        rng={() => 0}
        mcCorrectRevealMs={0}
        mcWrongRevealMs={0}
        mcLockDurationMs={0}
      />
    </GameProvider>,
  );
}

describe('GameScreen', () => {
  describe('question phase', () => {
    it('renders the current question, score, hint button, and progress text', () => {
      setupGameScreen(makeMCQuestions(3));
      expect(screen.getByText('Question 1')).toBeTruthy();
      expect(screen.getByText('Score:')).toBeTruthy();
      expect(screen.getByText(uiStrings.progress(1, 3))).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Hint' })).toBeTruthy();
    });

    it('does not render the feedback overlay', () => {
      setupGameScreen(makeMCQuestions(3));
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('transition to feedback phase', () => {
    it('renders the feedback overlay and hides the question + hint button after answer', async () => {
      setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.queryByText('Question 1')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Hint' })).toBeNull();
    });

    it('feedback overlay shows the correct verdict + 5 points for a correct answer', async () => {
      setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      expect(screen.getByText('✓')).toBeTruthy();
      expect(screen.getByText('+5')).toBeTruthy();
    });

    it('feedback overlay shows wrong verdict + 0 points for a wrong answer', async () => {
      setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Bravo' }));
      expect(screen.getByText('✗')).toBeTruthy();
      expect(screen.getByText('+0')).toBeTruthy();
    });
  });

  describe('advancing to the next round', () => {
    it('Tapping NEXT advances to the next question and updates progress text', async () => {
      setupGameScreen(makeMCQuestions(3));

      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      // FeedbackOverlay reveals the Next button after 400ms — findByRole polls.
      const nextBtn = await screen.findByRole('button', { name: uiStrings.buttons.next });
      await userEvent.click(nextBtn);

      expect(screen.getByText('Question 2')).toBeTruthy();
      expect(screen.getByText(uiStrings.progress(2, 3))).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('hint flow', () => {
    it('tapping HintButton greys a wrong distractor in QuestionMC', async () => {
      const { container } = setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Hint' }));

      const greyed = container.querySelector('[data-quadrant-state="greyed"]');
      expect(greyed).toBeTruthy();
      const idx = greyed?.getAttribute('data-quadrant-index');
      expect(['1', '3']).toContain(idx);
    });
  });
});
