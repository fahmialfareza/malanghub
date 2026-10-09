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
      "tw:mx-auto tw:w-full tw:max-w-6xl tw:px-4 tw:sm:px-6",
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

export const cardClass =
  "tw:rounded-xl tw:border tw:border-line tw:bg-surface tw:text-body tw:shadow-card";

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
      "tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-line tw:px-5 tw:py-4",
      className
    )}
  >
    <h3 className="tw:m-0 tw:font-heading tw:text-lg tw:font-semibold tw:text-fg">
      {title}
    </h3>
    {actions && <div className="tw:flex tw:gap-2">{actions}</div>}
  </div>
);

export type BadgeTone = "brand" | "neutral" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  brand: "tw:bg-brand-soft tw:text-brand",
  neutral: "tw:bg-surface-2 tw:text-body",
  success: "tw:bg-success-soft tw:text-success",
  warning: "tw:bg-warning-soft tw:text-warning",
  danger: "tw:bg-danger-soft tw:text-danger",
};

export const badgeClass = (tone: BadgeTone = "brand", className?: string) =>
  cx(
    "tw:inline-flex tw:items-center tw:rounded-full tw:px-2.5 tw:py-0.5 tw:text-xs tw:font-semibold tw:no-underline",
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
  <div className="tw:w-full tw:overflow-x-auto">
    <table
      className={cx(
        "tw:w-full tw:border-collapse tw:text-left tw:text-sm tw:text-body",
        "tw:[&_th]:border-b tw:[&_th]:border-line tw:[&_th]:bg-surface-2 tw:[&_th]:px-4 tw:[&_th]:py-3 tw:[&_th]:font-semibold tw:[&_th]:text-fg",
        "tw:[&_td]:border-b tw:[&_td]:border-line tw:[&_td]:px-4 tw:[&_td]:py-3 tw:[&_td]:align-middle",
        "tw:[&_tbody_tr:nth-child(even)]:bg-surface-2/50 tw:[&_tbody_tr:hover]:bg-surface-2",
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
    "tw:my-8 tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-1.5 tw:p-0 tw:list-none",
  pageLinkClassName:
    "tw:flex tw:h-9 tw:min-w-9 tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-line tw:bg-surface tw:px-3 tw:text-sm tw:font-semibold tw:text-body tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:text-brand",
  previousLinkClassName:
    "tw:flex tw:h-9 tw:items-center tw:rounded-lg tw:border tw:border-line tw:bg-surface tw:px-3 tw:text-sm tw:font-semibold tw:text-body tw:no-underline tw:hover:border-brand tw:hover:text-brand",
  nextLinkClassName:
    "tw:flex tw:h-9 tw:items-center tw:rounded-lg tw:border tw:border-line tw:bg-surface tw:px-3 tw:text-sm tw:font-semibold tw:text-body tw:no-underline tw:hover:border-brand tw:hover:text-brand",
  breakLinkClassName:
    "tw:flex tw:h-9 tw:items-center tw:px-2 tw:text-muted tw:no-underline",
  activeLinkClassName:
    "tw:border-brand! tw:bg-brand! tw:text-brand-fg! tw:hover:text-brand-fg!",
  disabledLinkClassName: "tw:pointer-events-none tw:opacity-50",
};
