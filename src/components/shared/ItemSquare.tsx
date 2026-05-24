import styles from './ItemSquare.module.css';

export type ItemSquareVariant =
  | 'default'
  | 'selected'
  | 'revealed-correct'
  | 'revealed-wrong'
  | 'revealed-missed';

export type ItemSquareProps = {
  text: string;
  variant?: ItemSquareVariant;
  /** Shown beneath text in revealed-* variants (e.g., "$8.99" for Type A reveal). */
  subtext?: string;
  /** When provided, renders as <button>; when omitted, renders as <div>. */
  onClick?: () => void;
  disabled?: boolean;
  /** For toggle-style selectable squares (Type B). Only meaningful when onClick is provided. */
  ariaPressed?: boolean;
};

function variantClassKey(variant: ItemSquareVariant): keyof typeof styles {
  switch (variant) {
    case 'default':           return 'default';
    case 'selected':          return 'selected';
    case 'revealed-correct':  return 'revealedCorrect';
    case 'revealed-wrong':    return 'revealedWrong';
    case 'revealed-missed':   return 'revealedMissed';
  }
}

const REVEALED_VARIANTS = new Set<ItemSquareVariant>([
  'revealed-correct',
  'revealed-wrong',
  'revealed-missed',
]);

export function ItemSquare({
  text,
  variant = 'default',
  subtext,
  onClick,
  disabled = false,
  ariaPressed,
}: ItemSquareProps) {
  const className = [styles.container, styles[variantClassKey(variant)]].join(' ');
  const showSubtext = subtext !== undefined && REVEALED_VARIANTS.has(variant);

  const content = (
    <>
      <span className={styles.text}>{text}</span>
      {showSubtext && <span className={styles.subtext}>{subtext}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={ariaPressed}
        data-variant={variant}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} data-variant={variant}>
      {content}
    </div>
  );
}
