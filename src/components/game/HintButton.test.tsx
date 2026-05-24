import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HintButton } from './HintButton';
import { uiStrings } from '../../content/uiStrings';

describe('HintButton', () => {
  it('renders the hint label from uiStrings', () => {
    render(<HintButton onUse={() => {}} />);
    expect(screen.getByRole('button', { name: 'Hint' })).toBeTruthy();
    expect(screen.getByText(uiStrings.buttons.hint)).toBeTruthy();
  });

  it('forwards aria-label="Hint"', () => {
    render(<HintButton onUse={() => {}} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Hint');
  });

  it('calls onUse exactly once when the enabled button is tapped', async () => {
    const onUse = vi.fn();
    render(<HintButton onUse={onUse} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(onUse).toHaveBeenCalledOnce();
  });

  it('does NOT call onUse when the disabled button is tapped', async () => {
    const onUse = vi.fn();
    render(<HintButton onUse={onUse} disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(onUse).not.toHaveBeenCalled();
  });
});
