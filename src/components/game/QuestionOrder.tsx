import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SpeedOrderQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import { pickRandomFromPool } from '../../lib/questionSelection';
import { formatFactorValue } from '../../lib/formatters';
import { useTimer } from '../../state/useTimer';
import { Button } from '../shared/Button';
import { ItemSquare, type ItemSquareVariant } from '../shared/ItemSquare';
import { TimerDisplay } from './TimerDisplay';
import { ReadyIndicator } from './ReadyIndicator';
import { uiStrings } from '../../content/uiStrings';
import styles from './QuestionOrder.module.css';

const DEFAULT_READY_DURATION_MS = 1200;

/**
 * Review-mode payload (see QuestionMCReview for context). Causes the
 * component to boot into 'revealed' phase with the user's submitted
 * order, swap the Lock-In button for a Next button, and hide the timer.
 */
export type QuestionOrderReview = {
  submittedOrder: string[];
  onNext: () => void;
  nextLabel: string;
};

export type QuestionOrderProps = {
  question: SpeedOrderQuestion;
  onAnswer: (isCorrect: boolean) => void;
  /**
   * Fires slightly BEFORE onAnswer with the order the player submitted.
   * Used by the parent to support the post-answer Review screen.
   */
  onSelectionCaptured?: (selection: { submittedOrder: string[] }) => void;
  rng?: Rng;
  durationSeconds?: number;
  correctRevealMs?: number;
  wrongRevealMs?: number;
  /**
   * Duration of the pre-countdown "Ready?" cue. The component starts in a
   * 'ready' phase (timer paused, interactions disabled) for this many ms
   * before transitioning to 'idle' (timer running). Default 1200ms; tests
   * pass 0 to skip ready entirely.
   */
  readyDurationMs?: number;
  /** Review-mode payload — present iff this is the review re-mount. */
  review?: QuestionOrderReview;
};

type Phase = 'ready' | 'idle' | 'revealed';

function isOrderCorrect(
  submittedNames: string[],
  canonical: SpeedOrderQuestion['items'],
): boolean {
  if (submittedNames.length !== canonical.length) return false;
  return submittedNames.every((name, i) => name === canonical[i]!.name);
}

export function QuestionOrder({
  question,
  onAnswer,
  onSelectionCaptured,
  rng = defaultRng,
  durationSeconds = 15,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
  readyDurationMs = DEFAULT_READY_DURATION_MS,
  review,
}: QuestionOrderProps) {
  // In review mode, use the player's submitted order verbatim — otherwise
  // shuffle on mount (stable per mount).
  const [order, setOrder] = useState<string[]>(() => {
    if (review) return review.submittedOrder;
    const names = question.items.map((i) => i.name);
    return pickRandomFromPool(names, names.length, rng);
  });

  // Boot order:
  //   review mode → 'revealed'           (skip ready, show reveal)
  //   readyDurationMs > 0 → 'ready'      (production: brief Ready? cue)
  //   readyDurationMs <= 0 → 'idle'      (tests: timer starts immediately)
  const [phase, setPhase] = useState<Phase>(
    review ? 'revealed' : readyDurationMs > 0 ? 'ready' : 'idle',
  );
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After the ready window, transition to idle so the timer starts ticking.
  useEffect(() => {
    if (phase !== 'ready') return;
    readyTimerRef.current = setTimeout(() => setPhase('idle'), readyDurationMs);
    return () => {
      if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    };
  }, [phase, readyDurationMs]);

  // Lookup: item name → factorValue for reveal subtext.
  const factorByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of question.items) map.set(item.name, item.factorValue);
    return map;
  }, [question]);

  // Lookup: item name → canonical-correct position.
  const canonicalIndexByName = useMemo(() => {
    const map = new Map<string, number>();
    question.items.forEach((item, i) => map.set(item.name, i));
    return map;
  }, [question]);

  // Cleanup any pending dispatch timer.
  useEffect(() => {
    return () => {
      if (dispatchTimerRef.current !== null) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (phase !== 'idle') return;
    const correct = isOrderCorrect(order, question.items);
    onSelectionCaptured?.({ submittedOrder: order });
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

  // Distance-based activation (not the default delay) so iOS Safari starts
  // dragging as soon as the finger moves ~8px, not after the 250ms long-press
  // the TouchSensor uses by default. 8px is large enough to disambiguate
  // intentional drag from finger jitter / mis-taps.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (phase !== 'idle') return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const itemVariantFor = (name: string, displayIndex: number): ItemSquareVariant => {
    if (phase === 'idle') return 'default';
    return canonicalIndexByName.get(name) === displayIndex ? 'revealed-correct' : 'revealed-wrong';
  };

  return (
    <div className={styles.container}>
      {/* Ready? cue lives ABOVE the prompt during the ready phase so it
          uses the empty space at the top of the screen rather than the
          timer-bar slot below. When the cue disappears, the bar slot
          below the prompt becomes the timer. */}
      {!review && phase === 'ready' && <ReadyIndicator />}
      <h2 className={styles.prompt}>{question.prompt}</h2>
      {/* Timer hidden in review mode (round is over) and during ready
          (no countdown yet — Ready? is the cue). */}
      {!review && phase !== 'ready' && (
        <TimerDisplay
          secondsRemaining={secondsRemaining}
          totalSeconds={durationSeconds}
          active={phase === 'idle'}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {/* data-phase drives the slide-in cascade (CSS module): rows are
              visibility:hidden during 'ready' so the list reserves layout
              space, then animate in when phase flips to 'idle'. */}
          <div className={styles.list} data-phase={phase}>
            {order.map((name, index) => (
              <SortableRow
                key={name}
                id={name}
                disabled={phase !== 'idle'}
                variant={itemVariantFor(name, index)}
                subtext={
                  phase === 'revealed'
                    ? formatFactorValue(factorByName.get(name) ?? 0, question.factor)
                    : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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

function SortableRow({
  id,
  variant,
  subtext,
  disabled,
}: {
  id: string;
  variant: ItemSquareVariant;
  subtext: string | undefined;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const wrapperClass = [styles.row, isDragging ? styles.dragging : ''].filter(Boolean).join(' ');

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={wrapperClass}
      disabled={disabled}
      data-row-name={id}
      {...attributes}
      {...listeners}
    >
      <ItemSquare text={id} variant={variant} subtext={subtext} />
      {!disabled && <DragHandleIcon />}
    </button>
  );
}

function DragHandleIcon() {
  return (
    <svg
      className={styles.dragHandle}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      data-testid="drag-handle"
    >
      <line x1="4" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
