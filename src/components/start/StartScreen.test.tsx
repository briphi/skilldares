import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from './StartScreen';
import { uiStrings } from '../../content/uiStrings';

const fixtureMessages = ['Test message A', 'Test message B', 'Test message C'];

describe('StartScreen', () => {
  it('renders the SKILLDARES wordmark', () => {
    render(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={() => 0} />);
    expect(screen.getByText(uiStrings.appTitle)).toBeTruthy();
  });

  it('renders a deterministic message when given a fixed rng', () => {
    // rng() => 0 → Math.floor(0 * 3) = 0 → first message
    render(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={() => 0} />);
    expect(screen.getByText('Test message A')).toBeTruthy();
  });

  it('renders the START GAME button label', () => {
    render(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={() => 0} />);
    expect(screen.getByRole('button', { name: uiStrings.buttons.start })).toBeTruthy();
  });

  it('calls onStart exactly once when the button is tapped', async () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} messages={fixtureMessages} rng={() => 0} />);
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.start }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('keeps the same picked message across re-renders (one-time pick)', () => {
    // rng whose value drifts every call. If the component re-picks on re-render,
    // the displayed message would change.
    let call = 0;
    const drifterRng = () => {
      const v = call / fixtureMessages.length;
      call++;
      return v;
    };

    const { rerender } = render(
      <StartScreen onStart={() => {}} messages={fixtureMessages} rng={drifterRng} />,
    );
    const firstMessage = fixtureMessages.find((m) => screen.queryByText(m));
    expect(firstMessage).toBeTruthy();

    rerender(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={drifterRng} />);
    // Still the same message — useState initializer only runs once.
    expect(screen.getByText(firstMessage!)).toBeTruthy();
  });
});
