import { useRef } from 'react';
import { motion } from 'motion/react';
import type { MessagePoolId } from '../../lib/schemas/message.schema';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import { fadeIn } from '../../lib/motionVariants';
import { useFitTextToLines } from '../../lib/useFitTextToLines';
import styles from './FeedbackOverlay.module.css';

export type FeedbackOverlayProps = {
  isCorrect: boolean;
  message: string;
  pointsAwarded: number;
  pool: MessagePoolId;
  isLastRound: boolean;
  onAdvance: () => void;
  /**
   * True when this answer's points include the streak bonus (player is
   * at or past the streak threshold). Drives the "Extra point!" note
   * shown above the points line.
   */
  onStreak?: boolean;
  /**
   * When provided AND the answer was wrong, render an additional
   * "Review" button next to "Next" (both equal-width). Tapping Review
   * takes the player back to the question with the answer revealed, so
   * they can see what they missed before advancing. Omitted (or
   * undefined) for correct answers — there's nothing to review.
   */
  onReview?: () => void;
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
  onStreak = false,
  onReview,
}: FeedbackOverlayProps) {
  const variantClass = styles[poolVariantKey(pool)] ?? '';
  const containerClasses = [styles.container, variantClass].filter(Boolean).join(' ');
  const verdictIcon = isCorrect ? '✓' : '✗';
  const buttonLabel = isLastRound ? uiStrings.buttons.finish : uiStrings.buttons.next;

  // Long messages (some pools have lines >80 chars) would wrap to 3+ lines
  // at the default --text-2xl size on narrow viewports. Auto-shrink to keep
  // every message on at most 2 lines without truncating the punchline.
  const messageRef = useRef<HTMLParagraphElement>(null);
  useFitTextToLines(messageRef, 2, { minFontSizePx: 14 });

  return (
    <motion.div
      role="alert"
      className={containerClasses}
      data-pool={pool}
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <div className={styles.icon} aria-hidden="true">{verdictIcon}</div>
      <p ref={messageRef} className={styles.message}>{message}</p>
      {onStreak && (
        <p className={styles.streakBonus}>You're on a streak. Extra point!</p>
      )}
      <p className={styles.points}>+{pointsAwarded} Points</p>
      {!isCorrect && onReview ? (
        <div className={styles.buttonRow}>
          <div className={styles.buttonRowSlot}>
            <Button variant="tertiary" onClick={onReview}>
              {uiStrings.buttons.review}
            </Button>
          </div>
          <div className={styles.buttonRowSlot}>
            <Button variant="primary" onClick={onAdvance}>
              {buttonLabel}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" onClick={onAdvance}>
          {buttonLabel}
        </Button>
      )}
    </motion.div>
  );
}
