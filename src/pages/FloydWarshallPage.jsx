import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Waypoints,
} from "lucide-react";
import {
  floydWarshallCPP,
  floydWarshallJava,
  floydWarshallPython,
  floydWarshallJS,
  generateFloydWarshallSteps,
} from "../algorithms/floydWarshall";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const CANVAS_WIDTH = 550;
const CANVAS_HEIGHT = 450;
const NODE_RADIUS = 20;

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const generateRandomGraph = (numNodes = 4) => {
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

    nodes.push({ id: i, x, y, label: String.fromCharCode(65 + i) });
  }

  // Connect nodes semi-randomly
  for (let i = 0; i < numNodes - 1; i++) {
    edges.push({
      source: i,
      target: i + 1,
      weight: Math.floor(Math.random() * 10) + 1,
    });
  }

  for (let i = 0; i < numNodes; i++) {
    const target = Math.floor(Math.random() * numNodes);
    if (
      target !== i &&
      !edges.some(
        (e) =>
          (e.source === i && e.target === target) ||
          (e.source === target && e.target === i),
      )
    ) {
      edges.push({
        source: i,
        target: target,
        weight: Math.floor(Math.random() * 10) + 1,
      });
    }
  }

  return { nodes, edges };
};

function formatElapsed(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function FloydWarshallPage() {
  const navigate = useNavigate();
  const [graph, setGraph] = useState(() => generateRandomGraph(5));
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(500);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [mappingConfigs, setMappingConfigs] = useState(null);

  const timerRef = useRef(null);

  const activeCode =
    selectedLanguage === "C++"
      ? floydWarshallCPP
      : selectedLanguage === "Java"
        ? floydWarshallJava
        : selectedLanguage === "Python"
          ? floydWarshallPython
          : floydWarshallJS;

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  const distances = currentStep ? currentStep.distances : null;
  const highlightK = currentStep ? currentStep.k : null;
  const highlightI = currentStep ? currentStep.i : null;
  const highlightJ = currentStep ? currentStep.j : null;
  const progress = useMemo(() => {
    if (runStatus === "Completed") return 100;
    if (steps.length === 0 || currentStepIndex < 0) return 0;
    return Math.min(Math.round(((currentStepIndex + 1) / steps.length) * 100), 100);
  }, [runStatus, currentStepIndex, steps.length]);

  const handleGenerateNewGraph = () => {
    handleReset();
    const numNodes = Math.floor(Math.random() * 2) + 4; // 4 to 5 nodes
    setGraph(generateRandomGraph(numNodes));
  };

  const handleReset = () => {
    stopAnimation();
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setIsPaused(false);
    setElapsedSeconds(0);
    setMappingConfigs(null);
  };

  const runAlgorithm = () => {
    const {
      steps: generatedSteps,
      nodeToIndex,
      indexToNode,
    } = generateFloydWarshallSteps(graph.nodes, graph.edges);
    setSteps(generatedSteps);
    setMappingConfigs({ nodeToIndex, indexToNode });
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
          setRunStatus("Completed");
          return prev;
        });
      }, speed);
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [runStatus, isPaused, steps.length, speed]);

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
          : ".py";
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FloydWarshall${ext}`;
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
      if (runStatus === "Idle" || runStatus === "Completed") {
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
      if (runStatus === "Idle") handleGenerateNewGraph();
    }
  });

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(225,29,72,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(244,63,94,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
              <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-200">
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
                Time: <span className="text-rose-200 font-mono">O(V^3)</span>
              </span>
              <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                Space: <span className="text-rose-200 font-mono">O(V^2)</span>
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Floyd Warshall
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Computes the shortest paths between all pairs of nodes using
              Dynamic Programming.
            </p>
            <div className="mt-6 w-full max-w-md">
              <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <span>Computation Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
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
                <p className="mt-1 text-sm font-semibold text-rose-200">
                  O(V³)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-rose-300" /> Live Status
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
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    i (Source)
                  </p>
                  <p className="text-lg font-bold text-sky-300">
                    {highlightI !== null
                      ? graph.nodes.find((n) => n.id === highlightI)?.label
                      : "-"}
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    j (Target)
                  </p>
                  <p className="text-lg font-bold text-pink-300">
                    {highlightJ !== null
                      ? graph.nodes.find((n) => n.id === highlightJ)?.label
                      : "-"}
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    k (Intermediate)
                  </p>
                  <p className="text-lg font-bold text-yellow-300">
                    {highlightK !== null
                      ? graph.nodes.find((n) => n.id === highlightK)?.label
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Step
                  </p>
                  <p className="text-lg font-bold text-cyan-200">
                    {steps.length > 0 ? `${Math.min(currentStepIndex + 1, steps.length)}/${steps.length}` : "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Delay
                  </p>
                  <p className="text-lg font-bold text-cyan-100">{speed}ms</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Nodes
                  </p>
                  <p className="text-lg font-bold text-rose-100">{graph.nodes.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_350px] xl:items-stretch">
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Waypoints size={18} className="text-rose-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4">
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

            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} /> Reset
              </button>
              <button
                onClick={handleGenerateNewGraph}
                disabled={runStatus !== "Idle"}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 py-2.5 text-sm font-bold text-rose-100 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
              >
                <Shuffle size={16} /> New Graph
              </button>
            </div>

            {runStatus === "Idle" || runStatus === "Completed" ? (
              <button
                onClick={() => {
                  if (runStatus === "Completed") handleReset();
                  setTimeout(runAlgorithm, 100);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-rose-600 to-red-500 py-3.5 font-bold text-white shadow-lg hover:shadow-rose-500/25 transition-all"
              >
                <Play size={18} fill="currentColor" />{" "}
                {runStatus === "Completed" ? "Restart" : "Start"}
              </button>
            ) : (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white ${isPaused ? "bg-emerald-600" : "bg-amber-500 text-slate-900"}`}
              >
                {isPaused ? (
                  <Play size={18} fill="currentColor" />
                ) : (
                  <Pause size={18} fill="currentColor" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </button>
            )}
            <HotkeysHint />
          </div>
        </aside>

        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col items-center justify-center">
          <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 backdrop-blur">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Legend</p>
            <div className="space-y-1.5 text-[10px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                <span>i (Source)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
                <span>j (Target)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span>k (Intermediate)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Evaluated Edge Pair</span>
              </div>
            </div>
          </div>
          <svg
            width="100%"
            height={CANVAS_HEIGHT}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className="w-full max-w-full rounded-2xl bg-slate-900/50 border border-slate-700/30"
          >
            {graph.edges.map((edge, i) => {
              const source = graph.nodes[edge.source];
              const target = graph.nodes[edge.target];

              const isEvalPath1 =
                highlightI !== null &&
                highlightK !== null &&
                ((source.id === highlightI && target.id === highlightK) ||
                  (source.id === highlightK && target.id === highlightI));
              const isEvalPath2 =
                highlightK !== null &&
                highlightJ !== null &&
                ((source.id === highlightK && target.id === highlightJ) ||
                  (source.id === highlightJ && target.id === highlightK));

              const isHighlighted = isEvalPath1 || isEvalPath2;

              return (
                <g key={i}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? "#fcd34d" : "#475569"}
                    strokeWidth={isHighlighted ? 4 : 2}
                    className="transition-colors duration-300"
                  />
                  <rect
                    x={(source.x + target.x) / 2 - 10}
                    y={(source.y + target.y) / 2 - 10}
                    width="20"
                    height="20"
                    rx="4"
                    fill="#0f172a"
                    className="stroke-slate-700"
                  />
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    dy="0.35em"
                    textAnchor="middle"
                    className="fill-slate-400 text-xs font-bold"
                  >
                    {edge.weight}
                  </text>
                </g>
              );
            })}

            {graph.nodes.map((node) => {
              const isI = highlightI === node.id;
              const isJ = highlightJ === node.id;
              const isK = highlightK === node.id;

              let circleFill = "#1e293b";
              let circleStroke = "#475569";

              if (isI) {
                circleFill = "#0ea5e9";
                circleStroke = "#bae6fd";
              } else if (isJ) {
                circleFill = "#db2777";
                circleStroke = "#fbcfe8";
              } else if (isK) {
                circleFill = "#eab308";
                circleStroke = "#fef08a";
              }

              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS}
                    fill={circleFill}
                    stroke={circleStroke}
                    strokeWidth={isI || isJ || isK ? "4" : "3"}
                    className="transition-all duration-300"
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    dy="0.35em"
                    textAnchor="middle"
                    className={`text-sm font-bold ${isI || isJ || isK ? "fill-slate-900" : "fill-white"}`}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 shadow-2xl backdrop-blur flex flex-col min-h-112.5">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Distance Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Updates real-time as paths relax.
            </p>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/50 p-2 relative">
            {distances ? (
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border-b border-r border-slate-700 text-slate-400 text-xs">
                      -
                    </th>
                    {graph.nodes.map((n, i) => (
                      <th
                        key={i}
                        className={`p-2 border-b border-slate-700 text-xs ${highlightJ === n.id ? "text-pink-300" : "text-slate-300"}`}
                      >
                        {n.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {graph.nodes.map((rowNode, r) => (
                    <tr key={r}>
                      <th
                        className={`p-2 border-r border-slate-700 text-xs ${highlightI === rowNode.id ? "text-sky-300" : "text-slate-300"}`}
                      >
                        {rowNode.label}
                      </th>
                      {graph.nodes.map((colNode, c) => {
                        const d = distances[r][c];
                        const isInfinity = d === Infinity;
                        const isHighlightedCell =
                          highlightI === rowNode.id &&
                          highlightJ === colNode.id;
                        return (
                          <td
                            key={c}
                            className={`p-2 text-sm font-mono border border-slate-800 ${isHighlightedCell ? "bg-amber-500/20 text-amber-200 font-bold" : isInfinity ? "text-slate-600" : "text-cyan-200"}`}
                          >
                            {isInfinity ? "∞" : d}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 text-center p-4">
                Click Start to compute all-pairs shortest paths
              </div>
            )}
          </div>
        </aside>
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
