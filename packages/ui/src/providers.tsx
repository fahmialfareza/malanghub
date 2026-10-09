import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type ApiClient,
  type AuthStorage,
  createApiClient,
  createLocalStorageAuthStorage,
} from "@malanghub/core";
import {
  AdapterProvider,
  type PlatformAdapters,
  browserAdapters,
} from "./adapters";
import { cx } from "./primitives/cx";

interface RuntimeContextValue {
  api: ApiClient;
  authStorage: AuthStorage;
  authVersion: number;
  refreshAuth(): void;
  signOut(): Promise<void>;
  notify(message: string, type?: "success" | "danger" | "info"): void;
}

interface AlertState {
  message: string;
  type: "success" | "danger" | "info";
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

export const useMalanghubRuntime = () => {
  const value = useContext(RuntimeContext);
  if (!value) {
    throw new Error("useMalanghubRuntime must be used inside MalanghubProviders");
  }
  return value;
};

const AlertBanner = ({
  alert,
  onClose,
}: {
  alert: AlertState | null;
  onClose(): void;
}) => {
  if (!alert) return null;

  return (
    <div
      role="alert"
      className={cx(
        "fixed top-4 left-1/2 z-[10060] flex max-w-[min(520px,calc(100vw-32px))] -translate-x-1/2 items-center gap-4 rounded-xl border border-l-4 border-line bg-surface px-3.5 py-3 font-semibold text-fg shadow-pop native-mobile:top-[calc(env(safe-area-inset-top)+76px)]",
        alert.type === "success" && "border-l-success",
        alert.type === "danger" && "border-l-danger",
        alert.type === "info" && "border-l-brand",
      )}
    >
      <span>{alert.message}</span>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={onClose}
        className="rounded-md border-0 bg-transparent px-2 py-0.5 font-bold text-muted hover:bg-surface-2 hover:text-fg"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
};

export interface MalanghubProvidersProps {
  apiBaseUrl: string;
  adapters?: PlatformAdapters;
  authStorage?: AuthStorage;
  queryClient?: QueryClient;
  children: React.ReactNode;
}

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isOnline) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[10005] bg-fg px-4 py-2 text-center text-sm text-bg native-mobile:bottom-[calc(66px+env(safe-area-inset-bottom))]"
    >
      Tidak ada koneksi internet. Menampilkan data tersimpan.
    </div>
  );
};

export const MalanghubProviders = ({
  apiBaseUrl,
  adapters = browserAdapters,
  authStorage = createLocalStorageAuthStorage(),
  queryClient,
  children,
}: MalanghubProvidersProps) => {
  const [authVersion, setAuthVersion] = useState(0);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const offlineBannerEnabled = adapters.offlineBannerEnabled ?? true;

  const client = useMemo(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
            networkMode: "offlineFirst",
          },
        },
      }),
    [queryClient]
  );

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getToken: () => authStorage.getToken(),
        onUnauthorized: async () => {
          await authStorage.clearToken();
          setAuthVersion((value) => value + 1);
        },
      }),
    [apiBaseUrl, authStorage]
  );

  const runtime = useMemo<RuntimeContextValue>(
    () => ({
      api,
      authStorage,
      authVersion,
      refreshAuth: () => setAuthVersion((value) => value + 1),
      signOut: async () => {
        await authStorage.clearToken();
        setAuthVersion((value) => value + 1);
        await client.clear();
      },
      notify: (message, type = "info") => {
        setAlert({ message, type });
      },
    }),
    [api, authStorage, authVersion, client]
  );

  return (
    <AdapterProvider adapters={adapters}>
      <RuntimeContext.Provider value={runtime}>
        <QueryClientProvider client={client}>
          <AlertBanner alert={alert} onClose={() => setAlert(null)} />
          {offlineBannerEnabled && <OfflineBanner />}
          {children}
          {adapters.analytics}
        </QueryClientProvider>
      </RuntimeContext.Provider>
    </AdapterProvider>
  );
};
