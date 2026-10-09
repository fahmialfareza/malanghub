import React from "react";
import { Container } from "./Surface";

export type BreadcrumbItem = { label: React.ReactNode; href?: string };

/**
 * Breadcrumb trail. The last item is the current page. `renderLink` lets
 * each app supply its router link.
 */
export const Breadcrumbs = ({
  items,
  renderLink,
}: {
  items: BreadcrumbItem[];
  renderLink: (props: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => React.ReactElement;
}) => (
  <nav
    aria-label="Breadcrumb"
    className="tw:border-b tw:border-line tw:bg-surface-2/60"
  >
    <Container>
      <ol className="tw:m-0 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:p-0 tw:py-3 tw:text-sm tw:list-none">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              key={index}
              className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5"
            >
              {item.href && !last ? (
                renderLink({
                  href: item.href,
                  className:
                    "tw:font-medium tw:text-muted tw:no-underline tw:hover:text-brand",
                  children: item.label,
                })
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="tw:truncate tw:font-semibold tw:text-fg"
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="tw:text-line-strong">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Container>
  </nav>
);
