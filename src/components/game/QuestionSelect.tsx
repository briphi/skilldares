import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpeedSelectQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import { pickRandomFromPool } from '../../lib/questionSelection';
import { useTimer } from '../../state/useTimer';
import { Button } from '../shared/Button';
import { ItemSquare, type ItemSquareVariant } from '../shared/ItemSquare';
import { TimerDisplay } from './TimerDisplay';
import { ReadyIndicator } from './ReadyIndicator';
import { uiStrings } from '../../content/uiStrings';
import styles from './QuestionSelect.module.css';

const DEFAULT_READY_DURATION_MS = 1200;

/**
 * Review-mode payload (see QuestionMCReview for context). Causes the
 * component to boot into 'revealed' phase with the user's selected
 * items, swap the Lock-In button for a Next button, and hide the timer.
 */
export type QuestionSelectReview = {
  selectedSet: string[];
  onNext: () => void;
  nextLabel: string;
};

export type QuestionSelectProps = {
  question: SpeedSelectQuestion;
  onAnswer: (isCorrect: boolean) => void;
  /**
   * Fires slightly BEFORE onAnswer with the set of items the player
   * had selected at submit time. Used by the parent to support the
   * post-answer Review screen.
   */
  onSelectionCaptured?: (selection: { selectedSet: string[] }) => void;
  rng?: Rng;
  durationSeconds?: number;
  correctRevealMs?: number;
  wrongRevealMs?: number;
  /**
   * Duration of the pre-countdown "Ready?" cue. Component starts in 'ready'
   * for this many ms (timer paused, interactions disabled) before flipping
   * to 'idle'. Default 1200ms; tests pass 0 to skip.
   */
  readyDurationMs?: number;
  /** Review-mode payload — present iff this is the review re-mount. */
  review?: QuestionSelectReview;
};

type Phase = 'ready' | 'idle' | 'revealed';

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
  onSelectionCaptured,
  rng = defaultRng,
  durationSeconds = 15,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
  readyDurationMs = DEFAULT_READY_DURATION_MS,
  review,
}: QuestionSelectProps) {
  // Display order shuffled per mount (prevents position-memorization across plays).
  const [displayItems] = useState<string[]>(() =>
    pickRandomFromPool(question.items, question.items.length, rng),
  );

  const [selected, setSelected] = useState<Set<string>>(() =>
    review ? new Set(review.selectedSet) : new Set(),
  );
  // Boot order (see QuestionOrder for the same logic):
  //   review → revealed; readyDurationMs > 0 → ready; else → idle.
  const [phase, setPhase] = useState<Phase>(
    review ? 'revealed' : readyDurationMs > 0 ? 'ready' : 'idle',
  );
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After the ready window, transition to idle so the timer starts.
  useEffect(() => {
    if (phase !== 'ready') return;
    readyTimerRef.current = setTimeout(() => setPhase('idle'), readyDurationMs);
    return () => {
      if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    };
  }, [phase, readyDurationMs]);

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
    onSelectionCaptured?.({ selectedSet: Array.from(selected) });
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
      {/* Prompt + Ready? share a slot: the cue absolute-overlays the prompt
          during ready, prompt is visibility-hidden so the slot keeps its
          layout height. See QuestionOrder for the same pattern. */}
      <div className={styles.promptSlot}>
        <h2 className={styles.prompt} data-hidden={!review && phase === 'ready'}>
          {question.prompt}
        </h2>
        {!review && (
          <div className={styles.readyOverlay}>
            <ReadyIndicator hidden={phase !== 'ready'} />
          </div>
        )}
      </div>
      {/* Timer always visible outside review — paused at full during ready,
          ticks when idle. */}
      {!review && (
        <TimerDisplay
          secondsRemaining={secondsRemaining}
          totalSeconds={durationSeconds}
          active={phase === 'idle'}
        />
      )}

      {/* data-phase drives the pop-in cascade (CSS module): items are
          visibility:hidden during 'ready' so the grid reserves layout
          space, then animate in when phase flips to 'idle'. */}
      <div className={styles.grid} data-phase={phase}>
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

      <div className={styles.submitRow}>
        {review ? (
          <Button variant="primary" onClick={review.onNext}>
            {review.nextLabel}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSubmit} disabled={phase !== 'idle'}>
            {uiStrings.buttons.lockIn}
          </Button>
        )}
      </div>
    </div>
  );
}
