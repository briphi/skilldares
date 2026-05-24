import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionMC } from './QuestionMC';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';

const fixtureQuestion: MultipleChoiceQuestion = {
  prompt: 'Which IS a Kildares Wing flavor?',
  options: ['Whiskey BBQ', 'Garlic Parm', 'Soap-Glazed Sadness', 'Buffalo'],
  correctIndex: 0,
  funnyWrongIndex: 2,
  menuRefs: [],
};

describe('QuestionMC', () => {
  describe('default render', () => {
    it('renders the prompt', () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      expect(screen.getByText(fixtureQuestion.prompt)).toBeTruthy();
    });

    it('renders all 4 options as buttons', () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      for (const option of fixtureQuestion.options) {
        expect(screen.getByRole('button', { name: option })).toBeTruthy();
      }
    });

    it('starts with no quadrants disabled', () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      for (const option of fixtureQuestion.options) {
        const btn = screen.getByRole('button', { name: option });
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      }
    });
  });

  describe('lock-on-tap', () => {
    it('calls onAnswer(true) when the correct quadrant is tapped', async () => {
      const onAnswer = vi.fn();
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={onAnswer} />);
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(true);
    });

    it('calls onAnswer(false) when a wrong quadrant is tapped', async () => {
      const onAnswer = vi.fn();
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={onAnswer} />);
      await userEvent.click(screen.getByRole('button', { name: 'Buffalo' }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('ignores subsequent taps after the first', async () => {
      const onAnswer = vi.fn();
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={onAnswer} />);
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));
      await userEvent.click(screen.getByRole('button', { name: 'Buffalo' }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('post-answer reveal', () => {
    it('marks correct/wrong-selected/muted states after a wrong tap', async () => {
      const { container } = render(
        <QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Buffalo' }));

      const correctBtn = container.querySelector('[data-quadrant-index="0"]');
      const pickedBtn = container.querySelector('[data-quadrant-index="3"]');
      const mutedBtn = container.querySelector('[data-quadrant-index="1"]');

      expect(correctBtn?.getAttribute('data-quadrant-state')).toBe('correct');
      expect(pickedBtn?.getAttribute('data-quadrant-state')).toBe('wrongSelected');
      expect(mutedBtn?.getAttribute('data-quadrant-state')).toBe('muted');
    });

    it('marks only the correct quadrant after a correct tap (others muted)', async () => {
      const { container } = render(
        <QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));

      expect(
        container.querySelector('[data-quadrant-index="0"]')!.getAttribute('data-quadrant-state'),
      ).toBe('correct');
      for (const idx of [1, 2, 3]) {
        expect(
          container.querySelector(`[data-quadrant-index="${idx}"]`)!.getAttribute('data-quadrant-state'),
        ).toBe('muted');
      }
    });

    it('disables all quadrants after the first tap', async () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));
      for (const option of fixtureQuestion.options) {
        expect(
          (screen.getByRole('button', { name: option }) as HTMLButtonElement).disabled,
        ).toBe(true);
      }
    });
  });

  describe('hint greying', () => {
    it('greys out one wrong distractor when usedHint is true (rng=0 picks first distractor)', () => {
      const { container } = render(
        <QuestionMC
          question={fixtureQuestion}
          usedHint
          onAnswer={() => {}}
          rng={() => 0}
        />,
      );
      // distractors = [1, 3] (skip correctIndex 0 and funnyWrongIndex 2)
      // rng=0 → distractors[0] = index 1 (Garlic Parm)
      const greyedBtn = container.querySelector('[data-quadrant-state="greyed"]');
      expect(greyedBtn).toBeTruthy();
      expect(greyedBtn?.getAttribute('data-quadrant-index')).toBe('1');
      expect((greyedBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('never greys out the funny-wrong option (rng=0.99 picks last distractor, not funny)', () => {
      const { container } = render(
        <QuestionMC
          question={fixtureQuestion}
          usedHint
          onAnswer={() => {}}
          rng={() => 0.99}
        />,
      );
      // distractors = [1, 3]; rng=0.99 → Math.floor(0.99 * 2) = 1 → index 3
      const greyedBtn = container.querySelector('[data-quadrant-state="greyed"]');
      expect(greyedBtn?.getAttribute('data-quadrant-index')).toBe('3');
      // Funny-wrong (index 2) is NOT greyed.
      const funnyBtn = container.querySelector('[data-quadrant-index="2"]');
      expect(funnyBtn?.getAttribute('data-quadrant-state')).toBe('default');
    });

    it('tapping the greyed quadrant does NOT call onAnswer', async () => {
      const onAnswer = vi.fn();
      render(
        <QuestionMC
          question={fixtureQuestion}
          usedHint
          onAnswer={onAnswer}
          rng={() => 0}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Garlic Parm' }));
      expect(onAnswer).not.toHaveBeenCalled();
    });
  });
});
