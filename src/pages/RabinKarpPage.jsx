import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CheckCheck,
  Clock3,
  Code2,
  Copy,
  Download,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Target,
  Info,
  Hash,
} from "lucide-react";
import {
  rabinKarpCPP,
  rabinKarpJava,
  rabinKarpPython,
  rabinKarpJS,
  generateRabinKarpSteps,
} from "../algorithms/rabinKarp";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import {
  shouldSkipHotkeyTarget,
  useStableHotkeys,
} from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

export default function RabinKarpPage() {
  const navigate = useNavigate();
  const [textStr, setTextStr] = useState("AABAACAADAABAABA");
  const [patternStr, setPatternStr] = useState("AABA");

  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(600);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");

  const timerRef = useRef(null);

  const activeCode = useMemo(() => {
    if (selectedLanguage === "Java") return rabinKarpJava;
    if (selectedLanguage === "Python") return rabinKarpPython;
    if (selectedLanguage === "JavaScript") return rabinKarpJS;
    return rabinKarpCPP;
  }, [selectedLanguage]);

  const currentStep = steps[currentStepIndex] || null;

  const handleGenerateNewStrings = () => {
    handleReset();
    const texts = [
      "ABCCABCABCC",
      "THEQUICKBROWNFOX",
      "AAAAABAAAA",
      "ABCDBACDABAC",
      "ZZZXYZZZYXZZ",
    ];
    const patterns = ["ABC", "FOX", "AAAB", "BACD", "ZYX"];
    const r = Math.floor(Math.random() * texts.length);
    setTextStr(texts[r]);
    setPatternStr(patterns[r]);
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setIsPaused(false);
  };

  const runAlgorithm = () => {
    if (!textStr || !patternStr) return;
    const generatedSteps = generateRabinKarpSteps(
      textStr.toUpperCase(),
      patternStr.toUpperCase(),
    );
    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    setRunStatus("Running");
    setIsPaused(false);
  };

  useEffect(() => {
    if (runStatus === "Running" && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setRunStatus("Completed");
          return prev;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runStatus, isPaused, steps.length, speed]);

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
      if (runStatus === "Running" || runStatus === "Paused") {
        setIsPaused((prev) => {
          const next = !prev;
          setRunStatus(next ? "Paused" : "Running");
          return next;
        });
        return;
      }
      if (runStatus === "Completed") handleReset();
      setTimeout(runAlgorithm, 50);
      return;
    }

    if (key === "r") {
      e.preventDefault();
      handleReset();
      return;
    }

    if (key === "n") {
      e.preventDefault();
      if (runStatus !== "Running") handleGenerateNewStrings();
    }
  });

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1400);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RabinKarp${selectedLanguage === "Python" ? ".py" : ".txt"}`;
    link.click();
  };

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.15),transparent_32%)]" />

      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-6 backdrop-blur shadow-2xl"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <button
              onClick={() => navigate("/algorithms")}
              className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10"
            >
              <ArrowLeft size={14} /> Back to Algorithms
            </button>
            <div className="mb-4 flex gap-2">
              <span className="rounded-full bg-fuchsia-500/10 border border-fuchsia-400/25 px-3 py-1 text-xs font-bold text-fuchsia-200">
                STRINGS
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white sm:text-5xl">
              Rabin-Karp Algorithm
            </h1>
            <p className="mt-3 text-slate-300">
              A pattern matching algorithm using rolling hashes to efficiently
              skip mismatches.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
              <Activity size={14} className="text-fuchsia-300" /> Algorithm
              Insight
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase">
                  Current Phase
                </p>
                <p className="text-sm font-bold text-sky-300">
                  {currentStep?.phase || "Idle"}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase flex items-center justify-center gap-1">
                  <Hash size={12} /> Window Hash
                </p>
                <p className="text-lg font-black text-amber-300">
                  {currentStep ? currentStep.textHash : "-"}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-white/5 p-3 min-h-12.5">
              <p className="text-[10px] text-slate-400">Current Logic Step</p>
              <p className="text-sm font-semibold text-white">
                {currentStep?.description || "Ready to start visualization."}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Controls Sidebar */}
        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className="text-fuchsia-400" /> Controls
            </h2>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 uppercase mb-1 block">
                  Text
                </label>
                <input
                  type="text"
                  value={textStr}
                  onChange={(e) => {
                    setTextStr(e.target.value);
                    handleReset();
                  }}
                  disabled={runStatus !== "Idle"}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 disabled:opacity-50 uppercase"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase mb-1 block">
                  Pattern
                </label>
                <input
                  type="text"
                  value={patternStr}
                  onChange={(e) => {
                    setPatternStr(e.target.value);
                    handleReset();
                  }}
                  disabled={runStatus !== "Idle"}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 disabled:opacity-50 uppercase"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/5 p-4">
              <label className="flex justify-between text-xs text-slate-400 uppercase mb-2">
                <span>
                  <Clock3 size={13} className="inline mr-1" /> Speed
                </span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="50"
                max="1500"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-fuchsia-500"
                style={{ direction: "rtl" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                <RotateCcw size={16} /> Reset
              </button>
              <button
                onClick={handleGenerateNewStrings}
                disabled={runStatus === "Running"}
                className="flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 py-3 text-sm font-bold text-fuchsia-100 disabled:opacity-50"
              >
                <Shuffle size={16} /> Random
              </button>
            </div>
            <button
              onClick={() => {
                if (runStatus === "Completed") handleReset();
                setTimeout(runAlgorithm, 50);
              }}
              className="w-full rounded-2xl bg-linear-to-r from-fuchsia-600 to-purple-500 py-4 font-black text-white shadow-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all"
            >
              {runStatus === "Running" ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
              {runStatus === "Completed"
                ? "Restart"
                : runStatus === "Running"
                  ? "Active"
                  : "Start Learning"}
            </button>
            <HotkeysHint className="mt-1" />
          </div>
        </aside>

        {/* Strings Visualization */}
        <section className="rounded-3xl border border-white/10 bg-slate-800/35 p-8 backdrop-blur shadow-2xl flex flex-col items-center justify-center min-h-100">
          <div className="w-full max-w-3xl overflow-x-auto pb-6">
            <div className="flex flex-col gap-3 mb-8 mx-auto w-max">
              {/* Text Array */}
              <div className="flex gap-1.5 justify-center">
                {textStr
                  .toUpperCase()
                  .split("")
                  .map((char, idx) => {
                    const inWindow =
                      currentStep &&
                      idx >= currentStep.textIndex &&
                      idx < currentStep.textIndex + patternStr.length;
                    const isMatch = currentStep?.matchFound && inWindow;
                    const isComparing =
                      inWindow &&
                      currentStep?.compareIndex === idx - currentStep.textIndex;

                    return (
                      <motion.div
                        key={`text-${idx}`}
                        layout
                        className={`relative flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-xl border-2 text-xl sm:text-2xl font-black transition-all duration-300 
                                                ${
                                                  isMatch
                                                    ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.4)] text-emerald-300"
                                                    : isComparing
                                                      ? "border-amber-400 bg-amber-500/20 text-amber-300 scale-110 z-10"
                                                      : inWindow
                                                        ? "border-sky-400 bg-sky-500/10 text-sky-200"
                                                        : "border-white/10 bg-slate-950/50 text-slate-400"
                                                }`}
                      >
                        {char}
                        <div className="absolute -bottom-6 text-[10px] text-slate-500 font-mono">
                          {idx}
                        </div>
                      </motion.div>
                    );
                  })}
              </div>

              {/* Pattern Array Spacer */}
              <div className="h-4"></div>

              {/* Pattern Array (Aligned) */}
              <div className="flex gap-1.5 justify-center">
                {textStr.split("").map((_, idx) => {
                  let pIdx = -1;
                  if (currentStep) {
                    pIdx = idx - currentStep.textIndex;
                  } else if (idx < patternStr.length) {
                    pIdx = idx; // Default position
                  }

                  const isValidPIdx = pIdx >= 0 && pIdx < patternStr.length;
                  const char = isValidPIdx
                    ? patternStr.toUpperCase()[pIdx]
                    : "";
                  const isComparing =
                    currentStep &&
                    isValidPIdx &&
                    currentStep.compareIndex === pIdx;
                  const isMatch = currentStep?.matchFound && isValidPIdx;

                  if (!char) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-14 w-12 sm:h-16 sm:w-14 shrink-0 border border-transparent"
                      ></div>
                    );
                  }

                  return (
                    <motion.div
                      key={`pat-${idx}`}
                      layout
                      className={`relative flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-xl border-2 text-xl sm:text-2xl font-black transition-all duration-300 shadow-lg
                                                ${
                                                  isMatch
                                                    ? "border-emerald-400 bg-emerald-600/30 text-emerald-300"
                                                    : isComparing
                                                      ? "border-amber-400 bg-amber-600/30 text-amber-300 scale-110 z-10"
                                                      : "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200"
                                                }`}
                    >
                      {char}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 w-full max-w-md rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Info size={14} /> Knowledge Corner
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pattern Hash Target:</span>
                <span className="text-fuchsia-300 font-bold font-mono">
                  {currentStep?.patternHash ?? "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                <span className="text-slate-500">Current Window Hash:</span>
                <span
                  className={`font-bold font-mono ${currentStep && currentStep.patternHash === currentStep.textHash && currentStep.patternHash !== undefined ? "text-emerald-400" : "text-amber-300"}`}
                >
                  {currentStep?.textHash ?? "-"}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      steps.length > 0
                        ? `${((currentStepIndex + 1) / steps.length) * 100}%`
                        : "0%",
                  }}
                  className="h-full bg-fuchsia-500"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Code Display Section */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
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
            <Code2 size={20} className="text-fuchsia-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-fuchsia-600 text-white" : "text-slate-400 hover:text-white"}`}
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
        <div className="ll-scrollbar max-h-125 overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed text-slate-300">
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
