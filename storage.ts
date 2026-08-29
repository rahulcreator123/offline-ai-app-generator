const DARK_MODE_KEY = "local-ai-app-builder-dark-mode";

export function isDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) return saved === "true";
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
  } catch {
    return false;
  }
}

export function toggleDarkMode(force?: boolean): boolean {
  const next = typeof force === "boolean" ? force : !isDarkMode();
  try {
    localStorage.setItem(DARK_MODE_KEY, String(next));
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.dataset.theme = next ? "dark" : "light";
    }
  } catch {
    // localStorage may be unavailable; still return the intended state.
  }
  return next;
}

export function setDarkMode(enabled: boolean): boolean {
  return toggleDarkMode(enabled);
}
