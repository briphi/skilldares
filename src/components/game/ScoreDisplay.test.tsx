import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ScoreDisplay } from './ScoreDisplay';

describe('ScoreDisplay', () => {
  it('renders the initial score', () => {
    render(<ScoreDisplay score={0} />);
    expect(screen.getByText('Score:')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('renders a non-zero initial score', () => {
    render(<ScoreDisplay score={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('animates count-up to the new score when the prop changes', async () => {
    const { rerender } = render(<ScoreDisplay score={0} />);
    expect(screen.getByText('0')).toBeTruthy();

    rerender(<ScoreDisplay score={5} />);
    // Animation ~250ms; waitFor's default timeout (1s) covers it.
    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  it('does not change the displayed value when the score prop is unchanged', () => {
    const { rerender } = render(<ScoreDisplay score={7} />);
    expect(screen.getByText('7')).toBeTruthy();
    rerender(<ScoreDisplay score={7} />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('marks the score region with aria-live="polite" for screen-reader updates', () => {
    const { container } = render(<ScoreDisplay score={0} />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('aria-atomic')).toBe('true');
  });
});
