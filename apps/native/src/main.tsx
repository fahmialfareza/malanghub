import React from "react";
import ReactDOM from "react-dom/client";
import type { AuthResponse } from "@malanghub/core";
import { HashRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AppShell,
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
} from "@malanghub/ui";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { platform, type Platform } from "@tauri-apps/plugin-os";
import { open as openBrowser } from "@tauri-apps/plugin-shell";
import "@malanghub/ui/styles.css";

const apiBaseUrl = import.meta.env.VITE_API_ADDRESS || "http://localhost:8080";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const googleAndroidClientId = import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID || "";
const googleIosClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || "";
const googleIosRedirectUri =
  import.meta.env.VITE_GOOGLE_IOS_REDIRECT_URI ||
  "com.malanghub.app:/oauth2redirect/google";
const googleServerClientId =
  import.meta.env.VITE_GOOGLE_SERVER_CLIENT_ID || googleClientId;
const tinyApiKey = import.meta.env.VITE_TINY_API_KEY || "";
// Required when using a "Web application" OAuth client type in Google Cloud.
// Leave empty if you created a "Desktop app" client (PKCE works without it).
const googleClientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "";
const nativePlatform = platform();
const googleOAuthTimeoutMs = 5 * 60 * 1000;

interface NativeGoogleSignInResponse {
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  photoUrl?: string;
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
  if (nativePlatform === "android" && !googleServerClientId) {
    return "VITE_GOOGLE_SERVER_CLIENT_ID belum diisi.";
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

function readGoogleCallback(callbackUrl: string, expectedState: string): string {
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
  clientId: string
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
        serverClientId: googleServerClientId || undefined,
        redirectUri: getGoogleRedirectUri() || undefined,
      },
    }
  );
  const idToken = credential.idToken?.trim();
  const accessToken = credential.accessToken?.trim();

  if (!idToken && !accessToken) {
    throw new Error("Google tidak mengembalikan token.");
  }

  const response = await fetch(
    new URL(
      "/api/users/google",
      apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_token: idToken || undefined,
        access_token: accessToken || undefined,
      }),
    }
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

const NativeLink = ({ href, children, ...props }: LinkProps) => (
  <Link to={href} {...props}>
    {children}
  </Link>
);

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
      tinyApiKey,
      apiBaseUrl,
      appName: "Malanghub",
    }),
    [location.pathname, navigate]
  );

  return (
    <MalanghubProviders apiBaseUrl={apiBaseUrl} adapters={adapters}>
      <AppShell>{children}</AppShell>
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
        <Route path="/users/newsDrafts/:slug" element={<DraftPreviewRoute />} />
        <Route path="/users/:id" element={<UserRoute />} />
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
  </React.StrictMode>
);
