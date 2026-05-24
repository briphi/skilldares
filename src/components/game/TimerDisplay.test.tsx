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

  it('drains over the full totalSeconds via CSS animation (defaults to 15s)', () => {
    render(<TimerDisplay secondsRemaining={15} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('animation-duration: 15s');
  });

  it('animation duration matches custom totalSeconds', () => {
    render(<TimerDisplay secondsRemaining={5} totalSeconds={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('animation-duration: 10s');
  });

  it('animation runs by default (active=true)', () => {
    render(<TimerDisplay secondsRemaining={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('animation-play-state: running');
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

  describe('active prop (silences urgency cues post-lock-in)', () => {
    it('suppresses low-time data attribute when active=false even at low secondsRemaining', () => {
      const { container } = render(<TimerDisplay secondsRemaining={3} active={false} />);
      const root = container.querySelector('[data-low-time]');
      expect(root?.getAttribute('data-low-time')).toBe('false');
    });

    it('suppresses the aria-live announcement when active=false', () => {
      const { container } = render(<TimerDisplay secondsRemaining={3} active={false} />);
      const live = container.querySelector('[aria-live="polite"]');
      expect(live?.textContent).toBe('');
    });

    it('pauses the drain animation when active=false (bar freezes at current scale)', () => {
      render(<TimerDisplay secondsRemaining={3} totalSeconds={15} active={false} />);
      const bar = screen.getByRole('progressbar');
      expect(bar.getAttribute('style')).toContain('animation-play-state: paused');
    });

    it('default active=true preserves prior behavior at low time', () => {
      const { container } = render(<TimerDisplay secondsRemaining={3} />);
      const root = container.querySelector('[data-low-time]');
      expect(root?.getAttribute('data-low-time')).toBe('true');
    });
  });
});
