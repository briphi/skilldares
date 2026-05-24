import { useState } from 'react';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import rawPool from '../../../data/messages/right-no-streak.json';
import styles from './EndScreen.module.css';

const defaultPool = MessagePoolSchema.parse(rawPool);

export type EndScreenProps = {
  finalScore: number;
  personalBest: number | null;
  onPlayAgain: () => void;
  /** Override the message pool — used by tests. Defaults to right-no-streak. */
  messages?: string[];
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function EndScreen({
  finalScore,
  personalBest,
  onPlayAgain,
  messages = defaultPool,
  rng = defaultRng,
}: EndScreenProps) {
  const [message] = useState<string>(() => pickMessage(messages, rng));

  const pbDisplay = personalBest === null ? uiStrings.endScreen.noPbValue : String(personalBest);

  return (
    <div className={styles.container}>
      <p className={styles.scoreLabel}>{uiStrings.endScreen.finalScoreLabel}</p>
      <p className={styles.score}>{finalScore}</p>
      <p className={styles.pbLine}>
        <span className={styles.pbLabel}>{uiStrings.endScreen.personalBestLabel}:</span>{' '}
        <span className={styles.pbValue}>{pbDisplay}</span>
      </p>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" onClick={onPlayAgain}>
        {uiStrings.buttons.playAgain}
      </Button>
    </div>
  );
}
