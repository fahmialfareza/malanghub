import React, { useId } from "react";
import { cx } from "./cx";

/** Shared look for text-like controls: soft surface in dark mode, clear focus ring. */
export const controlClass =
  "block w-full rounded-lg border border-line bg-input px-3.5 py-2.5 text-[0.95rem] text-fg shadow-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger";

export const labelClass =
  "mb-1.5 block text-sm font-semibold text-fg";

type FieldShellProps = {
  id: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** Label + control + hint/error, stacked with consistent spacing. */
export const FieldShell = ({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldShellProps) => (
  <div className={cx("mb-4", className)}>
    {label && (
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )
    )}
  </div>
);

type FieldExtras = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Classes for the wrapper (spacing, grid placement). */
  wrapperClassName?: string;
};

const describedBy = (id: string, hint: unknown, error: unknown) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  FieldExtras;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, wrapperClassName, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        className={wrapperClassName}
      >
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          className={cx(controlClass, className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldExtras;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, wrapperClassName, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          className={cx(controlClass, "min-h-28 resize-y", className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);
Textarea.displayName = "Textarea";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  FieldExtras;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, hint, error, wrapperClassName, className, id, children, ...rest },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        className={wrapperClassName}
      >
        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          className={cx(controlClass, "pr-9", className)}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  }
);
Select.displayName = "Select";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: React.ReactNode;
  wrapperClassName?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, wrapperClassName, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div
        className={cx(
          "mb-2 flex items-center gap-2.5",
          wrapperClassName
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cx(
            "size-4 shrink-0 cursor-pointer rounded accent-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
            className
          )}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className="mb-0 cursor-pointer text-[0.95rem] text-body"
        >
          {label}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export type FileInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> &
  FieldExtras;

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ label, hint, error, wrapperClassName, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        className={wrapperClassName}
      >
        <input
          ref={ref}
          id={inputId}
          type="file"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          className={cx(
            controlClass,
            "cursor-pointer p-1.5 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand",
            className
          )}
          {...rest}
        />
      </FieldShell>
    );
  }
);
FileInput.displayName = "FileInput";
