import { useState } from 'react';
import { Button } from '../shared/Button';
import { Confetti } from '../shared/Confetti';
import { uiStrings } from '../../content/uiStrings';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import rawStandardPool from '../../../data/messages/right-no-streak.json';
import rawCelebratoryPool from '../../../data/messages/new-high-score.json';
import styles from './EndScreen.module.css';

const defaultStandardPool = MessagePoolSchema.parse(rawStandardPool);
const defaultCelebratoryPool = MessagePoolSchema.parse(rawCelebratoryPool);

export type EndScreenProps = {
  finalScore: number;
  personalBest: number | null;
  /** PB at game start (pre-update). Drives the celebrating-variant decision. */
  previousPersonalBest: number | null;
  onPlayAgain: () => void;
  /** Override standard-variant pool — used by tests. Defaults to right-no-streak. */
  standardMessages?: string[];
  /** Override celebrating-variant pool — used by tests. Defaults to new-high-score. */
  celebratoryMessages?: string[];
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function EndScreen({
  finalScore,
  personalBest,
  previousPersonalBest,
  onPlayAgain,
  standardMessages = defaultStandardPool,
  celebratoryMessages = defaultCelebratoryPool,
  rng = defaultRng,
}: EndScreenProps) {
  const isNewHighScore = finalScore > (previousPersonalBest ?? -1);
  const messagesPool = isNewHighScore ? celebratoryMessages : standardMessages;
  const [message] = useState<string>(() => pickMessage(messagesPool, rng));

  if (isNewHighScore) {
    return (
      <div className={`${styles.container} ${styles.celebrating}`}>
        <Confetti />
        {/* Non-breaking spaces ( ) flank the emojis so iOS Safari can't
            wrap a lone emoji onto its own line at narrow viewport widths. */}
        <p className={styles.celebrateHeader}>{'🎉 NEW HIGH SCORE! 🎉'}</p>
        <p className={`${styles.score} ${styles.scoreAccent}`}>{finalScore}</p>
        {previousPersonalBest !== null && (
          <p className={styles.wasLine}>Was: {previousPersonalBest}</p>
        )}
        <p className={styles.message}>{message}</p>
        <Button variant="primary" onClick={onPlayAgain}>
          {uiStrings.buttons.playAgain}
        </Button>
      </div>
    );
  }

  // Standard variant (Story 1.16 — unchanged behavior).
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
