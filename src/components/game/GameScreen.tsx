import { useMemo } from 'react';
import { useGameState } from '../../state/useGameState';
import { computePoints } from '../../lib/scoring';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema, type MessagePoolId } from '../../lib/schemas/message.schema';
import { uiStrings } from '../../content/uiStrings';
import { ScoreDisplay } from './ScoreDisplay';
import { QuestionMC } from './QuestionMC';
import { QuestionOrder } from './QuestionOrder';
import { QuestionSelect } from './QuestionSelect';
import { HintButton } from './HintButton';
import { FeedbackOverlay } from './FeedbackOverlay';
import styles from './GameScreen.module.css';

// Pool imports — validated at module scope; failures throw → ErrorBoundary.
import rightNoStreakJson from '../../../data/messages/right-no-streak.json';
import wrongNoStreakJson from '../../../data/messages/wrong-no-streak.json';
import onFireJson from '../../../data/messages/on-fire.json';
import doingBadJson from '../../../data/messages/doing-bad.json';
import streakBrokenJson from '../../../data/messages/streak-broken.json';
import comebackJson from '../../../data/messages/comeback.json';

const POOLS: Partial<Record<MessagePoolId, string[]>> = {
  'right-no-streak': MessagePoolSchema.parse(rightNoStreakJson),
  'wrong-no-streak': MessagePoolSchema.parse(wrongNoStreakJson),
  'on-fire':         MessagePoolSchema.parse(onFireJson),
  'doing-bad':       MessagePoolSchema.parse(doingBadJson),
  'streak-broken':   MessagePoolSchema.parse(streakBrokenJson),
  'comeback':        MessagePoolSchema.parse(comebackJson),
};

export type GameScreenProps = {
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
  /** Forward to QuestionMC's correct-reveal duration. Tests pass 0 for sync. */
  mcCorrectRevealMs?: number;
  /** Forward to QuestionMC's wrong-reveal duration. Tests pass 0 for sync. */
  mcWrongRevealMs?: number;
  /** Forward to QuestionMC's lock-duration prop. Tests pass 0 for sync. */
  mcLockDurationMs?: number;
};

export function GameScreen({
  rng = defaultRng,
  mcCorrectRevealMs,
  mcWrongRevealMs,
  mcLockDurationMs,
}: GameScreenProps = {}) {
  const { state, helpers } = useGameState();

  const feedbackMessage = useMemo<string>(() => {
    if (state.phase !== 'feedback' || !state.lastFeedback) return '';
    const pool = POOLS[state.lastFeedback.pool];
    if (!pool || pool.length === 0) return '';
    return pickMessage(pool, rng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.roundIndex, state.lastFeedback]);

  if (state.phase !== 'question' && state.phase !== 'feedback') return null;

  const currentQuestion = state.questions[state.roundIndex];
  if (!currentQuestion) return null;

  const isLastRound = state.roundIndex === state.questions.length - 1;
  const isMC = currentQuestion.type === 'mc';

  const pointsAwarded = state.lastFeedback
    ? computePoints(state.lastFeedback.isCorrect, state.usedHintThisQuestion)
    : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.progress}>
          {uiStrings.progress(state.roundIndex + 1, state.questions.length)}
        </span>
        <ScoreDisplay score={state.score} />
      </header>

      <main className={styles.body}>
        {state.phase === 'question' && currentQuestion.type === 'mc' && (
          <QuestionMC
            key={state.roundIndex}
            question={currentQuestion.question}
            usedHint={state.usedHintThisQuestion}
            onAnswer={helpers.answerQuestion}
            correctRevealMs={mcCorrectRevealMs}
            wrongRevealMs={mcWrongRevealMs}
            lockDurationMs={mcLockDurationMs}
          />
        )}
        {state.phase === 'question' && currentQuestion.type === 'order' && (
          <QuestionOrder
            key={state.roundIndex}
            question={currentQuestion.question}
            onAnswer={helpers.answerQuestion}
          />
        )}
        {state.phase === 'question' && currentQuestion.type === 'select' && (
          <QuestionSelect
            key={state.roundIndex}
            question={currentQuestion.question}
            onAnswer={helpers.answerQuestion}
          />
        )}
        {state.phase === 'feedback' && state.lastFeedback && (
          <FeedbackOverlay
            key={`feedback-${state.roundIndex}`}
            isCorrect={state.lastFeedback.isCorrect}
            message={feedbackMessage}
            pointsAwarded={pointsAwarded}
            pool={state.lastFeedback.pool}
            isLastRound={isLastRound}
            onAdvance={isLastRound ? helpers.finishGame : helpers.advanceToNext}
          />
        )}
      </main>

      {state.phase === 'question' && isMC && (
        <footer className={styles.footer}>
          <HintButton onUse={helpers.useHint} disabled={state.usedHintThisQuestion} />
        </footer>
      )}
    </div>
  );
}
