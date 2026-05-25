/**
 * Skilldares — Play Again button label pool.
 *
 * Rotated through on each end-of-game screen so the replay CTA isn't the
 * same string every time. Picked via the same pickMessage + storage
 * (no back-to-back repeats) infrastructure used for the personality
 * message pools — see `lib/picker.ts` and `lib/storage.ts`.
 *
 * Labels are uppercase to match the existing button-label voice
 * (NEXT →, FINISH IT, START GAME, etc.). Length matters here — the
 * Button is `white-space: nowrap`, so labels that don't fit will
 * overflow horizontally. The Play Again button uses tightened
 * font + padding (see EndScreen.module.css .playAgainButtonWrapper)
 * so the longest label ("GLUTTON FOR PUNISHMENT") still fits one
 * line on iPhone SE.
 */
export const PLAY_AGAIN_LABELS = [
  'RUN IT BACK',
  'ANOTHER ROUND',
  'GO AGAIN, IDIOT',
  'GLUTTON FOR PUNISHMENT',
  'ONE MORE TIME',
  'HIT ME AGAIN',
  'BACK FOR MORE',
] as const;
