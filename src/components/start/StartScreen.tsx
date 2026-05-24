import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import { fadeIn } from '../../lib/motionVariants';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import rawPool from '../../../data/messages/pre-game-encouragement.json';
import styles from './StartScreen.module.css';

const defaultPool = MessagePoolSchema.parse(rawPool);

export type StartScreenProps = {
  onStart: () => void;
  /** Override the message pool — used by tests. Defaults to pre-game-encouragement. */
  messages?: string[];
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function StartScreen({ onStart, messages = defaultPool, rng = defaultRng }: StartScreenProps) {
  // Pick once on mount so re-renders do not flicker through messages.
  const [message] = useState<string>(() => pickMessage(messages, rng));

  return (
    <motion.div
      className={styles.container}
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <h1 className={styles.wordmark}>{uiStrings.appTitle}</h1>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" onClick={onStart}>
        {uiStrings.buttons.start}
      </Button>
    </motion.div>
  );
}
