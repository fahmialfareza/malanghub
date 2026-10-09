import React from "react";
import { cx } from "./cx";

export type PageLinkProps = {
  href: string;
  className: string;
  children: React.ReactNode;
  rel?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
};

/** Page numbers to show, with `null` for an ellipsis: 1 … 4 5 [6] 7 8 … 20 */
export const pageWindow = (
  page: number,
  pageCount: number,
  radius = 1
): Array<number | null> => {
  const pages = new Set<number>([1, pageCount]);
  for (let p = page - radius; p <= page + radius; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | null> = [];
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && p - previous > 1) {
      // Fill a single gap instead of showing "…" for one missing page.
      result.push(p - previous === 2 ? previous + 1 : null);
    }
    result.push(p);
  });
  return result;
};

/** `/news` for page 1, `/news?page=2` otherwise (keeps other query params). */
export const pageHref = (basePath: string, page: number) => {
  const [path, query = ""] = basePath.split("?");
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const search = params.toString();
  return search ? `${path}?${search}` : path;
};

const itemBase =
  "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";
const itemIdle =
  "border-line bg-surface text-body hover:border-brand hover:text-brand";
const itemActive = "border-brand bg-brand text-brand-fg hover:text-brand-fg";
const itemDisabled =
  "pointer-events-none border-line bg-surface text-muted opacity-50";

/**
 * Crawlable pagination: every page is a real link (`?page=N`), so search
 * engines and AI crawlers can reach all pages without running JavaScript.
 * `renderLink` lets each app supply its router link.
 */
export const Pagination = ({
  page,
  pageCount,
  basePath,
  renderLink,
  className,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  renderLink: (props: PageLinkProps) => React.ReactElement;
  className?: string;
}) => {
  if (pageCount <= 1) return null;

  const edge = (
    target: number,
    disabled: boolean,
    rel: "prev" | "next",
    label: string,
    icon: string
  ) =>
    disabled ? (
      <span aria-hidden className={cx(itemBase, itemDisabled)}>
        <span className={cx("fa", icon)} />
      </span>
    ) : (
      renderLink({
        href: pageHref(basePath, target),
        rel,
        "aria-label": label,
        className: cx(itemBase, itemIdle),
        children: <span aria-hidden className={cx("fa", icon)} />,
      })
    );

  return (
    <nav aria-label="Navigasi halaman" className={cx("my-10", className)}>
      <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-1.5 p-0">
        <li>
          {edge(page - 1, page <= 1, "prev", "Halaman sebelumnya", "fa-angle-left")}
        </li>
        {pageWindow(page, pageCount).map((p, index) => (
          <li key={p ?? `gap-${index}`}>
            {p === null ? (
              <span aria-hidden className="px-1.5 text-muted">
                …
              </span>
            ) : (
              renderLink({
                href: pageHref(basePath, p),
                "aria-label": `Halaman ${p}`,
                "aria-current": p === page ? "page" : undefined,
                rel: p === page - 1 ? "prev" : p === page + 1 ? "next" : undefined,
                className: cx(itemBase, p === page ? itemActive : itemIdle),
                children: p,
              })
            )}
          </li>
        ))}
        <li>
          {edge(
            page + 1,
            page >= pageCount,
            "next",
            "Halaman berikutnya",
            "fa-angle-right"
          )}
        </li>
      </ul>
      <p className="m-0 mt-3 text-center text-xs text-muted">
        Halaman {page} dari {pageCount}
      </p>
    </nav>
  );
};
