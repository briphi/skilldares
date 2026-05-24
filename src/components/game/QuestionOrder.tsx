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
import { uiStrings } from '../../content/uiStrings';
import styles from './QuestionOrder.module.css';

export type QuestionOrderProps = {
  question: SpeedOrderQuestion;
  onAnswer: (isCorrect: boolean) => void;
  rng?: Rng;
  durationSeconds?: number;
  correctRevealMs?: number;
  wrongRevealMs?: number;
};

type Phase = 'idle' | 'revealed';

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
  rng = defaultRng,
  durationSeconds = 15,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
}: QuestionOrderProps) {
  // Initial shuffle — stable per mount.
  const [order, setOrder] = useState<string[]>(() => {
    const names = question.items.map((i) => i.name);
    return pickRandomFromPool(names, names.length, rng);
  });

  const [phase, setPhase] = useState<Phase>('idle');
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
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
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <TimerDisplay secondsRemaining={secondsRemaining} totalSeconds={durationSeconds} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
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
    </button>
  );
}
