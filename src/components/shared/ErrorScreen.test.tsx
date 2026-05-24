import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorScreen } from './ErrorScreen';
import { uiStrings } from '../../content/uiStrings';

describe('ErrorScreen', () => {
  it('renders the heading and body from uiStrings', () => {
    render(<ErrorScreen />);
    expect(screen.getByText(uiStrings.errorScreen.heading)).toBeTruthy();
    expect(screen.getByText(uiStrings.errorScreen.body)).toBeTruthy();
  });

  it('has role=alert so screen readers announce it', () => {
    render(<ErrorScreen />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
