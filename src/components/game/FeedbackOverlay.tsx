import { useEffect, useState } from 'react';
import type { MessagePoolId } from '../../lib/schemas/message.schema';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import styles from './FeedbackOverlay.module.css';

export type FeedbackOverlayProps = {
  isCorrect: boolean;
  message: string;
  pointsAwarded: number;
  pool: MessagePoolId;
  isLastRound: boolean;
  onAdvance: () => void;
  /** Override the Next/Finish reveal delay — used by tests. Defaults to 400ms (UX spec). */
  revealDelayMs?: number;
};

function poolVariantKey(pool: MessagePoolId): string {
  switch (pool) {
    case 'right-no-streak': return 'variantRightNoStreak';
    case 'wrong-no-streak': return 'variantWrongNoStreak';
    case 'on-fire':         return 'variantOnFire';
    case 'streak-broken':   return 'variantStreakBroken';
    case 'comeback':        return 'variantComeback';
    case 'doing-bad':       return 'variantDoingBad';
    // pre-game-encouragement and new-high-score should never reach the
    // per-answer overlay; fall back to a neutral variant if they do.
    default:                return 'variantRightNoStreak';
  }
}

export function FeedbackOverlay({
  isCorrect,
  message,
  pointsAwarded,
  pool,
  isLastRound,
  onAdvance,
  revealDelayMs = 400,
}: FeedbackOverlayProps) {
  const [buttonRevealed, setButtonRevealed] = useState<boolean>(revealDelayMs <= 0);

  useEffect(() => {
    if (revealDelayMs <= 0) return;
    const id = setTimeout(() => setButtonRevealed(true), revealDelayMs);
    return () => clearTimeout(id);
  }, [revealDelayMs]);

  const variantClass = styles[poolVariantKey(pool)] ?? '';
  const containerClasses = [styles.container, variantClass].filter(Boolean).join(' ');
  const verdictIcon = isCorrect ? '✓' : '✗';
  const buttonLabel = isLastRound ? uiStrings.buttons.finish : uiStrings.buttons.next;

  return (
    <div role="alert" className={containerClasses} data-pool={pool}>
      <div className={styles.icon} aria-hidden="true">{verdictIcon}</div>
      <p className={styles.message}>{message}</p>
      <p className={styles.points}>+{pointsAwarded}</p>
      {buttonRevealed && (
        <Button variant="primary" onClick={onAdvance}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
