import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { countUp } from '../../lib/motionVariants';
import styles from './ScoreDisplay.module.css';

export type ScoreDisplayProps = {
  score: number;
};

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState<number>(score);
  const displayedRef = useRef<number>(score);
  displayedRef.current = displayed;

  useEffect(() => {
    if (displayedRef.current === score) return;
    const controls = animate(displayedRef.current, score, {
      ...countUp,
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <span className={styles.label}>Score:</span>{' '}
      <span className={styles.value}>{displayed}</span>
    </div>
  );
}
