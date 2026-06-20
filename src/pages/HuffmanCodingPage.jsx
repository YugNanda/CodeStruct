import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Waypoints,
  Type,
  ListTree,
} from "lucide-react";
import {
  huffmanCPP,
  huffmanJava,
  huffmanPython,
  huffmanJS,
  generateHuffmanSteps,
} from "../algorithms/huffmanCoding";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const NODE_RADIUS = 20;

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

// Helper for tree layout
function calculateTreeLayout(allNodes, forestRoots) {
  const layout = {};
  const levelHeight = 60;

  // Determine the max depth of each tree in the forest
  function getDepth(nodeId) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return 0;
    if (node.isLeaf) return 1;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
  }

  // First assign temporary local x coordinates based on inorder traversal
  function assignLocalX(nodeId, xOffset, depth) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return xOffset;

    let currentX = xOffset;
    if (!node.isLeaf) {
      currentX = assignLocalX(node.left, currentX, depth + 1);
    }

    layout[nodeId] = {
      localX: currentX,
      y: CANVAS_HEIGHT - 50 - getDepth(nodeId) * levelHeight,
    };
    currentX += 50; // horizontal spacing between nodes

    if (!node.isLeaf) {
      currentX = assignLocalX(node.right, currentX, depth + 1);
      // Center parent over children
      layout[nodeId].localX =
        (layout[node.left].localX + layout[node.right].localX) / 2;
    }

    return currentX;
  }

  let globalX = 50; // Start padding
  forestRoots.forEach((root) => {
    const nextX = assignLocalX(root.id, globalX, 0);
    globalX = nextX + 20; // spacing between trees
  });

  // We now have layout[nodeId] = { localX, y }
  // Scale localX to fit CANVAS_WIDTH if necessary, or just center them
  const maxX = globalX - 20;
  const scale = Math.min(1, (CANVAS_WIDTH - 100) / Math.max(1, maxX - 50));

  // Shift over to center
  const totalWidth = (maxX - 50) * scale;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;

  for (const key in layout) {
    layout[key].x = startX + (layout[key].localX - 50) * scale;
  }

  return layout;
}

export default function HuffmanCodingPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("HELLO WORLD");
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");

  const timerRef = useRef(null);

  const activeCode = useMemo(() => {
    if (selectedLanguage === "C++") return huffmanCPP;
    if (selectedLanguage === "Java") return huffmanJava;
    if (selectedLanguage === "Python") return huffmanPython;
    return huffmanJS;
  }, [selectedLanguage]);

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  // Layout configuration
  const layout = useMemo(() => {
    if (!currentStep) return {};
    // Only layout the current active forest and nodes
    return calculateTreeLayout(currentStep.allNodes, currentStep.nodes);
  }, [currentStep]);

  const handleReset = () => {
    stopAnimation();
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setIsPaused(false);
  };

  const runAlgorithm = () => {
    const result = generateHuffmanSteps(inputText.toUpperCase());
    setSteps(result.steps);
    setCurrentStepIndex(0);
    setRunStatus("Running");
    setIsPaused(false);
  };

  const stopAnimation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

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
  }, [runStatus, isPaused, steps.length, speed]);

  // Copy/Download handlers
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
    link.download = "HuffmanCoding" + ext;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateNewInput = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const length = Math.floor(Math.random() * 8) + 6;
    let generated = "";

    for (let i = 0; i < length; i++) {
      if (i > 0 && Math.random() < 0.18) generated += " ";
      generated += chars[Math.floor(Math.random() * chars.length)];
    }

    const normalized = generated.replace(/\s+/g, " ").trim();
    setInputText(normalized || "DATA");
    handleReset();
  };

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
      if (runStatus === "Idle" || runStatus === "Completed") {
        if (!inputText.trim()) return;
        if (runStatus === "Completed") handleReset();
        setTimeout(runAlgorithm, 100);
      } else {
        setIsPaused((prev) => !prev);
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
      handleGenerateNewInput();
    }
  });

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7 mb-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
                Greedy
              </span>
              <span
                className={
                  "rounded-full border px-3 py-1 text-xs font-semibold " +
                  runStatusStyleMap[runStatus]
                }
              >
                {runStatus}
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Huffman Coding
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              An optimal prefix code algorithm used for lossless data
              compression, building a tree based on character frequencies.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Length
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {inputText.length} chars
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Complexity
                </p>
                <p className="mt-1 text-sm font-semibold text-amber-200">
                  O(N log N)
                </p>
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-amber-300" /> Live Status
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Action</p>
                <p className="text-sm font-semibold text-white">
                  {currentStep
                    ? currentStep.description
                    : "Press Start to begin"}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Phase</p>
                <p className="text-sm font-bold text-amber-100">
                  {currentStep ? currentStep.phase : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-stretch">
        {/* Controls Sidebar */}
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Waypoints size={18} className="text-amber-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>
                  <Type size={13} className="mr-1 inline" /> Input Text
                </span>
                <span
                  className={
                    inputText.length > 20 ? "text-red-400" : "text-emerald-400"
                  }
                >
                  {inputText.length}/20
                </span>
              </label>
              <input
                type="text"
                maxLength={20}
                value={inputText}
                disabled={runStatus !== "Idle"}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors uppercase font-mono"
                placeholder="Enter text..."
              />
            </div>

            <div className="rounded-2xl bg-white/5 p-3 flex-grow overflow-auto max-h-48">
              <label className="mb-2 flex items-center text-xs uppercase text-slate-400">
                <ListTree size={13} className="mr-1 inline" /> Frequency Table
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {currentStep &&
                  Object.entries(currentStep.frequencies).map(
                    ([char, freq]) => (
                      <div
                        key={char}
                        className="flex justify-between bg-black/40 px-2 py-1.5 rounded border border-white/5 font-mono"
                      >
                        <span className="font-bold text-amber-200">
                          '{char}'
                        </span>
                        <span className="text-slate-300">{freq}</span>
                      </div>
                    ),
                  )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>
                  <Clock3 size={13} className="mr-1 inline" /> Speed
                </span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-amber-400"
                style={{ direction: "rtl" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} /> Reset
              </button>
              {runStatus === "Idle" || runStatus === "Completed" ? (
                <button
                  onClick={() => {
                    if (runStatus === "Completed") handleReset();
                    setTimeout(runAlgorithm, 100);
                  }}
                  disabled={!inputText.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 py-2.5 font-bold text-white shadow-lg shrink-0 transition-all disabled:opacity-50"
                >
                  <Play size={16} fill="currentColor" />{" "}
                  {runStatus === "Completed" ? "Restart" : "Start"}
                </button>
              ) : (
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={
                    "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-white transition-colors shrink-0 " +
                    (isPaused
                      ? "bg-emerald-600"
                      : "bg-amber-500 text-slate-900")
                  }
                >
                  {isPaused ? (
                    <Play size={16} fill="currentColor" />
                  ) : (
                    <Pause size={16} fill="currentColor" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </button>
              )}
            </div>
            <HotkeysHint />
          </div>
        </aside>

        {/* Visualization Area */}
        <section className="min-w-0 h-full flex flex-col gap-4">
          {/* SVG Canvas */}
          <div
            className="rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative overflow-hidden"
            style={{ minHeight: CANVAS_HEIGHT }}
          >
            <svg
              width="100%"
              height={CANVAS_HEIGHT}
              viewBox={"0 0 " + CANVAS_WIDTH + " " + CANVAS_HEIGHT}
              className="w-full h-full rounded-2xl bg-slate-900/50 border border-slate-700/30"
            >
              {/* Edges */}
              {currentStep &&
                currentStep.edges.map((edge, i) => {
                  const sourcePos = layout[edge.source];
                  const targetPos = layout[edge.target];
                  if (!sourcePos || !targetPos) return null;

                  const isHighlighted = currentStep.highlightEdges?.some(
                    (e) =>
                      (e.source === edge.source && e.target === edge.target) ||
                      (e.source === edge.target && e.target === edge.source),
                  );

                  return (
                    <g key={"edge-" + i}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isHighlighted ? "#fbbf24" : "#475569"}
                        strokeWidth={isHighlighted ? 4 : 2}
                        className="transition-colors duration-300"
                      />
                      <rect
                        x={(sourcePos.x + targetPos.x) / 2 - 10}
                        y={(sourcePos.y + targetPos.y) / 2 - 10}
                        width="20"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                        className="stroke-slate-700"
                      />
                      <text
                        x={(sourcePos.x + targetPos.x) / 2}
                        y={(sourcePos.y + targetPos.y) / 2}
                        dy="0.35em"
                        textAnchor="middle"
                        className="fill-amber-400 text-xs font-bold font-mono"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

              {/* Nodes (Active in Tree) */}
              {currentStep &&
                currentStep.allNodes.map((node) => {
                  const pos = layout[node.id];
                  if (!pos) return null;

                  const isHighlighted = currentStep.highlightNodes?.includes(
                    node.id,
                  );
                  let circleFill = "#1e293b";
                  let circleStroke = "#475569";

                  if (isHighlighted) {
                    circleFill = "#d97706"; // amber-600
                    circleStroke = "#fde68a"; // amber-200
                  } else if (node.isLeaf) {
                    circleFill = "#0f766e"; // teal-700
                    circleStroke = "#5eead4"; // teal-300
                  }

                  return (
                    <g key={node.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={NODE_RADIUS}
                        fill={circleFill}
                        stroke={circleStroke}
                        strokeWidth={isHighlighted ? "3" : "2"}
                        className="transition-all duration-300"
                      />
                      <text
                        x={pos.x}
                        y={pos.y}
                        dy="0.35em"
                        textAnchor="middle"
                        className="text-sm font-bold fill-white"
                      >
                        {node.isLeaf ? "'" + node.char + "'" : node.freq}
                      </text>

                      {/* Show freq label underneath leaf nodes too */}
                      {node.isLeaf && (
                        <text
                          x={pos.x}
                          y={pos.y + NODE_RADIUS + 12}
                          dy="0.35em"
                          textAnchor="middle"
                          className="text-[10px] font-mono fill-slate-400"
                        >
                          {node.freq}
                        </text>
                      )}
                    </g>
                  );
                })}
            </svg>
          </div>

          {/* Result Codes Table */}
          <AnimatePresence>
            {currentStep && Object.keys(currentStep.codes).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 shadow-xl backdrop-blur"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-3 ml-1">
                  Generated Codes
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(currentStep.codes).map(([char, code]) => (
                    <div
                      key={char}
                      className="flex flex-col bg-slate-900/60 rounded border border-white/5 py-1.5 px-3 min-w-[60px] text-center"
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">
                        Char{" "}
                        <span className="text-white font-bold ml-1">
                          '{char}'
                        </span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold tracking-widest">
                        {code}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Code Section */}
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
            <Code2 size={20} className="text-amber-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all " +
                    (selectedLanguage === lang
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:text-white")
                  }
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
        <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed text-slate-300">
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
