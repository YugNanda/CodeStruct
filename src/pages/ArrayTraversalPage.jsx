import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCheck,
  Clock3,
  Code2,
  Copy,
  Download,
  Eye,
  Grid3X3,
  Info,
  Keyboard,
  Layers,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Upload,
  Waypoints,
  X,
  Zap,
} from "lucide-react";
import {
  arrayTraversalCPP,
  arrayTraversalJava,
  arrayTraversalPython,
  arrayTraversalJS,
  TRAVERSAL_MODES,
  generateTraversalSteps,
  generateRandomMatrix,
  PRESET_MATRICES,
} from "../algorithms/arrayTraversal";
import { renderHighlightedCode } from "../utils/codeHighlight";

// ─── Constants ──────────────────────────────────────────────────────────────

const CELL_SIZE = 64;
const CELL_GAP = 6;

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const modeColorMap = {
  row: { bg: "bg-sky-500/20", border: "border-sky-400/30", text: "text-sky-200", accent: "#0ea5e9" },
  col: { bg: "bg-violet-500/20", border: "border-violet-400/30", text: "text-violet-200", accent: "#8b5cf6" },
  diagonal: { bg: "bg-amber-500/20", border: "border-amber-400/30", text: "text-amber-200", accent: "#f59e0b" },
  spiral: { bg: "bg-rose-500/20", border: "border-rose-400/30", text: "text-rose-200", accent: "#f43f5e" },
  reverseRow: { bg: "bg-teal-500/20", border: "border-teal-400/30", text: "text-teal-200", accent: "#14b8a6" },
  zigzag: { bg: "bg-pink-500/20", border: "border-pink-400/30", text: "text-pink-200", accent: "#ec4899" },
};

const traversalDescriptions = {
  row: "Visits each element left-to-right, top-to-bottom. The outer loop iterates rows, inner loop iterates columns. Time: O(m×n), Space: O(1).",
  col: "Visits each element top-to-bottom, left-to-right. The outer loop iterates columns, inner loop iterates rows. Time: O(m×n), Space: O(1).",
  diagonal: "Visits elements along anti-diagonals from top-right to bottom-left. Useful in matrix compression & dynamic programming. Time: O(m×n), Space: O(1).",
  spiral: "Visits elements in a spiral from the outermost layer inward. Uses four pointers (top, bottom, left, right). Time: O(m×n), Space: O(1).",
  reverseRow: "Visits elements right-to-left, bottom-to-top — the exact reverse of row-wise traversal. Time: O(m×n), Space: O(1).",
  zigzag: "Alternates direction each row: even rows go left-to-right, odd rows right-to-left. Also called snake/boustrophedon traversal. Time: O(m×n), Space: O(1).",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ArrayTraversalPage() {
  const navigate = useNavigate();

  // Matrix state
  const [matrixRows, setMatrixRows] = useState(3);
  const [matrixCols, setMatrixCols] = useState(4);
  const [matrix, setMatrix] = useState(() => generateRandomMatrix(3, 4));
  const [editingCell, setEditingCell] = useState(null);

  // Custom input state
  const [inputMode, setInputMode] = useState("random"); // "random" | "custom" | "preset"
  const [customInputText, setCustomInputText] = useState("");
  const [inputError, setInputError] = useState("");

  // Traversal mode
  const [traversalMode, setTraversalMode] = useState("row");

  // Algorithm state
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(400);
  const [isPaused, setIsPaused] = useState(false);

  // Code panel
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");

  // Learning panel
  const [showLearningPanel, setShowLearningPanel] = useState(true);
  const [showTraversalOrder, setShowTraversalOrder] = useState(true);

  const timerRef = useRef(null);

  // ── Derived state ───────────────────────────────────────────────────────

  const activeCode =
    selectedLanguage === "C++"
      ? arrayTraversalCPP
      : selectedLanguage === "Java"
        ? arrayTraversalJava
        : selectedLanguage === "Python"
          ? arrayTraversalPython
          : arrayTraversalJS;

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  const modeColors = modeColorMap[traversalMode] || modeColorMap.row;

  const progress = steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleGenerateNewMatrix = () => {
    handleReset();
    setMatrix(generateRandomMatrix(matrixRows, matrixCols));
    setCustomInputText("");
    setInputError("");
  };

  const handleResizeMatrix = (newRows, newCols) => {
    handleReset();
    setMatrixRows(newRows);
    setMatrixCols(newCols);
    setMatrix(generateRandomMatrix(newRows, newCols));
    setCustomInputText("");
    setInputError("");
  };

  const handleCellEdit = (r, c, value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    const newMatrix = matrix.map((row) => [...row]);
    newMatrix[r][c] = Math.max(0, Math.min(999, parsed));
    setMatrix(newMatrix);
  };

  const handleReset = () => {
    stopAnimation();
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setIsPaused(false);
  };

  const runAlgorithm = () => {
    handleReset();
    const generatedSteps = generateTraversalSteps(matrix, traversalMode);
    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    setRunStatus("Running");
    setIsPaused(false);
  };

  const stopAnimation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const stepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // ── Custom input handlers ───────────────────────────────────────────────

  const handleCustomMatrixInput = () => {
    setInputError("");
    try {
      const trimmed = customInputText.trim();
      if (!trimmed) {
        setInputError("Please enter a matrix.");
        return;
      }

      let parsed;

      // Try JSON format first: [[1,2],[3,4]]
      if (trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      } else {
        // Row-per-line format:
        // 1 2 3
        // 4 5 6
        parsed = trimmed.split("\n").map((line) =>
          line
            .trim()
            .split(/[\s,;]+/)
            .map(Number)
        );
      }

      // Validate structure
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setInputError("Invalid format. Enter rows of numbers.");
        return;
      }

      const cols = parsed[0].length;
      if (cols === 0) {
        setInputError("Rows cannot be empty.");
        return;
      }

      for (let i = 0; i < parsed.length; i++) {
        if (!Array.isArray(parsed[i]) || parsed[i].length !== cols) {
          setInputError(
            `Row ${i + 1} has ${parsed[i]?.length || 0} cols, expected ${cols}. All rows must have equal columns.`
          );
          return;
        }
        for (let j = 0; j < cols; j++) {
          if (isNaN(parsed[i][j])) {
            setInputError(`Invalid number at row ${i + 1}, col ${j + 1}.`);
            return;
          }
        }
      }

      if (parsed.length > 6 || cols > 6) {
        setInputError("Maximum supported size is 6×6.");
        return;
      }

      if (parsed.length < 2 || cols < 2) {
        setInputError("Minimum supported size is 2×2.");
        return;
      }

      handleReset();
      setMatrixRows(parsed.length);
      setMatrixCols(cols);
      setMatrix(parsed);
      setInputError("");
    } catch {
      setInputError("Could not parse input. Check the format and try again.");
    }
  };

  const handleLoadPreset = (preset) => {
    handleReset();
    setMatrixRows(preset.matrix.length);
    setMatrixCols(preset.matrix[0].length);
    setMatrix(preset.matrix.map((row) => [...row]));
    setCustomInputText(
      preset.matrix.map((row) => row.join(" ")).join("\n")
    );
    setInputError("");
  };

  // Sync custom input text when matrix changes via cell edit
  const syncCustomInputText = useCallback(() => {
    if (inputMode === "custom") {
      setCustomInputText(matrix.map((row) => row.join(" ")).join("\n"));
    }
  }, [matrix, inputMode]);

  useEffect(() => {
    syncCustomInputText();
  }, [matrix, syncCustomInputText]);

  // Timer effect
  useEffect(() => {
    if (runStatus === "Running" && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          stopAnimation();
          setRunStatus("Completed");
          return prev;
        });
      }, speed);
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [runStatus, isPaused, steps.length, speed, stopAnimation]);

  const handleCopyCode = async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("idle");
    }
  };

  const handleDownloadCode = () => {
    const ext =
      selectedLanguage === "C++"
        ? ".cpp"
        : selectedLanguage === "Java"
          ? ".java"
          : selectedLanguage === "Python"
            ? ".py"
            : ".js";
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ArrayTraversal${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Helper: check if cell is visited / current ─────────────────────────

  const isCellVisited = (r, c) => {
    if (!currentStep) return false;
    return currentStep.visited.some((v) => v.row === r && v.col === c);
  };

  const isCellCurrent = (r, c) => {
    if (!currentStep) return false;
    return currentStep.row === r && currentStep.col === c;
  };

  const getVisitOrder = (r, c) => {
    if (!currentStep) return null;
    const idx = currentStep.visited.findIndex((v) => v.row === r && v.col === c);
    return idx >= 0 ? idx + 1 : null;
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      {/* Background gradient */}
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(139,92,246,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ═══════════════════ HEADER SECTION ═══════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7 mb-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Left column */}
          <div>
            <div className="mb-6 flex items-center">
              <button
                onClick={() => navigate("/algorithms")}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-4 pl-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform group-hover:-translate-x-1"
                />
                Back to Algorithms
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border ${modeColors.border} ${modeColors.bg} px-3 py-1 text-xs font-semibold uppercase tracking-widest ${modeColors.text}`}
              >
                2D Array
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 capitalize">
                {inputMode === "random" ? "🎲 Random" : inputMode === "custom" ? "✏️ Custom" : "📋 Preset"}
              </span>
            </div>

            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              2D Array Traversal
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Visualize how different traversal patterns navigate through a 2D
              matrix — Row-wise, Column-wise, Diagonal, Spiral, Zigzag &amp; more.
            </p>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Matrix Size
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {matrixRows} × {matrixCols}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Total Cells
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {matrixRows * matrixCols}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Complexity
                </p>
                <p className="mt-1 text-sm font-semibold text-sky-200">
                  O(m×n)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Steps
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {steps.length > 0
                    ? `${currentStepIndex + 1} / ${steps.length}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Right column — Live Status */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-sky-300" /> Live Status
            </p>

            <div className="mt-4 space-y-3">
              {/* Current action */}
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Action</p>
                <p className="text-sm font-semibold text-white">
                  {currentStep
                    ? currentStep.description
                    : "Press Start to begin"}
                </p>
              </div>

              {/* Phase / indices */}
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Phase
                  </p>
                  <p className="text-base font-bold text-cyan-300 truncate">
                    {currentStep?.phase || "—"}
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Row (i)
                  </p>
                  <p className="text-lg font-bold text-sky-300">
                    {currentStep?.row !== null &&
                    currentStep?.row !== undefined
                      ? currentStep.row
                      : "—"}
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Col (j)
                  </p>
                  <p className="text-lg font-bold text-violet-300">
                    {currentStep?.col !== null &&
                    currentStep?.col !== undefined
                      ? currentStep.col
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: modeColors.accent }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Current value badge */}
              <div className="flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {currentStep?.value !== null &&
                    currentStep?.value !== undefined && (
                      <motion.div
                        key={`${currentStep.row}-${currentStep.col}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className={`rounded-2xl border-2 px-6 py-3 text-center ${modeColors.border} ${modeColors.bg}`}
                      >
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">
                          Current Value
                        </p>
                        <p
                          className={`text-3xl font-black ${modeColors.text}`}
                        >
                          {currentStep.value}
                        </p>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════ MAIN 3-COLUMN LAYOUT ═══════════════════ */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:items-stretch">
        {/* ─── LEFT SIDEBAR: Controls ─── */}
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Waypoints size={18} className="text-sky-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {/* Traversal mode selector */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                <Layers size={13} className="mr-1" /> Traversal Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TRAVERSAL_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setTraversalMode(m.id);
                      if (runStatus !== "Idle") handleReset();
                    }}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
                      traversalMode === m.id
                        ? `${modeColorMap[m.id].bg} ${modeColorMap[m.id].border} ${modeColorMap[m.id].text} border`
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── INPUT MODE SELECTOR ─── */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                <Keyboard size={13} className="mr-1" /> Input Mode
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-800/50 p-1">
                {[
                  { id: "random", label: "Random", icon: Shuffle },
                  { id: "custom", label: "Custom", icon: PenLine },
                  { id: "preset", label: "Presets", icon: Sparkles },
                ].map((mode) => {
                  const ModeIcon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setInputMode(mode.id);
                        setInputError("");
                      }}
                      disabled={runStatus === "Running"}
                      className={`flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-bold transition-all ${
                        inputMode === mode.id
                          ? "bg-sky-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      } disabled:opacity-50`}
                    >
                      <ModeIcon size={11} />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── RANDOM MODE: Size Controls ─── */}
            {inputMode === "random" && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                  <Grid3X3 size={13} className="mr-1" /> Matrix Size
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500">Rows</label>
                    <select
                      value={matrixRows}
                      onChange={(e) =>
                        handleResizeMatrix(
                          Number(e.target.value),
                          matrixCols
                        )
                      }
                      className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-2 py-1.5"
                      disabled={runStatus === "Running"}
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-slate-500 mt-4 text-lg">×</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500">Cols</label>
                    <select
                      value={matrixCols}
                      onChange={(e) =>
                        handleResizeMatrix(
                          matrixRows,
                          Number(e.target.value)
                        )
                      }
                      className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-2 py-1.5"
                      disabled={runStatus === "Running"}
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CUSTOM MODE: Text Input ─── */}
            {inputMode === "custom" && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-1.5 flex items-center gap-1 text-xs uppercase text-slate-400">
                  <PenLine size={13} className="mr-1" /> Enter Matrix
                </label>
                <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                  One row per line, values separated by spaces or commas.
                  <br />
                  Or JSON:{" "}
                  <code className="text-sky-400">[[1,2],[3,4]]</code>
                </p>
                <textarea
                  value={customInputText}
                  onChange={(e) => {
                    setCustomInputText(e.target.value);
                    setInputError("");
                  }}
                  placeholder={`1 2 3 4\n5 6 7 8\n9 10 11 12`}
                  rows={5}
                  disabled={runStatus === "Running"}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 font-mono placeholder:text-slate-600 focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/20 outline-none resize-none disabled:opacity-50"
                />
                {inputError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-[11px] text-red-400 flex items-start gap-1 leading-relaxed"
                  >
                    <X size={11} className="shrink-0 mt-0.5" /> {inputError}
                  </motion.p>
                )}
                <button
                  onClick={handleCustomMatrixInput}
                  disabled={
                    runStatus === "Running" || !customInputText.trim()
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600/80 py-2 text-xs font-bold text-white hover:bg-sky-600 transition-colors disabled:opacity-40"
                >
                  <Upload size={14} /> Apply Matrix
                </button>

                {/* Format examples */}
                <div className="mt-3 rounded-lg bg-slate-800/60 border border-slate-700/50 p-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Format Examples
                  </p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setCustomInputText("1 2 3\n4 5 6\n7 8 9");
                        setInputError("");
                      }}
                      className="w-full text-left rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all font-mono"
                    >
                      Space: 1 2 3 ↵ 4 5 6 ↵ 7 8 9
                    </button>
                    <button
                      onClick={() => {
                        setCustomInputText("1,2,3\n4,5,6\n7,8,9");
                        setInputError("");
                      }}
                      className="w-full text-left rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all font-mono"
                    >
                      Comma: 1,2,3 ↵ 4,5,6 ↵ 7,8,9
                    </button>
                    <button
                      onClick={() => {
                        setCustomInputText(
                          "[[1,2,3],[4,5,6],[7,8,9]]"
                        );
                        setInputError("");
                      }}
                      className="w-full text-left rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all font-mono"
                    >
                      JSON: [[1,2,3],[4,5,6],[7,8,9]]
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── PRESET MODE: Quick-load Options ─── */}
            {inputMode === "preset" && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                  <BookOpen size={13} className="mr-1" /> Preset Matrices
                </label>
                <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
                  {PRESET_MATRICES.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadPreset(preset)}
                      disabled={runStatus === "Running"}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all disabled:opacity-50 group"
                    >
                      <span className="font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-slate-500 group-hover:text-sky-400 transition-colors">
                        {preset.matrix.length}×{preset.matrix[0].length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Speed control */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>
                  <Clock3 size={13} className="mr-1 inline" /> Speed
                </span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-blue-400"
                style={{ direction: "rtl" }}
              />
            </div>

            {/* Toggles */}
            <div className="rounded-2xl bg-white/5 p-3 space-y-2">
              <label className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye size={13} /> Show Visit Order
                </span>
                <input
                  type="checkbox"
                  checked={showTraversalOrder}
                  onChange={(e) => setShowTraversalOrder(e.target.checked)}
                  className="accent-blue-400"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen size={13} /> Learning Panel
                </span>
                <input
                  type="checkbox"
                  checked={showLearningPanel}
                  onChange={(e) => setShowLearningPanel(e.target.checked)}
                  className="accent-blue-400"
                />
              </label>
            </div>

            {/* Step controls */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={stepBackward}
                disabled={currentStepIndex <= 0}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                title="Step Back"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={stepForward}
                disabled={currentStepIndex >= steps.length - 1}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                title="Step Forward"
              >
                <SkipForward size={16} />
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleGenerateNewMatrix}
                disabled={runStatus === "Running"}
                className="flex items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 py-2 text-sm font-bold text-sky-100 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
                title="New Random Matrix"
              >
                <Shuffle size={16} />
              </button>
            </div>

            {/* Start / Pause / Resume */}
            {runStatus === "Idle" || runStatus === "Completed" ? (
              <button
                onClick={() => {
                  if (runStatus === "Completed") handleReset();
                  setTimeout(runAlgorithm, 100);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-500 py-3.5 font-bold text-white shadow-lg hover:shadow-sky-500/25 transition-all"
              >
                <Play size={18} fill="currentColor" />{" "}
                {runStatus === "Completed" ? "Restart" : "Start"}
              </button>
            ) : (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white ${
                  isPaused
                    ? "bg-emerald-600"
                    : "bg-amber-500 text-slate-900"
                }`}
              >
                {isPaused ? (
                  <Play size={18} fill="currentColor" />
                ) : (
                  <Pause size={18} fill="currentColor" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </button>
            )}
          </div>
        </aside>

        {/* ─── CENTER: Matrix Visualization ─── */}
        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col">
          {/* Traversal mode description */}
          {showLearningPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4"
            >
              <div className="flex items-start gap-3">
                <Info
                  size={18}
                  className={`${modeColors.text} shrink-0 mt-0.5`}
                />
                <div>
                  <h3 className={`text-sm font-bold ${modeColors.text}`}>
                    {
                      TRAVERSAL_MODES.find((m) => m.id === traversalMode)
                        ?.icon
                    }{" "}
                    {
                      TRAVERSAL_MODES.find((m) => m.id === traversalMode)
                        ?.label
                    }{" "}
                    Traversal
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {traversalDescriptions[traversalMode]}
                  </p>
                  {/* Pseudocode hint */}
                  <div className="mt-2 rounded-lg bg-slate-800/80 px-3 py-2 font-mono text-[11px] text-slate-300 leading-relaxed">
                    {traversalMode === "row" && (
                      <>
                        <span className="text-pink-400">for</span> i = 0 →
                        rows-1:
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-pink-400">for</span> j = 0 →
                        cols-1:
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-cyan-400">visit</span>
                        (matrix[i][j])
                      </>
                    )}
                    {traversalMode === "col" && (
                      <>
                        <span className="text-pink-400">for</span> j = 0 →
                        cols-1:
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-pink-400">for</span> i = 0 →
                        rows-1:
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-cyan-400">visit</span>
                        (matrix[i][j])
                      </>
                    )}
                    {traversalMode === "diagonal" && (
                      <>
                        <span className="text-pink-400">for</span> d = 0 →
                        rows+cols-2:
                        <br />
                        &nbsp;&nbsp;startRow = d {"<"} cols ? 0 : d-cols+1
                        <br />
                        &nbsp;&nbsp;startCol = d {"<"} cols ? d : cols-1
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-pink-400">while</span>{" "}
                        inBounds:
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-cyan-400">visit</span>
                        (matrix[startRow++][startCol--])
                      </>
                    )}
                    {traversalMode === "spiral" && (
                      <>
                        top=0, bottom=R-1, left=0, right=C-1
                        <br />
                        <span className="text-pink-400">while</span>{" "}
                        top≤bottom && left≤right:
                        <br />
                        &nbsp;&nbsp;→ right, ↓ down, ← left, ↑ up
                        <br />
                        &nbsp;&nbsp;shrink boundaries
                      </>
                    )}
                    {traversalMode === "reverseRow" && (
                      <>
                        <span className="text-pink-400">for</span> i =
                        rows-1 → 0:
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-pink-400">for</span> j =
                        cols-1 → 0:
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-cyan-400">visit</span>
                        (matrix[i][j])
                      </>
                    )}
                    {traversalMode === "zigzag" && (
                      <>
                        <span className="text-pink-400">for</span> i = 0 →
                        rows-1:
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-pink-400">if</span> i % 2 ==
                        0: j = 0 → cols-1
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-pink-400">else</span>: j =
                        cols-1 → 0
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-cyan-400">visit</span>
                        (matrix[i][j])
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Matrix Grid */}
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <div className="inline-block">
              {/* Column headers */}
              <div
                className="flex mb-1"
                style={{ paddingLeft: CELL_SIZE * 0.65 }}
              >
                {Array.from({ length: matrixCols }).map((_, c) => (
                  <div
                    key={c}
                    className="text-center text-[10px] font-bold text-slate-500 uppercase"
                    style={{
                      width: CELL_SIZE + CELL_GAP,
                      minWidth: CELL_SIZE + CELL_GAP,
                    }}
                  >
                    Col {c}
                  </div>
                ))}
              </div>

              {matrix.map((row, r) => (
                <div
                  key={r}
                  className="flex items-center"
                  style={{ marginBottom: CELL_GAP }}
                >
                  {/* Row header */}
                  <div
                    className="text-[10px] font-bold text-slate-500 text-right pr-2 shrink-0"
                    style={{ width: CELL_SIZE * 0.6 }}
                  >
                    Row {r}
                  </div>

                  {row.map((val, c) => {
                    const visited = isCellVisited(r, c);
                    const current = isCellCurrent(r, c);
                    const order = getVisitOrder(r, c);

                    let cellBg = "bg-slate-800/80 border-slate-700/50";
                    let cellText = "text-slate-300";

                    if (current) {
                      cellBg = `border-2 ${modeColors.border} shadow-lg`;
                      cellText = "text-white font-black";
                    } else if (visited) {
                      cellBg = `${modeColors.bg} ${modeColors.border} border`;
                      cellText = modeColors.text;
                    }

                    const isEditing =
                      editingCell &&
                      editingCell.r === r &&
                      editingCell.c === c;

                    return (
                      <motion.div
                        key={c}
                        layout
                        className={`relative rounded-xl border flex items-center justify-center font-mono text-sm font-bold transition-all duration-200 cursor-pointer select-none ${cellBg} ${cellText}`}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          marginRight: CELL_GAP,
                          background: current
                            ? modeColors.accent
                            : undefined,
                        }}
                        animate={
                          current
                            ? {
                                scale: [1, 1.15, 1],
                                transition: { duration: 0.3 },
                              }
                            : { scale: 1 }
                        }
                        onClick={() => {
                          if (runStatus === "Idle")
                            setEditingCell({ r, c });
                        }}
                        title={
                          runStatus === "Idle"
                            ? "Click to edit"
                            : `[${r}][${c}] = ${val}`
                        }
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={val}
                            autoFocus
                            className="w-full h-full bg-transparent text-center text-white text-sm font-bold outline-none"
                            onBlur={(e) => {
                              handleCellEdit(r, c, e.target.value);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCellEdit(r, c, e.target.value);
                                setEditingCell(null);
                              }
                              if (e.key === "Escape")
                                setEditingCell(null);
                            }}
                            min={0}
                            max={999}
                          />
                        ) : (
                          <>
                            <span
                              className={current ? "text-slate-900" : ""}
                            >
                              {val}
                            </span>
                            {/* Visit order badge */}
                            {showTraversalOrder &&
                              visited &&
                              order !== null && (
                                <span
                                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                                  style={{
                                    background: modeColors.accent,
                                    color: "#0f172a",
                                  }}
                                >
                                  {order}
                                </span>
                              )}
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Traversal order strip */}
          {currentStep && currentStep.visited.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                <ArrowRight size={10} /> Traversal Order
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentStep.visited.map((v, idx) => {
                  const isCurr =
                    v.row === currentStep.row &&
                    v.col === currentStep.col;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-mono font-bold transition-all ${
                        isCurr
                          ? `${modeColors.bg} ${modeColors.text} border ${modeColors.border} ring-1 ring-white/20`
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {matrix[v.row][v.col]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ─── RIGHT SIDEBAR: Visited Log & Cheat Sheet ─── */}
        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 shadow-2xl backdrop-blur flex flex-col min-h-[28rem]">
          {/* Visit log */}
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Zap size={14} className="text-amber-300" /> Visit Log
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Elements visited in order.
            </p>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/50 p-2 relative">
            {currentStep && currentStep.visited.length > 0 ? (
              <div className="space-y-1">
                {currentStep.visited.map((v, idx) => {
                  const isCurr =
                    v.row === currentStep.row &&
                    v.col === currentStep.col;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
                        isCurr
                          ? `${modeColors.bg} ${modeColors.text} font-bold`
                          : "text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-slate-600 w-6">
                        {idx + 1}.
                      </span>
                      <span>
                        [{v.row}][{v.col}]
                      </span>
                      <span
                        className={isCurr ? "text-white font-bold" : ""}
                      >
                        = {matrix[v.row][v.col]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 text-center p-4">
                Click Start to begin traversal
              </div>
            )}
          </div>

          {/* Quick reference card */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
              <BookOpen size={12} /> Quick Reference
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ background: modeColors.accent }}
                />
                <span className="text-slate-300">
                  Current cell being visited
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-sm shrink-0 ${modeColors.bg} border ${modeColors.border}`}
                />
                <span className="text-slate-300">
                  Already visited cells
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm shrink-0 bg-slate-800 border border-slate-700" />
                <span className="text-slate-300">Not yet visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-3 w-3 items-center justify-center rounded-full text-[6px] font-bold shrink-0"
                  style={{
                    background: modeColors.accent,
                    color: "#0f172a",
                  }}
                >
                  n
                </span>
                <span className="text-slate-300">
                  Order of visit (when enabled)
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                <PenLine size={11} className="text-slate-500 shrink-0" />
                <span className="text-slate-300">
                  Click any cell to edit (when idle)
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══════════════════ CODE SECTION ═══════════════════ */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/algorithms")}
              className="group flex items-center gap-2 rounded-lg bg-white/5 pr-4 pl-3 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white border border-white/10"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back to Algorithms
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <Code2 size={20} className="text-blue-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    selectedLanguage === lang
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              {copyState === "copied" ? (
                <CheckCheck size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>
        <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed text-slate-300">
          <pre>
            <code>
              {(activeCode || "").split("\n").map((line, i) => (
                <div key={i} className="flex hover:bg-white/5 px-2 rounded">
                  <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-4 text-xs">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">
                    {renderHighlightedCode(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}
