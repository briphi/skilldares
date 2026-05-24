import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from './TimerDisplay';

describe('TimerDisplay', () => {
  it('renders a progressbar with the correct aria-valuenow', () => {
    render(<TimerDisplay secondsRemaining={12} />);
    const bar = screen.getByRole('progressbar', { name: 'Time remaining' });
    expect(bar.getAttribute('aria-valuenow')).toBe('12');
    expect(bar.getAttribute('aria-valuemax')).toBe('15');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
  });

  it('bar width matches secondsRemaining / totalSeconds (100% at full)', () => {
    render(<TimerDisplay secondsRemaining={15} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('width: 100%');
  });

  it('bar width at 50%', () => {
    render(<TimerDisplay secondsRemaining={5} totalSeconds={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('width: 50%');
  });

  it('marks data-low-time="false" above the 5s threshold', () => {
    const { container } = render(<TimerDisplay secondsRemaining={10} />);
    const root = container.querySelector('[data-low-time]');
    expect(root?.getAttribute('data-low-time')).toBe('false');
  });

  it('marks data-low-time="true" at the 5s threshold', () => {
    const { container } = render(<TimerDisplay secondsRemaining={5} />);
    const root = container.querySelector('[data-low-time]');
    expect(root?.getAttribute('data-low-time')).toBe('true');
  });

  it('marks data-low-time="true" below the threshold', () => {
    const { container } = render(<TimerDisplay secondsRemaining={2} />);
    const root = container.querySelector('[data-low-time]');
    expect(root?.getAttribute('data-low-time')).toBe('true');
  });

  it('aria-live region is empty above 5s', () => {
    const { container } = render(<TimerDisplay secondsRemaining={10} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe('');
  });

  it('aria-live region announces seconds at low time (≤5s)', () => {
    const { container } = render(<TimerDisplay secondsRemaining={3} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe('3 seconds remaining');
  });
});
