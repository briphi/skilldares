import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackOverlay } from './FeedbackOverlay';
import { uiStrings } from '../../content/uiStrings';
import type { MessagePoolId } from '../../lib/schemas/message.schema';

const baseProps = {
  message: 'Test message.',
  pointsAwarded: 5,
  pool: 'right-no-streak' as MessagePoolId,
  isLastRound: false,
  onAdvance: () => {},
};

describe('FeedbackOverlay', () => {
  describe('verdict + content', () => {
    it('renders ✓ when isCorrect=true', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect revealDelayMs={0} />);
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('renders ✗ when isCorrect=false', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect={false} revealDelayMs={0} />);
      expect(screen.getByText('✗')).toBeTruthy();
    });

    it('renders the message text from props', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect message="Custom voice line." revealDelayMs={0} />);
      expect(screen.getByText('Custom voice line.')).toBeTruthy();
    });

    it('renders the points indicator as "+{pointsAwarded}"', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect pointsAwarded={2} revealDelayMs={0} />);
      expect(screen.getByText('+2')).toBeTruthy();
    });

    it('renders +0 for a wrong answer', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect={false} pointsAwarded={0} revealDelayMs={0} />);
      expect(screen.getByText('+0')).toBeTruthy();
    });

    it('marks the root with role="alert"', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect revealDelayMs={0} />);
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  describe('pool variants', () => {
    const pools: MessagePoolId[] = [
      'right-no-streak',
      'wrong-no-streak',
      'on-fire',
      'streak-broken',
      'comeback',
      'doing-bad',
    ];

    for (const pool of pools) {
      it(`marks the root with data-pool="${pool}" for pool=${pool}`, () => {
        const { container } = render(
          <FeedbackOverlay {...baseProps} isCorrect pool={pool} revealDelayMs={0} />,
        );
        const root = container.querySelector(`[data-pool="${pool}"]`);
        expect(root).toBeTruthy();
      });
    }
  });

  describe('Next/Finish button label', () => {
    it('shows "NEXT →" when isLastRound=false', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect isLastRound={false} revealDelayMs={0} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.next })).toBeTruthy();
    });

    it('shows "FINISH IT" when isLastRound=true', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect isLastRound revealDelayMs={0} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.finish })).toBeTruthy();
    });

    it('calls onAdvance exactly once when tapped', async () => {
      const onAdvance = vi.fn();
      render(<FeedbackOverlay {...baseProps} isCorrect onAdvance={onAdvance} revealDelayMs={0} />);
      await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.next }));
      expect(onAdvance).toHaveBeenCalledTimes(1);
    });
  });

  describe('delayed reveal of the Next button', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not render the button immediately on mount with default delay', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('reveals the button after revealDelayMs elapses', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect revealDelayMs={400} />);
      expect(screen.queryByRole('button')).toBeNull();
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });
});
