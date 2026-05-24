import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakIndicator } from './StreakIndicator';

describe('StreakIndicator', () => {
  it('does not render at streak 0', () => {
    render(<StreakIndicator streak={0} />);
    expect(screen.queryByText('Streak')).toBeNull();
  });

  it('does not render at streak 2 (below default threshold of 3)', () => {
    render(<StreakIndicator streak={2} />);
    expect(screen.queryByText('Streak')).toBeNull();
  });

  it('renders at streak 3 (default threshold)', () => {
    render(<StreakIndicator streak={3} />);
    expect(screen.getByText('Streak')).toBeTruthy();
  });

  it('renders at streak 10', () => {
    render(<StreakIndicator streak={10} />);
    expect(screen.getByText('Streak')).toBeTruthy();
  });

  it('does NOT render for negative streaks (wrong-answer streaks)', () => {
    render(<StreakIndicator streak={-5} />);
    expect(screen.queryByText('Streak')).toBeNull();
  });

  it('honors a custom minStreak prop', () => {
    render(<StreakIndicator streak={4} minStreak={5} />);
    expect(screen.queryByText('Streak')).toBeNull();
  });

  it('renders when streak exactly equals custom minStreak', () => {
    render(<StreakIndicator streak={5} minStreak={5} />);
    expect(screen.getByText('Streak')).toBeTruthy();
  });

  it('marks data-streak attribute with the current streak value (for selectors / debugging)', () => {
    const { container } = render(<StreakIndicator streak={7} />);
    expect(container.querySelector('[data-streak="7"]')).toBeTruthy();
  });

  it('uses role="status" + aria-live="polite" so AT announces the threshold crossing', () => {
    render(<StreakIndicator streak={3} />);
    const el = screen.getByRole('status');
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-live')).toBe('polite');
  });
});
