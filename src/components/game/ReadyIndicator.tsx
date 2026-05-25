import styles from './ReadyIndicator.module.css';

/**
 * Pre-countdown "Ready?" cue for speed-round questions.
 *
 * Renders briefly in place of the timer bar so the player has a moment to
 * read the prompt and items before the countdown starts. Green + pulsing
 * to read as "get set." The parent (QuestionOrder / QuestionSelect)
 * controls visibility — this component just renders the styled text.
 */
export function ReadyIndicator() {
  return (
    <p className={styles.text} role="status" aria-live="polite">
      Ready?
    </p>
  );
}
