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
  tagline: 'A Kildares Menu Training Quiz',

  buttons: {
    start: 'START GAME',
    lockIn: 'LOCK IT IN',
    hint: 'Hint',
    /** Lightbulb emoji shown before the hint button label. Lives separately
        so HintButton can animate it (occasional yellow flash glitch). */
    hintBulb: '💡',
    next: 'NEXT →',
    /** Wrong-answer FeedbackOverlay's left-side button. Arrow before the
        word mirrors the Next button's trailing arrow — together they read
        as direction ("back" vs "forward"). */
    review: '← REVIEW',
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
