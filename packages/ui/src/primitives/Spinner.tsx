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
    className={cx("inline-flex items-center gap-2", className)}
  >
    <span
      aria-hidden
      className={cx(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent text-brand",
        size === "sm" && "size-4",
        size === "md" && "size-6",
        size === "lg" && "size-10 border-[3px]"
      )}
    />
    {label ? (
      <span className="text-sm text-muted">{label}</span>
    ) : (
      <span className="sr-only">Memuat...</span>
    )}
  </span>
);

/** Centered spinner for loading sections or pages. */
export const LoadingBlock = ({ label }: { label?: string }) => (
  <div className="flex justify-center py-10">
    <Spinner size="lg" label={label} />
  </div>
);
