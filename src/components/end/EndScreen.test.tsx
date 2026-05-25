import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndScreen } from './EndScreen';
import { uiStrings } from '../../content/uiStrings';

const fixtureStandardMessages = ['Test message A', 'Test message B', 'Test message C'];
const fixtureCelebratoryMessages = ['Celebrate A', 'Celebrate B', 'Celebrate C'];

describe('EndScreen', () => {
  // EndScreen's play-again-label picker reads/writes localStorage
  // (lastShown exclusion). Without this, the second test in a file
  // sees the previous test's write and picks a different label —
  // any assertion against a hardcoded label would fail.
  beforeEach(() => {
    localStorage.clear();
  });

  describe('standard variant (not a new high score)', () => {
    it('renders the FINAL DAMAGE label and the numeric final score', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText(uiStrings.endScreen.finalScoreLabel)).toBeTruthy();
      expect(screen.getByText('42 Points')).toBeTruthy();
    });

    it('renders the ALL-TIME BEST line with the PB value when present', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={87}
          previousPersonalBest={87}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText(`${uiStrings.endScreen.personalBestLabel}:`)).toBeTruthy();
      expect(screen.getByText('87')).toBeTruthy();
    });

    it('renders "—" for the PB value when personalBest is null (but previousPersonalBest forces standard)', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={null}
          previousPersonalBest={42}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText(uiStrings.endScreen.noPbValue)).toBeTruthy();
    });

    it('renders a deterministic message from the standard pool when given a fixed rng', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText('Test message A')).toBeTruthy();
    });

    it('keeps the same picked message across re-renders (one-time pick)', () => {
      let call = 0;
      const drifterRng = () => {
        const v = call / fixtureStandardMessages.length;
        call++;
        return v;
      };

      const { rerender } = render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={drifterRng}
        />,
      );
      const firstMessage = fixtureStandardMessages.find((m) => screen.queryByText(m));
      expect(firstMessage).toBeTruthy();

      rerender(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={drifterRng}
        />,
      );
      expect(screen.getByText(firstMessage!)).toBeTruthy();
    });

    it('renders the RUN IT BACK button label', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByRole('button', { name: uiStrings.buttons.playAgain })).toBeTruthy();
    });

    it('calls onPlayAgain exactly once when the button is tapped', async () => {
      const onPlayAgain = vi.fn();
      render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={onPlayAgain}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.playAgain }));
      expect(onPlayAgain).toHaveBeenCalledOnce();
    });

    it('does NOT render the NEW HIGH SCORE header when score equals previous PB', () => {
      render(
        <EndScreen
          finalScore={50}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.queryByText(/NEW HIGH SCORE/i)).toBeNull();
    });

    it('does NOT render the NEW HIGH SCORE header when score is below previous PB', () => {
      render(
        <EndScreen
          finalScore={10}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.queryByText(/NEW HIGH SCORE/i)).toBeNull();
    });
  });

  describe('celebrating variant (new high score — Story 3.3)', () => {
    it('renders the 🎉 NEW HIGH SCORE 🎉 header when finalScore beats previousPersonalBest', () => {
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText(/NEW HIGH SCORE!/)).toBeTruthy();
    });

    it('renders the celebrating variant when previousPersonalBest is null (first game ever) and score > 0', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={42}
          previousPersonalBest={null}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText(/NEW HIGH SCORE!/)).toBeTruthy();
    });

    it('renders the final score in the celebrating variant', () => {
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText('100 Points')).toBeTruthy();
    });

    it('renders the "Was: {previousPersonalBest}" line when previousPersonalBest is non-null', () => {
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText('Was: 80')).toBeTruthy();
    });

    it('does NOT render the "Was:" line when previousPersonalBest is null (first-game case)', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={42}
          previousPersonalBest={null}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.queryByText(/^Was:/)).toBeNull();
    });

    it('picks the message from the celebratoryMessages pool, NOT the standard pool', () => {
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText('Celebrate A')).toBeTruthy();
      expect(screen.queryByText('Test message A')).toBeNull();
    });

    it('still renders the RUN IT BACK button in the celebrating variant', () => {
      const onPlayAgain = vi.fn();
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={onPlayAgain}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByRole('button', { name: uiStrings.buttons.playAgain })).toBeTruthy();
    });

    it('renders a Confetti overlay in the celebrating variant', () => {
      const { container } = render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(container.querySelector('[data-confetti-mode]')).toBeTruthy();
    });

    it('does NOT render the standard ALL-TIME BEST line in the celebrating variant', () => {
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={10}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.queryByText(`${uiStrings.endScreen.personalBestLabel}:`)).toBeNull();
    });
  });

  describe('letter grade + correct count', () => {
    it('renders the "N / M correct" line in the standard variant', () => {
      render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={11}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText('11 / 15 Correct')).toBeTruthy();
    });

    it('renders the "N / M correct" line in the celebrating variant', () => {
      render(
        <EndScreen
          finalScore={100}
          personalBest={100}
          previousPersonalBest={80}
          correctCount={14}
          totalQuestions={15}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          celebratoryMessages={fixtureCelebratoryMessages}
          rng={() => 0}
        />,
      );
      expect(screen.getByText('14 / 15 Correct')).toBeTruthy();
    });

    it('renders A+ grade with tier="a" for perfect score', () => {
      const { container } = render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={30}
          totalQuestions={30}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      const grade = container.querySelector('[data-tier]');
      expect(grade?.textContent).toBe('A+');
      expect(grade?.getAttribute('data-tier')).toBe('a');
    });

    it('renders C- grade with tier="c" at 70% (21/30)', () => {
      const { container } = render(
        <EndScreen
          finalScore={42}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={21}
          totalQuestions={30}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      const grade = container.querySelector('[data-tier]');
      expect(grade?.textContent).toBe('C-');
      expect(grade?.getAttribute('data-tier')).toBe('c');
    });

    it('renders F grade with tier="f" below 60%', () => {
      const { container } = render(
        <EndScreen
          finalScore={5}
          personalBest={50}
          previousPersonalBest={50}
          correctCount={10}
          totalQuestions={30}
          onPlayAgain={() => {}}
          standardMessages={fixtureStandardMessages}
          rng={() => 0}
        />,
      );
      const grade = container.querySelector('[data-tier]');
      expect(grade?.textContent).toBe('F');
      expect(grade?.getAttribute('data-tier')).toBe('f');
    });
  });
});
