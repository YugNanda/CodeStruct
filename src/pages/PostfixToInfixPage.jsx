import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  Code2,
  Copy,
  Download,
  Info,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Waypoints,
} from "lucide-react";
import {
  generatePostfixToInfixSteps,
  postfixToInfixCPP,
  postfixToInfixJava,
  postfixToInfixPython,
  postfixToInfixJS,
} from "../algorithms/postfixToInfix";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import {
  shouldSkipHotkeyTarget,
  useStableHotkeys,
} from "../hooks/useStableHotkeys";

const LANGUAGES = ["C++", "Java", "Python", "JavaScript"];

const PRESET_EXPRESSIONS = [
  { label: "Basic Arithmetic", value: "a b c * +" },
  { label: "With Parentheses logic", value: "a b + c *" },
  { label: "Mixed Precedence", value: "a b c * + d e / -" },
  { label: "Right-Assoc (^)", value: "a b c ^ ^" },
  { label: "Complex", value: "a b c * + d e / f ^ -" },
];

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

// Token chip colour map
const tokenStatusClassMap = {
  pending: "border-slate-600/40 bg-slate-700/40 text-slate-400",
  processed: "border-slate-500/30 bg-slate-600/20 text-slate-500 opacity-50",
  operand:
    "border-cyan-400/70 bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/40 scale-110",
  operator:
    "border-amber-400/70 bg-amber-500/30 text-amber-100 ring-2 ring-amber-400/40 scale-110",
  error:
    "border-rose-400/70 bg-rose-500/30 text-rose-100 ring-2 ring-rose-400/40 scale-110",
  done: "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function PostfixToInfixPage() {
  useDocumentTitle("Postfix to Infix");
  const navigate = useNavigate();

  const [expression, setExpression] = useState("a b c * + d e / f ^ -");
  const [customInput, setCustomInput] = useState("");
  const [inputError, setInputError] = useState("");

  const [stack, setStack] = useState([]); // [{id, value, status}]
  const [tokenTape, setTokenTape] = useState([]); // [{value, status}]

  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Choose a preset or type an expression and press Start.",
  );
  const [operationCount, setOperationCount] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);

  // Step-through
  const [frames, setFrames] = useState([]);
  const [frameIndex, setFrameIndex] = useState(-1);

  // UI
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");
  const [showTheory, setShowTheory] = useState(false);

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);
  const timerRef = useRef(null);

  const MotionSection = motion.section;
  const MotionDiv = motion.div;

  const activeCodeSnippet = useMemo(() => {
    const map = {
      "C++": postfixToInfixCPP,
      Java: postfixToInfixJava,
      Python: postfixToInfixPython,
      JavaScript: postfixToInfixJS,
    };
    return map[selectedLanguage] ?? postfixToInfixCPP;
  }, [selectedLanguage]);

  const progress = useMemo(() => {
    if (runStatus === "Completed") return 100;
    if (totalOperations === 0) return 0;
    return Math.min(Math.round((operationCount / totalOperations) * 100), 99);
  }, [runStatus, operationCount, totalOperations]);

  const topElement = useMemo(
    () => (stack.length > 0 ? stack[stack.length - 1] : null),
    [stack],
  );

  const validateExpression = (expr) => {
    if (!expr.trim()) return "Expression cannot be empty.";
    return "";
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const waitWithControl = useCallback(async (ms) => {
    let elapsed = 0;
    while (elapsed < ms) {
      if (stopSignal.current) return false;
      while (pauseSignal.current) {
        if (stopSignal.current) return false;
        await sleep(80);
      }
      const chunk = Math.min(40, ms - elapsed);
      await sleep(chunk);
      elapsed += chunk;
    }
    return !stopSignal.current;
  }, []);

  const hardStop = useCallback(() => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
    stopTimer();
  }, [stopTimer]);

  const handleReset = useCallback(() => {
    hardStop();
    setStack([]);
    setTokenTape([]);
    setRunStatus("Idle");
    setOperationCount(0);
    setTotalOperations(0);
    setElapsedSeconds(0);
    setStatusMessage("Stack cleared. Ready for new operations.");
    setFrames([]);
    setFrameIndex(-1);
    setInputError("");
  }, [hardStop]);

  const runAnimation = useCallback(
    async (generatedFrames) => {
      for (let i = 0; i < generatedFrames.length; i++) {
        if (stopSignal.current) return;
        while (pauseSignal.current) {
          if (stopSignal.current) return;
          await sleep(80);
        }

        const frame = generatedFrames[i];

        // Update token tape
        setTokenTape(frame.tokens);

        // Update stack
        setStack(
          frame.stack.map((item, idx) => ({
            id: `st-${idx}-${Math.random()}`,
            value: item,
            status: idx === frame.stack.length - 1 ? "top" : "default",
          })),
        );

        // Status message
        setStatusMessage(frame.explanation);

        setOperationCount(i + 1);
        setFrameIndex(i);

        if (frame.action === "Error") {
          setRunStatus("Paused"); // Stop running on error
          setIsRunning(false);
          stopTimer();
          return;
        }

        const ok = await waitWithControl(speed);
        if (!ok) return;
      }

      stopTimer();
      setRunStatus("Completed");
      setIsRunning(false);
      setIsPaused(false);
      setStatusMessage(
        generatedFrames[generatedFrames.length - 1]?.explanation ?? "Complete",
      );
    },
    [speed, waitWithControl, stopTimer],
  );

  const handleStart = useCallback(() => {
    const err = validateExpression(expression);
    if (err) {
      setInputError(err);
      return;
    }
    setInputError("");

    stopSignal.current = false;
    pauseSignal.current = false;

    const generatedFrames = generatePostfixToInfixSteps(expression);
    setFrames(generatedFrames);
    setTotalOperations(generatedFrames.length);
    setOperationCount(0);
    setStack([]);
    setTokenTape([]);
    setElapsedSeconds(0);
    setRunStatus("Running");
    setIsRunning(true);
    setIsPaused(false);
    startTimer();
    runAnimation(generatedFrames);
  }, [expression, runAnimation, startTimer]);

  const handlePause = useCallback(() => {
    if (!isRunning || isPaused) return;
    pauseSignal.current = true;
    setIsPaused(true);
    setRunStatus("Paused");
    stopTimer();
  }, [isRunning, isPaused, stopTimer]);

  const handleResume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    pauseSignal.current = false;
    setIsPaused(false);
    setRunStatus("Running");
    startTimer();
  }, [isRunning, isPaused, startTimer]);

  const applyFrame = useCallback((f) => {
    if (!f) return;
    setTokenTape(f.tokens);
    setStack(
      f.stack.map((item, idx) => ({
        id: `st-${idx}-${Math.random()}`,
        value: item,
        status: idx === f.stack.length - 1 ? "top" : "default",
      })),
    );
    setStatusMessage(f.explanation);
  }, []);

  const handleStepForward = useCallback(() => {
    if (isRunning) return;
    let localFrames = frames;
    let localIndex = frameIndex;

    if (localFrames.length === 0) {
      const err = validateExpression(expression);
      if (err) {
        setInputError(err);
        return;
      }
      setInputError("");
      localFrames = generatePostfixToInfixSteps(expression);
      setFrames(localFrames);
      setTotalOperations(localFrames.length);
      setRunStatus("Paused");
      localIndex = -1;
    }

    const next = localIndex + 1;
    if (next < localFrames.length) {
      setFrameIndex(next);
      applyFrame(localFrames[next]);
      setOperationCount(next + 1);
      if (
        next === localFrames.length - 1 &&
        localFrames[next].action !== "Error"
      ) {
        setRunStatus("Completed");
      } else {
        setRunStatus("Paused");
      }
    }
  }, [isRunning, frames, frameIndex, expression, applyFrame]);

  const handleStepBackward = useCallback(() => {
    if (isRunning || frameIndex <= 0) return;
    const prev = frameIndex - 1;
    setFrameIndex(prev);
    applyFrame(frames[prev]);
    setOperationCount(prev + 1);
    setRunStatus("Paused");
  }, [isRunning, frameIndex, frames, applyFrame]);

  const handleRandomExpression = useCallback(() => {
    const exprs = [
      "a b + c *",
      "x y ^ z +",
      "a b c * +",
      "p q r * + s -",
      "m n * p q / +",
    ];
    const expr = exprs[Math.floor(Math.random() * exprs.length)];
    setExpression(expr);
    setCustomInput(expr);
    handleReset();
  }, [handleReset]);

  const handleCopyCode = useCallback(async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCodeSnippet);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("idle");
    }
  }, [activeCodeSnippet]);

  const handleDownloadCode = useCallback(() => {
    const ext = { "C++": "cpp", Java: "java", Python: "py", JavaScript: "js" }[
      selectedLanguage
    ];
    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postfix_to_infix.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, selectedLanguage]);

  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    if (e.repeat) {
      e.preventDefault();
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (isRunning) {
        isPaused ? handleResume() : handlePause();
      } else {
        handleStart();
      }
      return;
    }
    if (key === "r") {
      e.preventDefault();
      handleReset();
      return;
    }
    if (key === "n") {
      e.preventDefault();
      handleRandomExpression();
      return;
    }
    if (key === "arrowleft") {
      e.preventDefault();
      if (!isRunning) handleStepBackward();
      return;
    }
    if (key === "arrowright") {
      e.preventDefault();
      if (!isRunning) handleStepForward();
    }
  });

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopSignal.current = true;
      stopTimer();
    },
    [stopTimer],
  );

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      {/* Ambient gradient */}
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(6,182,212,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(245,158,11,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ── Hero Section ── */}
      <MotionSection
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Left */}
          <div>
            <button
              onClick={() => navigate("/algorithms")}
              className="group mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-3 pr-4 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft
                size={13}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back to Algorithms
            </button>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
                Stack
              </span>
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
                Expression Parsing
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
            </div>

            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              Postfix → Infix{" "}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Converts postfix (Reverse Polish) expressions like{" "}
              <code className="rounded bg-white/10 px-1 text-cyan-300">
                a b * c +
              </code>{" "}
              back to standard infix notation{" "}
              <strong className="text-white">((a * b) + c)</strong> using a
              stack to keep track of operands and sub-expressions.
            </p>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <MotionDiv
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-linear-to-r from-cyan-400 via-amber-400 to-emerald-400"
                />
              </div>
            </div>

            {/* Complexity cards */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { label: "Time", val: "O(n)", color: "text-cyan-200" },
                { label: "Space", val: "O(n)", color: "text-amber-200" },
                { label: "Category", val: "Stack", color: "text-violet-200" },
                { label: "Level", val: "Beginner", color: "text-emerald-200" },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">
                    {label}
                  </p>
                  <p className={`text-sm font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right – live snapshot (mirrors StackVisualizerPage) */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-cyan-300" /> Live Snapshot
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Stack Size</p>
                  <p className="text-lg font-bold text-white">{stack.length}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Top of Stack</p>
                  <p className="text-sm font-bold text-cyan-100 truncate">
                    {topElement ? topElement.value : "Empty"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Total Steps</p>
                  <p className="text-lg font-bold text-amber-100">
                    {totalOperations}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Elapsed</p>
                  <p className="text-lg font-bold text-violet-100">
                    <Clock3 size={13} className="mr-1 inline text-slate-400" />
                    {formatElapsed(elapsedSeconds)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Status</p>
                <p className="text-sm font-semibold text-white">
                  {statusMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* ── Main Grid ── */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-stretch">
        {/* ── Sidebar Controls ── */}
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Layers size={18} className="text-cyan-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            {/* Expression input */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">
                Postfix Expression
              </label>
              <input
                type="text"
                value={customInput}
                disabled={isRunning}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput.trim()) {
                    const err = validateExpression(customInput);
                    if (err) {
                      setInputError(err);
                      return;
                    }
                    setInputError("");
                    setExpression(customInput.trim());
                    handleReset();
                  }
                }}
                placeholder={expression}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
              <button
                disabled={isRunning}
                onClick={() => {
                  if (!customInput.trim()) return;
                  const err = validateExpression(customInput);
                  if (err) {
                    setInputError(err);
                    return;
                  }
                  setInputError("");
                  setExpression(customInput.trim());
                  handleReset();
                }}
                className="mt-2 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-all disabled:opacity-40"
              >
                Apply Expression
              </button>
              {inputError && (
                <p className="mt-1 text-xs text-rose-400">{inputError}</p>
              )}
            </div>

            {/* Presets */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">
                Preset Examples
              </label>
              <div className="flex flex-col gap-1.5">
                {PRESET_EXPRESSIONS.map((p) => (
                  <button
                    key={p.label}
                    disabled={isRunning}
                    onClick={() => {
                      setExpression(p.value);
                      setCustomInput(p.value);
                      handleReset();
                      setInputError("");
                    }}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                      expression === p.value
                        ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    } disabled:opacity-40`}
                  >
                    <span className="font-semibold">{p.label}</span>
                    <br />
                    <code className="text-[10px] text-slate-400">
                      {p.value}
                    </code>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                <span>Delay</span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>

            {/* Play controls */}
            <div className="flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={
                  runStatus === "Running"
                    ? handlePause
                    : runStatus === "Paused"
                      ? handleResume
                      : handleStart
                }
                disabled={runStatus === "Completed"}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all disabled:opacity-40 ${
                  runStatus === "Running"
                    ? "border border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                    : "border border-cyan-400/40 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                }`}
              >
                {runStatus === "Running" ? (
                  <>
                    <Pause size={16} fill="currentColor" /> Pause
                  </>
                ) : runStatus === "Paused" ? (
                  <>
                    <Play size={16} fill="currentColor" /> Resume
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" /> Start
                  </>
                )}
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleStepBackward}
                  disabled={isRunning || frameIndex <= 0}
                  className="flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <ArrowLeft size={13} /> Prev
                </button>
                <button
                  onClick={handleStepForward}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  Next <ArrowRight size={13} />
                </button>
              </div>

              <button
                disabled={isRunning}
                onClick={handleRandomExpression}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/25 bg-violet-500/10 py-2.5 text-sm font-bold text-violet-200 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
              >
                <Shuffle size={15} /> Random Expression
              </button>

              <button
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-500/20 transition-all"
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>

            <HotkeysHint />

            {/* Theory toggle */}
            <button
              onClick={() => setShowTheory((v) => !v)}
              className="flex items-center gap-2 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-200 hover:bg-violet-500/20 transition-all"
            >
              <BookOpen size={15} />
              {showTheory ? "Hide" : "Show"} Theory
            </button>
          </div>
        </aside>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">
          {/* Theory panel */}
          <AnimatePresence>
            {showTheory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5 backdrop-blur"
              >
                <h3 className="mb-3 flex items-center gap-2 font-bold text-violet-200">
                  <Info size={16} /> How Postfix to Infix Evaluation Works
                </h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                  <li>
                    Read tokens from the postfix expression from left to right.
                  </li>
                  <li>
                    <strong className="text-white">Operand</strong>: Push it
                    directly onto the stack.
                  </li>
                  <li>
                    <strong className="text-white">Operator</strong>: Pop two
                    operands from the stack. The first popped operand is the
                    right operand. The second is the left operand.
                  </li>
                  <li>
                    Combine them with the operator and parentheses like so:{" "}
                    <code>(left operator right)</code>
                  </li>
                  <li>Push the combined string back onto the stack.</li>
                  <li>
                    At the end of the input, the stack should contain exactly
                    one item: the final infix expression.
                  </li>
                </ol>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Visualization ── */}
          <section className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Waypoints size={18} className="text-cyan-300" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                  Live Visualization
                </h2>
              </div>
              {frames.length > 0 && (
                <span className="text-xs text-slate-500">
                  Step {Math.max(0, frameIndex + 1)} / {frames.length}
                </span>
              )}
            </div>

            {/* Token tape */}
            <div className="mb-6">
              <p className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">
                Input Tokens
              </p>
              <div className="flex flex-wrap gap-2">
                {tokenTape.length > 0
                  ? tokenTape.map((tok, i) => (
                      <motion.div
                        key={i}
                        layout
                        className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 font-mono text-sm font-bold transition-all duration-200 ${
                          tokenStatusClassMap[tok.status] ??
                          tokenStatusClassMap.pending
                        }`}
                      >
                        {tok.value}
                      </motion.div>
                    ))
                  : expression
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((ch, i) => (
                        <div
                          key={i}
                          className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 font-mono text-sm font-bold ${tokenStatusClassMap.pending}`}
                        >
                          {ch}
                        </div>
                      ))}
              </div>
            </div>

            {/* Stack Layout */}
            <div className="mb-6 flex justify-center mt-8">
              <div className="relative flex w-full max-w-sm flex-col justify-end rounded-t-none rounded-b-xl border-x-4 border-b-4 border-slate-600/50 bg-slate-900/30 p-4 min-h-75">
                {stack.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm font-medium opacity-50">
                    Empty Stack
                  </div>
                ) : (
                  <div className="flex flex-col-reverse gap-2">
                    <AnimatePresence>
                      {stack.map((item, idx) => {
                        const isTop = idx === stack.length - 1;
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className={`flex min-h-10 w-full items-center justify-center rounded-xl border px-3 text-sm font-bold shadow-sm transition-all duration-200 break-all ${
                              isTop
                                ? "border-cyan-400/60 bg-cyan-500/25 text-cyan-100 ring-2 ring-cyan-400/40"
                                : "border-slate-500/30 bg-slate-700/50 text-slate-300"
                            }`}
                          >
                            {item.value}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-xs font-medium text-slate-400">
              Stack
            </p>
          </section>

          {/* ── Code Snippet ── */}
          <section className="rounded-3xl border border-white/10 bg-slate-800/35 backdrop-blur flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-cyan-300" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                  Algorithm Source
                </h2>
              </div>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedLanguage === lang
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  title="Copy code"
                >
                  {copyState === "copied" ? (
                    <span className="text-emerald-400 text-xs font-bold px-1 flex">
                      <Copy size={14} className="mr-1" />
                      Copied!
                    </span>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  title="Download code"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 max-h-125 overflow-auto custom-scrollbar text-sm font-code text-slate-300 bg-[#020617]">
              <pre>
                <code>
                  {activeCodeSnippet.split("\n").map((line, i) => (
                    <div key={i} className="flex rounded px-2 hover:bg-white/5">
                      <span className="w-8 shrink-0 select-none pr-4 text-right text-xs text-slate-600">
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
      </div>
    </div>
  );
}
