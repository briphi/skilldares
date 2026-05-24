/**
 * Skilldares — UI Strings.
 *
 * Every UI string used by the app lives here. Components MUST NOT contain
 * hardcoded English text. Voice consistency with the 8 message pools
 * (FR41) is enforced by keeping all copy in one editable file.
 *
 * Voice: irreverent, terse, knows the player wants to be in on the joke.
 */

export const uiStrings = {
  appTitle: 'SKILLDARES',

  buttons: {
    start: 'START GAME',
    lockIn: 'LOCK IT IN',
    hint: '💡 Hint',
    next: 'NEXT →',
    finish: 'FINISH IT',
    playAgain: 'RUN IT BACK',
  },

  errorScreen: {
    heading: 'Welp. That broke.',
    body: 'Try refreshing. If it keeps happening, the universe is messing with you.',
  },

  endScreen: {
    finalScoreLabel: 'FINAL DAMAGE',
    personalBestLabel: 'ALL-TIME BEST',
    noPbValue: '—',
  },

  /** "Q 5/30" — keep terse; component renders it in the gameplay header. */
  progress: (round: number, total: number): string => `Q ${round}/${total}`,
} as const;

export type UiStrings = typeof uiStrings;
