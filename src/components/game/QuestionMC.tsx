import { useEffect, useMemo, useRef, useState } from 'react';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import { Button } from '../shared/Button';
import styles from './QuestionMC.module.css';

/**
 * Review-mode payload passed when re-mounting QuestionMC from the
 * FeedbackOverlay's "Review" path. Causes the component to:
 *  - boot directly into 'revealed' phase (no taps, no timers)
 *  - preserve the prior selectedIndex (kept for clarity even though the
 *    revealed visual doesn't distinguish the user's wrong-pick from
 *    other wrongs in the existing reveal styling)
 *  - render a Next button at the bottom (MC has no Lock In button to
 *    repurpose, so review adds one).
 */
export type QuestionMCReview = {
  selectedIndex: number;
  onNext: () => void;
  nextLabel: string;
};

export type QuestionMCProps = {
  question: MultipleChoiceQuestion;
  usedHint: boolean;
  onAnswer: (isCorrect: boolean) => void;
  /**
   * Fired when the player taps an answer — slightly BEFORE onAnswer.
   * Lets the parent capture which quadrant was picked so it can offer
   * a review screen if the answer was wrong. Optional; tests that don't
   * exercise the review path can omit it.
   */
  onSelectionCaptured?: (selection: { selectedIndex: number }) => void;
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
  /**
   * Total ms from tap → onAnswer fires when the user picks the CORRECT answer.
   * Default 1500ms. Tests pass 0 for a synchronous path.
   */
  correctRevealMs?: number;
  /**
   * Total ms from tap → onAnswer fires when the user picks a WRONG answer.
   * Default 3000ms — longer so the player has time to read the correct answer
   * (which is highlighted via outline + brightness during the reveal phase).
   * Tests pass 0 for a synchronous path.
   */
  wrongRevealMs?: number;
  /**
   * Ms from tap → reveal phase begins (the lock phase duration).
   * During the lock phase, only the tapped quadrant is highlighted; others stay default.
   * Default 400ms. Same for both correct and wrong answers.
   */
  lockDurationMs?: number;
  /** Review-mode payload — present iff this is the review re-mount. */
  review?: QuestionMCReview;
};

function pickHintGreyedIndex(question: MultipleChoiceQuestion, rng: Rng): number {
  // Hint greys out a real distractor — never the obviously-funny option.
  const distractors = [0, 1, 2, 3].filter(
    (i) => i !== question.correctIndex && i !== question.funnyWrongIndex,
  );
  if (distractors.length === 0) {
    // Schema guarantees funnyWrongIndex !== correctIndex, so distractors.length === 2.
    // Defensive fallback only.
    const wrongs = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
    return wrongs[Math.floor(rng() * wrongs.length)]!;
  }
  return distractors[Math.floor(rng() * distractors.length)]!;
}

type QuadrantState = 'default' | 'greyed' | 'locked' | 'correct' | 'muted';
type RevealPhase = 'idle' | 'locked' | 'revealed';

function quadrantStateFor(
  index: number,
  question: MultipleChoiceQuestion,
  selectedIndex: number | null,
  greyedIndex: number | null,
  revealPhase: RevealPhase,
): QuadrantState {
  if (revealPhase === 'revealed') {
    // All wrongs (including the user's wrong pick if any) dim equally;
    // only the correct answer stays highlighted.
    if (index === question.correctIndex) return 'correct';
    return 'muted';
  }
  // idle or locked
  if (revealPhase === 'locked' && index === selectedIndex) return 'locked';
  if (greyedIndex === index) return 'greyed';
  return 'default';
}

export function QuestionMC({
  question,
  usedHint,
  onAnswer,
  onSelectionCaptured,
  rng = defaultRng,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
  lockDurationMs = 400,
  review,
}: QuestionMCProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    review?.selectedIndex ?? null,
  );
  const [revealPhase, setRevealPhase] = useState<RevealPhase>(
    review ? 'revealed' : 'idle',
  );
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount (parent unmounts QuestionMC when phase flips to feedback).
  useEffect(() => {
    return () => {
      if (lockTimerRef.current !== null) clearTimeout(lockTimerRef.current);
      if (dispatchTimerRef.current !== null) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const greyedIndex = useMemo<number | null>(() => {
    if (!usedHint) return null;
    return pickHintGreyedIndex(question, rng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedHint, question]);

  const handleTap = (index: number) => {
    if (revealPhase !== 'idle') return;
    if (index === greyedIndex) return;

    setSelectedIndex(index);
    onSelectionCaptured?.({ selectedIndex: index });
    const isCorrect = index === question.correctIndex;
    const totalDuration = isCorrect ? correctRevealMs : wrongRevealMs;

    if (totalDuration <= 0) {
      // Synchronous path for tests — snap to revealed state, dispatch immediately.
      setRevealPhase('revealed');
      onAnswer(isCorrect);
      return;
    }

    setRevealPhase('locked');
    lockTimerRef.current = setTimeout(() => {
      setRevealPhase('revealed');
    }, lockDurationMs);
    dispatchTimerRef.current = setTimeout(() => {
      onAnswer(isCorrect);
    }, totalDuration);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <div className={styles.grid} role="group" aria-label="Answer options">
        {question.options.map((option, index) => {
          const state = quadrantStateFor(
            index,
            question,
            selectedIndex,
            greyedIndex,
            revealPhase,
          );
          const isDisabled = state === 'greyed' || revealPhase !== 'idle';
          const classes = [
            styles.quadrant,
            styles[`color${index + 1}` as 'color1' | 'color2' | 'color3' | 'color4'],
            styles[state],
          ].join(' ');

          return (
            <button
              key={index}
              type="button"
              className={classes}
              onClick={() => handleTap(index)}
              disabled={isDisabled}
              data-quadrant-index={index}
              data-quadrant-state={state}
            >
              <span className={styles.optionText}>{option}</span>
            </button>
          );
        })}
      </div>
      {review && (
        <div className={styles.reviewActions}>
          <Button variant="primary" onClick={review.onNext}>
            {review.nextLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
