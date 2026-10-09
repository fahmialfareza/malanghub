import React from "react";
import { cx } from "./cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const base =
  "tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:font-semibold tw:leading-none tw:whitespace-nowrap tw:transition-colors tw:no-underline tw:cursor-pointer tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring tw:disabled:cursor-not-allowed tw:disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary:
    "tw:border tw:border-transparent tw:bg-brand tw:text-brand-fg tw:hover:bg-brand-hover tw:hover:text-brand-fg",
  secondary:
    "tw:border tw:border-line-strong tw:bg-surface tw:text-fg tw:hover:bg-surface-2 tw:hover:text-fg",
  ghost:
    "tw:border tw:border-transparent tw:bg-transparent tw:text-body tw:hover:bg-surface-2 tw:hover:text-fg",
  danger:
    "tw:border tw:border-transparent tw:bg-danger tw:text-white tw:hover:opacity-90 tw:dark:text-bg",
};

const sizes: Record<ButtonSize, string> = {
  sm: "tw:h-8 tw:px-3 tw:text-sm",
  md: "tw:h-10 tw:px-4 tw:text-[0.95rem]",
};

/** Button classes, for links that should look like buttons. */
export const buttonClass = ({
  variant = "primary",
  size = "md",
  block,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}) =>
  cx(base, variants[variant], sizes[size], block && "tw:w-full", className);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      block,
      loading,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, block, className })}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
