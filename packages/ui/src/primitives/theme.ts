import { useCallback, useEffect, useState } from "react";

export type ThemeName = "light" | "dark";

const readTheme = (): ThemeName =>
  typeof document !== "undefined" &&
  document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";

/** Sets `data-theme` on <html> and remembers the choice. */
export const applyTheme = (theme: ThemeName) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // Storage can be unavailable in restricted WebViews.
  }
};

/**
 * Current theme, kept in sync with the `data-theme` attribute no matter who
 * changes it (Redux in the web app, the shared shell in the native app).
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeName>(readTheme);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    setThemeState(readTheme());
    const observer = new MutationObserver(() => setThemeState(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((next: ThemeName) => applyTheme(next), []);

  return { theme, setTheme };
};
