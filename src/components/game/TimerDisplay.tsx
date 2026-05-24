import { motion, useReducedMotion } from 'motion/react';
import { shake } from '../../lib/motionVariants';
import styles from './TimerDisplay.module.css';

export type TimerDisplayProps = {
  secondsRemaining: number;
  totalSeconds?: number;
  /**
   * When false, the urgency cues (shake animation, low-time aria-live
   * announcement) are silenced regardless of secondsRemaining. The bar
   * width still reflects the frozen value. Defaults to true.
   */
  active?: boolean;
};

const LOW_TIME_THRESHOLD = 5;

export function TimerDisplay({
  secondsRemaining,
  totalSeconds = 15,
  active = true,
}: TimerDisplayProps) {
  const reducedMotion = useReducedMotion();
  const isLowTime = active && secondsRemaining <= LOW_TIME_THRESHOLD;

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
        style={{
          animationDuration: `${totalSeconds}s`,
          // Pause the drain when active=false so the bar freezes alongside
          // useTimer (which the parent pauses on lock-in). Without this the
          // bar would keep draining visually after the player submitted.
          animationPlayState: active ? 'running' : 'paused',
        }}
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
