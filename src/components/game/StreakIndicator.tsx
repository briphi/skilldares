import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import styles from './StreakIndicator.module.css';

export type StreakIndicatorProps = {
  streak: number;
  /** Threshold at which the indicator becomes visible. Defaults to 3. */
  minStreak?: number;
};

/**
 * Streak indicator — appears at the top of the game screen when the
 * player has a positive streak ≥ minStreak (default 3). Pulses gently
 * to draw the eye without dominating. Respects prefers-reduced-motion
 * by skipping the scale loop (the entry fade still plays).
 *
 * Mount/unmount is driven by AnimatePresence so crossing the threshold
 * fades in/out smoothly instead of popping.
 */
export function StreakIndicator({ streak, minStreak = 3 }: StreakIndicatorProps) {
  const reducedMotion = useReducedMotion();
  const visible = streak >= minStreak;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="streak-indicator"
          className={styles.container}
          initial={{ opacity: 0, y: -8 }}
          animate={
            reducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1, y: 0, scale: [1, 1.05, 1] }
          }
          exit={{ opacity: 0, y: -8 }}
          transition={
            reducedMotion
              ? { duration: 0.25 }
              : {
                  opacity: { duration: 0.25 },
                  y: { duration: 0.25 },
                  scale: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                }
          }
          role="status"
          aria-live="polite"
          data-streak={streak}
        >
          <span className={styles.label}>Streak</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
