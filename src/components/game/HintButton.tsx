import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';

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
      {uiStrings.buttons.hint}
    </Button>
  );
}
