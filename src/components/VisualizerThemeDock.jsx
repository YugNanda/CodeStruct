import { useEffect } from "react";
import { Keyboard, Maximize2, Minimize2, Palette, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useVisualizerTheme } from "../context/VisualizerThemeContext";
import { shouldSkipHotkeyTarget } from "../hooks/useStableHotkeys";

export default function VisualizerThemeDock() {
  const location = useLocation();
  const {
    themeKey,
    themes,
    setTheme,
    cycleTheme,
    focusMode,
    toggleFocusMode,
    ambientFx,
    toggleAmbientFx,
  } = useVisualizerTheme();

  const isVisualizerRoute = location.pathname.startsWith("/visualizer/");

  useEffect(() => {
    if (!isVisualizerRoute) return undefined;

    const handleKeyDown = (event) => {
      if (shouldSkipHotkeyTarget(event.target)) return;
      if (event.repeat) return;
      const key = event.key?.toLowerCase();
      if (!["c", "f", "b"].includes(key)) return;

      event.preventDefault();
      if (key === "c") cycleTheme();
      if (key === "f") toggleFocusMode();
      if (key === "b") toggleAmbientFx();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycleTheme, isVisualizerRoute, toggleAmbientFx, toggleFocusMode]);

  if (!isVisualizerRoute) return null;

  return (
    <div className="visualizer-control-hub fixed right-3 bottom-3 z-40 w-[min(92vw,360px)] rounded-2xl border border-white/15 bg-slate-950/75 p-3 shadow-[0_20px_60px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:right-4 sm:bottom-4 sm:p-4">
      <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">
        <Palette size={12} className="text-[var(--viz-theme-accent)]" />
        Visualizer Hub
      </p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(themes).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            className={`group rounded-xl border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-all ${
              themeKey === key
                ? "border-[var(--viz-theme-accent)] bg-[color:var(--viz-theme-pill)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span
              className="mb-1 block h-1.5 w-full rounded-full"
              style={{ background: config.swatch }}
            />
            {config.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleFocusMode}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ${
            focusMode
              ? "border-[var(--viz-theme-accent)] bg-[color:var(--viz-theme-pill)] text-white"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {focusMode ? "Exit Focus" : "Focus Mode"}
        </button>
        <button
          type="button"
          onClick={toggleAmbientFx}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ${
            ambientFx
              ? "border-[var(--viz-theme-accent)] bg-[color:var(--viz-theme-pill)] text-white"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          <Sparkles size={14} />
          {ambientFx ? "FX On" : "FX Off"}
        </button>
      </div>
      <div className="mt-2 inline-flex items-center gap-2 text-[10px] text-slate-400">
        <Keyboard size={12} />
        <span>`C` theme, `F` focus, `B` effects</span>
      </div>
    </div>
  );
}
