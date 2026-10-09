import React, { useId } from "react";
import { cx } from "./cx";

/** Shared look for text-like controls: soft surface in dark mode, clear focus ring. */
export const controlClass =
  "tw:block tw:w-full tw:rounded-lg tw:border tw:border-line tw:bg-input tw:px-3.5 tw:py-2.5 tw:text-[0.95rem] tw:text-fg tw:shadow-none tw:transition-[border-color,box-shadow] tw:placeholder:text-muted tw:hover:border-line-strong tw:focus:border-brand tw:focus:outline-none tw:focus:ring-4 tw:focus:ring-ring tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:aria-invalid:border-danger";

export const labelClass =
  "tw:mb-1.5 tw:block tw:text-sm tw:font-semibold tw:text-fg";

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
  <div className={cx("tw:mb-4", className)}>
    {label && (
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p id={`${id}-error`} className="tw:mt-1.5 tw:text-sm tw:text-danger">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${id}-hint`} className="tw:mt-1.5 tw:text-sm tw:text-muted">
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
          className={cx(controlClass, "tw:min-h-28 tw:resize-y", className)}
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
          className={cx(controlClass, "tw:pr-9", className)}
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
          "tw:mb-2 tw:flex tw:items-center tw:gap-2.5",
          wrapperClassName
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cx(
            "tw:size-4 tw:shrink-0 tw:cursor-pointer tw:rounded tw:accent-brand tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring",
            className
          )}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className="tw:mb-0 tw:cursor-pointer tw:text-[0.95rem] tw:text-body"
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
            "tw:cursor-pointer tw:p-1.5 tw:file:mr-3 tw:file:cursor-pointer tw:file:rounded-md tw:file:border-0 tw:file:bg-brand-soft tw:file:px-3 tw:file:py-1.5 tw:file:text-sm tw:file:font-semibold tw:file:text-brand",
            className
          )}
          {...rest}
        />
      </FieldShell>
    );
  }
);
FileInput.displayName = "FileInput";
