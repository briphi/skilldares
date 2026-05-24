import { type ReactNode, type MouseEventHandler } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  variant: ButtonVariant;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit';
  'aria-label'?: string;
};

export function Button({
  variant,
  children,
  onClick,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const className =
    variant === 'primary'
      ? `${styles.base} ${styles.primary}`
      : `${styles.base} ${styles.secondary}`;

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
