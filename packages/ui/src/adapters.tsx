import React, { createContext, useContext } from "react";
import type { AuthResponse } from "@malanghub/core";

export interface LinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
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
  reportError?(error: unknown): void;
  requestGoogleAuth?(): Promise<AuthResponse>;
  requestGoogleAccessToken?(): Promise<string>;
  analytics?: React.ReactNode;
  googleAuthAvailable?: boolean;
  googleAuthHidden?: boolean;
  googleAuthUnavailableMessage?: string;
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
