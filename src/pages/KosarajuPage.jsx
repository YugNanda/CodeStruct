import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCheck,
  Code2,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Network,
  ArrowLeft,
  Download,
} from "lucide-react";
import {
  kosarajuCPP,
  kosarajuJava,
  kosarajuPython,
  kosarajuJS,
} from "../algorithms/kosaraju";
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

const SCC_COLORS = [
  "bg-rose-500 border-rose-300",
  "bg-fuchsia-500 border-fuchsia-300",
  "bg-violet-500 border-violet-300",
  "bg-indigo-500 border-indigo-300",
  "bg-blue-500 border-blue-300",
  "bg-cyan-500 border-cyan-300",
  "bg-teal-500 border-teal-300",
  "bg-emerald-500 border-emerald-300",
  "bg-green-500 border-green-300",
  "bg-lime-500 border-lime-300",
  "bg-amber-500 border-amber-300",
  "bg-orange-500 border-orange-300",
];

// Helper to generate a generic directed graph, optionally ensuring some cycles to form SCCs
function generateDirectedGraphWithSCCs(nodeCount, width, height) {
  const nodes = [];
  const edges = [];
  const padding = 40;

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i,
      x: Math.random() * (width - 2 * padding) + padding,
      y: Math.random() * (height - 2 * padding) + padding,
      status: "unvisited", // unvisited, processing, finished, scc
      sccIndex: -1,
    });
  }

  // Let's create some clusters to be SCCs
  const clustersCount = Math.max(1, Math.floor(nodeCount / 3));
  const nodesPerCluster = Math.floor(nodeCount / clustersCount);

  // Create random cycles within clusters
  for (let c = 0; c < clustersCount; c++) {
    const startIdx = c * nodesPerCluster;
    const endIdx =
      c === clustersCount - 1 ? nodeCount : startIdx + nodesPerCluster;
    const clusterNodes = nodes.slice(startIdx, endIdx);

    if (clusterNodes.length >= 2) {
      // Create a cycle
      for (let i = 0; i < clusterNodes.length; i++) {
        const u = clusterNodes[i].id;
        const v = clusterNodes[(i + 1) % clusterNodes.length].id;
        edges.push({
          source: u,
          target: v,
          id: `e-${u}-${v}`,
          status: "default",
          isReversed: false,
        });
      }
      // Add some internal random edges
      if (clusterNodes.length > 3) {
        const u =
          clusterNodes[Math.floor(Math.random() * clusterNodes.length)].id;
        const v =
          clusterNodes[Math.floor(Math.random() * clusterNodes.length)].id;
        if (u !== v && !edges.some((e) => e.source === u && e.target === v)) {
          edges.push({
            source: u,
            target: v,
            id: `e-${u}-${v}`,
            status: "default",
            isReversed: false,
          });
        }
      }
    }
  }

  // Add some random edges between clusters, maintaining a DAG structure between SCCs roughly
  for (let i = 0; i < clustersCount - 1; i++) {
    const u = nodes[i * nodesPerCluster].id;
    const v = nodes[(i + 1) * nodesPerCluster].id;
    if (
      !edges.some((e) => e.source === u && e.target === v) &&
      !edges.some((e) => e.source === v && e.target === u)
    ) {
      edges.push({
        source: u,
        target: v,
        id: `e-${u}-${v}`,
        status: "default",
        isReversed: false,
      });
    }
  }

  return { nodes, edges, isTransposed: false };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatElapsed(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function KosarajuPage() {
  const navigate = useNavigate();
  useDocumentTitle("Kosaraju's Algorithm");
  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
    isTransposed: false,
  });
  const [nodeCount, setNodeCount] = useState(8);
  const [speed, setSpeed] = useState(300);
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Generate a graph to start.",
  );
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");

  // Algorithm state
  const [stack, setStack] = useState([]);
  const [sccs, setSccs] = useState([]);
  const [dfsPhase, setDfsPhase] = useState("None"); // None, DFS1, Transpose, DFS2
  const [visitedCount, setVisitedCount] = useState(0);

  const activeCode =
    selectedLanguage === "C++"
      ? kosarajuCPP
      : selectedLanguage === "Java"
        ? kosarajuJava
        : selectedLanguage === "Python"
          ? kosarajuPython
          : kosarajuJS;

  // Progress is based on two DFS passes: 50% for 1st pass, 50% for 2nd pass
  const progress = useMemo(() => {
    if (runStatus === "Completed") return 100;
    if (graph.nodes.length === 0) return 0;
    let p = 0;
    if (dfsPhase === "DFS1" || dfsPhase === "Transpose") {
      p = Math.round((visitedCount / graph.nodes.length) * 45); // up to 45%
    } else if (dfsPhase === "DFS2") {
      p =
        45 +
        10 /* transpose */ +
        Math.round((visitedCount / graph.nodes.length) * 45);
    }
    return Math.min(100, p);
  }, [runStatus, visitedCount, graph.nodes.length, dfsPhase]);

  const getFileExtension = (lang) => {
    switch (lang) {
      case "C++":
        return "cpp";
      case "Java":
        return "java";
      case "Python":
        return "py";
      case "JavaScript":
        return "js";
      default:
        return "txt";
    }
  };

  // Canvas Refs
  const containerRef = useRef(null);
  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);

  useEffect(() => {
    handleNewGraph(nodeCount);
  }, []);

  useEffect(() => {
    if (runStatus !== "Running" || isPaused) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [runStatus, isPaused]);

  const handleNewGraph = (count = nodeCount) => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setRunStatus("Idle");
    setStatusMessage("New graph generated.");
    setElapsedSeconds(0);
    setStack([]);
    setSccs([]);
    setDfsPhase("None");
    setVisitedCount(0);

    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setGraph(
        generateDirectedGraphWithSCCs(count, width || 600, height || 400),
      );
    }
  };

  const handleReset = () => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setRunStatus("Idle");
    setElapsedSeconds(0);

    setGraph((prev) => ({
      ...prev,
      isTransposed: false,
      nodes: prev.nodes.map((n) => ({
        ...n,
        status: "unvisited",
        sccIndex: -1,
      })),
      edges: prev.edges.map((e) => {
        // Return to original direction if currently reversed by checking if it was reversed
        if (prev.isTransposed) {
          return {
            ...e,
            source: e.target,
            target: e.source,
            status: "default",
            isReversed: false,
          };
        }
        return { ...e, status: "default", isReversed: false };
      }),
    }));

    setStack([]);
    setSccs([]);
    setDfsPhase("None");
    setVisitedCount(0);
    setStatusMessage("Visualization reset.");
  };

  const waitWithControl = async (duration) => {
    let elapsed = 0;
    while (elapsed < duration) {
      if (stopSignal.current) return false;
      while (pauseSignal.current) {
        if (stopSignal.current) return false;
        await sleep(100);
      }
      await sleep(50);
      elapsed += 50;
    }
    return !stopSignal.current;
  };

  const runKosaraju = async () => {
    if (isRunning || graph.nodes.length === 0) return;

    setIsRunning(true);
    setRunStatus("Running");
    setElapsedSeconds(0);
    stopSignal.current = false;
    pauseSignal.current = false;

    // Reset state
    setStack([]);
    setSccs([]);
    setVisitedCount(0);

    setGraph((prev) => ({
      ...prev,
      isTransposed: false,
      nodes: prev.nodes.map((n) => ({
        ...n,
        status: "unvisited",
        sccIndex: -1,
      })),
      edges: prev.edges.map((e) => ({
        ...(prev.isTransposed ? { source: e.target, target: e.source } : e),
        status: "default",
        isReversed: false,
      })),
    }));

    const updateNodeStatus = (id, status, sccIndex = -1) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === id
            ? { ...n, status, ...(sccIndex >= 0 ? { sccIndex } : {}) }
            : n,
        ),
      }));
    };
    const updateEdgeStatus = (source, target, status) => {
      setGraph((prev) => ({
        ...prev,
        edges: prev.edges.map((e) =>
          e.source === source && e.target === target ? { ...e, status } : e,
        ),
      }));
    };

    let tempVisitedCount = 0;

    // --- PHASE 1: Normal DFS ---
    setDfsPhase("DFS1");
    setStatusMessage("Phase 1: DFS to compute finishing times.");
    if (!(await waitWithControl(speed))) return;

    let adj1 = Array.from({ length: nodeCount }, () => []);
    // Need to refer to latest graph edges because state might not have updated if we rely on initial graph
    const edges = graph.edges;
    edges.forEach((e) => {
      adj1[e.source].push(e.target);
    });

    const vis1 = new Array(nodeCount).fill(false);
    const st = [];

    for (let i = 0; i < nodeCount; i++) {
      if (!vis1[i]) {
        if (
          !(await dfs1(i, adj1, vis1, st, updateNodeStatus, updateEdgeStatus))
        )
          return;
      }
    }

    // --- PHASE 2: Transpose Graph ---
    setDfsPhase("Transpose");
    setStatusMessage("Phase 2: Transposing the graph (reversing all edges).");
    if (!(await waitWithControl(speed))) return;

    setGraph((prev) => ({
      ...prev,
      isTransposed: true,
      nodes: prev.nodes.map((n) => ({ ...n, status: "unvisited" })),
      edges: prev.edges.map((e) => ({
        source: e.target,
        target: e.source,
        id: `e-${e.target}-${e.source}`,
        status: "default",
        isReversed: true,
      })),
    }));
    setVisitedCount(0);
    tempVisitedCount = 0;

    setStatusMessage("Graph transposed. Edges are now reversed.");
    if (!(await waitWithControl(speed * 2))) return;

    let adj2 = Array.from({ length: nodeCount }, () => []);
    // The reversed edges
    edges.forEach((e) => {
      // e.target is the new source, e.source is the new target
      adj2[e.target].push(e.source);
    });

    // --- PHASE 3: DFS 2 based on Stack ---
    setDfsPhase("DFS2");
    setStatusMessage(
      "Phase 3: DFS in decreasing order of finishing times (stack).",
    );
    if (!(await waitWithControl(speed))) return;

    const vis2 = new Array(nodeCount).fill(false);
    const resultSCCs = [];

    while (st.length > 0) {
      if (stopSignal.current) return;
      const node = st.pop();
      setStack([...st]); // update UI stack

      if (!vis2[node]) {
        const currentSCCIndex = resultSCCs.length;
        const currentSCC = [];

        setStatusMessage(
          `Exploring node ${node} to find SCC ${currentSCCIndex + 1}`,
        );
        updateNodeStatus(node, "processing");
        if (!(await waitWithControl(speed))) return;

        if (
          !(await dfs2(
            node,
            adj2,
            vis2,
            currentSCC,
            currentSCCIndex,
            updateNodeStatus,
            updateEdgeStatus,
          ))
        )
          return;

        resultSCCs.push(currentSCC);
        setSccs([...resultSCCs]);
      } else {
        setStatusMessage(
          `Node ${node} from stack is already visited. Skipping.`,
        );
        if (!(await waitWithControl(speed / 2))) return;
      }
    }

    if (!stopSignal.current) {
      setRunStatus("Completed");
      setStatusMessage(
        `Completed! Found ${resultSCCs.length} Strongly Connected Component(s).`,
      );
      setDfsPhase("Completed");
    }
    setIsRunning(false);

    // Helper recursive function for DFS 1
    async function dfs1(u, adj, vis, st, updateNodeStatus, updateEdgeStatus) {
      if (stopSignal.current) return false;

      vis[u] = true;
      tempVisitedCount++;
      setVisitedCount(tempVisitedCount);

      updateNodeStatus(u, "processing");
      setStatusMessage(`DFS 1: Processing Node ${u}`);
      if (!(await waitWithControl(speed))) return false;

      for (let v of adj[u]) {
        if (stopSignal.current) return false;

        updateEdgeStatus(u, v, "traversing");
        if (!(await waitWithControl(speed / 1.5))) return false;

        if (!vis[v]) {
          if (
            !(await dfs1(v, adj, vis, st, updateNodeStatus, updateEdgeStatus))
          )
            return false;
        } else {
          updateEdgeStatus(u, v, "default");
        }
      }

      if (stopSignal.current) return false;

      st.push(u);
      setStack([...st]); // Update UI
      updateNodeStatus(u, "finished");
      setStatusMessage(`DFS 1: Finished Node ${u}, pushed to stack`);
      if (!(await waitWithControl(speed))) return false;

      return true;
    }

    // Helper recursive function for DFS 2
    async function dfs2(
      u,
      adj,
      vis,
      currentSCC,
      sccIndex,
      updateNodeStatus,
      updateEdgeStatus,
    ) {
      if (stopSignal.current) return false;

      vis[u] = true;
      currentSCC.push(u);
      tempVisitedCount++;
      setVisitedCount(tempVisitedCount);

      updateNodeStatus(u, "scc", sccIndex);
      setStatusMessage(`DFS 2: Added Node ${u} to SCC ${sccIndex + 1}`);
      if (!(await waitWithControl(speed))) return false;

      for (let v of adj[u]) {
        if (stopSignal.current) return false;

        updateEdgeStatus(u, v, "traversing");
        if (!(await waitWithControl(speed / 1.5))) return false;

        if (!vis[v]) {
          updateNodeStatus(v, "processing");
          if (
            !(await dfs2(
              v,
              adj,
              vis,
              currentSCC,
              sccIndex,
              updateNodeStatus,
              updateEdgeStatus,
            ))
          )
            return false;
        } else {
          updateEdgeStatus(u, v, "default");
        }
      }

      return true;
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch {}
  };

  const handleDownloadCode = () => {
    const ext = getFileExtension(selectedLanguage);
    const filename = `kosaraju.${ext}`;
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      if (isRunning) {
        if (isPaused) {
          pauseSignal.current = false;
          setIsPaused(false);
          setRunStatus("Running");
        } else {
          pauseSignal.current = true;
          setIsPaused(true);
          setRunStatus("Paused");
        }
      } else {
        runKosaraju();
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
      handleNewGraph();
    }
  });

  // Node Colors
  const getNodeColor = (status, sccIndex) => {
    switch (status) {
      case "processing":
        return "bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110 z-20";
      case "finished":
        return "bg-slate-700 border-slate-500 opacity-80"; // Finished during Phase 1
      case "scc":
        return SCC_COLORS[sccIndex % SCC_COLORS.length] + " z-10 scale-105";
      default:
        return "bg-slate-800 border-slate-600 hover:border-emerald-400 z-10"; // unvisited
    }
  };

  const getEdgeColor = (status, isTransposed) => {
    switch (status) {
      case "traversing":
        return isTransposed
          ? "stroke-amber-400 stroke-2 opacity-100"
          : "stroke-orange-400 stroke-2 opacity-100";
      case "faded":
        return "stroke-slate-700 stroke-1 opacity-20";
      default:
        return isTransposed
          ? "stroke-teal-600/80 stroke-1 opacity-60"
          : "stroke-cyan-600/60 stroke-1 opacity-100";
    }
  };

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.15),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
      >
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
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
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                Graph
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
                Time:{" "}
                <span className="text-emerald-300 font-mono">O(V + E)</span>
              </span>
              <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                Space: <span className="text-emerald-300 font-mono">O(V)</span>
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Kosaraju's Algorithm
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl">
              Finds all Strongly Connected Components (SCCs) in a directed graph
              using two DFS passes and a graph transpose.
            </p>
            <div className="mt-6 w-full max-w-md">
              <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <span>Total Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                <motion.div
                  className="h-full bg-linear-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 min-w-62.5 w-full md:w-72 flex flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                <Activity size={14} className="text-emerald-400" /> Status
              </p>
              <p className="mt-2 text-sm font-semibold text-white min-h-10">
                {statusMessage}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">
                  Phase
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-200">
                  {dfsPhase === "None" ? "-" : dfsPhase}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">
                  SCCs Found
                </p>
                <p className="mt-1 text-sm font-bold text-cyan-200">
                  {sccs.length}
                </p>
              </div>
            </div>

            {/* Stack Display */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">
                Stack (Top to Bottom)
              </p>
              <div className="flex flex-row-reverse justify-end gap-1 min-h-8 overflow-x-auto overflow-y-hidden pb-1 ll-scrollbar">
                <AnimatePresence mode="popLayout">
                  {stack.length === 0 && (
                    <span className="text-xs text-slate-500 italic">Empty</span>
                  )}
                  {stack.map((id, idx) => (
                    <motion.div
                      key={`stack-${id}-${idx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.5, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      className="w-8 h-8 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0"
                      title="Stack Top is rightmost"
                    >
                      {id}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[350px_1fr]">
        {/* Controls */}
        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur h-fit">
          <div className="mb-5 flex items-center gap-2">
            <Network size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Graph Controls
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Nodes</span> <span>{nodeCount}</span>
              </label>
              <input
                type="range"
                min="4"
                max="15"
                value={nodeCount}
                disabled={isRunning}
                onChange={(e) => {
                  setNodeCount(+e.target.value);
                  handleNewGraph(+e.target.value);
                }}
                className="w-full accent-emerald-400"
              />
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Speed</span> <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
                className="w-full accent-emerald-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white border border-white/10 hover:bg-white/10"
              >
                <RotateCcw size={16} /> Reset
              </motion.button>
              <motion.button
                onClick={() => handleNewGraph()}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-100 border border-emerald-400/20 hover:bg-emerald-500/20"
              >
                <Shuffle size={16} /> New Graph
              </motion.button>
            </div>

            <motion.button
              onClick={
                isRunning
                  ? isPaused
                    ? () => {
                        pauseSignal.current = false;
                        setIsPaused(false);
                        setRunStatus("Running");
                      }
                    : () => {
                        pauseSignal.current = true;
                        setIsPaused(true);
                        setRunStatus("Paused");
                      }
                  : runKosaraju
              }
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg transition-all ${isPaused ? "bg-amber-600" : isRunning ? "bg-amber-500 text-slate-900" : "bg-linear-to-r from-emerald-500 to-teal-500"}`}
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
              {isRunning ? (isPaused ? "Resume" : "Pause") : "Start Kosaraju's"}
            </motion.button>
            <HotkeysHint />

            {/* SCCs Result Display */}
            {sccs.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
                  SCCs Discovered
                </h3>
                <div className="space-y-2">
                  {sccs.map((scc, idx) => {
                    const colorClass = SCC_COLORS[idx % SCC_COLORS.length];
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={`res-scc-${idx}`}
                        className={`flex items-center gap-2 rounded-lg p-2 bg-slate-900/50 border-l-4 border-slate-700`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${colorClass.split(" ")[0]}`}
                        ></div>
                        <div className="flex flex-wrap gap-1">
                          {scc.map((nodeId) => (
                            <span
                              key={`scc-node-${nodeId}`}
                              className="bg-slate-800 border border-slate-700 text-white text-xs px-1.5 py-0.5 rounded"
                            >
                              {nodeId}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Visualization Area */}
        <section
          className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 shadow-2xl relative overflow-hidden min-h-125"
          ref={containerRef}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="absolute right-3 top-3 z-20 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Legend
            </p>
            <div className="space-y-1.5 text-[10px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-800 border border-slate-600" />
                <span>Unvisited Node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Processing (DFS)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                <span>Finished (DFS 1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span>SCC Discovered</span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {graph.isTransposed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-4 bottom-4 z-20 bg-teal-500/20 border border-teal-400/40 text-teal-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest pointer-events-none"
              >
                Graph Transposed
              </motion.div>
            )}
          </AnimatePresence>

          {/* SVG for Edges with Arrowheads */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#0891b2" />
              </marker>
              <marker
                id="arrowhead-traverse"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
              </marker>
              <marker
                id="arrowhead-transposed"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#0d9488" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              const u = graph.nodes.find((n) => n.id === edge.source);
              const v = graph.nodes.find((n) => n.id === edge.target);
              if (!u || !v) return null;

              const isTraversing = edge.status === "traversing";
              const isFaded = edge.status === "faded";

              return (
                <motion.line
                  key={edge.id}
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  className={`transition-all duration-500 ${getEdgeColor(edge.status, graph.isTransposed)}`}
                  markerEnd={
                    isFaded
                      ? ""
                      : isTraversing
                        ? "url(#arrowhead-traverse)"
                        : graph.isTransposed
                          ? "url(#arrowhead-transposed)"
                          : "url(#arrowhead)"
                  }
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {graph.nodes.map((node) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1, x: node.x - 24, y: node.y - 24 }} // centering 48px node
              className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 flex-col ${getNodeColor(node.status, node.sccIndex)}`}
            >
              <span className="text-white font-bold text-sm pointer-events-none select-none">
                {node.id}
              </span>
            </motion.div>
          ))}
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
            <Code2 size={20} className="text-emerald-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
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
