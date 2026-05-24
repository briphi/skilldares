import { motion, useReducedMotion } from 'motion/react';
import { shake } from '../../lib/motionVariants';
import styles from './TimerDisplay.module.css';

export type TimerDisplayProps = {
  secondsRemaining: number;
  totalSeconds?: number;
};

const LOW_TIME_THRESHOLD = 5;

export function TimerDisplay({ secondsRemaining, totalSeconds = 15 }: TimerDisplayProps) {
  const reducedMotion = useReducedMotion();
  const isLowTime = secondsRemaining <= LOW_TIME_THRESHOLD;
  const widthPct = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;

  return (
    <motion.div
      className={styles.container}
      data-low-time={isLowTime}
      variants={shake}
      animate={isLowTime && !reducedMotion ? 'shake' : 'still'}
    >
      <div
        className={styles.bar}
        role="progressbar"
        aria-label="Time remaining"
        aria-valuenow={secondsRemaining}
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        style={{ width: `${widthPct}%` }}
        data-low-time={isLowTime}
      />
      {/* Polite aria-live announcement — only populates at low time so the
          assistive tech doesn't chatter through the entire 15s countdown. */}
      <div className={styles.srOnly} aria-live="polite">
        {isLowTime ? `${secondsRemaining} seconds remaining` : ''}
      </div>
    </motion.div>
  );
}
