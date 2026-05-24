import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="primary">Hello</Button>);
    expect(screen.getByRole('button', { name: 'Hello' })).toBeTruthy();
  });

  it('invokes onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not invoke onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick} disabled>Tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with the primary variant marker', () => {
    render(<Button variant="primary">P</Button>);
    expect(screen.getByRole('button').getAttribute('data-variant')).toBe('primary');
  });

  it('renders with the secondary variant marker', () => {
    render(<Button variant="secondary">S</Button>);
    expect(screen.getByRole('button').getAttribute('data-variant')).toBe('secondary');
  });

  it('forwards aria-label', () => {
    render(<Button variant="primary" aria-label="Begin the game">Go</Button>);
    expect(screen.getByRole('button', { name: 'Begin the game' })).toBeTruthy();
  });
});
