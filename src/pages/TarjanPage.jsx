import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Network
} from "lucide-react";
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

// Helper to generate a generic directed graph
function generateDirectedGraphWithSCCs(nodeCount, width, height) {
  const nodes = [];
  const edges = [];
  const padding = 40;

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i,
      x: Math.random() * (width - 2 * padding) + padding,
      y: Math.random() * (height - 2 * padding) + padding,
      status: "unvisited", 
      sccIndex: -1,
      disc: -1,
      low: -1
    });
  }

  const clustersCount = Math.max(1, Math.floor(nodeCount / 3));
  const nodesPerCluster = Math.floor(nodeCount / clustersCount);

  for (let c = 0; c < clustersCount; c++) {
    const startIdx = c * nodesPerCluster;
    const endIdx =
      c === clustersCount - 1 ? nodeCount : startIdx + nodesPerCluster;
    const clusterNodes = nodes.slice(startIdx, endIdx);

    if (clusterNodes.length >= 2) {
      for (let i = 0; i < clusterNodes.length; i++) {
        const u = clusterNodes[i].id;
        const v = clusterNodes[(i + 1) % clusterNodes.length].id;
        edges.push({
          source: u,
          target: v,
          id: `e-${u}-${v}`,
          status: "default",
        });
      }
      if (clusterNodes.length > 3) {
        const u = clusterNodes[Math.floor(Math.random() * clusterNodes.length)].id;
        const v = clusterNodes[Math.floor(Math.random() * clusterNodes.length)].id;
        if (u !== v && !edges.some((e) => e.source === u && e.target === v)) {
          edges.push({
            source: u,
            target: v,
            id: `e-${u}-${v}`,
            status: "default",
          });
        }
      }
    }
  }

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
      });
    }
  }

  return { nodes, edges };
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

export default function TarjanPage() {
  const navigate = useNavigate();
  useDocumentTitle("Tarjan's Algorithm");
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [nodeCount, setNodeCount] = useState(8);
  const [speed, setSpeed] = useState(300);
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Generate a graph to start.");

  const [stack, setStack] = useState([]);
  const [sccs, setSccs] = useState([]);
  const [visitedCount, setVisitedCount] = useState(0);

  const progress = useMemo(() => {
    if (runStatus === "Completed") return 100;
    if (graph.nodes.length === 0) return 0;
    return Math.min(100, Math.round((visitedCount / graph.nodes.length) * 100));
  }, [runStatus, visitedCount, graph.nodes.length]);

  const containerRef = useRef(null);
  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);

  useEffect(() => {
    handleNewGraph(nodeCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setVisitedCount(0);

    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setGraph(generateDirectedGraphWithSCCs(count, width || 600, height || 400));
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
      nodes: prev.nodes.map((n) => ({
        ...n,
        status: "unvisited",
        sccIndex: -1,
        disc: -1,
        low: -1
      })),
      edges: prev.edges.map((e) => ({
        ...e,
        status: "default",
      })),
    }));

    setStack([]);
    setSccs([]);
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

  const runTarjan = async () => {
    if (isRunning || graph.nodes.length === 0) return;

    setIsRunning(true);
    setRunStatus("Running");
    setElapsedSeconds(0);
    stopSignal.current = false;
    pauseSignal.current = false;

    setStack([]);
    setSccs([]);
    setVisitedCount(0);

    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({
        ...n,
        status: "unvisited",
        sccIndex: -1,
        disc: -1,
        low: -1
      })),
      edges: prev.edges.map((e) => ({
        ...e,
        status: "default"
      })),
    }));

    const updateNode = (id, updates) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
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

    let time = 0;
    let sccCountRef = 0;
    let tempVisitedCount = 0;
    const inStack = new Array(nodeCount).fill(false);
    const disc = new Array(nodeCount).fill(-1);
    const low = new Array(nodeCount).fill(-1);
    const st = [];
    
    let adj = Array.from({ length: nodeCount }, () => []);
    graph.edges.forEach((e) => {
      adj[e.source].push(e.target);
    });

    for (let i = 0; i < nodeCount; i++) {
        if (stopSignal.current) return;
        if (disc[i] === -1) {
            let res = await dfsTarjan(i, adj, disc, low, st, inStack);
            if (!res) return;
        }
    }

    if (!stopSignal.current) {
      setRunStatus("Completed");
      setStatusMessage(`Completed! Found ${sccCountRef} Strongly Connected Component(s).`);
    }
    setIsRunning(false);

    async function dfsTarjan(u, adj, disc, low, st, inStack) {
      if (stopSignal.current) return false;

      time++;
      disc[u] = low[u] = time;
      st.push(u);
      inStack[u] = true;
      setStack([...st]);

      tempVisitedCount++;
      setVisitedCount(tempVisitedCount);

      updateNode(u, { status: "processing", disc: disc[u], low: low[u] });
      setStatusMessage(`Processing Node ${u} (disc:${disc[u]} low:${low[u]})`);
      if (!(await waitWithControl(speed))) return false;

      for (let v of adj[u]) {
        if (stopSignal.current) return false;

        updateEdgeStatus(u, v, "traversing");
        if (!(await waitWithControl(speed / 1.5))) return false;

        if (disc[v] === -1) {
            let res = await dfsTarjan(v, adj, disc, low, st, inStack);
            if (!res) return false;
            
            low[u] = Math.min(low[u], low[v]);
            updateNode(u, { low: low[u] });
            setStatusMessage(`Backtracking to Node ${u}, updated low pointer to ${low[u]}`);
            if (!(await waitWithControl(speed))) return false;

        } else if (inStack[v]) {
            low[u] = Math.min(low[u], disc[v]);
            updateNode(u, { low: low[u] });
            setStatusMessage(`Node ${v} in stack (back-edge), Node ${u} low updated to ${low[u]}`);
            if (!(await waitWithControl(speed))) return false;
        }
        
        updateEdgeStatus(u, v, "default");
      }

      if (low[u] === disc[u]) {
        sccCountRef++;
        setStatusMessage(`Found SCC ${sccCountRef} rooted at Node ${u}`);
        if (!(await waitWithControl(speed))) return false;

        const currentSCC = [];
        let w;
        do {
            w = st.pop();
            inStack[w] = false;
            currentSCC.push(w);
            updateNode(w, { status: "scc", sccIndex: sccCountRef - 1 });
        } while (w !== u);
        
        setStack([...st]);
        setSccs(prev => [...prev, currentSCC]);
        if (!(await waitWithControl(speed))) return false;
      } else {
        updateNode(u, { status: "finished" });
      }

      return true;
    }
  };

  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    const isHotkey = e.code === "Space" || key === "r" || key === "n";
    if (!isHotkey) return;

    if (e.repeat) { e.preventDefault(); return; }

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
        runTarjan();
      }
      return;
    }
    if (key === "r") { e.preventDefault(); handleReset(); return; }
    if (key === "n") { e.preventDefault(); handleNewGraph(); }
  });

  const getNodeColor = (status, sccIndex) => {
    switch (status) {
      case "processing":
        return "bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110 z-20";
      case "finished":
        return "bg-slate-700 border-slate-500 opacity-80 z-10 scale-100";
      case "scc":
        return SCC_COLORS[sccIndex % SCC_COLORS.length] + " z-10 scale-105";
      default:
        return "bg-slate-800 border-slate-600 hover:border-emerald-400 z-10";
    }
  };

  const getEdgeColor = (status) => {
    switch (status) {
      case "traversing": return "stroke-amber-400 stroke-2 opacity-100";
      case "faded": return "stroke-slate-700 stroke-1 opacity-20";
      default: return "stroke-cyan-600/60 stroke-1 opacity-100";
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
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                Back to Algorithms
              </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                Graph
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                {runStatus}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {formatElapsed(elapsedSeconds)}
              </span>
              <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                Time: <span className="text-emerald-300 font-mono">O(V + E)</span>
              </span>
              <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                Space: <span className="text-emerald-300 font-mono">O(V)</span>
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Tarjan's Algorithm
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl">
              Finds Strongly Connected Components (SCCs) using a single DFS pass, low-link values, and a stack.
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

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 min-w-[250px] w-full md:w-72 flex flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                <Activity size={14} className="text-emerald-400" /> Status
              </p>
              <p className="mt-2 text-sm font-semibold text-white min-h-[40px]">
                {statusMessage}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">SCCs Found</p>
                <p className="mt-1 text-sm font-bold text-cyan-200">{sccs.length}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Stack (Top to Bottom)</p>
              <div className="flex flex-row-reverse justify-end gap-1 min-h-[32px] overflow-x-auto overflow-y-hidden pb-1 ll-scrollbar">
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
        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur h-fit">
          <div className="mb-5 flex items-center gap-2">
            <Network size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Graph Controls</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Nodes</span> <span>{nodeCount}</span>
              </label>
              <input
                type="range"
                min="4"
                max="20"
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
                min="50"
                max="1000"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
                className="w-full accent-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={isRunning ? (isPaused ? () => { pauseSignal.current = false; setIsPaused(false); setRunStatus("Running"); } : () => { pauseSignal.current = true; setIsPaused(true); setRunStatus("Paused"); }) : runTarjan}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
                  isRunning && !isPaused
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50"
                    : isRunning && isPaused
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50"
                      : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                }`}
              >
                {isRunning && !isPaused ? "Pause" : isRunning && isPaused ? "Resume" : "Start Algorithm"}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                Reset
              </button>
            </div>
            <button
                onClick={() => handleNewGraph(nodeCount)}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate New Graph
              </button>
          </div>
        </aside>

        <div className="min-h-[500px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur lg:min-h-[600px] relative">
          <div ref={containerRef} className="absolute inset-0 m-4">
            <svg className="h-full w-full" style={{ overflow: "visible" }}>
              <defs>
                <marker
                  id="arrowhead-default"
                  markerWidth="7"
                  markerHeight="7"
                  refX="30"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 7 3.5, 0 7" fill="#0891b2" className="opacity-80" />
                </marker>
                <marker
                  id="arrowhead-traversing"
                  markerWidth="7"
                  markerHeight="7"
                  refX="30"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 7 3.5, 0 7" fill="#fbbf24" />
                </marker>
              </defs>

              <AnimatePresence>
                {graph.edges.map((edge) => {
                  const src = graph.nodes.find((n) => n.id === edge.source);
                  const tgt = graph.nodes.find((n) => n.id === edge.target);
                  if (!src || !tgt) return null;

                  const dx = tgt.x - src.x;
                  const dy = tgt.y - src.y;
                  const length = Math.sqrt(dx * dx + dy * dy);

                  const padding = 25;
                  const targetPad = 25;
                  
                  const nx = dx / length;
                  const ny = dy / length;

                  const startX = src.x + nx * padding;
                  const startY = src.y + ny * padding;
                  const endX = tgt.x - nx * targetPad;
                  const endY = tgt.y - ny * targetPad;
                    
                  const curveOffset = 20;
                  const midX = (startX + endX) / 2 - ny * curveOffset;
                  const midY = (startY + endY) / 2 + nx * curveOffset;

                  return (
                    <motion.path
                      key={edge.id}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: 1,
                      }}
                      d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                      fill="none"
                      className={`transition-colors duration-300 ${getEdgeColor(edge.status)}`}
                      markerEnd={`url(#arrowhead-${edge.status === "traversing" ? "traversing" : "default"})`}
                    />
                  );
                })}
              </AnimatePresence>
            </svg>

            <AnimatePresence>
              {graph.nodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: node.x - 24,
                    y: node.y - 24,
                  }}
                  className={`absolute flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold text-white shadow-xl transition-all duration-300 ${getNodeColor(node.status, node.sccIndex)}`}
                >
                  {node.id}
                  {node.disc !== -1 && (
                     <div className="absolute -bottom-5 w-auto whitespace-nowrap bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono text-cyan-200">
                        d:{node.disc} l:{node.low}
                     </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
