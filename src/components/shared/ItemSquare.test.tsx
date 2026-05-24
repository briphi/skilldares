import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemSquare, type ItemSquareVariant } from './ItemSquare';

describe('ItemSquare', () => {
  it('renders the text prop', () => {
    render(<ItemSquare text="House Salad" />);
    expect(screen.getByText('House Salad')).toBeTruthy();
  });

  describe('variants', () => {
    const variants: ItemSquareVariant[] = [
      'default',
      'selected',
      'revealed-correct',
      'revealed-wrong',
      'revealed-missed',
    ];

    for (const variant of variants) {
      it(`sets data-variant="${variant}"`, () => {
        const { container } = render(<ItemSquare text="X" variant={variant} />);
        const root = container.querySelector('[data-variant]');
        expect(root).toBeTruthy();
        expect(root?.getAttribute('data-variant')).toBe(variant);
      });
    }
  });

  describe('subtext', () => {
    it('renders subtext in revealed-correct variant', () => {
      render(<ItemSquare text="Item" variant="revealed-correct" subtext="$8.99" />);
      expect(screen.getByText('$8.99')).toBeTruthy();
    });

    it('renders subtext in revealed-wrong variant', () => {
      render(<ItemSquare text="Item" variant="revealed-wrong" subtext="$5.00" />);
      expect(screen.getByText('$5.00')).toBeTruthy();
    });

    it('renders subtext in revealed-missed variant', () => {
      render(<ItemSquare text="Item" variant="revealed-missed" subtext="$10" />);
      expect(screen.getByText('$10')).toBeTruthy();
    });

    it('does NOT render subtext in default variant', () => {
      render(<ItemSquare text="Item" variant="default" subtext="$8.99" />);
      expect(screen.queryByText('$8.99')).toBeNull();
    });

    it('does NOT render subtext in selected variant', () => {
      render(<ItemSquare text="Item" variant="selected" subtext="$8.99" />);
      expect(screen.queryByText('$8.99')).toBeNull();
    });
  });

  describe('element type', () => {
    it('renders as <button> when onClick is provided', () => {
      render(<ItemSquare text="X" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'X' })).toBeTruthy();
    });

    it('renders as <div> when onClick is omitted', () => {
      render(<ItemSquare text="X" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('interaction', () => {
    it('calls onClick when the button is tapped', async () => {
      const onClick = vi.fn();
      render(<ItemSquare text="X" onClick={onClick} />);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does NOT call onClick when disabled', async () => {
      const onClick = vi.fn();
      render(<ItemSquare text="X" onClick={onClick} disabled />);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('forwards ariaPressed to the button when provided', () => {
      render(<ItemSquare text="X" onClick={() => {}} ariaPressed />);
      expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
    });
  });
});
