import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { QuestionOrder } from './QuestionOrder';
import type { SpeedOrderQuestion } from '../../lib/schemas/question.schema';
import { uiStrings } from '../../content/uiStrings';

const fixturePriceQuestion: SpeedOrderQuestion = {
  prompt: 'Order from cheapest to most expensive',
  factor: 'price',
  items: [
    { name: 'A', factorValue: 1 },
    { name: 'B', factorValue: 2 },
    { name: 'C', factorValue: 3 },
  ],
  menuRefs: [],
};

const fixtureABVQuestion: SpeedOrderQuestion = {
  prompt: 'Order from lowest ABV to highest ABV',
  factor: 'ABV',
  items: [
    { name: 'Guinness', factorValue: 4.2 },
    { name: 'Bitburger', factorValue: 4.8 },
    { name: 'Fiddlehead', factorValue: 6.5 },
  ],
  menuRefs: [],
};

// Sync-zero props for fast tests (skip the reveal-delay timers).
const syncProps = { correctRevealMs: 0, wrongRevealMs: 0 };

// rng=()=>0.999 with Fisher-Yates on a 3-item array produces no swaps (canonical order).
// Useful for testing the "correct submit" path without dragging.
const identityRng = () => 0.999;

// rng=()=>0 with Fisher-Yates on [A,B,C]:
//   i=2: j=0 → swap [0]↔[2] → [C, B, A]
//   i=1: j=0 → swap [0]↔[1] → [B, C, A]
// Result: [B, C, A]. NOT canonical → submit-as-is is wrong.
const reverseishRng = () => 0;

describe('QuestionOrder', () => {
  describe('default render', () => {
    it('renders the prompt', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByText(fixturePriceQuestion.prompt)).toBeTruthy();
    });

    it('renders all items', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      for (const item of fixturePriceQuestion.items) {
        expect(screen.getByText(item.name)).toBeTruthy();
      }
    });

    it('renders the LOCK IT IN button', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.lockIn })).toBeTruthy();
    });

    it('renders the timer progressbar', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('with canonical initial order (identity rng), LOCK IT IN → onAnswer(true)', () => {
      const onAnswer = vi.fn();
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(true);
    });

    it('with shuffled-not-canonical order, LOCK IT IN → onAnswer(false)', () => {
      const onAnswer = vi.fn();
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={onAnswer} rng={reverseishRng} {...syncProps} />);
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('LOCK IT IN button stays mounted but is disabled after submission (no layout shift)', () => {
      const onAnswer = vi.fn();
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      const button = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      fireEvent.click(button);
      // Button stays mounted to preserve layout — re-query to get the post-render reference.
      const buttonAfter = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      expect(buttonAfter).toBeTruthy();
      expect(buttonAfter).toHaveProperty('disabled', true);
      // Subsequent clicks are no-ops (browser ignores clicks on disabled buttons, but assert intent).
      fireEvent.click(buttonAfter);
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('post-submit reveal', () => {
    it('items render with reveal variants and price factor subtext', () => {
      const { container } = render(
        <QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />,
      );
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      const revealedItems = container.querySelectorAll('[data-variant^="revealed-"]');
      expect(revealedItems.length).toBe(fixturePriceQuestion.items.length);
      expect(screen.getByText('$1')).toBeTruthy();
      expect(screen.getByText('$2')).toBeTruthy();
      expect(screen.getByText('$3')).toBeTruthy();
    });

    it('ABV factor formatting in reveal subtext', () => {
      render(<QuestionOrder question={fixtureABVQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(screen.getByText('4.2% ABV')).toBeTruthy();
      expect(screen.getByText('4.8% ABV')).toBeTruthy();
      expect(screen.getByText('6.5% ABV')).toBeTruthy();
    });
  });

  describe('timer expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-submits as wrong when the timer expires', () => {
      const onAnswer = vi.fn();
      render(
        <QuestionOrder
          question={fixturePriceQuestion}
          onAnswer={onAnswer}
          rng={reverseishRng}
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
