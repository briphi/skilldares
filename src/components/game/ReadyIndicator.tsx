import styles from './ReadyIndicator.module.css';

export type ReadyIndicatorProps = {
  /**
   * When true, the cue takes up layout space but is visually hidden
   * (visibility: hidden) — its space stays reserved so the prompt /
   * grid / Lock-In don't shift when the cue toggles. The pulse
   * animation halts when hidden.
   */
  hidden?: boolean;
};

/**
 * Pre-countdown "Ready?" cue for speed-round questions.
 *
 * Sits above the question prompt during the ready phase. Green +
 * pulsing to read as "get set." The parent (QuestionOrder /
 * QuestionSelect) drives visibility via the `hidden` prop — the
 * element stays mounted at all times so its slot keeps reserving
 * layout space (no shift when the cue disappears).
 */
export function ReadyIndicator({ hidden = false }: ReadyIndicatorProps) {
  return (
    <p
      className={styles.text}
      role="status"
      aria-live="polite"
      data-hidden={hidden}
    >
      Ready?
    </p>
  );
}
