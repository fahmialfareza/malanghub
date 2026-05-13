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
    <div className={`malanghub-alert malanghub-alert-${alert.type}`}>
      <span>{alert.message}</span>
      <button type="button" aria-label="Close alert" onClick={onClose}>
        x
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
    <div className="malanghub-offline-banner" role="status">
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
