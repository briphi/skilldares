import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import styles from './HintButton.module.css';

export type HintButtonProps = {
  onUse: () => void;
  disabled?: boolean;
};

const MIN_FLASH_GAP_MS = 8000;
const MAX_FLASH_GAP_MS = 15000;
/** Matches the bulbFlash keyframes duration in HintButton.module.css. */
const FLASH_PULSE_MS = 500;

export function HintButton({ onUse, disabled = false }: HintButtonProps) {
  const reducedMotion = useReducedMotion();
  /** Null when idle; 1 or 2 while a flash animation is playing. */
  const [flashCount, setFlashCount] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    let scheduleTimer: ReturnType<typeof setTimeout> | undefined;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      const delay = MIN_FLASH_GAP_MS + Math.random() * (MAX_FLASH_GAP_MS - MIN_FLASH_GAP_MS);
      scheduleTimer = setTimeout(() => {
        // 50/50 split between 1-pulse and 2-pulse flashes.
        const count = Math.random() < 0.5 ? 1 : 2;
        setFlashCount(count);
        // Hold the data attribute long enough for the CSS animation to play,
        // then clear it so the next flash (with possibly the same count) will
        // re-trigger the animation on next attribute change.
        clearTimer = setTimeout(() => {
          setFlashCount(null);
          scheduleNext();
        }, count * FLASH_PULSE_MS + 50);
      }, delay);
    };

    scheduleNext();

    return () => {
      if (scheduleTimer !== undefined) clearTimeout(scheduleTimer);
      if (clearTimer !== undefined) clearTimeout(clearTimer);
    };
  }, [reducedMotion]);

  return (
    <Button
      variant="secondary"
      onClick={onUse}
      disabled={disabled}
      aria-label="Hint"
    >
      <span
        className={styles.bulb}
        aria-hidden="true"
        data-flash-count={flashCount ?? undefined}
      >
        {uiStrings.buttons.hintBulb}
      </span>
      {uiStrings.buttons.hint}
    </Button>
  );
}
