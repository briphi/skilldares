import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpeedSelectQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import { pickRandomFromPool } from '../../lib/questionSelection';
import { useTimer } from '../../state/useTimer';
import { Button } from '../shared/Button';
import { ItemSquare, type ItemSquareVariant } from '../shared/ItemSquare';
import { TimerDisplay } from './TimerDisplay';
import { uiStrings } from '../../content/uiStrings';
import styles from './QuestionSelect.module.css';

export type QuestionSelectProps = {
  question: SpeedSelectQuestion;
  onAnswer: (isCorrect: boolean) => void;
  rng?: Rng;
  durationSeconds?: number;
  correctRevealMs?: number;
  wrongRevealMs?: number;
};

type Phase = 'idle' | 'revealed';

function isSelectionCorrect(selected: Set<string>, correctSet: Set<string>): boolean {
  if (selected.size !== correctSet.size) return false;
  for (const item of selected) {
    if (!correctSet.has(item)) return false;
  }
  return true;
}

export function QuestionSelect({
  question,
  onAnswer,
  rng = defaultRng,
  durationSeconds = 15,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
}: QuestionSelectProps) {
  // Display order shuffled per mount (prevents position-memorization across plays).
  const [displayItems] = useState<string[]>(() =>
    pickRandomFromPool(question.items, question.items.length, rng),
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<Phase>('idle');
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correctSet = useMemo(() => new Set(question.correctSet), [question]);

  useEffect(() => {
    return () => {
      if (dispatchTimerRef.current !== null) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const toggleItem = (name: string) => {
    if (phase !== 'idle') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (phase !== 'idle') return;
    const correct = isSelectionCorrect(selected, correctSet);
    setPhase('revealed');
    const duration = correct ? correctRevealMs : wrongRevealMs;
    if (duration <= 0) {
      onAnswer(correct);
      return;
    }
    dispatchTimerRef.current = setTimeout(() => {
      onAnswer(correct);
    }, duration);
  };

  const { secondsRemaining } = useTimer({
    durationSeconds,
    onExpire: handleSubmit,
    paused: phase !== 'idle',
  });

  const variantFor = (name: string): ItemSquareVariant => {
    if (phase === 'idle') {
      return selected.has(name) ? 'selected' : 'default';
    }
    // Revealed phase: 4-way matrix per (selected, correct).
    const wasSelected = selected.has(name);
    const isCorrect = correctSet.has(name);
    if (wasSelected && isCorrect) return 'revealed-correct';
    if (wasSelected && !isCorrect) return 'revealed-wrong';
    if (!wasSelected && isCorrect) return 'revealed-missed';
    return 'default'; // correctly not selected
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <TimerDisplay secondsRemaining={secondsRemaining} totalSeconds={durationSeconds} />

      <div className={styles.grid}>
        {displayItems.map((name) => (
          <ItemSquare
            key={name}
            text={name}
            variant={variantFor(name)}
            onClick={() => toggleItem(name)}
            disabled={phase !== 'idle' ? false : false /* always interactive in idle */}
            ariaPressed={selected.has(name)}
          />
        ))}
      </div>

      {phase === 'idle' && (
        <div className={styles.submitRow}>
          <Button variant="primary" onClick={handleSubmit}>
            {uiStrings.buttons.lockIn}
          </Button>
        </div>
      )}
    </div>
  );
}
