import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCheck,
  ChevronRight,
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
  generateShuntingYardSteps,
  shuntingYardCPP,
  shuntingYardJava,
  shuntingYardPython,
  shuntingYardJS,
} from "../algorithms/shuntingYard";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = ["C++", "Java", "Python", "JavaScript"];

const PRESET_EXPRESSIONS = [
  { label: "Basic Arithmetic",   value: "a + b * c" },
  { label: "With Parentheses",   value: "( a + b ) * c" },
  { label: "Mixed Precedence",   value: "a + b * c - d / e" },
  { label: "Right-Assoc (^)",    value: "a ^ b ^ c" },
  { label: "Complex",            value: "a + b * c - ( d / e ) ^ f" },
  { label: "Nested Parens",      value: "( ( a + b ) * ( c - d ) ) / e" },
];

const runStatusStyleMap = {
  Idle:      "border-white/15 bg-white/5 text-slate-200",
  Running:   "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused:    "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

// Token chip colour map (matches StackVisualizerPage's elementStatusClassMap pattern)
const tokenStatusClassMap = {
  pending:   "border-slate-600/40 bg-slate-700/40 text-slate-400",
  processed: "border-slate-500/30 bg-slate-600/20 text-slate-500 opacity-50",
  operand:   "border-cyan-400/70 bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/40 scale-110",
  operator:  "border-amber-400/70 bg-amber-500/30 text-amber-100 ring-2 ring-amber-400/40 scale-110",
  paren:     "border-violet-400/70 bg-violet-500/30 text-violet-100 ring-2 ring-violet-400/40 scale-110",
  done:      "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
};

// Operator stack element — mirrors elementStatusClassMap from StackVisualizerPage
const opStackItemBase =
  "flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-bold transition-all duration-200";

const opStackItemClasses = {
  default:  "border-amber-400/40 bg-amber-500/20 text-amber-100",
  top:      "border-cyan-400/60 bg-cyan-500/25 text-cyan-100 ring-2 ring-cyan-400/40",
  pushing:  "border-emerald-400/60 bg-emerald-500/25 text-emerald-100",
  popping:  "border-rose-400/60 bg-rose-500/25 text-rose-100",
};

// Output queue element
const outputItemBase =
  "flex h-9 min-w-[2.5rem] items-center justify-center rounded-xl border px-3 font-mono text-sm font-bold";
const outputItemClass = "border-cyan-400/40 bg-cyan-500/15 text-cyan-100";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShuntingYardPage() {
  useDocumentTitle("Shunting Yard – Infix to Postfix");
  const navigate = useNavigate();

  // ── Core visualizer state (mirrors StackVisualizerPage) ──────────────────
  const [expression,       setExpression]       = useState("a + b * c - ( d / e ) ^ f");
  const [customInput,      setCustomInput]      = useState("");
  const [inputError,       setInputError]       = useState("");

  // operator stack shown as a real vertical stack (like StackVisualizerPage)
  const [operatorStack,    setOperatorStack]    = useState([]);   // [{id, value, status}]
  const [outputQueue,      setOutputQueue]      = useState([]);   // string[]
  const [tokenTape,        setTokenTape]        = useState([]);   // [{value, status}]

  const [runStatus,        setRunStatus]        = useState("Idle");
  const [isRunning,        setIsRunning]        = useState(false);
  const [isPaused,         setIsPaused]         = useState(false);
  const [speed,            setSpeed]            = useState(600);
  const [elapsedSeconds,   setElapsedSeconds]   = useState(0);
  const [statusMessage,    setStatusMessage]    = useState("Choose a preset or type an expression and press Start.");
  const [operationHistory, setOperationHistory] = useState([]);  // [{action, token}]
  const [operationCount,   setOperationCount]   = useState(0);
  const [totalOperations,  setTotalOperations]  = useState(0);

  // Step-through (pre-generated frames for manual stepping)
  const [frames,           setFrames]           = useState([]);
  const [frameIndex,       setFrameIndex]       = useState(-1);

  // UI
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState,        setCopyState]        = useState("idle");
  const [showTheory,       setShowTheory]       = useState(false);
  const [selectedOp,       setSelectedOp]       = useState("shuntingYard");

  const stopSignal  = useRef(false);
  const pauseSignal = useRef(false);
  const timerRef    = useRef(null);

  const MotionSection = motion.section;
  const MotionDiv     = motion.div;

  // ── Active code snippet ───────────────────────────────────────────────────
  const activeCodeSnippet = useMemo(() => {
    const map = {
      "C++":        shuntingYardCPP,
      Java:         shuntingYardJava,
      Python:       shuntingYardPython,
      JavaScript:   shuntingYardJS,
    };
    return map[selectedLanguage] ?? shuntingYardCPP;
  }, [selectedLanguage]);

  // ── Progress ──────────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (runStatus === "Completed") return 100;
    if (totalOperations === 0) return 0;
    return Math.min(Math.round((operationCount / totalOperations) * 100), 99);
  }, [runStatus, operationCount, totalOperations]);

  // ── Top of the operator stack ─────────────────────────────────────────────
  const topElement = useMemo(
    () => operatorStack.length > 0 ? operatorStack[operatorStack.length - 1] : null,
    [operatorStack]
  );

  // ── Postfix result ────────────────────────────────────────────────────────
  const postfixResult = useMemo(
    () => outputQueue.join(" "),
    [outputQueue]
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const validateExpression = (expr) => {
    if (!expr.trim()) return "Expression cannot be empty.";
    let depth = 0;
    for (const ch of expr) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (depth < 0) return "Mismatched parentheses – extra ')' found.";
    }
    if (depth !== 0) return "Mismatched parentheses – unclosed '(' found.";
    return "";
  };

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ── Pause-aware sleep ─────────────────────────────────────────────────────
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

  // ── Hard-stop helper ──────────────────────────────────────────────────────
  const hardStop = useCallback(() => {
    stopSignal.current  = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
    stopTimer();
  }, [stopTimer]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    hardStop();
    setOperatorStack([]);
    setOutputQueue([]);
    setTokenTape([]);
    setRunStatus("Idle");
    setOperationCount(0);
    setTotalOperations(0);
    setOperationHistory([]);
    setElapsedSeconds(0);
    setStatusMessage("Stack cleared. Ready for new operations.");
    setFrames([]);
    setFrameIndex(-1);
    setInputError("");
  }, [hardStop]);

  // ── Core animation: play all frames ──────────────────────────────────────
  const runAnimation = useCallback(async (generatedFrames) => {
    for (let i = 0; i < generatedFrames.length; i++) {
      if (stopSignal.current) return;
      while (pauseSignal.current) {
        if (stopSignal.current) return;
        await sleep(80);
      }

      const frame = generatedFrames[i];

      // Update token tape
      setTokenTape(frame.tokens);

      // Update operator stack as animated items (mirrors StackVisualizerPage push/pop)
      setOperatorStack(
        frame.operatorStack.map((op, idx) => ({
          id:     `op-${op}-${idx}`,
          value:  op,
          status: idx === frame.operatorStack.length - 1 ? "top" : "default",
        }))
      );

      // Update output queue
      setOutputQueue(frame.outputQueue);

      // Status message
      setStatusMessage(frame.explanation);

      // History
      if (frame.action && frame.action !== "Complete") {
        setOperationHistory((prev) => [
          ...prev.slice(-19),
          { action: frame.action, token: frame.currentToken ?? "" },
        ]);
      }

      setOperationCount(i + 1);
      setFrameIndex(i);

      const ok = await waitWithControl(speed);
      if (!ok) return;
    }

    stopTimer();
    setRunStatus("Completed");
    setIsRunning(false);
    setIsPaused(false);
    setStatusMessage(`✓ Conversion complete!  Postfix: ${generatedFrames[generatedFrames.length - 1]?.outputQueue.join(" ")}`);
  }, [speed, waitWithControl, stopTimer]);

  // ── Start ─────────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    const err = validateExpression(expression);
    if (err) { setInputError(err); return; }
    setInputError("");

    stopSignal.current  = false;
    pauseSignal.current = false;

    const generatedFrames = generateShuntingYardSteps(expression);
    setFrames(generatedFrames);
    setTotalOperations(generatedFrames.length);
    setOperationCount(0);
    setOperationHistory([]);
    setOperatorStack([]);
    setOutputQueue([]);
    setTokenTape([]);
    setElapsedSeconds(0);
    setRunStatus("Running");
    setIsRunning(true);
    setIsPaused(false);
    startTimer();
    runAnimation(generatedFrames);
  }, [expression, runAnimation, startTimer]);

  // ── Pause / Resume ────────────────────────────────────────────────────────
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

  // ── Manual step-through ───────────────────────────────────────────────────
  const applyFrame = useCallback((f) => {
    if (!f) return;
    setTokenTape(f.tokens);
    setOperatorStack(
      f.operatorStack.map((op, idx) => ({
        id:     `op-${op}-${idx}`,
        value:  op,
        status: idx === f.operatorStack.length - 1 ? "top" : "default",
      }))
    );
    setOutputQueue(f.outputQueue);
    setStatusMessage(f.explanation);
    setOperationCount(f.operatorStack.length + f.outputQueue.length);
  }, []);

  const handleStepForward = useCallback(() => {
    if (isRunning) return;
    let localFrames = frames;
    let localIndex  = frameIndex;

    if (localFrames.length === 0) {
      const err = validateExpression(expression);
      if (err) { setInputError(err); return; }
      setInputError("");
      localFrames = generateShuntingYardSteps(expression);
      setFrames(localFrames);
      setTotalOperations(localFrames.length);
      setRunStatus("Paused");
      localIndex = -1;
    }

    const next = localIndex + 1;
    if (next < localFrames.length) {
      setFrameIndex(next);
      applyFrame(localFrames[next]);
      if (next === localFrames.length - 1) setRunStatus("Completed");
      else setRunStatus("Paused");
    }
  }, [isRunning, frames, frameIndex, expression, applyFrame]);

  const handleStepBackward = useCallback(() => {
    if (isRunning || frameIndex <= 0) return;
    const prev = frameIndex - 1;
    setFrameIndex(prev);
    applyFrame(frames[prev]);
    setRunStatus("Paused");
  }, [isRunning, frameIndex, frames, applyFrame]);

  // ── Random expression ─────────────────────────────────────────────────────
  const handleRandomExpression = useCallback(() => {
    const ops     = ["+", "-", "*", "/"];
    const vars    = ["a", "b", "c", "d", "e"];
    const numVars = Math.floor(Math.random() * 3) + 3;
    let tokens    = [vars[Math.floor(Math.random() * vars.length)]];
    for (let i = 1; i < numVars; i++) {
      tokens.push(ops[Math.floor(Math.random() * ops.length)]);
      tokens.push(vars[Math.floor(Math.random() * vars.length)]);
    }
    // Optionally wrap a sub-expression in parens
    if (tokens.length >= 5 && Math.random() > 0.4) {
      tokens = ["(", ...tokens.slice(0, 3), ")", ...tokens.slice(3)];
    }
    const expr = tokens.join(" ");
    setExpression(expr);
    setCustomInput(expr);
    handleReset();
  }, [handleReset]);

  // ── Code copy/download ────────────────────────────────────────────────────
  const handleCopyCode = useCallback(async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCodeSnippet);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch { setCopyState("idle"); }
  }, [activeCodeSnippet]);

  const handleDownloadCode = useCallback(() => {
    const ext  = { "C++": "cpp", Java: "java", Python: "py", JavaScript: "js" }[selectedLanguage];
    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `shunting_yard.${ext}`; a.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, selectedLanguage]);

  // ── Hotkeys (matches StackVisualizerPage pattern) ─────────────────────────
  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    if (e.repeat) { e.preventDefault(); return; }

    if (e.code === "Space") {
      e.preventDefault();
      if (isRunning) { isPaused ? handleResume() : handlePause(); }
      else           { handleStart(); }
      return;
    }
    if (key === "r")           { e.preventDefault(); handleReset(); return; }
    if (key === "n")           { e.preventDefault(); handleRandomExpression(); return; }
    if (key === "arrowleft")   { e.preventDefault(); if (!isRunning) handleStepBackward(); return; }
    if (key === "arrowright")  { e.preventDefault(); if (!isRunning) handleStepForward(); }
  });

  // Cleanup on unmount
  useEffect(() => () => { stopSignal.current = true; stopTimer(); }, [stopTimer]);

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
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
              <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
              Back to Algorithms
            </button>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
                Stack
              </span>
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
                Expression Parsing
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                {runStatus}
              </span>
            </div>

            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              Infix → Postfix{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                (Shunting Yard)
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Dijkstra's <strong className="text-white">Shunting Yard Algorithm</strong> converts infix expressions like{" "}
              <code className="rounded bg-white/10 px-1 text-cyan-300">a + b * c</code> to{" "}
              <strong className="text-white">Reverse Polish Notation</strong> using an operator stack and output
              queue — respecting precedence and associativity automatically.
            </p>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Progress</span><span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <MotionDiv
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400"
                />
              </div>
            </div>

            {/* Complexity cards */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { label: "Time",     val: "O(n)",         color: "text-cyan-200" },
                { label: "Space",    val: "O(n)",         color: "text-amber-200" },
                { label: "Category", val: "Stack",        color: "text-violet-200" },
                { label: "Level",    val: "Intermediate", color: "text-emerald-200" },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">{label}</p>
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
                  <p className="text-lg font-bold text-white">{operatorStack.length}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Top of Stack</p>
                  <p className="text-lg font-bold text-cyan-100">
                    {topElement ? topElement.value : "Empty"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Output Tokens</p>
                  <p className="text-lg font-bold text-amber-100">{outputQueue.length}</p>
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
                <p className="text-sm font-semibold text-white">{statusMessage}</p>
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
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            {/* Expression input */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">Infix Expression</label>
              <input
                type="text"
                value={customInput}
                disabled={isRunning}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput.trim()) {
                    const err = validateExpression(customInput);
                    if (err) { setInputError(err); return; }
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
                  if (err) { setInputError(err); return; }
                  setInputError("");
                  setExpression(customInput.trim());
                  handleReset();
                }}
                className="mt-2 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-all disabled:opacity-40"
              >
                Apply Expression
              </button>
              {inputError && <p className="mt-1 text-xs text-rose-400">{inputError}</p>}
            </div>

            {/* Presets */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">Preset Examples</label>
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
                    <code className="text-[10px] text-slate-400">{p.value}</code>
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
                type="range" min={100} max={2000} step={100} value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>Fast</span><span>Slow</span>
              </div>
            </div>

            {/* Play controls (identical layout to StackVisualizerPage) */}
            <div className="flex flex-col gap-2">
              {/* Start / Pause / Resume */}
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
                  <><Pause size={16} fill="currentColor" /> Pause</>
                ) : runStatus === "Paused" ? (
                  <><Play size={16} fill="currentColor" /> Resume</>
                ) : (
                  <><Play size={16} fill="currentColor" /> Start</>
                )}
              </motion.button>

              {/* Step buttons */}
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

              {/* Random */}
              <button
                disabled={isRunning}
                onClick={handleRandomExpression}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/25 bg-violet-500/10 py-2.5 text-sm font-bold text-violet-200 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
              >
                <Shuffle size={15} /> Random Expression
              </button>

              {/* Reset */}
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
                  <Info size={16} /> How the Shunting Yard Algorithm Works
                </h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                  <li>Read tokens left-to-right from the infix expression.</li>
                  <li><strong className="text-white">Operand</strong> → send directly to the <span className="text-cyan-300">Output Queue</span>.</li>
                  <li><strong className="text-white">Operator</strong> → while stack top has higher/equal (left-assoc) precedence, pop to output. Then push current operator.</li>
                  <li><strong className="text-white">Left paren <code>(</code></strong> → push onto the <span className="text-amber-300">Operator Stack</span>.</li>
                  <li><strong className="text-white">Right paren <code>)</code></strong> → pop operators to output until matching <code>(</code> found, then discard it.</li>
                  <li>End of input → pop all remaining operators to output.</li>
                </ol>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { op: "+ −", desc: "Prec 1 (lowest)" },
                    { op: "× ÷", desc: "Prec 2 (medium)" },
                    { op: "^",   desc: "Prec 3 (highest)" },
                    { op: "^",   desc: "Right-Associative" },
                  ].map((r, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center text-xs">
                      <p className="text-lg font-mono font-bold text-amber-300">{r.op}</p>
                      <p className="text-slate-400">{r.desc}</p>
                    </div>
                  ))}
                </div>
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
              <p className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">Input Tokens</p>
              <div className="flex flex-wrap gap-2">
                {tokenTape.length > 0
                  ? tokenTape.map((tok, i) => (
                      <motion.div
                        key={i}
                        layout
                        className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border px-3 font-mono text-sm font-bold transition-all duration-200 ${
                          tokenStatusClassMap[tok.status] ?? tokenStatusClassMap.pending
                        }`}
                      >
                        {tok.value}
                      </motion.div>
                    ))
                  : expression.split(/\s+/).filter(Boolean).map((ch, i) => (
                      <div key={i} className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border px-3 font-mono text-sm font-bold ${tokenStatusClassMap.pending}`}>
                        {ch}
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Stack + Queue grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* ── Operator Stack (REAL vertical stack, mirrors StackVisualizerPage) ── */}
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-amber-400" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                    Operator Stack (LIFO)
                  </p>
                </div>

                {/* Stack rendered top-first, same layout as StackVisualizerPage */}
                <div className="flex flex-col-reverse gap-2 min-h-[8rem]">
                  <AnimatePresence mode="popLayout">
                    {operatorStack.map((el, idx) => (
                      <motion.div
                        key={el.id}
                        layout
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className={`${opStackItemBase} ${opStackItemClasses[el.status] ?? opStackItemClasses.default}`}
                      >
                        <span className="text-[10px] text-slate-400">
                          {idx === operatorStack.length - 1 ? "TOP" : `[${idx}]`}
                        </span>
                        <span className="text-base font-mono">{el.value}</span>
                        {idx === operatorStack.length - 1 && (
                          <span className="flex items-center gap-1 text-[10px] text-cyan-300">
                            <ArrowDown size={10} /> top
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {operatorStack.length === 0 && (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-amber-400/20 py-4">
                      <span className="text-xs italic text-slate-600">empty stack</span>
                    </div>
                  )}
                </div>

                {/* Stack bottom label */}
                <div className="mt-1 rounded-lg border-t-2 border-amber-400/30 pt-1 text-center text-[10px] uppercase tracking-widest text-amber-400/50">
                  ── bottom ──
                </div>
              </div>

              {/* ── Output Queue (postfix result) ── */}
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ChevronRight size={15} className="text-cyan-400" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                    Output Queue (Postfix)
                  </p>
                </div>

                {/* Output queue grows left→right */}
                <div className="flex min-h-[8rem] flex-wrap content-start gap-2">
                  <AnimatePresence mode="popLayout">
                    {outputQueue.map((tok, i) => (
                      <motion.div
                        key={`${tok}-${i}`}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className={`${outputItemBase} ${outputItemClass}`}
                      >
                        {tok}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {outputQueue.length === 0 && (
                    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-cyan-400/20 py-4">
                      <span className="text-xs italic text-slate-600">empty queue</span>
                    </div>
                  )}
                </div>

                {/* Postfix so far */}
                {outputQueue.length > 0 && (
                  <p className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 font-mono text-xs text-cyan-200">
                    <span className="text-slate-500">postfix: </span>
                    {postfixResult}
                  </p>
                )}
              </div>
            </div>

            {/* Step explanation */}
            <AnimatePresence mode="wait">
              {statusMessage && (
                <motion.div
                  key={frameIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <Info size={15} className="mt-0.5 shrink-0 text-cyan-400" />
                  <p className="text-sm text-slate-300">{statusMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Completion banner */}
            <AnimatePresence>
              {runStatus === "Completed" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4"
                >
                  <CheckCheck size={20} className="shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Conversion Complete!</p>
                    <p className="mt-0.5 font-mono text-sm text-emerald-100">
                      Postfix: <strong>{postfixResult}</strong>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── Operation History (mirrors StackVisualizerPage) ── */}
          <section className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-cyan-300" /> Operation History
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {operationHistory.length === 0 ? (
                <span className="text-xs italic text-slate-600">No operations yet.</span>
              ) : (
                operationHistory.map((op, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 rounded-xl border px-2 py-1 text-xs font-semibold ${
                      op.action.toLowerCase().includes("enqueue") || op.action.toLowerCase().includes("operand")
                        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                        : op.action.toLowerCase().includes("push")
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : op.action.toLowerCase().includes("pop") || op.action.toLowerCase().includes("drain")
                        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {op.action.toLowerCase().includes("push") ? (
                      <ArrowDown size={11} />
                    ) : op.action.toLowerCase().includes("pop") ? (
                      <ArrowUp size={11} />
                    ) : (
                      <ChevronRight size={11} />
                    )}
                    <span>{op.action}</span>
                    {op.token && <strong className="font-mono">{op.token}</strong>}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── Step Timeline scrubber ── */}
          {frames.length > 0 && (
            <section className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Step Timeline</p>
                <span className="text-xs text-slate-500">{Math.max(0, frameIndex + 1)} / {frames.length}</span>
              </div>
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={Math.max(0, frameIndex)}
                onChange={(e) => {
                  if (isRunning) handlePause();
                  const idx = Number(e.target.value);
                  setFrameIndex(idx);
                  applyFrame(frames[idx]);
                  setRunStatus(idx === frames.length - 1 ? "Completed" : "Paused");
                }}
                className="w-full accent-cyan-400"
              />
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {frames.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (isRunning) handlePause();
                      setFrameIndex(i);
                      applyFrame(frames[i]);
                      setRunStatus(i === frames.length - 1 ? "Completed" : "Paused");
                    }}
                    title={f.explanation}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all ${
                      i === frameIndex
                        ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                        : i < frameIndex
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400 opacity-60"
                        : "border-white/10 bg-white/5 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Code Panel (correct renderHighlightedCode usage) ── */}
          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-3">
                <Code2 size={20} className="text-violet-400" />
                <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  {selectedLanguage} Source
                </span>
                <div className="ml-4 flex rounded-lg bg-white/5 p-1 border border-white/10">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`rounded-md px-3 py-1 text-[10px] font-bold transition-all ${
                        selectedLanguage === lang
                          ? "bg-violet-600 text-white"
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
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
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
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>

            {/* ✅ CORRECT: split by line, render JSX nodes — NO dangerouslySetInnerHTML */}
            <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm">
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