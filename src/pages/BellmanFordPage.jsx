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
  Waypoints,
  Flag,
  AlertTriangle,
} from "lucide-react";
import {
  bellmanFordCPP,
  bellmanFordJava,
  bellmanFordPython,
  bellmanFordJS,
  generateBellmanFordSteps,
} from "../algorithms/bellmanFord";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import {
  shouldSkipHotkeyTarget,
  useStableHotkeys,
} from "../hooks/useStableHotkeys";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const NODE_RADIUS = 20;

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  Error: "border-red-400/30 bg-red-500/10 text-red-100",
};

const generateRandomDirectedGraph = (
  numNodes = 6,
  forceNegativeCycle = false,
) => {
  const nodes = [];
  const edges = [];
  const minDistance = 100;

  for (let i = 0; i < numNodes; i++) {
    let x, y, tooClose;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * (CANVAS_WIDTH - 100)) + 50;
      y = Math.floor(Math.random() * (CANVAS_HEIGHT - 100)) + 50;
      tooClose = nodes.some((n) => Math.hypot(n.x - x, n.y - y) < minDistance);
      attempts++;
    } while (tooClose && attempts < 100);

    nodes.push({ id: i, x, y, label: String.fromCharCode(65 + i), rank: i });
  }

  // Connect sequentially to ensure connectivity
  for (let i = 0; i < numNodes - 1; i++) {
    edges.push({
      source: i,
      target: i + 1,
      weight: Math.floor(Math.random() * 8) + 1,
    });
  }

  // Add random edges preserving DAG structure for negative weights to avoid accidental negative cycles
  for (let i = 0; i < numNodes; i++) {
    const target = Math.floor(Math.random() * numNodes);
    if (
      i !== target &&
      !edges.some((e) => e.source === i && e.target === target) &&
      !edges.some((e) => e.source === target && e.target === i)
    ) {
      let weight = Math.floor(Math.random() * 8) + 1;

      // Allow negative weights for forward edges
      if (nodes[i].rank < nodes[target].rank && Math.random() > 0.6) {
        weight = -Math.floor(Math.random() * 5) - 1;
      }

      edges.push({
        source: i,
        target: target,
        weight,
      });
    }
  }

  if (forceNegativeCycle) {
    // Find two nodes far apart and add a strong negative backward edge
    const u = numNodes - 1;
    const v = 0;
    const existingIndex = edges.findIndex(
      (e) => e.source === u && e.target === v,
    );
    if (existingIndex !== -1) edges.splice(existingIndex, 1);

    edges.push({
      source: u,
      target: v,
      weight: -15,
    });
  }

  return { nodes, edges };
};

function formatElapsed(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function BellmanFordPage() {
  const navigate = useNavigate();
  const [graph, setGraph] = useState(() =>
    generateRandomDirectedGraph(5, false),
  );
  const [startNodeId, setStartNodeId] = useState(0);
  const [targetNodeId, setTargetNodeId] = useState(4);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [previous, setPrevious] = useState({});

  const timerRef = useRef(null);

  const activeCode =
    selectedLanguage === "C++"
      ? bellmanFordCPP
      : selectedLanguage === "Java"
        ? bellmanFordJava
        : selectedLanguage === "Python"
          ? bellmanFordPython
          : bellmanFordJS;

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  const distances = currentStep ? currentStep.distances : {};
  const highlightEdge = currentStep ? currentStep.highlightEdge : null;
  const hasNegativeCycleFound = currentStep
    ? currentStep.hasNegativeCycle
    : false;

  const progress = useMemo(() => {
    if (runStatus === "Completed" || runStatus === "Error") return 100;
    if (steps.length <= 1 || currentStepIndex < 0) return 0;
    return Math.min(
      99,
      Math.round((currentStepIndex / (steps.length - 1)) * 100),
    );
  }, [runStatus, steps.length, currentStepIndex]);

  const pathEdges = useMemo(() => {
    if (runStatus !== "Completed") return [];
    if (hasNegativeCycleFound) return [];
    const path = [];
    let curr = targetNodeId;
    let count = 0;
    while (
      curr !== startNodeId &&
      previous[curr] !== undefined &&
      previous[curr] !== null &&
      count < graph.nodes.length
    ) {
      path.push({ source: previous[curr], target: curr });
      curr = previous[curr];
      count++;
    }
    return path;
  }, [
    runStatus,
    targetNodeId,
    previous,
    startNodeId,
    graph.nodes.length,
    hasNegativeCycleFound,
  ]);

  const handleGenerateNewGraph = (withNegativeCycle = false) => {
    handleReset();
    const numNodes = Math.floor(Math.random() * 3) + 5;
    setGraph(generateRandomDirectedGraph(numNodes, withNegativeCycle));
    setStartNodeId(0);
    setTargetNodeId(numNodes - 1);
  };

  const handleReset = () => {
    stopAnimation();
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setIsPaused(false);
    setElapsedSeconds(0);
    setPrevious({});
  };

  const runAlgorithm = () => {
    const { steps: generatedSteps, previous: prevMap } =
      generateBellmanFordSteps(graph.nodes, graph.edges, startNodeId);
    setSteps(generatedSteps);
    setPrevious(prevMap);
    setCurrentStepIndex(0);
    setRunStatus("Running");
    setIsPaused(false);
    setElapsedSeconds(0);
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
          const finalStep = steps[steps.length - 1];
          setRunStatus(finalStep.hasNegativeCycle ? "Error" : "Completed");
          return prev;
        });
      }, speed);
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [runStatus, isPaused, steps, speed]);

  useEffect(() => {
    if (runStatus !== "Running" || isPaused) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [runStatus, isPaused]);

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
    link.download = `BellmanFord${ext}`;
    link.click();
    URL.revokeObjectURL(url);
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
      if (
        runStatus === "Idle" ||
        runStatus === "Completed" ||
        runStatus === "Error"
      ) {
        if (runStatus === "Completed" || runStatus === "Error") handleReset();
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
      if (runStatus === "Idle") handleGenerateNewGraph();
    }
  });

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
                Pathfinding
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {formatElapsed(elapsedSeconds)}
              </span>
              <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                Time: <span className="text-cyan-300 font-mono">O(V * E)</span>
              </span>
              <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                Space: <span className="text-cyan-300 font-mono">O(V)</span>
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Bellman-Ford
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Computes shortest paths from a single source vertex to all other
              vertices. Handles negative weights and detects negative cycles.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Run Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-linear-to-r from-cyan-500 to-blue-500"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Nodes
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {graph.nodes.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Complexity
                </p>
                <p className="mt-1 text-sm font-semibold text-cyan-200">
                  O(V \u00d7 E)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Phase (Iter)
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-200">
                  {currentStep ? currentStep.iteration : 0} /{" "}
                  {graph.nodes.length - 1}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Step
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-200">
                  {currentStepIndex >= 0
                    ? `${currentStepIndex + 1}/${Math.max(steps.length, 1)}`
                    : "0/0"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 flex flex-col">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-cyan-300" /> Live Status
            </p>
            <div className="mt-4 space-y-3 flex-1 flex flex-col justify-center">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Action</p>
                <p
                  className={`text-sm font-semibold ${hasNegativeCycleFound ? "text-red-300" : "text-white"}`}
                >
                  {currentStep
                    ? currentStep.description
                    : "Press Start to begin"}
                </p>
              </div>
              {hasNegativeCycleFound && (
                <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-3 mt-2 flex items-center gap-3">
                  <AlertTriangle size={24} className="text-red-400" />
                  <div>
                    <p className="text-xs font-bold text-red-200">
                      NEGATIVE CYCLE DETECTED
                    </p>
                    <p className="text-xs text-red-300/80">
                      Shortest path cannot be determined.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-slate-400">Delay</p>
                  <p className="text-lg font-bold text-cyan-100">{speed}ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-stretch">
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Waypoints size={18} className="text-cyan-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>
                  <Target size={13} className="mr-1 inline" /> Start Node
                </span>
                <span>{graph.nodes[startNodeId]?.label}</span>
              </label>
              <input
                type="range"
                min="0"
                max={graph.nodes.length - 1}
                value={startNodeId}
                disabled={runStatus !== "Idle"}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartNodeId(val);
                  if (val === targetNodeId) setTargetNodeId(val === 0 ? 1 : 0);
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>
                  <Flag size={13} className="mr-1 inline" /> Target Node
                </span>
                <span>{graph.nodes[targetNodeId]?.label}</span>
              </label>
              <input
                type="range"
                min="0"
                max={graph.nodes.length - 1}
                value={targetNodeId}
                disabled={runStatus !== "Idle"}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetNodeId(val);
                  if (val === startNodeId) setStartNodeId(val === 0 ? 1 : 0);
                }}
                className="w-full accent-emerald-400"
              />
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
                className="w-full accent-blue-400"
                style={{ direction: "rtl" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} /> Reset
              </button>
              <button
                onClick={() => handleGenerateNewGraph(false)}
                disabled={runStatus !== "Idle"}
                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
              >
                <Shuffle size={16} /> Random DAG
              </button>
              <button
                onClick={() => handleGenerateNewGraph(true)}
                disabled={runStatus !== "Idle"}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 py-2 text-sm font-bold text-red-200 hover:bg-red-500/20 transition-colors disabled:opacity-50 mt-1"
              >
                <AlertTriangle size={16} /> Force Negative Cycle
              </button>
            </div>

            {runStatus === "Idle" ||
            runStatus === "Completed" ||
            runStatus === "Error" ? (
              <button
                onClick={() => {
                  if (runStatus !== "Idle") handleReset();
                  setTimeout(runAlgorithm, 100);
                }}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 py-3.5 font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <Play size={18} fill="currentColor" />{" "}
                {runStatus !== "Idle" ? "Restart" : "Start"}
              </button>
            ) : (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white ${isPaused ? "bg-emerald-600" : "bg-amber-500 text-slate-900"}`}
              >
                {isPaused ? (
                  <Play size={18} fill="currentColor" />
                ) : (
                  <Pause size={18} fill="currentColor" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </button>
            )}
            <HotkeysHint className="mt-1" />
          </div>
        </aside>

        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6 relative">
          <div className="absolute top-4 left-6 z-10 w-48">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {graph.nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex justify-between bg-black/40 px-2 py-1 rounded border border-white/5"
                >
                  <span className="font-bold text-slate-300">{node.label}</span>
                  <span
                    className={`font-mono ${distances[node.id] === Infinity ? "text-slate-500" : "text-cyan-300"}`}
                  >
                    {distances[node.id] === undefined
                      ? "INF"
                      : distances[node.id] === Infinity
                        ? "INF"
                        : distances[node.id]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <svg
            width="100%"
            height={CANVAS_HEIGHT}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className="w-full h-full rounded-2xl bg-slate-900/50 border border-slate-700/30"
          >
            <defs>
              <marker
                id="arrow-normal"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="#475569"
                  className="transition-colors duration-300"
                />
              </marker>
              <marker
                id="arrow-highlight"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="#22d3ee"
                  className="transition-colors duration-300"
                />
              </marker>
              <marker
                id="arrow-relax"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="#eab308"
                  className="transition-colors duration-300"
                />
              </marker>
              <marker
                id="arrow-cycle"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="#ef4444"
                  className="transition-colors duration-300"
                />
              </marker>
              <marker
                id="arrow-path"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="#f472b6"
                  className="transition-colors duration-300"
                />
              </marker>
            </defs>

            {/* Edges */}
            {graph.edges.map((edge, i) => {
              const source = graph.nodes[edge.source];
              const target = graph.nodes[edge.target];
              const isHighlighted =
                highlightEdge &&
                highlightEdge.source === edge.source &&
                highlightEdge.target === edge.target;

              const isChecking = isHighlighted && highlightEdge.isChecking;
              const isRelaxed = isHighlighted && highlightEdge.isRelaxed;
              const isCycle = isHighlighted && highlightEdge.isCycleCycle;
              const isPathEdge = pathEdges.some(
                (p) => p.source === edge.source && p.target === edge.target,
              );

              let edgeColor = "#475569";
              let markerEnd = "url(#arrow-normal)";
              let strokeWidth = 2;

              if (isCycle) {
                edgeColor = "#ef4444";
                markerEnd = "url(#arrow-cycle)";
                strokeWidth = 4;
              } else if (isPathEdge) {
                edgeColor = "#f472b6";
                markerEnd = "url(#arrow-path)";
                strokeWidth = 4;
              } else if (isRelaxed) {
                edgeColor = "#eab308";
                markerEnd = "url(#arrow-relax)";
                strokeWidth = 4;
              } else if (isChecking) {
                edgeColor = "#22d3ee";
                markerEnd = "url(#arrow-highlight)";
                strokeWidth = 3;
              }

              return (
                <g key={i}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={edgeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={markerEnd}
                    className="transition-all duration-300"
                  />
                  <rect
                    x={(source.x + target.x) / 2 - 12}
                    y={(source.y + target.y) / 2 - 12}
                    width="24"
                    height="24"
                    rx="12"
                    fill="#0f172a"
                    className="stroke-slate-700"
                  />
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    dy="0.35em"
                    textAnchor="middle"
                    className={`text-xs font-bold ${edge.weight < 0 ? "fill-red-400" : "fill-slate-400"}`}
                  >
                    {edge.weight}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => {
              const isStart = node.id === startNodeId;
              const isTarget = node.id === targetNodeId;
              const isProcessing =
                highlightEdge &&
                (highlightEdge.source === node.id ||
                  highlightEdge.target === node.id);

              let circleFill = "#1e293b";
              let circleStroke = "#475569";

              if (isStart) {
                circleFill = "#0ea5e9";
                circleStroke = "#bae6fd";
              } else if (isTarget) {
                circleFill = "#db2777";
                circleStroke = "#fbcfe8";
              } else if (isProcessing) {
                circleFill = "#eab308";
                circleStroke = "#fef08a";
              }

              if (hasNegativeCycleFound && isProcessing) {
                circleFill = "#ef4444";
                circleStroke = "#fca5a5";
              }

              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS}
                    fill={circleFill}
                    stroke={circleStroke}
                    strokeWidth={isStart || isTarget ? "4" : "3"}
                    className="transition-all duration-300"
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    dy="0.35em"
                    textAnchor="middle"
                    className={`text-sm font-bold ${isStart || isTarget || isProcessing ? "fill-slate-900" : "fill-white"}`}
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + NODE_RADIUS + 15}
                    dy="0.35em"
                    textAnchor="middle"
                    className="fill-cyan-300 text-xs font-mono font-bold"
                  >
                    {distances[node.id] === Infinity ||
                    distances[node.id] === undefined
                      ? "∞"
                      : distances[node.id]}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Legend
            </p>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Start
                Node
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-pink-600" /> Target
                Node
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />{" "}
                Checking Edge
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />{" "}
                Relaxed Edge
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-0.5 w-5 rounded bg-pink-400" /> Final Path
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />{" "}
                Negative Cycle
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
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
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
