import React from "react";
import ReactDOM from "react-dom/client";
import { useQueryClient } from "@tanstack/react-query";
import { type AuthResponse, useCategories } from "@malanghub/core";
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { onBackButtonPress } from "@tauri-apps/api/app";
import {
  AppShell,
  AskPage,
  ContactPage,
  DashboardPage,
  DraftPreviewPage,
  HomePage,
  MalanghubProviders,
  NewsCategoryPage,
  NewsDetailPage,
  NewsListPage,
  NewsTagPage,
  NotFoundPage,
  PrivacyPage,
  SearchPage,
  SignInPage,
  SignUpPage,
  TermsPage,
  type ImageProps,
  type LinkProps,
  type MetaProps,
  type PlatformAdapters,
  UserProfilePage,
  cx,
  useMalanghubRuntime,
} from "@malanghub/ui";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { platform, type Platform } from "@tauri-apps/plugin-os";
import { open as openBrowser } from "@tauri-apps/plugin-shell";
import "./app.css";

const apiBaseUrl = import.meta.env.VITE_API_ADDRESS || "http://localhost:8080";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const googleAndroidClientId =
  import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID || "";
const googleIosClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || "";
const googleIosRedirectUri =
  import.meta.env.VITE_GOOGLE_IOS_REDIRECT_URI ||
  "com.malanghub.native:/oauth2redirect/google";
const tinyApiKey = import.meta.env.VITE_TINY_API_KEY || "";
// Required when using a "Web application" OAuth client type in Google Cloud.
// Leave empty if you created a "Desktop app" client (PKCE works without it).
const googleClientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "";
const nativePlatform = platform();
const googleOAuthTimeoutMs = 5 * 60 * 1000;
const externalProtocols = new Set([
  "http:",
  "https:",
  "intent:",
  "mailto:",
  "tel:",
  "sms:",
  "geo:",
  "maps:",
  "whatsapp:",
  "comgooglemaps:",
  "google.navigation:",
]);
const nativeGestureIgnoreSelector = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[role='dialog']",
  ".tox",
].join(",");

interface NativeGoogleSignInResponse {
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  photoUrl?: string;
}

interface NativeAppleSignInResponse {
  identityToken?: string;
  email?: string;
  name?: string;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function isMobilePlatform(value: Platform): value is "android" | "ios" {
  return value === "android" || value === "ios";
}

const nativeNavigationEnabled = isMobilePlatform(nativePlatform);
const nativeZoomShortcutKeys = new Set(["+", "=", "-", "_", "0"]);

function getNativeRouteKey(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function shouldIgnoreNativeGesture(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest(nativeGestureIgnoreSelector))
  );
}

function isNativeExternalHref(href: string) {
  const value = href.trim();

  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../")
  ) {
    return false;
  }

  if (value.startsWith("//")) {
    return true;
  }

  try {
    return externalProtocols.has(new URL(value).protocol);
  } catch {
    return /^[a-z][a-z0-9+.-]*:/i.test(value);
  }
}

function getGoogleMapsDestination(target: string) {
  try {
    const url = new URL(target);
    const host = url.hostname.toLowerCase();
    const isGoogleMapsHost =
      host === "maps.google.com" ||
      host.endsWith(".maps.google.com") ||
      host === "google.com" ||
      host.endsWith(".google.com");

    if (!isGoogleMapsHost || !url.pathname.includes("/maps")) {
      return null;
    }

    if (url.searchParams.has("destination")) {
      return url.searchParams.get("destination");
    }

    if (url.pathname.includes("/maps/dir")) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      return pathParts[pathParts.length - 1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function getExternalOpenCandidates(href: string) {
  const value = href.trim();
  const target = value.startsWith("//") ? `https:${value}` : value;
  const mapsDestination = getGoogleMapsDestination(target);

  if (!mapsDestination) {
    return [target];
  }

  const destination = encodeURIComponent(mapsDestination);

  if (nativePlatform === "android") {
    return [`google.navigation:q=${destination}`, target];
  }

  if (nativePlatform === "ios") {
    return [
      `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
      target,
    ];
  }

  return [target];
}

async function openNativeExternalHref(href: string) {
  const candidates = getExternalOpenCandidates(href);
  let lastError: unknown;

  for (const url of candidates) {
    try {
      await invoke("plugin:google-auth|open_external_url", { url });
      return;
    } catch (error) {
      lastError = error;
      console.error("Native external open failed", error);
    }
  }

  await openBrowser(candidates[candidates.length - 1]);

  if (lastError) {
    console.error(lastError);
  }
}

function getGoogleClientId(): string {
  if (nativePlatform === "android") {
    return googleAndroidClientId;
  }

  if (nativePlatform === "ios") {
    return googleIosClientId;
  }

  return googleClientId;
}

function getGoogleRedirectUri(): string | null {
  if (nativePlatform === "ios") {
    return googleIosRedirectUri;
  }

  return null;
}

function getGoogleClientIdEnvName(): string {
  if (nativePlatform === "android") {
    return "VITE_GOOGLE_ANDROID_CLIENT_ID";
  }

  if (nativePlatform === "ios") {
    return "VITE_GOOGLE_IOS_CLIENT_ID";
  }

  return "VITE_GOOGLE_CLIENT_ID";
}

function getNativeGoogleConfigError(): string | null {
  if (nativePlatform === "android" && !googleAndroidClientId) {
    return "VITE_GOOGLE_ANDROID_CLIENT_ID belum diisi.";
  }

  if (nativePlatform === "ios" && !googleIosClientId) {
    return "VITE_GOOGLE_IOS_CLIENT_ID belum diisi.";
  }

  return null;
}

function createGoogleAuthUrl({
  clientId,
  redirectUri,
  codeChallenge,
  state,
}: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}) {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");
  return authUrl;
}

function readGoogleCallback(
  callbackUrl: string,
  expectedState: string,
): string {
  const params = getCallbackParams(callbackUrl);
  const error = params.get("error");
  if (error) {
    throw new Error(params.get("error_description") ?? error);
  }

  if (params.get("state") !== expectedState) {
    throw new Error("Google login callback tidak valid.");
  }

  const code = params.get("code");
  if (!code) {
    throw new Error("Google tidak mengembalikan authorization code.");
  }

  return code;
}

function getCallbackParams(callbackUrl: string) {
  const parsed = new URL(callbackUrl);
  const params = new URLSearchParams(parsed.search);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));

  hashParams.forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  return params;
}

async function exchangeGoogleCodeForAccessToken({
  code,
  clientId,
  redirectUri,
  codeVerifier,
  clientSecret,
}: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
  clientSecret?: string;
}) {
  const tokenParams: Record<string, string> = {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  };

  if (clientSecret) {
    tokenParams.client_secret = clientSecret;
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(tokenParams),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text().catch(() => "");
    throw new Error(`Google token exchange gagal: ${body}`);
  }

  const { access_token } = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!access_token) {
    throw new Error("Google tidak mengembalikan access token.");
  }

  return access_token;
}

async function requestDesktopGoogleAccessToken(
  clientId: string,
): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateCodeVerifier();

  // Start the local redirect server. tauri-plugin-oauth returns the port
  // immediately, then emits an "oauth://url" event when Google redirects back.
  const port = await invoke<number>("plugin:oauth|start");
  const redirectUri = `http://localhost:${port}`;
  const authUrl = createGoogleAuthUrl({
    clientId,
    redirectUri,
    codeChallenge,
    state,
  });

  // Register the listener BEFORE opening the browser so we never miss the event.
  try {
    const callbackUrl = await new Promise<string>((resolve, reject) => {
      let unlisten: (() => void) | undefined;
      const timeout = window.setTimeout(() => {
        unlisten?.();
        reject(new Error("Google login timeout."));
      }, googleOAuthTimeoutMs);

      listen<string>("oauth://url", (event) => {
        window.clearTimeout(timeout);
        unlisten?.();
        resolve(event.payload);
      })
        .then((cleanup) => {
          unlisten = cleanup;
          return openBrowser(authUrl.toString());
        })
        .catch((error) => {
          window.clearTimeout(timeout);
          unlisten?.();
          reject(error);
        });
    });

    const code = readGoogleCallback(callbackUrl, state);
    return exchangeGoogleCodeForAccessToken({
      code,
      clientId,
      redirectUri,
      codeVerifier,
      clientSecret: googleClientSecret,
    });
  } finally {
    // Free the port.
    await invoke("plugin:oauth|cancel", { port }).catch(() => undefined);
  }
}

const requestGoogleAccessToken = async (): Promise<string> => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error(`${getGoogleClientIdEnvName()} belum diisi.`);
  }

  return requestDesktopGoogleAccessToken(clientId);
};

const parseResponsePayload = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const getPayloadMessage = (payload: unknown) => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message = record.message ?? record.error ?? record.detail;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return undefined;
};

const requestNativeGoogleAuth = async (): Promise<AuthResponse> => {
  const configError = getNativeGoogleConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const credential = await invoke<NativeGoogleSignInResponse>(
    "plugin:google-auth|sign_in",
    {
      payload: {
        androidClientId: googleAndroidClientId || undefined,
        iosClientId: googleIosClientId || undefined,
        redirectUri: getGoogleRedirectUri() || undefined,
      },
    },
  );
  const idToken = credential.idToken?.trim();
  const accessToken = credential.accessToken?.trim();

  if (!idToken && !accessToken) {
    throw new Error("Google tidak mengembalikan token.");
  }

  const response = await fetch(
    new URL(
      "/api/users/google",
      apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_token: idToken || undefined,
        access_token: accessToken || undefined,
      }),
    },
  );
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(getPayloadMessage(payload) ?? "Google login gagal");
  }

  if (!payload || typeof payload !== "object" || !("token" in payload)) {
    throw new Error("Backend tidak mengembalikan token Malanghub.");
  }

  return payload as AuthResponse;
};

const requestNativeAppleAuth = async (): Promise<AuthResponse> => {
  const credential = await invoke<NativeAppleSignInResponse>(
    "plugin:google-auth|apple_sign_in",
  );
  const identityToken = credential.identityToken?.trim();

  if (!identityToken) {
    throw new Error("Apple tidak mengembalikan identity token.");
  }

  const response = await fetch(
    new URL(
      "/api/users/apple",
      apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity_token: identityToken,
        email: credential.email || undefined,
        name: credential.name || undefined,
      }),
    },
  );
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(getPayloadMessage(payload) ?? "Apple Sign In gagal");
  }

  if (!payload || typeof payload !== "object" || !("token" in payload)) {
    throw new Error("Backend tidak mengembalikan token Malanghub.");
  }

  return payload as AuthResponse;
};

const NativeLink = ({ href, children, onClick, ...props }: LinkProps) =>
  isNativeExternalHref(href) ? (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ) : (
    <Link to={href} onClick={onClick} {...props}>
      {children}
    </Link>
  );

// Query params live inside the hash (`#/news?page=2`); react-router parses
// them into `location.search`, so read them through the router.
const useNativeSearchParam = (name: string) => {
  const [searchParams] = useSearchParams();
  return searchParams.get(name);
};

const NativeImage = ({
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

const NativeMeta = ({ title, description }: MetaProps) => {
  React.useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
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

const NativeMobileBodyClass = () => {
  React.useEffect(() => {
    if (!nativeNavigationEnabled) {
      return undefined;
    }

    document.body.classList.add("malanghub-native-mobile");

    return () => {
      document.body.classList.remove("malanghub-native-mobile");
    };
  }, []);

  return null;
};

const NativeZoomLock = () => {
  React.useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) {
      return undefined;
    }

    let viewport = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]',
    );

    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }

    const previousViewportContent = viewport.content;
    // Android WebView (Chromium) handles user-scalable=no without breaking scroll.
    // iOS and macOS both use WKWebView — user-scalable=no disables its native scroll mechanism.
    viewport.content = nativePlatform === "android"
      ? "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
      : "width=device-width, initial-scale=1, viewport-fit=cover";

    const preventNativeZoomGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventZoomShortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        nativeZoomShortcutKeys.has(event.key)
      ) {
        event.preventDefault();
      }
    };

    // Gesture events (gesturestart/change/end) fire on macOS trackpad at the
    // moment two fingers make contact — before the browser classifies the
    // gesture as a scroll vs. pinch. Calling preventDefault() there blocks
    // scroll on macOS desktop. Restrict these listeners to iOS where they are
    // needed to suppress in-WebView pinch-to-zoom.
    const isIos = nativePlatform === "ios";

    if (isIos) {
      document.addEventListener("gesturestart", preventNativeZoomGesture, {
        passive: false,
      });
      document.addEventListener("gesturechange", preventNativeZoomGesture, {
        passive: false,
      });
      document.addEventListener("gestureend", preventNativeZoomGesture, {
        passive: false,
      });
    }

    window.addEventListener("keydown", preventZoomShortcut, true);

    return () => {
      viewport.content = previousViewportContent;

      if (isIos) {
        document.removeEventListener(
          "gesturestart",
          preventNativeZoomGesture,
        );
        document.removeEventListener(
          "gesturechange",
          preventNativeZoomGesture,
        );
        document.removeEventListener("gestureend", preventNativeZoomGesture);
      }

      window.removeEventListener("keydown", preventZoomShortcut, true);
    };
  }, []);

  return null;
};

const NativeStartupSplash = () => {
  React.useEffect(() => {
    const splash = document.getElementById("malanghub-splash");

    if (!splash) {
      document.body.classList.remove("malanghub-splash-active");
      return undefined;
    }

    const splashStart = Number(
      document.documentElement.dataset.splashStart ?? 0,
    );
    const splashPlatform = document.documentElement.dataset.splashPlatform;
    const elapsed = splashStart ? performance.now() - splashStart : 0;
    const minimumDuration = splashPlatform === "ios" ? 180 : 620;
    let removeTimeout: number | undefined;

    const hideTimeout = window.setTimeout(
      () => {
        document.body.classList.remove("malanghub-splash-active");
        splash.classList.add("malanghub-startup-splash--hide");
        removeTimeout = window.setTimeout(() => {
          splash.remove();
        }, 220);
      },
      Math.max(minimumDuration - elapsed, 0),
    );

    return () => {
      window.clearTimeout(hideTimeout);
      if (removeTimeout) {
        window.clearTimeout(removeTimeout);
      }
    };
  }, []);

  return null;
};

const NativeExternalLinkHandler = () => {
  const { notify } = useMalanghubRuntime();

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      const href = anchor?.getAttribute("href") ?? "";

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        !isNativeExternalHref(href)
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      anchor.removeAttribute("target");
      void openNativeExternalHref(href).catch((error) => {
        console.error(error);
        notify("Tidak bisa membuka tautan eksternal.", "danger");
      });
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [notify]);

  return null;
};

interface NativeHistoryState {
  entries: string[];
  index: number;
}

interface NativeTouchState {
  startX: number;
  startY: number;
  edge: "left" | "right" | null;
  startedAtTop: boolean;
  handled: boolean;
}

const NativeNavigationGestures = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const queryClient = useQueryClient();
  const isRefreshingRef = React.useRef(false);
  const [historyState, setHistoryState] = React.useState<NativeHistoryState>(
    () => ({
      entries: [getNativeRouteKey(location)],
      index: 0,
    }),
  );

  React.useEffect(() => {
    const routeKey = getNativeRouteKey(location);

    setHistoryState((current) => {
      if (current.entries[current.index] === routeKey) {
        return current;
      }

      if (navigationType === "REPLACE") {
        const entries = [...current.entries];
        entries[current.index] = routeKey;
        return { entries, index: current.index };
      }

      if (navigationType === "POP") {
        const existingIndex = current.entries.lastIndexOf(routeKey);
        if (existingIndex !== -1) {
          return { entries: current.entries, index: existingIndex };
        }
      }

      const entries = [
        ...current.entries.slice(0, current.index + 1),
        routeKey,
      ];
      return { entries, index: entries.length - 1 };
    });
  }, [location, navigationType]);

  const canGoBack = historyState.index > 0;
  const canGoForward = historyState.index < historyState.entries.length - 1;

  const refreshCurrentRoute = React.useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      await queryClient.invalidateQueries({ refetchType: "active" });
    } finally {
      isRefreshingRef.current = false;
    }
  }, [queryClient]);

  const goBack = React.useCallback(() => {
    if (canGoBack) {
      navigate(-1);
    }
  }, [canGoBack, navigate]);

  const goForward = React.useCallback(() => {
    if (canGoForward) {
      navigate(1);
    }
  }, [canGoForward, navigate]);

  const canGoBackRef = React.useRef(canGoBack);
  const canGoForwardRef = React.useRef(canGoForward);
  const goBackRef = React.useRef(goBack);
  const goForwardRef = React.useRef(goForward);
  const refreshCurrentRouteRef = React.useRef(refreshCurrentRoute);

  React.useEffect(() => {
    canGoBackRef.current = canGoBack;
    canGoForwardRef.current = canGoForward;
    goBackRef.current = goBack;
    goForwardRef.current = goForward;
    refreshCurrentRouteRef.current = refreshCurrentRoute;
  }, [canGoBack, canGoForward, goBack, goForward, refreshCurrentRoute]);

  React.useEffect(() => {
    if (nativePlatform !== "android" || !canGoBack) {
      return undefined;
    }

    let isActive = true;
    let listener: { unregister: () => Promise<void> } | undefined;

    onBackButtonPress(() => {
      if (canGoBackRef.current) {
        goBackRef.current();
      }
    })
      .then((registeredListener) => {
        if (!isActive) {
          void registeredListener.unregister();
          return;
        }

        listener = registeredListener;
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isActive = false;
      void listener?.unregister();
    };
  }, [canGoBack]);

  React.useEffect(() => {
    if (!nativeNavigationEnabled) {
      return undefined;
    }

    let touchState: NativeTouchState | null = null;

    const onTouchStart = (event: TouchEvent) => {
      if (
        event.touches.length !== 1 ||
        shouldIgnoreNativeGesture(event.target)
      ) {
        touchState = null;
        return;
      }

      const touch = event.touches[0];
      const rightEdgeStart = window.innerWidth - touch.clientX <= 28;
      touchState = {
        startX: touch.clientX,
        startY: touch.clientY,
        edge: touch.clientX <= 28 ? "left" : rightEdgeStart ? "right" : null,
        startedAtTop:
          window.scrollY <= 2 || document.documentElement.scrollTop <= 2,
        handled: false,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchState || touchState.handled || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      const isHorizontalSwipe =
        Math.abs(deltaX) > 72 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35;

      if (
        touchState.edge === "left" &&
        deltaX > 72 &&
        isHorizontalSwipe &&
        canGoBackRef.current
      ) {
        event.preventDefault();
        touchState.handled = true;
        goBackRef.current();
        return;
      }

      if (
        touchState.edge === "right" &&
        deltaX < -72 &&
        isHorizontalSwipe &&
        canGoForwardRef.current
      ) {
        event.preventDefault();
        touchState.handled = true;
        goForwardRef.current();
        return;
      }

      if (
        touchState.startedAtTop &&
        touchState.startY <= 120 &&
        deltaY > 96 &&
        Math.abs(deltaX) < 45
      ) {
        event.preventDefault();
        touchState.handled = true;
        void refreshCurrentRouteRef.current();
      }
    };

    const clearTouchState = () => {
      touchState = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", clearTouchState, { passive: true });
    window.addEventListener("touchcancel", clearTouchState, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", clearTouchState);
      window.removeEventListener("touchcancel", clearTouchState);
    };
  }, []);

  if (!nativeNavigationEnabled) {
    return null;
  }

  return null;
};

const nativeBackdropClass = "fixed inset-0 z-[1045] flex items-end bg-overlay";

/**
 * Pins a bottom sheet to the part of the screen the on-screen keyboard leaves
 * visible. iOS WKWebView doesn't shrink the layout viewport when the keyboard
 * opens, so a `bottom: 0` sheet would sit underneath the keyboard.
 */
const useKeyboardAwareOverlay = (active: boolean) => {
  const [style, setStyle] = React.useState<React.CSSProperties>();

  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) {
      setStyle(undefined);
      return undefined;
    }

    const update = () =>
      setStyle({
        top: viewport.offsetTop,
        height: viewport.height,
        bottom: "auto",
      });

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [active]);

  return style;
};

const nativeTabClass = (active: boolean) =>
  cx(
    "flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl border-0 text-[11px] leading-none font-bold focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none active:bg-brand-soft active:text-brand-hover",
    active ? "bg-brand-soft text-brand" : "bg-transparent text-muted",
  );

const nativeSheetOptionClass = (active: boolean) =>
  cx(
    "flex w-full items-center gap-3 rounded-xl border-0 px-3.5 py-[13px] text-left text-base font-bold active:bg-brand-soft active:text-brand",
    active ? "bg-brand-soft text-brand" : "bg-transparent text-body",
  );

const NativeTabIcon = ({ icon }: { icon: string }) => (
  <span aria-hidden="true" className="text-[19px] leading-none">
    <span className={cx("fa", icon)} />
  </span>
);

const NativeSheetIcon = ({ icon }: { icon: string }) => (
  <span aria-hidden="true" className="w-5 shrink-0 text-center text-brand">
    <span className={cx("fa", icon)} />
  </span>
);

const NativeActionSheet = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose(): void;
}) => (
  <div
    className={nativeBackdropClass}
    onClick={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}
  >
    <section
      className="w-full rounded-t-[20px] border border-b-0 border-line bg-surface shadow-[0_-12px_40px_var(--mh-shadow-color)] max-h-[min(72vh,620px)] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-[18px] pt-[18px] pb-3">
        <h2 className="m-0 text-lg font-extrabold text-fg">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="grid size-9 place-items-center rounded-full border-0 bg-surface-2 text-body"
        >
          <span className="fa fa-times" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[calc(min(72vh,620px)-67px)] overflow-y-auto px-3.5 pt-2.5 pb-[calc(18px+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </section>
  </div>
);

const NativeBottomTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { api, authStorage, authVersion } = useMalanghubRuntime();
  const categories = useCategories(api);
  const [hasToken, setHasToken] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
    });
  }, [authStorage, authVersion]);

  React.useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const searchOverlayStyle = useKeyboardAwareOverlay(searchOpen);

  if (!nativeNavigationEnabled) {
    return null;
  }

  const currentPath = location.pathname;
  const profileHref = hasToken ? "/users" : "/signin";
  const profileLabel = hasToken ? "Profil" : "Masuk";

  const closeSheets = () => {
    setSearchOpen(false);
    setCategoryOpen(false);
  };

  const goTo = (href: string) => {
    closeSheets();
    navigate(href);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextSearch = search.trim();

    if (!nextSearch) {
      return;
    }

    closeSheets();
    navigate(`/search/${encodeURIComponent(nextSearch)}`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const isActive = (key: string) => {
    if (key === "/") {
      return currentPath === "/";
    }

    if (key === "/news") {
      return (
        currentPath.startsWith("/news") ||
        currentPath.startsWith("/newsCategories") ||
        currentPath.startsWith("/newsTags")
      );
    }

    if (key === "/profile") {
      return hasToken
        ? currentPath.startsWith("/users")
        : currentPath.startsWith("/signin") ||
            currentPath.startsWith("/signup");
    }

    return currentPath.startsWith(key);
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-[1040] flex min-h-[calc(66px+env(safe-area-inset-bottom))] items-stretch gap-0.5 border-t border-line bg-surface/95 px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_28px_var(--mh-shadow-color)] backdrop-blur-lg"
        aria-label="Navigasi utama"
      >
        <button
          type="button"
          className={nativeTabClass(isActive("/"))}
          onClick={() => goTo("/")}
        >
          <NativeTabIcon icon="fa-home" />
          <span>Beranda</span>
        </button>
        <button
          type="button"
          className={nativeTabClass(isActive("/news"))}
          onClick={() => {
            setSearchOpen(false);
            setCategoryOpen(true);
          }}
        >
          <NativeTabIcon icon="fa-newspaper-o" />
          <span>Berita</span>
        </button>
        <button
          type="button"
          className={nativeTabClass(isActive("/search"))}
          onClick={() => {
            setCategoryOpen(false);
            setSearchOpen(true);
          }}
        >
          <NativeTabIcon icon="fa-search" />
          <span>Cari</span>
        </button>
        <button
          type="button"
          className={nativeTabClass(isActive("/contact"))}
          onClick={() => goTo("/contact")}
        >
          <NativeTabIcon icon="fa-envelope-o" />
          <span>Kontak</span>
        </button>
        <button
          type="button"
          className={nativeTabClass(isActive("/profile"))}
          onClick={() => goTo(profileHref)}
        >
          <NativeTabIcon icon="fa-user-circle-o" />
          <span>{profileLabel}</span>
        </button>
      </nav>
      <div
        className="hidden h-[calc(76px+env(safe-area-inset-bottom))] native-mobile:block"
        aria-hidden="true"
      />
      {categoryOpen && (
        <NativeActionSheet
          title="Kategori Berita"
          onClose={() => setCategoryOpen(false)}
        >
          <div className="grid gap-2">
            <button
              type="button"
              className={nativeSheetOptionClass(currentPath === "/news")}
              onClick={() => goTo("/news")}
            >
              <NativeSheetIcon icon="fa-newspaper-o" />
              <span>Semua Berita</span>
            </button>
            {categories.isLoading && (
              <div className="px-3.5 py-3 font-semibold text-muted">
                Memuat kategori...
              </div>
            )}
            {!categories.isLoading &&
              (categories.data ?? []).map((category) => (
                <button
                  key={category._id ?? category.slug}
                  type="button"
                  className={nativeSheetOptionClass(
                    currentPath === `/newsCategories/${category.slug}`,
                  )}
                  onClick={() => goTo(`/newsCategories/${category.slug}`)}
                >
                  <NativeSheetIcon icon="fa-folder-o" />
                  <span>{category.name}</span>
                </button>
              ))}
            {!categories.isLoading && !categories.data?.length && (
              <div className="px-3.5 py-3 font-semibold text-muted">
                Kategori belum tersedia.
              </div>
            )}
          </div>
        </NativeActionSheet>
      )}
      {searchOpen && (
        <div
          className={nativeBackdropClass}
          style={searchOverlayStyle}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSearchOpen(false);
            }
          }}
        >
          <form
            className="w-full rounded-t-[20px] border border-b-0 border-line bg-surface shadow-[0_-12px_40px_var(--mh-shadow-color)] px-[18px] pt-[18px] pb-[calc(18px+env(safe-area-inset-bottom))]"
            onSubmit={onSearch}
          >
            <label
              htmlFor="native-search-input"
              className="mb-2.5 block font-extrabold text-fg"
            >
              Cari Berita
            </label>
            <div className="flex overflow-hidden rounded-[10px] border border-line bg-input focus-within:border-brand focus-within:ring-[3px] focus-within:ring-ring">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent p-3.5 text-base text-fg outline-none placeholder:text-muted"
                ref={searchInputRef}
                id="native-search-input"
                type="search"
                placeholder="Masukkan kata kunci"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                type="submit"
                aria-label="Cari"
                className="w-[54px] border-0 bg-brand text-brand-fg"
              >
                <span className="fa fa-search" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className={cx(nativeSheetOptionClass(false), "mt-2")}
              onClick={() => {
                const question = search.trim();
                goTo(question ? `/ask?q=${encodeURIComponent(question)}` : "/ask");
              }}
            >
              <NativeSheetIcon icon="fa-comments" />
              <span>Tanya Malanghub AI</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const NativeProviders = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const adapters = React.useMemo<PlatformAdapters>(
    () => ({
      Link: NativeLink,
      Image: NativeImage,
      Meta: NativeMeta,
      navigate: (href) => navigate(href),
      useCurrentPath: () => location.pathname,
      useSearchParam: useNativeSearchParam,
      reportError: (error) => console.error(error),
      requestGoogleAuth: isMobilePlatform(nativePlatform)
        ? requestNativeGoogleAuth
        : undefined,
      requestGoogleAccessToken: isMobilePlatform(nativePlatform)
        ? undefined
        : requestGoogleAccessToken,
      googleAuthAvailable: isMobilePlatform(nativePlatform)
        ? !getNativeGoogleConfigError()
        : Boolean(getGoogleClientId()),
      googleAuthUnavailableMessage:
        getNativeGoogleConfigError() ??
        "Isi VITE_GOOGLE_CLIENT_ID untuk mengaktifkan Google login.",
      appleAuthAvailable:
        nativePlatform === "ios" || nativePlatform === "macos",
      requestAppleAuth:
        nativePlatform === "ios" || nativePlatform === "macos"
          ? requestNativeAppleAuth
          : undefined,
      tinyApiKey,
      apiBaseUrl,
      appName: "Malanghub",
    }),
    [location.pathname, navigate],
  );

  return (
    <MalanghubProviders apiBaseUrl={apiBaseUrl} adapters={adapters}>
      <NativeStartupSplash />
      <NativeZoomLock />
      <NativeMobileBodyClass />
      <NativeExternalLinkHandler />
      <AppShell>{children}</AppShell>
      <NativeNavigationGestures />
      {nativeNavigationEnabled && <NativeBottomTabs />}
    </MalanghubProviders>
  );
};

const NewsDetailRoute = () => {
  const { slug } = useParams();
  return <NewsDetailPage slug={slug} />;
};

const CategoryRoute = () => {
  const { slug } = useParams();
  return <NewsCategoryPage slug={slug} />;
};

const TagRoute = () => {
  const { slug } = useParams();
  return <NewsTagPage slug={slug} />;
};

const SearchRoute = () => {
  const { search } = useParams();
  return <SearchPage search={search ? decodeURIComponent(search) : ""} />;
};

const UserRoute = () => {
  const { id } = useParams();
  return <UserProfilePage id={id} />;
};

const DraftPreviewRoute = () => {
  const { slug } = useParams();
  return <DraftPreviewPage slug={slug} />;
};

const App = () => (
  <HashRouter>
    <NativeProviders>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/news/:slug" element={<NewsDetailRoute />} />
        <Route path="/newsCategories/:slug" element={<CategoryRoute />} />
        <Route path="/newsTags/:slug" element={<TagRoute />} />
        <Route path="/search/:search" element={<SearchRoute />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/users" element={<DashboardPage />} />
        <Route path="/users/news" element={<DashboardPage />} />
        <Route path="/users/news/drafts" element={<DashboardPage />} />
        <Route path="/users/news/agreements" element={<DashboardPage />} />
        <Route path="/users/categories" element={<DashboardPage />} />
        <Route path="/users/tags" element={<DashboardPage />} />
        <Route path="/users/newsDrafts/:slug" element={<DraftPreviewRoute />} />
        <Route path="/users/:id" element={<UserRoute />} />
        <Route path="/ask" element={<AskPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </NativeProviders>
  </HashRouter>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
