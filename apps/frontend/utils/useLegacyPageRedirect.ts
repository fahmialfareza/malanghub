import { useEffect } from "react";
import { useRouter } from "next/router";
import { listingHref, parsePage } from "./pagination";

/**
 * Listings used to paginate with `?page=N`; they are now static files at
 * `${basePath}/page/N`. The static host serves page 1 for any query string,
 * so old links (and indexed URLs) are moved to the real page in the browser.
 * Only page 1 can receive these URLs, so pass `enabled = page === 1`.
 */
export function useLegacyPageRedirect(basePath: string, enabled: boolean) {
  const router = useRouter();
  const raw = router.isReady ? router.query.page : undefined;

  useEffect(() => {
    if (!enabled || raw === undefined) return;
    // `?page=1` and junk map to page 1 (parsePage returns null).
    router.replace(listingHref(basePath, parsePage(raw) ?? 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, raw, basePath]);
}
