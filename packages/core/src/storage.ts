export interface AuthStorage {
  getToken(): string | null | Promise<string | null>;
  setToken(token: string): void | Promise<void>;
  clearToken(): void | Promise<void>;
}

const TOKEN_KEY = "token";

export const createLocalStorageAuthStorage = (
  key: string = TOKEN_KEY
): AuthStorage => ({
  getToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setToken(token: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, token);
  },
  clearToken() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
});

export const noopAuthStorage: AuthStorage = {
  getToken: () => null,
  setToken: () => undefined,
  clearToken: () => undefined,
};
