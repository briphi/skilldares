import { type ReactNode, type MouseEventHandler } from 'react';
import styles from './Button.module.css';

/**
 * Button variants:
 *  - 'primary'   — main CTA: gold fill, large pill, used for START / NEXT / etc.
 *  - 'secondary' — small utility: rounded pill, used for the Hint button
 *  - 'tertiary'  — same size/shape as primary but a distinct color, used when
 *                  two equal-weight actions share a row (e.g. Review + Next on
 *                  the wrong-answer FeedbackOverlay)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export type ButtonProps = {
  variant: ButtonVariant;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit';
  'aria-label'?: string;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary!,
  secondary: styles.secondary!,
  tertiary: styles.tertiary!,
};

export function Button({
  variant,
  children,
  onClick,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const className = `${styles.base} ${VARIANT_CLASS[variant]}`;

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-variant={variant}
    >
      {children}
    </button>
  );
}
