import { useEffect, useRef, useState } from 'react';
import { Button } from '../shared/Button';
import { Confetti } from '../shared/Confetti';
import { uiStrings } from '../../content/uiStrings';
import { PLAY_AGAIN_LABELS } from '../../content/playAgainLabels';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import { useFitTextToLines } from '../../lib/useFitTextToLines';
import { getLastShownMessages, setLastShownMessage } from '../../lib/storage';
import { computeGrade, gradeTier } from '../../lib/grade';
import rawStandardPool from '../../../data/messages/right-no-streak.json';
import rawCelebratoryPool from '../../../data/messages/new-high-score.json';
import styles from './EndScreen.module.css';

const defaultStandardPool = MessagePoolSchema.parse(rawStandardPool);
const defaultCelebratoryPool = MessagePoolSchema.parse(rawCelebratoryPool);
const defaultPlayAgainPool = [...PLAY_AGAIN_LABELS];
/** Storage key for last-shown play-again label — kept separate from the
    per-pool message keys used by FeedbackOverlay so they don't collide. */
const PLAY_AGAIN_STORAGE_KEY = 'play-again';

export type EndScreenProps = {
  finalScore: number;
  personalBest: number | null;
  /** PB at game start (pre-update). Drives the celebrating-variant decision. */
  previousPersonalBest: number | null;
  /** How many questions the player got right this game. Used for the
      "N/M correct" line and the letter-grade calculation. */
  correctCount: number;
  /** Total number of questions in this game. */
  totalQuestions: number;
  onPlayAgain: () => void;
  /** Override standard-variant pool — used by tests. Defaults to right-no-streak. */
  standardMessages?: string[];
  /** Override celebrating-variant pool — used by tests. Defaults to new-high-score. */
  celebratoryMessages?: string[];
  /** Override play-again label pool — used by tests. Defaults to PLAY_AGAIN_LABELS. */
  playAgainLabels?: string[];
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function EndScreen({
  finalScore,
  personalBest,
  previousPersonalBest,
  correctCount,
  totalQuestions,
  onPlayAgain,
  standardMessages = defaultStandardPool,
  celebratoryMessages = defaultCelebratoryPool,
  playAgainLabels = defaultPlayAgainPool,
  rng = defaultRng,
}: EndScreenProps) {
  const isNewHighScore = finalScore > (previousPersonalBest ?? -1);
  const messagesPool = isNewHighScore ? celebratoryMessages : standardMessages;
  const [message] = useState<string>(() => pickMessage(messagesPool, rng));
  const grade = computeGrade(correctCount, totalQuestions);
  const tier = gradeTier(grade);

  // Pick a Play Again label from the pool, avoiding the most-recently-shown
  // one (tracked via localStorage so it survives across games + refreshes).
  // Persist back after mount so the next end screen excludes this one.
  const [playAgainLabel] = useState<string>(() => {
    const lastShown = getLastShownMessages()[PLAY_AGAIN_STORAGE_KEY] ?? null;
    return pickMessage(playAgainLabels, rng, lastShown);
  });
  useEffect(() => {
    setLastShownMessage(PLAY_AGAIN_STORAGE_KEY, playAgainLabel);
  }, [playAgainLabel]);

  // Auto-shrink the celebrating header so the whole banner stays on one
  // line at any viewport width. The hook measures after render and shrinks
  // inline font-size until scrollHeight fits 1 line × line-height. Ref is
  // only attached when the celebrating branch renders; the hook returns
  // early if ref.current is null (standard variant case).
  const celebrateHeaderRef = useRef<HTMLParagraphElement>(null);
  useFitTextToLines(celebrateHeaderRef, 1, { minFontSizePx: 16 });

  if (isNewHighScore) {
    return (
      <div className={`${styles.container} ${styles.celebrating}`}>
        <Confetti />
        <p ref={celebrateHeaderRef} className={styles.celebrateHeader}>
          🎉 NEW HIGH SCORE! 🎉
        </p>
        <Scorecard
          finalScore={finalScore}
          finalScoreAccent
          pbLabel="Was"
          pbValue={
            previousPersonalBest !== null ? String(previousPersonalBest) : null
          }
          correctCount={correctCount}
          totalQuestions={totalQuestions}
        />
        <div className={styles.gradeRow}>
          <span className={styles.gradeLabel}>Grade:</span>
          <span
            className={styles.gradeBadge}
            data-tier={tier}
            role="img"
            aria-label={`Grade: ${grade}`}
          >
            {grade}
          </span>
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.playAgainButton}>
          <Button variant="primary" onClick={onPlayAgain}>
            {playAgainLabel}
          </Button>
        </div>
      </div>
    );
  }

  // Standard variant.
  const pbDisplay = personalBest === null ? uiStrings.endScreen.noPbValue : String(personalBest);
  return (
    <div className={styles.container}>
      <p className={styles.scoreLabel}>{uiStrings.endScreen.finalScoreLabel}</p>
      <Scorecard
        finalScore={finalScore}
        pbLabel={uiStrings.endScreen.personalBestLabel}
        pbValue={pbDisplay}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
      />
      <div className={styles.gradeRow}>
        <span className={styles.gradeLabel}>Grade:</span>
        <span
          className={styles.gradeBadge}
          data-tier={tier}
          role="img"
          aria-label={`Grade: ${grade}`}
        >
          {grade}
        </span>
      </div>
      <p className={styles.message}>{message}</p>
      <div className={styles.playAgainButton}>
        <Button variant="primary" onClick={onPlayAgain}>
          {playAgainLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * Three-row scorecard used by both EndScreen variants. Groups POINTS,
 * PB (or "Was" in the celebrating variant), and CORRECT into a single
 * styled card so the stats read as one scannable block instead of three
 * floating paragraphs.
 *
 * The PB row is omitted entirely when pbValue is null — happens in the
 * celebrating variant when the player has no prior PB to compare to
 * (first game ever).
 */
function Scorecard({
  finalScore,
  finalScoreAccent = false,
  pbLabel,
  pbValue,
  correctCount,
  totalQuestions,
}: {
  finalScore: number;
  finalScoreAccent?: boolean;
  pbLabel: string;
  pbValue: string | null;
  correctCount: number;
  totalQuestions: number;
}) {
  return (
    <div className={styles.scorecard} role="group" aria-label="Game results">
      <div className={styles.scorecardRow}>
        <span className={styles.scorecardLabel}>Points</span>
        <span
          className={`${styles.scorecardValue} ${
            finalScoreAccent ? styles.scorecardValueAccent : ''
          }`}
        >
          {finalScore}
        </span>
      </div>
      {pbValue !== null && (
        <div className={styles.scorecardRow}>
          <span className={styles.scorecardLabel}>{pbLabel}</span>
          <span className={styles.scorecardValue}>{pbValue}</span>
        </div>
      )}
      <div className={styles.scorecardRow}>
        <span className={styles.scorecardLabel}>Correct</span>
        <span className={styles.scorecardValue}>
          {correctCount} / {totalQuestions}
        </span>
      </div>
    </div>
  );
}
