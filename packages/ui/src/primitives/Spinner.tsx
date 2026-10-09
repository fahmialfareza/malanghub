import { cx } from "./cx";

export const Spinner = ({
  size = "md",
  label,
  className,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) => (
  <span
    role="status"
    aria-live="polite"
    className={cx("tw:inline-flex tw:items-center tw:gap-2", className)}
  >
    <span
      aria-hidden
      className={cx(
        "tw:inline-block tw:animate-spin tw:rounded-full tw:border-2 tw:border-current tw:border-r-transparent tw:text-brand",
        size === "sm" && "tw:size-4",
        size === "md" && "tw:size-6",
        size === "lg" && "tw:size-10 tw:border-[3px]"
      )}
    />
    {label ? (
      <span className="tw:text-sm tw:text-muted">{label}</span>
    ) : (
      <span className="tw:sr-only">Memuat...</span>
    )}
  </span>
);

/** Centered spinner for loading sections or pages. */
export const LoadingBlock = ({ label }: { label?: string }) => (
  <div className="tw:flex tw:justify-center tw:py-10">
    <Spinner size="lg" label={label} />
  </div>
);
