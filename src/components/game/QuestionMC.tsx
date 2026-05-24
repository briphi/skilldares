import { useMemo, useState } from 'react';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import styles from './QuestionMC.module.css';

export type QuestionMCProps = {
  question: MultipleChoiceQuestion;
  usedHint: boolean;
  onAnswer: (isCorrect: boolean) => void;
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
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

type QuadrantState = 'default' | 'greyed' | 'correct' | 'wrongSelected' | 'muted';

function quadrantStateFor(
  index: number,
  question: MultipleChoiceQuestion,
  selectedIndex: number | null,
  greyedIndex: number | null,
): QuadrantState {
  if (selectedIndex === null) {
    return greyedIndex === index ? 'greyed' : 'default';
  }
  if (index === question.correctIndex) return 'correct';
  if (index === selectedIndex) return 'wrongSelected';
  return 'muted';
}

export function QuestionMC({ question, usedHint, onAnswer, rng = defaultRng }: QuestionMCProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const greyedIndex = useMemo<number | null>(() => {
    if (!usedHint) return null;
    return pickHintGreyedIndex(question, rng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedHint, question]);

  const handleTap = (index: number) => {
    if (selectedIndex !== null) return;
    if (index === greyedIndex) return;
    setSelectedIndex(index);
    onAnswer(index === question.correctIndex);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <div className={styles.grid} role="group" aria-label="Answer options">
        {question.options.map((option, index) => {
          const state = quadrantStateFor(index, question, selectedIndex, greyedIndex);
          const isDisabled = state === 'greyed' || selectedIndex !== null;
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
              {state === 'correct' && (
                <span className={styles.overlay} aria-hidden="true">✓</span>
              )}
              {state === 'wrongSelected' && (
                <span className={styles.overlay} aria-hidden="true">✗</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
