import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { motion } from 'framer-motion';
import {
    Activity,
    CheckCheck,
    Clock3,
    Code2,
    Copy,
    Download,
    Pause,
    Play,
    RotateCcw,
    Shuffle,
    Network,
    ArrowLeft,
    Binary,
    Target,
    Layers,
} from 'lucide-react';
import { bfsCPP, bfsJava, bfsPython, bfsJS } from '../algorithms/bfs';
import { renderHighlightedCode } from '../utils/codeHighlight';
import HotkeysHint from "../components/HotkeysHint";

const runStatusStyleMap = {
    Idle: 'border-white/15 bg-white/5 text-slate-200',
    Running: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
    Paused: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
    Completed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
};

// Helper to generate a random graph (connected)
function generateRandomGraph(nodeCount, width, height) {
    const nodes = [];
    const edges = [];
    const padding = 40;

    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            id: i,
            value: Math.floor(Math.random() * 99) + 1,
            x: Math.random() * (width - 2 * padding) + padding,
            y: Math.random() * (height - 2 * padding) + padding,
            status: 'default',
        });
    }

    const connected = new Set([0]);
    const uncommitted = new Set();
    for (let i = 1; i < nodeCount; i++) uncommitted.add(i);

    while (uncommitted.size > 0) {
        const u = Array.from(connected)[Math.floor(Math.random() * connected.size)];
        const v = Array.from(uncommitted)[Math.floor(Math.random() * uncommitted.size)];
        edges.push({ source: u, target: v, id: `e-${u}-${v}`, status: 'default' });
        uncommitted.delete(v);
        connected.add(v);
    }

    const extraEdges = Math.floor(nodeCount * 0.5);
    for (let i = 0; i < extraEdges; i++) {
        const u = Math.floor(Math.random() * nodeCount);
        const v = Math.floor(Math.random() * nodeCount);
        if (u !== v && !edges.some(e => (e.source === u && e.target === v) || (e.source === v && e.target === u))) {
            edges.push({ source: u, target: v, id: `e-${u}-${v}`, status: 'default' });
        }
    }

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

function getFileExtension(language) {
    switch (language) {
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
}


export default function BFSVisualizerPage() {
    const navigate = useNavigate();
    useDocumentTitle('Breadth First Search');
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [nodeCount, setNodeCount] = useState(8);
    const [startNodeId, setStartNodeId] = useState(0);
    const [speed, setSpeed] = useState(250);
    const [runStatus, setRunStatus] = useState("Idle");
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Generate a graph to start.");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");
    const [copyState, setCopyState] = useState("idle");
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [traversalOrder, setTraversalOrder] = useState([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [queueContents, setQueueContents] = useState([]);

    const activeCode = selectedLanguage === "C++" ? bfsCPP : (selectedLanguage === "Java" ? bfsJava : (selectedLanguage === "Python" ? bfsPython : bfsJS));

    const containerRef = useRef(null);
    const stopSignal = useRef(false);
    const pauseSignal = useRef(false);
    const isRunningRef = useRef(false);
    const isPausedRef = useRef(false);
    const runBFSRef = useRef(null);
    const resetRef = useRef(null);
    const newGraphRef = useRef(null);

    const visitedCount = useMemo(
        () => graph.nodes.filter((n) => n.status === "visited").length,
        [graph.nodes],
    );
    const traversedEdgesCount = useMemo(
        () => graph.edges.filter((e) => e.status === "traversed").length,
        [graph.edges],
    );
    const progress = useMemo(
        () => runStatus === "Completed"
            ? 100
            : graph.nodes.length === 0
                ? 0
                : Math.round((visitedCount / graph.nodes.length) * 100),
        [runStatus, graph.nodes.length, visitedCount],
    );

    useEffect(() => {
        handleNewGraph(nodeCount);
    }, []);

    useEffect(() => {
        if (!isRunning || isPaused) return undefined;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isRunning, isPaused]);

    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const resetRuntimeState = () => {
        setCurrentNodeId(null);
        setTraversalOrder([]);
        setElapsedSeconds(0);
        setCurrentLevel(0);
        setQueueContents([]);
    };

    const handleNewGraph = (count = nodeCount) => {
        stopSignal.current = true;
        pauseSignal.current = false;
        setIsRunning(false);
        setIsPaused(false);
        isRunningRef.current = false;
        isPausedRef.current = false;
        setRunStatus("Idle");
        setStatusMessage("New graph generated.");
        resetRuntimeState();
        setStartNodeId((prev) => Math.min(prev, Math.max(0, count - 1)));

        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            const newGraph = generateRandomGraph(count, width || 600, height || 400);
            setGraph(newGraph);
        } else {
            const newGraph = generateRandomGraph(count, 800, 450);
            setGraph(newGraph);
        }
    };

    const handleReset = () => {
        stopSignal.current = true;
        pauseSignal.current = false;
        setIsRunning(false);
        setIsPaused(false);
        isRunningRef.current = false;
        isPausedRef.current = false;
        setRunStatus("Idle");
        resetRuntimeState();
        setGraph(prev => ({
            nodes: prev.nodes.map(n => ({ ...n, status: 'default' })),
            edges: prev.edges.map(e => ({ ...e, status: 'default' }))
        }));
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

    const runBFS = async () => {
        if (isRunning || graph.nodes.length === 0) return;

        setIsRunning(true);
        setRunStatus("Running");
        setElapsedSeconds(0);
        setCurrentNodeId(null);
        setTraversalOrder([]);
        setCurrentLevel(0);
        setQueueContents([]);
        isRunningRef.current = true;
        isPausedRef.current = false;
        setStatusMessage(`Starting BFS from Node ${startNodeId}.`);
        stopSignal.current = false;
        pauseSignal.current = false;
        setGraph(prev => ({
            nodes: prev.nodes.map(n => ({ ...n, status: 'default' })),
            edges: prev.edges.map(e => ({ ...e, status: 'default' }))
        }));

        // Build Adj List
        const adj = Array.from({ length: graph.nodes.length }, () => []);
        graph.edges.forEach(e => {
            adj[e.source].push({ target: e.target, id: e.id });
            adj[e.target].push({ target: e.source, id: e.id });
        });

        const visited = new Array(graph.nodes.length).fill(false);

        const updateNode = (id, status) => {
            setGraph(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => n.id === id ? { ...n, status } : n)
            }));
        };
        const updateEdge = (id, status) => {
            setGraph(prev => ({
                ...prev,
                edges: prev.edges.map(e => e.id === id ? { ...e, status } : e)
            }));
        };

        // BFS using queue with level tracking
        const queue = [{ node: startNodeId, level: 0 }];
        visited[startNodeId] = true;
        setQueueContents([startNodeId]);

        updateNode(startNodeId, 'queued');
        setStatusMessage(`Enqueued start Node ${startNodeId}.`);
        if (!(await waitWithControl(speed / 2))) { setIsRunning(false); isRunningRef.current = false; return; }

        while (queue.length > 0) {
            if (stopSignal.current) break;

            const { node: curr, level } = queue.shift();
            setCurrentLevel(level);
            setCurrentNodeId(curr);
            setQueueContents(queue.map(q => q.node));

            // Highlight as processing
            updateNode(curr, 'processing');
            setStatusMessage(`Visiting Node ${curr} (Level ${level})`);
            if (!(await waitWithControl(speed))) break;

            // Mark visited
            updateNode(curr, 'visited');
            setTraversalOrder(prev => [...prev, curr]);

            // Explore neighbors
            const neighbors = adj[curr];
            for (const edge of neighbors) {
                if (stopSignal.current) break;

                if (!visited[edge.target]) {
                    visited[edge.target] = true;

                    // Highlight edge
                    updateEdge(edge.id, 'traversed');
                    setStatusMessage(`Traversing edge ${curr} → ${edge.target}`);
                    if (!(await waitWithControl(speed / 2))) break;

                    // Enqueue neighbor
                    queue.push({ node: edge.target, level: level + 1 });
                    setQueueContents(queue.map(q => q.node));
                    updateNode(edge.target, 'queued');
                    setStatusMessage(`Enqueued Node ${edge.target}`);
                    if (!(await waitWithControl(speed / 3))) break;
                }
            }
        }

        setCurrentNodeId(null);
        setQueueContents([]);

        if (!stopSignal.current) {
            setRunStatus("Completed");
            setStatusMessage("BFS Traversal Completed.");
        }
        setIsRunning(false);
        isRunningRef.current = false;
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
        const filename = `breadth_first_search.${ext}`;
        const blob = new Blob([activeCode || ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Node Colors — blue/cyan theme for BFS
    const getNodeColor = (status, nodeId) => {
        switch (status) {
            case 'processing': return 'bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110';
            case 'queued': return 'bg-blue-600 border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]';
            case 'visited': return 'bg-emerald-500 border-emerald-300';
            default:
                if (nodeId === startNodeId) {
                    return 'bg-sky-700 border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.45)]';
                }
                return 'bg-slate-800 border-slate-600 hover:border-cyan-400';
        }
    };

    const getEdgeColor = (status) => {
        switch (status) {
            case 'traversed': return 'stroke-emerald-400 stroke-2';
            default: return 'stroke-slate-700 stroke-1';
        }
    };

    useEffect(() => {
        runBFSRef.current = runBFS;
        resetRef.current = handleReset;
        newGraphRef.current = handleNewGraph;
    }, [runBFS, handleReset, handleNewGraph]);

    useEffect(() => {
        const shouldSkipHotkeys = (target) => {
            if (!target) return false;
            if (target.isContentEditable) return true;
            const tag = target.tagName?.toLowerCase();
            if (tag === "textarea" || tag === "select") return true;
            if (tag !== "input") return false;
            const type = (target.type || "").toLowerCase();
            return type !== "range";
        };

        const handleHotkeys = (e) => {
            if (shouldSkipHotkeys(e.target)) return;
            const key = e.key?.toLowerCase();
            const isHotkey = e.code === "Space" || key === "r" || key === "n";
            if (!isHotkey) return;

            if (e.repeat) {
                e.preventDefault();
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                if (isRunningRef.current) {
                    const nextPaused = !isPausedRef.current;
                    pauseSignal.current = nextPaused;
                    isPausedRef.current = nextPaused;
                    setIsPaused(nextPaused);
                    setRunStatus(nextPaused ? "Paused" : "Running");
                } else {
                    runBFSRef.current?.();
                }
                return;
            }

            if (key === "r") {
                e.preventDefault();
                resetRef.current?.();
                return;
            }

            if (key === "n") {
                e.preventDefault();
                newGraphRef.current?.();
            }
        };

        window.addEventListener("keydown", handleHotkeys);
        return () => window.removeEventListener("keydown", handleHotkeys);
    }, []);


    return (
        <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(6,182,212,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
                            <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200">Graph</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>{runStatus}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">{formatElapsed(elapsedSeconds)}</span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">Time: <span className="text-blue-300 font-mono">O(V + E)</span></span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">Space: <span className="text-blue-300 font-mono">O(V)</span></span>
                        </div>
                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">Breadth First Search</h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl">Traverse graphs level by level, visiting all neighbors at the current depth before moving deeper.</p>

                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                                <span>Traversal Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                />
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Nodes</p>
                                <p className="mt-1 text-sm font-semibold text-white">{graph.nodes.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Visited</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">{visitedCount}/{graph.nodes.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Traversed Edges</p>
                                <p className="mt-1 text-sm font-semibold text-blue-200">{traversedEdgesCount}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Current Level</p>
                                <p className="mt-1 text-sm font-semibold text-cyan-200">{currentLevel}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 min-w-[200px] w-full md:w-80">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300"><Activity size={14} className="text-blue-300" /> Live Diagnostics</p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-white/5 p-3">
                                <p className="text-[11px] text-slate-400">Current Action</p>
                                <p className="text-sm font-semibold text-white min-h-[40px]">{statusMessage}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Current Node</p>
                                    <p className="text-lg font-bold text-amber-200">{currentNodeId ?? "-"}</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Delay</p>
                                    <p className="text-lg font-bold text-blue-100 inline-flex items-center gap-1"><Clock3 size={14} />{speed}ms</p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3">
                                <p className="text-[11px] text-slate-400 mb-2 inline-flex items-center gap-1"><Layers size={12} /> Queue Contents</p>
                                <div className="ll-scrollbar flex min-h-[34px] gap-2 overflow-x-auto overflow-y-hidden pb-1">
                                    {queueContents.length === 0 && (
                                        <span className="text-xs italic text-slate-500">Queue is empty</span>
                                    )}
                                    {queueContents.map((id, idx) => (
                                        <span
                                            key={`q-${id}-${idx}`}
                                            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 px-2 text-xs font-bold text-blue-100"
                                        >
                                            {id}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3">
                                <p className="text-[11px] text-slate-400 mb-2">Traversal Order</p>
                                <div className="ll-scrollbar flex min-h-[34px] gap-2 overflow-x-auto overflow-y-hidden pb-1">
                                    {traversalOrder.length === 0 && (
                                        <span className="text-xs italic text-slate-500">No nodes visited yet</span>
                                    )}
                                    {traversalOrder.map((id, idx) => (
                                        <span
                                            key={`${id}-${idx}`}
                                            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 text-xs font-bold text-cyan-100"
                                        >
                                            {id}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[350px_1fr]">
                {/* Controls */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur h-fit">
                    <div className="mb-5 flex items-center gap-2"><Network size={18} className="text-blue-300" /><h2 className="text-sm font-bold uppercase tracking-widest text-white">Graph Controls</h2></div>

                    <div className="space-y-4">
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase"><span>Nodes</span> <span>{nodeCount}</span></label>
                            <input type="range" min="4" max="15" value={nodeCount} disabled={isRunning} onChange={(e) => { setNodeCount(+e.target.value); handleNewGraph(+e.target.value); }} className="w-full accent-blue-400" />
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase"><span className="inline-flex items-center gap-1"><Target size={13} />Start</span> <span>{startNodeId}</span></label>
                            <input
                                type="range"
                                min="0"
                                max={Math.max(0, graph.nodes.length - 1)}
                                value={Math.min(startNodeId, Math.max(0, graph.nodes.length - 1))}
                                disabled={isRunning || graph.nodes.length === 0}
                                onChange={(e) => setStartNodeId(Number(e.target.value))}
                                className="w-full accent-sky-400"
                            />
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase"><span>Speed</span> <span>{speed}ms</span></label>
                            <input type="range" min="50" max="800" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full accent-blue-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <motion.button onClick={handleReset} className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white border border-white/10 hover:bg-white/10"><RotateCcw size={16} /> Reset</motion.button>
                            <motion.button onClick={() => handleNewGraph()} className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-2.5 text-sm font-bold text-blue-100 border border-blue-400/20 hover:bg-blue-500/20"><Shuffle size={16} /> Re-Gen</motion.button>
                        </div>

                        <motion.button
                            onClick={isRunning ? (isPaused ? () => { pauseSignal.current = false; setIsPaused(false); setRunStatus("Running") } : () => { pauseSignal.current = true; setIsPaused(true); setRunStatus("Paused") }) : runBFS}
                            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg transition-all ${isPaused ? "bg-emerald-600" : (isRunning ? "bg-amber-500 text-slate-900" : "bg-gradient-to-r from-blue-600 to-cyan-500")}`}
                        >
                            {isRunning ? (isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />) : <Play size={18} fill="currentColor" />}
                            {isRunning ? (isPaused ? "Resume" : "Pause") : "Start BFS"}
                        </motion.button>
                        <HotkeysHint />
                    </div>
                </aside>

                {/* Visualization Area */}
                <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 shadow-2xl relative overflow-hidden min-h-[500px]" ref={containerRef}>
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                    <div className="absolute left-4 top-4 z-20 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                        Start Node: {startNodeId}
                    </div>

                    <svg className="w-full h-full absolute inset-0 pointer-events-none">
                        {graph.edges.map((edge) => {
                            const u = graph.nodes.find(n => n.id === edge.source);
                            const v = graph.nodes.find(n => n.id === edge.target);
                            if (!u || !v) return null;
                            return (
                                <motion.line
                                    key={edge.id}
                                    x1={u.x} y1={u.y} x2={v.x} y2={v.y}
                                    className={`transition-all duration-500 ${getEdgeColor(edge.status)}`}
                                    strokeWidth="2"
                                />
                            );
                        })}
                    </svg>

                    {graph.nodes.map((node) => (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, x: node.x - 24, y: node.y - 24 }}
                            className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 ${getNodeColor(node.status, node.id)}`}
                        >
                            <span className="text-white font-bold text-sm pointer-events-none select-none">{node.id}</span>
                        </motion.div>
                    ))}

                    <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 inline-flex items-center gap-1"><Binary size={12} /> Legend</p>
                        <div className="space-y-1.5 text-[10px]">
                            <div className="flex items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Start Node</div>
                            <div className="flex items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> In Queue</div>
                            <div className="flex items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Processing Node</div>
                            <div className="flex items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Visited Node</div>
                            <div className="flex items-center gap-2 text-slate-300"><span className="h-0.5 w-5 rounded bg-emerald-400" /> Traversed Edge</div>
                        </div>
                    </div>
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
                        <Code2 size={20} className="text-blue-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">{selectedLanguage} Source</span>
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopyCode} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10">
                            {copyState === "copied" ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />} {copyState === "copied" ? "Copied" : "Copy"}
                        </button>
                        <button
                            onClick={handleDownloadCode}
                            className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-100 hover:bg-blue-500/20 transition-colors border border-blue-400/20"
                        >
                            <Download size={14} /> Download
                        </button>
                    </div>
                </div>
                <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed">
                    <pre>
                        <code>
                            {(activeCode || "").split("\n").map((line, i) => (
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
