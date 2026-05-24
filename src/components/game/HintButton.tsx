import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import styles from './HintButton.module.css';

export type HintButtonProps = {
  onUse: () => void;
  disabled?: boolean;
};

export function HintButton({ onUse, disabled = false }: HintButtonProps) {
  return (
    <Button
      variant="secondary"
      onClick={onUse}
      disabled={disabled}
      aria-label="Hint"
    >
      <span className={styles.bulb} aria-hidden="true">
        {uiStrings.buttons.hintBulb}
      </span>
      {uiStrings.buttons.hint}
    </Button>
  );
}
