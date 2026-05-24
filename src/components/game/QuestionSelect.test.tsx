import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionSelect } from './QuestionSelect';
import type { SpeedSelectQuestion } from '../../lib/schemas/question.schema';
import { uiStrings } from '../../content/uiStrings';

const fixtureQuestion: SpeedSelectQuestion = {
  prompt: 'Pick what is correct',
  criteriaType: 'items-in-dish',
  items: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
  correctSet: ['Alpha', 'Charlie', 'Echo'],
  menuRefs: [],
};

// Identity rng — preserves the items array order so tests can predict positions.
const identityRng = () => 0.999;

// Sync-zero props for fast tests (skip the reveal-delay timers).
const syncProps = { correctRevealMs: 0, wrongRevealMs: 0 };

describe('QuestionSelect', () => {
  describe('default render', () => {
    it('renders the prompt', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByText(fixtureQuestion.prompt)).toBeTruthy();
    });

    it('renders all 5 items as buttons', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      for (const item of fixtureQuestion.items) {
        expect(screen.getByRole('button', { name: item })).toBeTruthy();
      }
    });

    it('renders the LOCK IT IN button', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.lockIn })).toBeTruthy();
    });

    it('renders the timer progressbar', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toBeTruthy();
    });

    it('all items start with aria-pressed="false" (unselected)', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      for (const item of fixtureQuestion.items) {
        expect(screen.getByRole('button', { name: item }).getAttribute('aria-pressed')).toBe('false');
      }
    });
  });

  describe('toggle selection', () => {
    it('tapping an unselected item flips aria-pressed to true', async () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      const alpha = screen.getByRole('button', { name: 'Alpha' });
      await userEvent.click(alpha);
      expect(alpha.getAttribute('aria-pressed')).toBe('true');
    });

    it('tapping a selected item flips aria-pressed back to false', async () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      const alpha = screen.getByRole('button', { name: 'Alpha' });
      await userEvent.click(alpha);
      await userEvent.click(alpha);
      expect(alpha.getAttribute('aria-pressed')).toBe('false');
    });

    it('multiple selections accumulate independently', async () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      expect(screen.getByRole('button', { name: 'Alpha' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Charlie' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Bravo' }).getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('submit', () => {
    it('exact match (Alpha+Charlie+Echo) → onAnswer(true)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      await userEvent.click(screen.getByRole('button', { name: 'Echo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(true);
    });

    it('missing a correct item → onAnswer(false)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('extra wrong item → onAnswer(false)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      await userEvent.click(screen.getByRole('button', { name: 'Echo' }));
      await userEvent.click(screen.getByRole('button', { name: 'Bravo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('empty selection with non-empty correctSet → onAnswer(false)', () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledWith(false);
    });
  });

  describe('post-submit reveal (4-way variant matrix)', () => {
    it('applies correct variant per (selected, correct) combination', async () => {
      const { container } = render(
        <QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />,
      );
      // User picks Alpha (correct), Bravo (wrong); leaves Charlie+Echo (correct) unpicked, Delta unpicked (correctly).
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Bravo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));

      const buttons = container.querySelectorAll('[data-variant]');
      const variantByName = new Map<string, string>();
      for (const btn of buttons) {
        const name = btn.textContent?.trim() ?? '';
        variantByName.set(name, btn.getAttribute('data-variant') ?? '');
      }

      expect(variantByName.get('Alpha')).toBe('revealed-correct');     // selected ∧ correct
      expect(variantByName.get('Bravo')).toBe('revealed-wrong');       // selected ∧ ¬correct
      expect(variantByName.get('Charlie')).toBe('revealed-missed');    // ¬selected ∧ correct
      expect(variantByName.get('Echo')).toBe('revealed-missed');       // ¬selected ∧ correct
      expect(variantByName.get('Delta')).toBe('default');              // ¬selected ∧ ¬correct
    });

    it('LOCK IT IN button stays mounted but is disabled after submission (no layout shift)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      await userEvent.click(screen.getByRole('button', { name: 'Echo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      const buttonAfter = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      expect(buttonAfter).toBeTruthy();
      expect(buttonAfter).toHaveProperty('disabled', true);
      fireEvent.click(buttonAfter);
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('timer expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-submits as wrong when the timer expires with empty selection', () => {
      const onAnswer = vi.fn();
      render(
        <QuestionSelect
          question={fixtureQuestion}
          onAnswer={onAnswer}
          rng={identityRng}
          durationSeconds={2}
          correctRevealMs={0}
          wrongRevealMs={0}
        />,
      );
      act(() => { vi.advanceTimersByTime(2000); });
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(false);
    });
  });
});
