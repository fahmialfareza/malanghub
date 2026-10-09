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
      "flex flex-col gap-3 p-4 transition-colors",
      active && "border-brand ring-1 ring-brand"
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-muted">{label}</span>
      {icon && (
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand"
        >
          <i className={icon} aria-hidden="true"></i>
        </span>
      )}
    </div>
    <div className="font-heading text-3xl font-bold leading-none text-fg">
      {value}
    </div>
    {action}
  </Card>
);

export default StatTile;
