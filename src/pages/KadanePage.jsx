import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCheck,
  Clock3,
  Code2,
  Copy,
  Download,
  Grid3X3,
  Keyboard,
  Layers,
  PenLine,
  Shuffle,
  Sparkles,
  Upload,
  Waypoints,
  X,
  Zap,
} from "lucide-react";
import {
  kadaneCPP,
  kadaneJava,
  kadanePython,
  kadaneJS,
  generateKadaneSteps,
  generateRandomArray,
  PRESET_ARRAYS,
} from "../algorithms/kadane";
import { renderHighlightedCode } from "../utils/codeHighlight";

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

export default function KadanePage() {
  const navigate = useNavigate();

  // Array state
  const [arraySize, setArraySize] = useState(8);
  const [array, setArray] = useState(() => generateRandomArray(8));

  // Custom input state
  const [inputMode, setInputMode] = useState("random"); // "random" | "custom" | "preset"
  const [customInputText, setCustomInputText] = useState("");
  const [inputError, setInputError] = useState("");

  // Algorithm state
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(600);
  const [isPaused, setIsPaused] = useState(false);

  // Code panel
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");

  const timerRef = useRef(null);

  const activeCode =
    selectedLanguage === "C++"
      ? kadaneCPP
      : selectedLanguage === "Java"
        ? kadaneJava
        : selectedLanguage === "Python"
          ? kadanePython
          : kadaneJS;

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  const progress =
    steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  const handleGenerateNewArray = () => {
    handleReset();
    setArray(generateRandomArray(arraySize));
    setCustomInputText("");
    setInputError("");
  };

  const handleResizeArray = (newSize) => {
    handleReset();
    setArraySize(newSize);
    setArray(generateRandomArray(newSize));
    setCustomInputText("");
    setInputError("");
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
    const generatedSteps = generateKadaneSteps(array);
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

  const handleCustomArrayInput = () => {
    setInputError("");
    try {
      const trimmed = customInputText.trim();
      if (!trimmed) {
        setInputError("Please enter an array.");
        return;
      }

      let parsed;

      // Try JSON format first: [1,2,3]
      if (trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      } else {
        // Space or comma separated Format:
        // 1 2 3
        parsed = trimmed.split(/[\s,]+/).map(Number);
      }

      // Validate structure
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setInputError("Invalid format. Enter a list of numbers.");
        return;
      }

      for (let i = 0; i < parsed.length; i++) {
        if (isNaN(parsed[i])) {
          setInputError(`Invalid number at index ${i}.`);
          return;
        }
      }

      if (parsed.length > 20) {
        setInputError("Maximum supported size is 20 Elements.");
        return;
      }

      if (parsed.length < 1) {
        setInputError("Minimum supported size is 1.");
        return;
      }

      handleReset();
      setArraySize(parsed.length);
      setArray(parsed);
      setInputError("");
    } catch {
      setInputError("Could not parse input. Check the format and try again.");
    }
  };

  const handleLoadPreset = (preset) => {
    handleReset();
    setArraySize(preset.array.length);
    setArray([...preset.array]);
    setCustomInputText(preset.array.join(" "));
    setInputError("");
  };

  // Sync custom input text when array changes
  const syncCustomInputText = useCallback(() => {
    if (inputMode === "custom") {
      setCustomInputText(array.join(" "));
    }
  }, [array, inputMode]);

  useEffect(() => {
    syncCustomInputText();
  }, [array, syncCustomInputText]);

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
    link.download = `Kadane${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Helper: cell rendering logic ─────────────────────────

  const isCellInCurrentSubarray = (i) => {
    if (!currentStep || currentStep.index === null) return false;
    // Current subarray starts at currentStart and goes up to index
    if (
      currentStep.currentStart !== undefined &&
      currentStep.index !== undefined
    ) {
      return i >= currentStep.currentStart && i <= currentStep.index;
    }
    return false;
  };

  const isCellInMaxSubarray = (i) => {
    if (!currentStep || currentStep.start === undefined) return false;
    return i >= currentStep.start && i <= currentStep.end;
  };

  const isCellCurrentIndex = (i) => {
    if (!currentStep || currentStep.index === null) return false;
    return currentStep.index === i;
  };

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      {/* Background gradient */}
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(139,92,246,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
              <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
                1D Array
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 capitalize">
                {inputMode === "random"
                  ? "🎲 Random"
                  : inputMode === "custom"
                    ? "✏️ Custom"
                    : "📋 Preset"}
              </span>
            </div>

            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Kadane's Algorithm
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Visualize finding the maximum contiguous subarray sum in an array
              using dynamic programming approach.
            </p>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Array Size
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {arraySize}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Time Complexity
                </p>
                <p className="mt-1 text-sm font-semibold text-sky-200">O(N)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Space Complexity
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-200">
                  O(1)
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
                <p className="text-sm font-semibold text-white h-10">
                  {currentStep
                    ? currentStep.description
                    : "Press Start to begin"}
                </p>
              </div>

              {/* Progress bar */}
              <div className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-amber-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Kadane specific values */}
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`curr-${currentStep?.currentMax}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      currentMax
                    </p>
                    <p className="text-2xl font-black text-sky-300">
                      {currentStep?.currentMax !== undefined
                        ? currentStep.currentMax
                        : "—"}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`max-${currentStep?.maxSoFar}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      maxSoFar
                    </p>
                    <p className="text-2xl font-black text-emerald-300">
                      {currentStep?.maxSoFar !== undefined
                        ? currentStep.maxSoFar
                        : "—"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[340px_1fr] xl:items-stretch">
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur xl:sticky xl:top-24">
          <div className="mb-5 flex items-center gap-2">
            <Waypoints size={18} className="text-sky-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
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
                          ? "bg-amber-600 text-white shadow-md"
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

            {inputMode === "random" && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                  <Grid3X3 size={13} className="mr-1" /> Array Size
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={arraySize}
                      onChange={(e) =>
                        handleResizeArray(Number(e.target.value))
                      }
                      className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-2 py-1.5"
                      disabled={runStatus === "Running"}
                    >
                      {[4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => (
                        <option key={n} value={n}>
                          {n} Elements
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateNewArray}
                  disabled={runStatus === "Running"}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors disabled:opacity-40"
                >
                  <Shuffle size={14} /> New Random Array
                </button>
              </div>
            )}

            {inputMode === "custom" && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-1.5 flex items-center gap-1 text-xs uppercase text-slate-400">
                  <PenLine size={13} className="mr-1" /> Enter Array
                </label>
                <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                  Values separated by spaces or commas.
                </p>
                <textarea
                  value={customInputText}
                  onChange={(e) => {
                    setCustomInputText(e.target.value);
                    setInputError("");
                  }}
                  placeholder={`-2 1 -3 4 -1 2 1 -5 4`}
                  rows={4}
                  disabled={runStatus === "Running"}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 font-mono placeholder:text-slate-600 focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 outline-none resize-none disabled:opacity-50"
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
                  onClick={handleCustomArrayInput}
                  disabled={runStatus === "Running" || !customInputText.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600/80 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-40"
                >
                  <Upload size={14} /> Apply Array
                </button>
              </div>
            )}

            {inputMode === "preset" && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                  <BookOpen size={13} className="mr-1" /> Preset Arrays
                </label>
                <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
                  {PRESET_ARRAYS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadPreset(preset)}
                      disabled={runStatus === "Running"}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all disabled:opacity-50 group"
                    >
                      <span className="font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">
                        {preset.array.length} items
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
                className="w-full accent-amber-400"
                style={{ direction: "rtl" }}
              />
            </div>

            {/* Player Controls */}
            <div className="mt-auto pt-4 flex flex-col gap-2">
              {runStatus === "Idle" || runStatus === "Completed" ? (
                <button
                  onClick={runAlgorithm}
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 flex justify-center items-center gap-2 transition-colors"
                >
                  <Zap size={18} /> Start Kadane
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold py-3 flex justify-center items-center gap-2 transition-colors"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200 font-bold py-3 flex justify-center items-center gap-2 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur min-h-125 xl:min-h-150">
          {/* Top toolbar over viz */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Visualization
            </h3>

            {/* Step Controls (visible when paused or completed) */}
            <div
              className={`flex items-center gap-2 transition-opacity duration-300 ${isPaused || runStatus === "Completed" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <button
                onClick={stepBackward}
                disabled={currentStepIndex <= 0}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-xs font-mono text-slate-400 w-16 text-center">
                Step {currentStepIndex + 1}/{steps.length}
              </span>
              <button
                onClick={stepForward}
                disabled={currentStepIndex >= steps.length - 1}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft size={16} className="rotate-180" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-auto">
            <div className="flex flex-wrap gap-2 justify-center p-4">
              {array.map((val, i) => {
                const inCurrent = isCellInCurrentSubarray(i);
                const inMax = isCellInMaxSubarray(i);
                const isCurrentIdx = isCellCurrentIndex(i);

                let borderColor = "border-slate-600";
                let bgColor = "bg-slate-800";
                let textColor = "text-slate-300";

                if (inMax) {
                  borderColor = "border-emerald-500";
                  bgColor = "bg-emerald-500/20";
                  textColor = "text-emerald-100";
                }

                if (inCurrent) {
                  borderColor = inMax ? "border-emerald-400" : "border-sky-500";
                  bgColor = inMax ? "bg-emerald-400/30" : "bg-sky-500/30";
                  textColor = "text-white";
                }

                if (isCurrentIdx) {
                  borderColor = "border-amber-400";
                  bgColor = "bg-amber-400/20";
                  textColor = "text-amber-100";
                }

                return (
                  <motion.div
                    layout
                    key={i}
                    className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 ${borderColor} ${bgColor} transition-colors duration-300 shadow-lg`}
                  >
                    <span className={`text-xl font-bold ${textColor}`}>
                      {val}
                    </span>
                    <span className="absolute -bottom-6 text-[10px] text-slate-500">
                      [{i}]
                    </span>

                    {/* Indicator for current index */}
                    {isCurrentIdx && (
                      <motion.div
                        layoutId="currentIndicator"
                        className="absolute -top-8 text-amber-400"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Connection Line indicator for Max Subarray (optional visually) */}
          </div>

          <div className="mt-8 rounded-xl bg-slate-800/80 p-4 border border-slate-700/50">
            <div className="flex items-center gap-6 text-xs text-slate-400 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-amber-400 bg-amber-400/20"></div>
                <span>Current Element</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-sky-500 bg-sky-500/30"></div>
                <span>Current Subarray</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500/20"></div>
                <span>Max Subarray So Far</span>
              </div>
            </div>
          </div>
        </section>
      </div>

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
              )}{" "}
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
        <div className="ll-scrollbar max-h-125 overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed">
          <pre>
            <code>
              {activeCode.split("\n").map((line, i) => (
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
