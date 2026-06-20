import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCheck,
  Code2,
  Copy,
  Download,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Trash2,
} from "lucide-react";
import {
  stackPushPopCPP,
  stackArrayCPP,
  stackPushPopJava,
  stackArrayJava,
  stackPushPopPython,
  stackArrayPython,
  stackPushPopJS,
  stackArrayJS,
} from "../algorithms/stack";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const stackOperations = {
  pushPop: {
    title: "Push-Pop Operations",
    description:
      "Visualize the LIFO (Last In, First Out) behavior of a stack with animated push and pop operations.",
    pushTime: "O(1)",
    popTime: "O(1)",
    space: "O(n)",
    cppSnippet: stackPushPopCPP,
    javaSnippet: stackPushPopJava,
    pythonSnippet: stackPushPopPython,
    jsSnippet: stackPushPopJS,
  },
  arrayImpl: {
    title: "Array-Based Stack",
    description:
      "Stack implementation using a fixed-size array with push, pop, peek, and size operations.",
    pushTime: "O(1)",
    popTime: "O(1)",
    space: "O(n)",
    cppSnippet: stackArrayCPP,
    javaSnippet: stackArrayJava,
    pythonSnippet: stackArrayPython,
    jsSnippet: stackArrayJS,
  },
};

const elementStatusClassMap = {
  default: "border-blue-400/30 bg-blue-500/20 text-blue-100",
  pushing: "border-emerald-400/50 bg-emerald-500/30 text-emerald-100",
  popping: "border-rose-400/50 bg-rose-500/30 text-rose-100",
  top: "border-cyan-400/50 bg-cyan-500/25 text-cyan-100",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomValue() {
  return Math.floor(Math.random() * 90) + 10;
}

function getElementStatusClass(status) {
  return elementStatusClassMap[status] ?? elementStatusClassMap.default;
}

export default function StackVisualizerPage() {
  useDocumentTitle("Stack Visualizer");

  const [stack, setStack] = useState([]);
  const [maxSize] = useState(10);
  const [speed, setSpeed] = useState(400);
  const [selectedOperation, setSelectedOperation] = useState("pushPop");
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [operationCount, setOperationCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready to push or pop elements.");
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [inputValue, setInputValue] = useState("");
  const [operationHistory, setOperationHistory] = useState([]);
  const [totalOperations, setTotalOperations] = useState(0);

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);

  const MotionSection = motion.section;
  const MotionButton = motion.button;
  const MotionDiv = motion.div;

  const activeOperation = stackOperations[selectedOperation];

  const activeCodeSnippet = useMemo(() => {
    if (selectedLanguage === "C++") return activeOperation.cppSnippet;
    if (selectedLanguage === "Python") return activeOperation.pythonSnippet;
    if (selectedLanguage === "Java") return activeOperation.javaSnippet;
    return activeOperation.jsSnippet;
  }, [selectedLanguage, activeOperation]);

  const progress = useMemo(() => {
    if (totalOperations === 0) return 0;
    return runStatus === "Completed"
      ? 100
      : Math.min(Math.round((operationCount / totalOperations) * 100), 99);
  }, [runStatus, operationCount, totalOperations]);

  const topElement = useMemo(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const waitWithControl = useCallback(async (durationMs) => {
    let elapsed = 0;
    while (elapsed < durationMs) {
      if (stopSignal.current) return false;
      while (pauseSignal.current) {
        if (stopSignal.current) return false;
        await sleep(80);
      }
      const chunk = Math.min(40, durationMs - elapsed);
      await sleep(chunk);
      elapsed += chunk;
    }
    return !stopSignal.current;
  }, []);

  const hardStopRun = useCallback(() => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const resetStack = useCallback(() => {
    hardStopRun();
    setStack([]);
    setRunStatus("Idle");
    setOperationCount(0);
    setTotalOperations(0);
    setOperationHistory([]);
    setStatusMessage("Stack cleared. Ready for new operations.");
  }, [hardStopRun]);

  const generateRandomStack = useCallback(() => {
    hardStopRun();
    const size = Math.floor(Math.random() * 5) + 3;
    const newStack = Array.from({ length: size }, () => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: getRandomValue(),
      status: "default",
    }));
    setStack(newStack);
    setRunStatus("Idle");
    setOperationCount(0);
    setTotalOperations(0);
    setOperationHistory([]);
    setStatusMessage(`Generated stack with ${size} elements.`);
  }, [hardStopRun]);

  const handlePush = useCallback(async (value) => {
    if (stack.length >= maxSize) {
      setStatusMessage("Stack Overflow! Maximum size reached.");
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setStatusMessage("Please enter a valid number.");
      return;
    }

    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setRunStatus("Running");
    setTotalOperations((prev) => prev + 1);

    const newElement = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: numValue,
      status: "pushing",
    };

    setStatusMessage(`Pushing ${numValue} onto the stack...`);
    setStack((prev) => [...prev.map(el => ({ ...el, status: "default" })), newElement]);

    const canContinue = await waitWithControl(speed);
    if (!canContinue) return;

    setStack((prev) =>
      prev.map((el, idx) =>
        idx === prev.length - 1
          ? { ...el, status: "top" }
          : { ...el, status: "default" }
      )
    );

    setOperationCount((prev) => prev + 1);
    setOperationHistory((prev) => [...prev, { type: "push", value: numValue }]);
    setStatusMessage(`Pushed ${numValue}. Stack size: ${stack.length + 1}`);
    setInputValue("");
    setIsRunning(false);
    setRunStatus("Completed");

    await sleep(500);
    setStack((prev) =>
      prev.map((el, idx) =>
        idx === prev.length - 1 ? { ...el, status: "top" } : { ...el, status: "default" }
      )
    );
  }, [stack.length, maxSize, speed, waitWithControl]);

  const handlePop = useCallback(async () => {
    if (stack.length === 0) {
      setStatusMessage("Stack Underflow! Stack is empty.");
      return;
    }

    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setRunStatus("Running");
    setTotalOperations((prev) => prev + 1);

    const topValue = stack[stack.length - 1]?.value;
    setStatusMessage(`Popping ${topValue} from the stack...`);

    setStack((prev) =>
      prev.map((el, idx) =>
        idx === prev.length - 1
          ? { ...el, status: "popping" }
          : { ...el, status: "default" }
      )
    );

    const canContinue = await waitWithControl(speed);
    if (!canContinue) return;

    setStack((prev) => {
      const newStack = prev.slice(0, -1);
      if (newStack.length > 0) {
        newStack[newStack.length - 1] = { ...newStack[newStack.length - 1], status: "top" };
      }
      return newStack;
    });

    setOperationCount((prev) => prev + 1);
    setOperationHistory((prev) => [...prev, { type: "pop", value: topValue }]);
    setStatusMessage(`Popped ${topValue}. Stack size: ${stack.length - 1}`);
    setIsRunning(false);
    setRunStatus("Completed");
  }, [stack, speed, waitWithControl]);

  const handleAutoPushPop = useCallback(async () => {
    if (isRunning) return;

    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setRunStatus("Running");
    setOperationCount(0);
    setTotalOperations(6);
    setOperationHistory([]);
    setStack([]);

    // Auto push 3 elements
    for (let i = 0; i < 3; i++) {
      if (stopSignal.current) break;
      
      while (pauseSignal.current) {
        if (stopSignal.current) break;
        await sleep(80);
      }

      const value = getRandomValue();
      const newElement = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value,
        status: "pushing",
      };

      setStatusMessage(`Pushing ${value} onto the stack...`);
      setStack((prev) => [...prev.map(el => ({ ...el, status: "default" })), newElement]);

      await waitWithControl(speed);
      if (stopSignal.current) break;

      setStack((prev) =>
        prev.map((el, idx) =>
          idx === prev.length - 1
            ? { ...el, status: "top" }
            : { ...el, status: "default" }
        )
      );

      setOperationCount((prev) => prev + 1);
      setOperationHistory((prev) => [...prev, { type: "push", value }]);
      setStatusMessage(`Pushed ${value}`);

      await waitWithControl(speed * 0.5);
    }

    // Auto pop 3 elements
    for (let i = 0; i < 3; i++) {
      if (stopSignal.current) break;
      
      while (pauseSignal.current) {
        if (stopSignal.current) break;
        await sleep(80);
      }

      setStack((prev) => {
        if (prev.length === 0) return prev;
        const topValue = prev[prev.length - 1]?.value;
        setStatusMessage(`Popping ${topValue} from the stack...`);
        return prev.map((el, idx) =>
          idx === prev.length - 1
            ? { ...el, status: "popping" }
            : { ...el, status: "default" }
        );
      });

      await waitWithControl(speed);
      if (stopSignal.current) break;

      let poppedValue;
      setStack((prev) => {
        if (prev.length === 0) return prev;
        poppedValue = prev[prev.length - 1]?.value;
        const newStack = prev.slice(0, -1);
        if (newStack.length > 0) {
          newStack[newStack.length - 1] = { ...newStack[newStack.length - 1], status: "top" };
        }
        return newStack;
      });

      setOperationCount((prev) => prev + 1);
      if (poppedValue !== undefined) {
        setOperationHistory((prev) => [...prev, { type: "pop", value: poppedValue }]);
        setStatusMessage(`Popped ${poppedValue}`);
      }

      await waitWithControl(speed * 0.5);
    }

    if (!stopSignal.current) {
      setRunStatus("Completed");
      setStatusMessage("Auto push-pop sequence completed!");
    }
    setIsRunning(false);
  }, [isRunning, speed, waitWithControl]);

  const handlePause = useCallback(() => {
    if (!isRunning || isPaused) return;
    pauseSignal.current = true;
    setIsPaused(true);
    setRunStatus("Paused");
  }, [isPaused, isRunning]);

  const handleResume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    pauseSignal.current = false;
    setIsPaused(false);
    setRunStatus("Running");
  }, [isPaused, isRunning]);

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
    let extension = ".cpp";
    if (selectedLanguage === "Python") extension = ".py";
    if (selectedLanguage === "Java") extension = ".java";
    if (selectedLanguage === "JavaScript") extension = ".js";

    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Stack${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, selectedLanguage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && inputValue && !isRunning) {
      handlePush(inputValue);
    }
  }, [inputValue, isRunning, handlePush]);

  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;

    const key = e.key?.toLowerCase();
    const isHotkey = e.code === "Space" || key === "r" || key === "n";
    if (!isHotkey) return;

    if (e.repeat) {
      e.preventDefault();
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (isRunning) {
        if (isPaused) handleResume();
        else handlePause();
      } else {
        handleAutoPushPop();
      }
      return;
    }

    if (key === "r") {
      e.preventDefault();
      resetStack();
      return;
    }

    if (key === "n") {
      e.preventDefault();
      if (!isRunning) generateRandomStack();
    }
  });

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      <MotionSection
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
                Stack Operations
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                {runStatus}
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              {activeOperation.title}
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">{activeOperation.description}</p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <MotionDiv 
                  animate={{ width: `${progress}%` }} 
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-violet-400 via-blue-500 to-cyan-500" 
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { label: "Push", val: activeOperation.pushTime, color: "text-emerald-200" },
                { label: "Pop", val: activeOperation.popTime, color: "text-rose-200" },
                { label: "Space", val: activeOperation.space, color: "text-blue-100" },
                { label: "Operations", val: operationCount, color: "text-cyan-200" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className={`mt-1 text-sm font-semibold ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-cyan-300" /> Live Snapshot
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Stack Size</p>
                  <p className="text-lg font-bold text-white">{stack.length} / {maxSize}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Top Element</p>
                  <p className="text-lg font-bold text-cyan-100">
                    {topElement ? topElement.value : "Empty"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Delay</p>
                <p className="text-lg font-bold text-blue-100">{speed}ms</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Status</p>
                <p className="text-sm font-semibold text-white">{statusMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-stretch">
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Layers size={18} className="text-violet-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">Implementation</label>
              <select
                value={selectedOperation}
                disabled={isRunning}
                onChange={(e) => setSelectedOperation(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none"
              >
                <option value="pushPop">Push-Pop Operations</option>
                <option value="arrayImpl">Array-Based Stack</option>
              </select>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                <span>Delay</span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="800"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-violet-400"
              />
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">Push Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isRunning}
                  placeholder="Enter value..."
                  className="h-10 flex-1 rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
                <MotionButton
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePush(inputValue)}
                  disabled={isRunning || !inputValue || stack.length >= maxSize}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 text-sm font-bold text-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDown size={14} /> Push
                </MotionButton>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={handlePop}
                disabled={isRunning || stack.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 py-2.5 text-sm font-bold text-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp size={16} /> Pop
              </MotionButton>
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={resetStack}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white"
              >
                <Trash2 size={16} /> Clear
              </MotionButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={generateRandomStack}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100 disabled:opacity-50"
              >
                <Shuffle size={16} /> Random
              </MotionButton>
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadCode}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 py-2.5 text-sm font-bold text-blue-100"
              >
                <Download size={16} /> Code
              </MotionButton>
            </div>
            <MotionButton
              whileHover={{ scale: 1.02 }}
              onClick={
                isRunning
                  ? isPaused
                    ? handleResume
                    : handlePause
                  : handleAutoPushPop
              }
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg ${
                isRunning
                  ? isPaused
                    ? "bg-emerald-600"
                    : "bg-amber-500 text-slate-900"
                  : "bg-gradient-to-r from-violet-600 to-blue-500"
              }`}
            >
              {isRunning ? (
                isPaused ? (
                  <Play size={18} fill="currentColor" />
                ) : (
                  <Pause size={18} fill="currentColor" />
                )
              ) : (
                <Play size={18} fill="currentColor" />
              )}
              {isRunning ? (isPaused ? "Resume" : "Pause") : "Auto Demo"}
            </MotionButton>
            <HotkeysHint className="mt-1" />
          </div>
        </aside>

        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Stack Visualization</p>
            <div className="flex gap-2">
              {[
                { label: "Top", color: "bg-cyan-500/50" },
                { label: "Pushing", color: "bg-emerald-500/50" },
                { label: "Popping", color: "bg-rose-500/50" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            {/* Stack Container */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative w-full max-w-xs">
                {/* Stack base/boundary */}
                <div className="relative min-h-[400px] rounded-2xl border-2 border-dashed border-slate-600/50 bg-slate-900/40 p-4 overflow-hidden">
                  {/* Empty state */}
                  {stack.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-slate-500 text-sm">Stack is empty</p>
                    </div>
                  )}

                  {/* Stack elements */}
                  <div className="flex flex-col-reverse gap-2 absolute bottom-4 left-4 right-4">
                    <AnimatePresence mode="popLayout">
                      {stack.map((element, index) => (
                        <motion.div
                          key={element.id}
                          layout
                          initial={{ opacity: 0, y: -50, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -50, scale: 0.8 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          className={`relative rounded-xl border-2 px-4 py-3 text-center shadow-lg ${getElementStatusClass(element.status)}`}
                        >
                          {index === stack.length - 1 && (
                            <span className="absolute -top-2 -right-2 rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              TOP
                            </span>
                          )}
                          <p className="text-lg font-bold">{element.value}</p>
                          <p className="text-[10px] uppercase text-slate-400">
                            Index: {index}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Stack labels */}
                  <div className="absolute -left-16 bottom-4 text-[10px] font-bold uppercase text-slate-500 rotate-[-90deg]">
                    Bottom
                  </div>
                  <div className="absolute -left-10 top-4 text-[10px] font-bold uppercase text-slate-500 rotate-[-90deg]">
                    Top
                  </div>
                </div>

                {/* Capacity indicator */}
                <div className="mt-4 text-center">
                  <div className="h-2 rounded-full bg-slate-700/70 overflow-hidden">
                    <motion.div
                      animate={{ width: `${(stack.length / maxSize) * 100}%` }}
                      className={`h-full ${stack.length >= maxSize ? "bg-rose-500" : "bg-violet-500"}`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Capacity: {stack.length} / {maxSize}
                  </p>
                </div>
              </div>
            </div>

            {/* Operation History */}
            <div className="w-48 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-3">
                History
              </p>
              <div className="space-y-2 max-h-[350px] overflow-y-auto ll-scrollbar">
                {operationHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No operations yet</p>
                ) : (
                  [...operationHistory].reverse().map((op, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                        op.type === "push"
                          ? "bg-emerald-500/10 text-emerald-200"
                          : "bg-rose-500/10 text-rose-200"
                      }`}
                    >
                      {op.type === "push" ? (
                        <ArrowDown size={12} />
                      ) : (
                        <ArrowUp size={12} />
                      )}
                      <span className="font-semibold capitalize">{op.type}</span>
                      <span className="font-bold">{op.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <Code2 size={20} className="text-violet-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="ml-4 flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
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
              )}{" "}
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
  );
}
