import React, { createContext, useContext } from "react";
import type { AuthResponse } from "@malanghub/core";

export interface LinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  rel?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
}

export interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  objectFit?: React.CSSProperties["objectFit"];
}

export interface MetaProps {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  image?: string;
}

export interface PlatformAdapters {
  Link: React.ComponentType<LinkProps>;
  Image: React.ComponentType<ImageProps>;
  Meta: React.ComponentType<MetaProps>;
  navigate(href: string): void;
  useCurrentPath(): string;
  /**
   * Reads a query-string parameter of the current route (e.g. `page` from
   * `/news?page=2`). Must be a React hook. Optional: when omitted, the
   * shared `useSearchParam` hook falls back to `window.location`.
   */
  useSearchParam?(name: string): string | null;
  reportError?(error: unknown): void;
  requestGoogleAuth?(): Promise<AuthResponse>;
  requestGoogleAccessToken?(): Promise<string>;
  requestAppleAuth?(): Promise<AuthResponse>;
  analytics?: React.ReactNode;
  googleAuthAvailable?: boolean;
  googleAuthHidden?: boolean;
  googleAuthUnavailableMessage?: string;
  appleAuthAvailable?: boolean;
  offlineBannerEnabled?: boolean;
  tinyApiKey?: string;
  apiBaseUrl?: string;
  appName?: string;
}

const BrowserLink = ({ href, children, onClick, ...props }: LinkProps) => (
  <a href={href} onClick={onClick} {...props}>
    {children}
  </a>
);

const BrowserImage = ({
  fill,
  objectFit,
  width,
  height,
  className,
  ...props
}: ImageProps) => (
  <img
    {...props}
    className={className}
    width={fill ? undefined : width}
    height={fill ? undefined : height}
    style={{
      objectFit,
      width: fill ? "100%" : undefined,
      height: fill ? "100%" : undefined,
    }}
  />
);

const BrowserMeta = ({ title, description }: MetaProps) => {
  React.useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]'
      );
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [description, title]);

  return null;
};

export const browserAdapters: PlatformAdapters = {
  Link: BrowserLink,
  Image: BrowserImage,
  Meta: BrowserMeta,
  navigate(href) {
    window.location.href = href;
  },
  useCurrentPath() {
    return typeof window === "undefined" ? "/" : window.location.pathname;
  },
  reportError(error) {
    console.error(error);
  },
  googleAuthAvailable: false,
  offlineBannerEnabled: true,
  appName: "Malanghub",
};

const AdapterContext = createContext<PlatformAdapters>(browserAdapters);

export const AdapterProvider = ({
  adapters,
  children,
}: {
  adapters: PlatformAdapters;
  children: React.ReactNode;
}) => (
  <AdapterContext.Provider value={adapters}>
    {children}
  </AdapterContext.Provider>
);

export const useAdapters = () => useContext(AdapterContext);

const subscribeToLocation = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
};

/** Query string of the current URL, including hash routes like `#/news?page=2`. */
const readLocationSearch = () => {
  if (typeof window === "undefined") return "";
  const { search, hash } = window.location;
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
  return hashQuery || search;
};

const useWindowSearchParam = (name: string) => {
  const search = React.useSyncExternalStore(
    subscribeToLocation,
    readLocationSearch,
    () => ""
  );
  return new URLSearchParams(search).get(name);
};

/**
 * Reads a query-string parameter through the platform adapter, falling back
 * to `window.location` when the platform does not provide one. The adapter
 * object is stable per platform, so the hook order never changes.
 */
export const useSearchParam = (name: string): string | null => {
  const adapters = useAdapters();
  const useAdapterSearchParam =
    adapters.useSearchParam ?? useWindowSearchParam;
  return useAdapterSearchParam(name);
};

/** Current `?page=N` as a positive integer (invalid or < 1 becomes 1). */
export const usePageParam = (): number => {
  const value = Number.parseInt(useSearchParam("page") ?? "", 10);
  return Number.isFinite(value) && value >= 1 ? value : 1;
};
