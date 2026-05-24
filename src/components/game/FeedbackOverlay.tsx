import { motion } from 'motion/react';
import type { MessagePoolId } from '../../lib/schemas/message.schema';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import { fadeIn } from '../../lib/motionVariants';
import styles from './FeedbackOverlay.module.css';

export type FeedbackOverlayProps = {
  isCorrect: boolean;
  message: string;
  pointsAwarded: number;
  pool: MessagePoolId;
  isLastRound: boolean;
  onAdvance: () => void;
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
}: FeedbackOverlayProps) {
  const variantClass = styles[poolVariantKey(pool)] ?? '';
  const containerClasses = [styles.container, variantClass].filter(Boolean).join(' ');
  const verdictIcon = isCorrect ? '✓' : '✗';
  const buttonLabel = isLastRound ? uiStrings.buttons.finish : uiStrings.buttons.next;

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
      <p className={styles.message}>{message}</p>
      <p className={styles.points}>+{pointsAwarded}</p>
      <Button variant="primary" onClick={onAdvance}>
        {buttonLabel}
      </Button>
    </motion.div>
  );
}
