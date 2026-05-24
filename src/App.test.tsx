import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { uiStrings } from './content/uiStrings';

describe('App (integration)', () => {
  it('initial render shows the Start screen with the SKILLDARES wordmark', () => {
    render(<App />);
    expect(screen.getByText(uiStrings.appTitle)).toBeTruthy();
    expect(screen.getByRole('button', { name: uiStrings.buttons.start })).toBeTruthy();
  });

  it('tapping START GAME transitions to the Game screen with the first MC question', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.start }));
    expect(screen.getByText(uiStrings.progress(1, 15))).toBeTruthy();
    expect(screen.getByText('Score:')).toBeTruthy();
    expect(screen.queryByText(uiStrings.appTitle)).toBeNull();
  });

  it('tapping a hint then an answer transitions to the feedback overlay', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.start }));
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));

    // Pick the first non-greyed quadrant.
    const allButtons = screen.getAllByRole('button');
    const answerButton = allButtons.find((btn) => {
      const di = btn.getAttribute('data-quadrant-index');
      const ds = btn.getAttribute('data-quadrant-state');
      return di !== null && ds === 'default';
    });
    expect(answerButton).toBeTruthy();
    await userEvent.click(answerButton!);

    // QuestionMC reveal phase runs for ~1500ms (correct) or ~3000ms (wrong) before
    // dispatching to FeedbackOverlay. The test clicks a non-greyed quadrant which
    // could be either; bump timeout to 4000ms to cover the wrong-answer case.
    await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
