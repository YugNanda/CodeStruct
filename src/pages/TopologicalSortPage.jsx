import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { topologicalSortCPP, topologicalSortJava, topologicalSortPython, topologicalSortJS } from '../algorithms/topologicalSort';
import { renderHighlightedCode } from '../utils/codeHighlight';
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
    Idle: 'border-white/15 bg-white/5 text-slate-200',
    Running: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
    Paused: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
    Completed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
};

// Helper to generate a random Directed Acyclic Graph (DAG)
function generateRandomDAG(nodeCount, width, height) {
    const nodes = [];
    const edges = [];
    const padding = 40;

    // 1. Generate Nodes 
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            id: i,
            x: Math.random() * (width - 2 * padding) + padding,
            y: Math.random() * (height - 2 * padding) + padding,
            status: 'default', // default, processing, completed
            inDegree: 0,
        });
    }

    for (let i = 0; i < nodeCount - 1; i++) {
        // Not necessarily connecting i to i+1, but just ensuring it's a valid DAG
        let u = i;
        let v = i + 1 + Math.floor(Math.random() * (nodeCount - 1 - i));
        edges.push({ source: u, target: v, id: `e-${u}-${v}`, status: 'default' });
    }

    // Add some random extra edges
    const extraEdges = Math.floor(nodeCount * 0.4);
    for (let i = 0; i < extraEdges; i++) {
        let u = Math.floor(Math.random() * nodeCount);
        let v = Math.floor(Math.random() * nodeCount);
        if (u > v) {
            // Swap to maintain DAG property
            let temp = u;
            u = v;
            v = temp;
        }
        if (u !== v && !edges.some(e => e.source === u && e.target === v)) {
            edges.push({ source: u, target: v, id: `e-${u}-${v}`, status: 'default' });
        }
    }

    // Compute initial in-degrees
    edges.forEach(e => {
        nodes[e.target].inDegree++;
    });

    return { nodes, edges };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatElapsed(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function TopologicalSortPage() {
    const navigate = useNavigate();
    useDocumentTitle('Topological Sort');
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [nodeCount, setNodeCount] = useState(7);
    const [speed, setSpeed] = useState(300);
    const [runStatus, setRunStatus] = useState("Idle");
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Generate a DAG to start.");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");
    const [copyState, setCopyState] = useState("idle");
    const [topoResult, setTopoResult] = useState([]);

    // Kahn's Algo UI Trackers
    const [queueIds, setQueueIds] = useState([]);
    const [inDegreesMap, setInDegreesMap] = useState({});

    const activeCode = selectedLanguage === "C++" ? topologicalSortCPP : (selectedLanguage === "Java" ? topologicalSortJava : (selectedLanguage === "Python" ? topologicalSortPython : topologicalSortJS));
    const progress = useMemo(() => {
        if (runStatus === "Completed") return 100;
        if (graph.nodes.length === 0) return 0;
        return Math.round((topoResult.length / graph.nodes.length) * 100);
    }, [runStatus, topoResult.length, graph.nodes.length]);

    const getFileExtension = (lang) => {
        switch (lang) {
            case "C++": return "cpp";
            case "Java": return "java";
            case "Python": return "py";
            case "JavaScript": return "js";
            default: return "txt";
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
        setStatusMessage("New DAG generated.");
        setElapsedSeconds(0);
        setTopoResult([]);
        setQueueIds([]);

        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            const newGraph = generateRandomDAG(count, width || 600, height || 400);
            setGraph(newGraph);

            let degMap = {};
            newGraph.nodes.forEach(n => degMap[n.id] = n.inDegree);
            setInDegreesMap(degMap);
        }
    };

    const handleReset = () => {
        stopSignal.current = true;
        pauseSignal.current = false;
        setIsRunning(false);
        setIsPaused(false);
        setRunStatus("Idle");
        setElapsedSeconds(0);

        // Recalculate original in-degrees
        let degMap = {};
        graph.nodes.forEach(n => degMap[n.id] = 0);
        graph.edges.forEach(e => degMap[e.target]++);

        setGraph(prev => ({
            nodes: prev.nodes.map(n => ({ ...n, status: 'default', inDegree: degMap[n.id] })),
            edges: prev.edges.map(e => ({ ...e, status: 'default' }))
        }));

        setInDegreesMap(degMap);
        setTopoResult([]);
        setQueueIds([]);
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
    }

    const runTopologicalSort = async () => {
        if (isRunning || graph.nodes.length === 0) return;

        setIsRunning(true);
        setRunStatus("Running");
        setElapsedSeconds(0);
        stopSignal.current = false;
        pauseSignal.current = false;

        setTopoResult([]);

        // Build Adj List and In-Degree Map
        const adj = Array.from({ length: nodeCount }, () => []);
        const inDeg = new Array(nodeCount).fill(0);

        graph.edges.forEach(e => {
            adj[e.source].push(e.target);
            inDeg[e.target]++;
        });

        // Update helpers
        const updateNodeStatus = (id, status) => {
            setGraph(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => n.id === id ? { ...n, status } : n)
            }));
        };
        const updateEdgeStatus = (source, target, status) => {
            setGraph(prev => ({
                ...prev,
                edges: prev.edges.map(e => (e.source === source && e.target === target) ? { ...e, status } : e)
            }));
        };
        const updateInDegDisplay = (id, val) => {
            setInDegreesMap(prev => ({ ...prev, [id]: val }));
        };

        const queue = [];
        for (let i = 0; i < nodeCount; i++) {
            if (inDeg[i] === 0) {
                queue.push(i);
            }
        }

        setQueueIds([...queue]);
        setStatusMessage(`Enqueued ${queue.length} node(s) with 0 in-degree.`);
        if (!(await waitWithControl(speed))) return;

        let resultLen = 0;

        while (queue.length > 0) {
            if (stopSignal.current) return;

            const u = queue.shift();
            setQueueIds([...queue]);

            updateNodeStatus(u, 'processing');
            setStatusMessage(`Processing Node ${u}`);
            if (!(await waitWithControl(speed))) return;

            // Add to topological order
            setTopoResult(prev => [...prev, u]);
            resultLen++;
            updateNodeStatus(u, 'completed');

            // Highlight outgoing edges and reduce in-degree
            for (let v of adj[u]) {
                if (stopSignal.current) return;

                updateEdgeStatus(u, v, 'traversing');
                setStatusMessage(`Traversing edge ${u} -> ${v}`);
                if (!(await waitWithControl(speed / 2))) return;

                inDeg[v]--;
                updateInDegDisplay(v, inDeg[v]);
                setStatusMessage(`Decreased in-degree of Node ${v} to ${inDeg[v]}`);
                updateEdgeStatus(u, v, 'faded'); // edge is "removed" visually

                if (inDeg[v] === 0) {
                    if (!(await waitWithControl(speed / 2))) return;
                    queue.push(v);
                    setQueueIds([...queue]);
                    setStatusMessage(`Node ${v} in-degree is 0. Added to queue.`);
                }
                if (!(await waitWithControl(speed / 2))) return;
            }
        }

        if (!stopSignal.current) {
            if (resultLen === nodeCount) {
                setRunStatus("Completed");
                setStatusMessage("Topological Sort Completed Successfully!");
            } else {
                setRunStatus("Completed"); // Technically failed due to cycle, but this shouldn't happen with our DAG builder
                setStatusMessage("Cycle detected! Topological sort not possible.");
            }
        }
        setIsRunning(false);
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(activeCode);
            setCopyState("copied");
            setTimeout(() => setCopyState("idle"), 1400);
        } catch { }
    };

    const handleDownloadCode = () => {
        const ext = getFileExtension(selectedLanguage);
        const filename = `topological_sort.${ext}`;
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
                runTopologicalSort();
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
    const getNodeColor = (status) => {
        switch (status) {
            case 'processing': return 'bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110 z-20';
            case 'completed': return 'bg-emerald-500 border-emerald-300 z-10 opacity-70';
            default: return 'bg-slate-800 border-slate-600 hover:border-cyan-400 z-10';
        }
    };

    const getEdgeColor = (status) => {
        switch (status) {
            case 'traversing': return 'stroke-amber-400 stroke-2 opacity-100';
            case 'faded': return 'stroke-slate-700 stroke-1 opacity-20';
            default: return 'stroke-cyan-600/60 stroke-1 opacity-100';
        }
    };

    return (
        <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.15),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7">
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
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">Graph</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>{runStatus}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">{formatElapsed(elapsedSeconds)}</span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">Time: <span className="text-emerald-300 font-mono">O(V + E)</span></span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">Space: <span className="text-emerald-300 font-mono">O(V)</span></span>
                        </div>
                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">Topological Sort</h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl">Linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u→v, vertex u comes before v.</p>
                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Traversal Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 min-w-[250px] w-full md:w-72 flex flex-col justify-between">
                        <div>
                            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300"><Activity size={14} className="text-emerald-400" /> Status</p>
                            <p className="mt-2 text-sm font-semibold text-white min-h-[40px]">{statusMessage}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400">Sorted</p>
                                <p className="mt-1 text-sm font-bold text-emerald-200">{topoResult.length}/{graph.nodes.length || 0}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400">Queue</p>
                                <p className="mt-1 text-sm font-bold text-cyan-200">{queueIds.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400">Delay</p>
                                <p className="mt-1 text-sm font-bold text-slate-100">{speed}ms</p>
                            </div>
                        </div>

                        {/* Queue Display */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Queue (In-Degree = 0)</p>
                            <div className="flex gap-2 min-h-[32px] overflow-x-auto overflow-y-hidden pb-1 ll-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {queueIds.length === 0 && <span className="text-xs text-slate-500 italic">Empty</span>}
                                    {queueIds.map((id) => (
                                        <motion.div
                                            key={id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.5, y: -10 }}
                                            className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-200"
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
                    <div className="mb-5 flex items-center gap-2"><Network size={18} className="text-emerald-400" /><h2 className="text-sm font-bold uppercase tracking-widest text-white">Graph Controls</h2></div>

                    <div className="space-y-4">
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase"><span>Nodes</span> <span>{nodeCount}</span></label>
                            <input type="range" min="4" max="12" value={nodeCount} disabled={isRunning} onChange={(e) => { setNodeCount(+e.target.value); handleNewGraph(+e.target.value); }} className="w-full accent-emerald-400" />
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase"><span>Speed</span> <span>{speed}ms</span></label>
                            <input type="range" min="100" max="1000" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full accent-emerald-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <motion.button onClick={handleReset} className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white border border-white/10 hover:bg-white/10"><RotateCcw size={16} /> Reset</motion.button>
                            <motion.button onClick={() => handleNewGraph()} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-100 border border-emerald-400/20 hover:bg-emerald-500/20"><Shuffle size={16} /> New DAG</motion.button>
                        </div>

                        <motion.button
                            onClick={isRunning ? (isPaused ? () => { pauseSignal.current = false; setIsPaused(false); setRunStatus("Running") } : () => { pauseSignal.current = true; setIsPaused(true); setRunStatus("Paused") }) : runTopologicalSort}
                            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg transition-all ${isPaused ? "bg-amber-600" : (isRunning ? "bg-amber-500 text-slate-900" : "bg-gradient-to-r from-emerald-500 to-teal-500")}`}
                        >
                            {isRunning ? (isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />) : <Play size={18} fill="currentColor" />}
                            {isRunning ? (isPaused ? "Resume" : "Pause") : "Start Topological Sort"}
                        </motion.button>
                        <HotkeysHint />

                        {/* Result Array Display */}
                        {topoResult.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Topological Order</h3>
                                <div className="flex flex-wrap gap-2 group">
                                    {topoResult.map((nodeId, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={`res-${idx}`}
                                            className="w-10 h-10 rounded bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-sm font-bold text-emerald-100"
                                        >
                                            {nodeId}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Visualization Area */}
                <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 shadow-2xl relative overflow-hidden min-h-[500px]" ref={containerRef}>
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                    <div className="absolute right-3 top-3 z-20 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Legend</p>
                        <div className="space-y-1.5 text-[10px] text-slate-300">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                                <span>Unvisited Node</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                <span>Processing Node</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <span>Sorted Node</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                <span>Ready in Queue</span>
                            </div>
                        </div>
                    </div>

                    {/* SVG for Edges with Arrowheads */}
                    <svg className="w-full h-full absolute inset-0 pointer-events-none">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#0891b2" />
                            </marker>
                            <marker id="arrowhead-traverse" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                            </marker>
                        </defs>
                        {graph.edges.map((edge) => {
                            const u = graph.nodes.find(n => n.id === edge.source);
                            const v = graph.nodes.find(n => n.id === edge.target);
                            if (!u || !v) return null;

                            const isTraversing = edge.status === 'traversing';
                            const isFaded = edge.status === 'faded';

                            return (
                                <motion.line
                                    key={edge.id}
                                    x1={u.x} y1={u.y} x2={v.x} y2={v.y}
                                    className={`transition-all duration-500 ${getEdgeColor(edge.status)}`}
                                    markerEnd={isFaded ? "" : (isTraversing ? "url(#arrowhead-traverse)" : "url(#arrowhead)")}
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
                            className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 flex-col ${getNodeColor(node.status)}`}
                        >
                            <span className="text-white font-bold text-sm pointer-events-none select-none">{node.id}</span>

                            {/* In-Degree Badge */}
                            <span className="absolute -top-3 -right-3 w-6 h-6 rounded bg-slate-800 border-2 border-slate-600 text-[10px] font-bold text-emerald-400 flex items-center justify-center pointer-events-none">
                                {inDegreesMap[node.id] !== undefined ? inDegreesMap[node.id] : node.inDegree}
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
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">{selectedLanguage} Source</span>
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}>
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
                            {copyState === "copied" ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />} {copyState === "copied" ? "Copied" : "Copy"}
                        </button>
                        <button
                            onClick={handleDownloadCode}
                            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                        >
                            <Download size={14} /> Download
                        </button>
                    </div>
                </div>
                <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed">
                    <pre>
                        <code>
                            {activeCode.split("\n").map((line, i) => (
                                <div key={i} className="flex hover:bg-white/5 px-2 rounded">
                                    <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-4 text-xs">{i + 1}</span>
                                    <span className="text-slate-300">{renderHighlightedCode(line)}</span>
                                </div>
                            ))}
                        </code>
                    </pre>
                </div>
            </section>
        </div>
    );
}
