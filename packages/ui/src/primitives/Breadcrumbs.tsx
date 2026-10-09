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
    className="border-b border-line bg-surface-2/60"
  >
    <Container>
      <ol className="m-0 flex flex-wrap items-center gap-1.5 p-0 py-3 text-sm list-none">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              key={index}
              className="flex min-w-0 items-center gap-1.5"
            >
              {item.href && !last ? (
                renderLink({
                  href: item.href,
                  className:
                    "font-medium text-muted no-underline hover:text-brand",
                  children: item.label,
                })
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="truncate font-semibold text-fg"
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="text-line-strong">
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
