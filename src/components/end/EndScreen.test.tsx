import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndScreen } from './EndScreen';
import { uiStrings } from '../../content/uiStrings';

const fixtureMessages = ['Test message A', 'Test message B', 'Test message C'];

describe('EndScreen', () => {
  it('renders the FINAL DAMAGE label and the numeric final score', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText(uiStrings.endScreen.finalScoreLabel)).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders the ALL-TIME BEST line with the PB value when present', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={87}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText(`${uiStrings.endScreen.personalBestLabel}:`)).toBeTruthy();
    expect(screen.getByText('87')).toBeTruthy();
  });

  it('renders "—" for the PB value when personalBest is null', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={null}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText(uiStrings.endScreen.noPbValue)).toBeTruthy();
  });

  it('renders a deterministic message when given a fixed rng', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    // rng=0 → Math.floor(0 * 3) = 0 → first message
    expect(screen.getByText('Test message A')).toBeTruthy();
  });

  it('keeps the same picked message across re-renders (one-time pick)', () => {
    let call = 0;
    const drifterRng = () => {
      const v = call / fixtureMessages.length;
      call++;
      return v;
    };

    const { rerender } = render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={drifterRng}
      />,
    );
    const firstMessage = fixtureMessages.find((m) => screen.queryByText(m));
    expect(firstMessage).toBeTruthy();

    rerender(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
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
        onPlayAgain={() => {}}
        messages={fixtureMessages}
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
        onPlayAgain={onPlayAgain}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.playAgain }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
