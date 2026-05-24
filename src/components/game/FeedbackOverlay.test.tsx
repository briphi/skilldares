import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      render(<FeedbackOverlay {...baseProps} isCorrect />);
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('renders ✗ when isCorrect=false', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect={false} />);
      expect(screen.getByText('✗')).toBeTruthy();
    });

    it('renders the message text from props', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect message="Custom voice line." />);
      expect(screen.getByText('Custom voice line.')).toBeTruthy();
    });

    it('renders the points indicator as "+{pointsAwarded} Points"', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect pointsAwarded={2} />);
      expect(screen.getByText('+2 Points')).toBeTruthy();
    });

    it('renders "+0 Points" for a wrong answer', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect={false} pointsAwarded={0} />);
      expect(screen.getByText('+0 Points')).toBeTruthy();
    });

    it('marks the root with role="alert"', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect />);
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
          <FeedbackOverlay {...baseProps} isCorrect pool={pool} />,
        );
        const root = container.querySelector(`[data-pool="${pool}"]`);
        expect(root).toBeTruthy();
      });
    }
  });

  describe('Next/Finish button label', () => {
    it('shows "NEXT →" when isLastRound=false', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect isLastRound={false} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.next })).toBeTruthy();
    });

    it('shows "FINISH IT" when isLastRound=true', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect isLastRound />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.finish })).toBeTruthy();
    });

    it('calls onAdvance exactly once when tapped', async () => {
      const onAdvance = vi.fn();
      render(<FeedbackOverlay {...baseProps} isCorrect onAdvance={onAdvance} />);
      await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.next }));
      expect(onAdvance).toHaveBeenCalledTimes(1);
    });
  });

  it('button is present immediately on mount (no delayed reveal)', () => {
    render(<FeedbackOverlay {...baseProps} isCorrect />);
    // No timers required — button renders with the rest of the overlay.
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
