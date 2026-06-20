import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_THEME_KEY = "dsa-visualizer-theme";
const STORAGE_FOCUS_KEY = "dsa-visualizer-focus";
const STORAGE_AMBIENT_KEY = "dsa-visualizer-ambient";
const STORAGE_COLOR_MODE_KEY = "dsa-visualizer-color-mode";
const STORAGE_SOUND_KEY = "dsa-visualizer-sound";
const DEFAULT_THEME_KEY = "ocean";

export const VISUALIZER_THEMES = {
  ocean: {
    label: "Ocean",
    swatch: "linear-gradient(135deg,#06b6d4,#3b82f6)",
  },
  sunrise: {
    label: "Sunrise",
    swatch: "linear-gradient(135deg,#fb923c,#ec4899)",
  },
  aurora: {
    label: "Aurora",
    swatch: "linear-gradient(135deg,#34d399,#22d3ee)",
  },
};

const VisualizerThemeContext = createContext(null);

function resolveInitialTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME_KEY;
  const saved = window.localStorage.getItem(STORAGE_THEME_KEY);
  if (saved && VISUALIZER_THEMES[saved]) return saved;
  return DEFAULT_THEME_KEY;
}

function resolveInitialBoolean(storageKey, fallback = false) {
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(storageKey);
  if (saved === null) return fallback;
  return saved === "true";
}

function resolveInitialColorMode() {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_COLOR_MODE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export function VisualizerThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(resolveInitialTheme);
  const [focusMode, setFocusMode] = useState(() =>
    resolveInitialBoolean(STORAGE_FOCUS_KEY, false),
  );
  const [ambientFx, setAmbientFx] = useState(() =>
    resolveInitialBoolean(STORAGE_AMBIENT_KEY, true),
  );
  const [colorMode, setColorMode] = useState(resolveInitialColorMode);
  const [soundEnabled, setSoundEnabled] = useState(() =>
    resolveInitialBoolean(STORAGE_SOUND_KEY, false),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_THEME_KEY, themeKey);
    document.documentElement.setAttribute("data-visualizer-theme", themeKey);
  }, [themeKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_FOCUS_KEY, String(focusMode));
  }, [focusMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_AMBIENT_KEY, String(ambientFx));
    document.documentElement.setAttribute(
      "data-visualizer-ambient",
      ambientFx ? "on" : "off",
    );
  }, [ambientFx]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_COLOR_MODE_KEY, colorMode);
    document.documentElement.setAttribute("data-mode", colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const value = useMemo(() => {
    const setTheme = (nextThemeKey) => {
      if (!VISUALIZER_THEMES[nextThemeKey]) return;
      setThemeKey(nextThemeKey);
    };

    const cycleTheme = () => {
      const keys = Object.keys(VISUALIZER_THEMES);
      const currentIndex = keys.indexOf(themeKey);
      const nextIndex = (currentIndex + 1) % keys.length;
      setThemeKey(keys[nextIndex]);
    };

    const toggleFocusMode = () => {
      setFocusMode((current) => !current);
    };

    const toggleAmbientFx = () => {
      setAmbientFx((current) => !current);
    };

    const toggleColorMode = () => {
      setColorMode((current) => (current === "dark" ? "light" : "dark"));
    };

    const toggleSoundEffects = () => {
      setSoundEnabled((current) => !current);
    };

    return {
      themeKey,
      theme: VISUALIZER_THEMES[themeKey] ?? VISUALIZER_THEMES[DEFAULT_THEME_KEY],
      themes: VISUALIZER_THEMES,
      focusMode,
      ambientFx,
      colorMode,
      soundEnabled,
      setTheme,
      cycleTheme,
      setFocusMode,
      toggleFocusMode,
      setAmbientFx,
      toggleAmbientFx,
      toggleColorMode,
      toggleSoundEffects,
    };
  }, [ambientFx, colorMode, focusMode, soundEnabled, themeKey]);

  return (
    <VisualizerThemeContext.Provider value={value}>
      {children}
    </VisualizerThemeContext.Provider>
  );
}

export function useVisualizerTheme() {
  const context = useContext(VisualizerThemeContext);
  if (!context) {
    throw new Error(
      "useVisualizerTheme must be used inside VisualizerThemeProvider",
    );
  }
  return context;
}
