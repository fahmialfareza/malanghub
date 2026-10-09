import React from "react";
import { cx } from "./cx";

/** Page-width wrapper, replaces Bootstrap's `.container`. */
export const Container = ({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cx(
      "mx-auto w-full max-w-6xl px-4 sm:px-6",
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

export const cardClass =
  "rounded-xl border border-line bg-surface text-body shadow-card";

export const Card = ({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx(cardClass, className)} {...rest}>
    {children}
  </div>
);

export const CardHeader = ({
  title,
  actions,
  className,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cx(
      "flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4",
      className
    )}
  >
    <h3 className="m-0 font-heading text-lg font-semibold text-fg">
      {title}
    </h3>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

export type BadgeTone = "brand" | "neutral" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  brand: "bg-brand-soft text-brand",
  neutral: "bg-surface-2 text-body",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export const badgeClass = (tone: BadgeTone = "brand", className?: string) =>
  cx(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold no-underline",
    badgeTones[tone],
    className
  );

export const Badge = ({
  tone,
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) => <span className={badgeClass(tone, className)}>{children}</span>;

/** Bordered, zebra-striped table that stays readable in dark mode. */
export const Table = ({
  className,
  children,
  ...rest
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto">
    <table
      className={cx(
        "w-full border-collapse text-left text-sm text-body",
        "[&_th]:border-b [&_th]:border-line [&_th]:bg-surface-2 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-fg",
        "[&_td]:border-b [&_td]:border-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle",
        "[&_tbody_tr:nth-child(even)]:bg-surface-2/50 [&_tbody_tr:hover]:bg-surface-2",
        className
      )}
      {...rest}
    >
      {children}
    </table>
  </div>
);

/** Class names for react-paginate so pagination matches the design. */
export const paginationClasses = {
  containerClassName:
    "my-8 flex flex-wrap items-center justify-center gap-1.5 p-0 list-none",
  pageLinkClassName:
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-body no-underline transition-colors hover:border-brand hover:text-brand",
  previousLinkClassName:
    "flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-body no-underline hover:border-brand hover:text-brand",
  nextLinkClassName:
    "flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-body no-underline hover:border-brand hover:text-brand",
  breakLinkClassName:
    "flex h-9 items-center px-2 text-muted no-underline",
  activeLinkClassName:
    "border-brand! bg-brand! text-brand-fg! hover:text-brand-fg!",
  disabledLinkClassName: "pointer-events-none opacity-50",
};
