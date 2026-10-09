import { ReactNode } from "react";
import { Card, cx } from "@malanghub/ui";

interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  icon?: string;
  active?: boolean;
  action?: ReactNode;
}

/** Small count card shown next to the dashboard tables. */
const StatTile = ({ label, value, icon, active, action }: StatTileProps) => (
  <Card
    className={cx(
      "tw:flex tw:flex-col tw:gap-3 tw:p-4 tw:transition-colors",
      active && "tw:border-brand tw:ring-1 tw:ring-brand"
    )}
  >
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
      <span className="tw:text-sm tw:font-semibold tw:text-muted">{label}</span>
      {icon && (
        <span
          aria-hidden
          className="tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-lg tw:bg-brand-soft tw:text-brand"
        >
          <i className={icon} aria-hidden="true"></i>
        </span>
      )}
    </div>
    <div className="tw:font-heading tw:text-3xl tw:font-bold tw:leading-none tw:text-fg">
      {value}
    </div>
    {action}
  </Card>
);

export default StatTile;
