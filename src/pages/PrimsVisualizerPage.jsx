import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Target,
    Waypoints,
    Network,
    Zap,
    Keyboard,
    Binary
} from 'lucide-react';

// Import the logic and code snippets from your prims.js
import { prims, primsCPP, primsJava, primsPython, primsJS } from '../algorithms/prims';
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const NODE_RADIUS = 22;

const runStatusStyleMap = {
    Idle: 'border-white/15 bg-white/5 text-slate-200',
    Running: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
    Paused: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
    Completed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
};

// --- CODE HIGHLIGHTER UTIL (from DijkstraPage) ---
const CODE_KEYWORDS = new Set(["break", "case", "class", "const", "continue", "default", "do", "else", "enum", "for", "if", "new", "return", "struct", "switch", "template", "this", "throw", "typedef", "using", "virtual", "while", "public", "static", "package", "import", "def", "print", "in", "function", "let", "var"]);
const CODE_TYPES = new Set(["bool", "char", "double", "float", "int", "long", "short", "void", "string", "vector", "std", "Scanner", "System", "String", "out", "println", "List", "PriorityQueue", "Set", "Array", "Infinity"]);
const TOKEN_REGEX = /\/\*[\s\S]*?\*\/|\/\/.*|"(?:\\.|[^"\\])*"|^\s*#.*$|\b\d+\b|\b[a-zA-Z_]\w*\b/gm;

function renderHighlightedCode(code) {
    const nodes = []; let lastIndex = 0; const safeCode = code || "";
    for (const match of safeCode.matchAll(TOKEN_REGEX)) {
        const token = match[0]; const start = match.index;
        if (start > lastIndex) nodes.push(safeCode.slice(lastIndex, start));
        let cls = "text-slate-100";
        if (token.startsWith("//") || token.startsWith("/*")) cls = "text-emerald-400/80 italic";
        else if (token.startsWith('"')) cls = "text-amber-300";
        else if (CODE_TYPES.has(token)) cls = "text-cyan-300 font-bold";
        else if (CODE_KEYWORDS.has(token)) cls = "text-sky-300 font-bold";
        nodes.push(<span key={start} className={cls}>{token}</span>);
        lastIndex = start + token.length;
    }
    if (lastIndex < safeCode.length) nodes.push(safeCode.slice(lastIndex));
    return nodes;
}

// --- GRAPH GENERATOR ---
const generateWeightedGraph = (nodeCount = 8) => {
    const nodes = [];
    const edges = [];
    const minDistance = 110;

    for (let i = 0; i < nodeCount; i++) {
        let x, y, tooClose;
        let attempts = 0;
        do {
            x = Math.floor(Math.random() * (CANVAS_WIDTH - 150)) + 75;
            y = Math.floor(Math.random() * (CANVAS_HEIGHT - 120)) + 60;
            tooClose = nodes.some(n => Math.hypot(n.x - x, n.y - y) < minDistance);
            attempts++;
        } while (tooClose && attempts < 100);

        nodes.push({ id: i, x, y, label: String.fromCharCode(65 + i), status: 'default' });
    }

    // Connectivity logic: Build a spanning skeleton first
    for (let i = 1; i < nodeCount; i++) {
        const target = Math.floor(Math.random() * i);
        edges.push({
            source: target,
            target: i,
            id: `e-${target}-${i}`,
            weight: Math.floor(Math.random() * 20) + 1,
            status: 'default'
        });
    }

    // Extra density
    for (let i = 0; i < nodeCount; i++) {
        if (Math.random() > 0.65) {
            const target = Math.floor(Math.random() * nodeCount);
            if (target !== i && !edges.some(e => (e.source === i && e.target === target) || (e.source === target && e.target === i))) {
                edges.push({
                    source: i,
                    target: target,
                    id: `e-${i}-${target}`,
                    weight: Math.floor(Math.random() * 20) + 1,
                    status: 'default'
                });
            }
        }
    }
    return { nodes, edges };
};

function formatElapsed(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function PrimsVisualizerPage() {
    const [graph, setGraph] = useState(() => generateWeightedGraph(8));
    const [startNodeId, setStartNodeId] = useState(0);
    const [speed, setSpeed] = useState(600);
    const [runStatus, setRunStatus] = useState('Idle');
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Select a root node and launch the visualizer.");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");
    const [copyState, setCopyState] = useState('idle');
    const [processingNode, setProcessingNode] = useState(null);

    const stopSignal = useRef(false);
    const pauseSignal = useRef(false);

    const activeCode = useMemo(() => {
        const map = { "C++": primsCPP, "Java": primsJava, "Python": primsPython, "JavaScript": primsJS };
        return map[selectedLanguage];
    }, [selectedLanguage]);

    const progress = useMemo(() => {
        const visited = graph.nodes.filter(n => n.status === 'visited').length;
        return Math.min(Math.round((visited / graph.nodes.length) * 100), 100);
    }, [graph.nodes]);

    useEffect(() => { pauseSignal.current = isPaused; }, [isPaused]);

    useEffect(() => {
        if (runStatus !== "Running" || isPaused) return undefined;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [runStatus, isPaused]);

    const handleReset = () => {
        stopSignal.current = true;
        setRunStatus('Idle');
        setIsPaused(false);
        setElapsedSeconds(0);
        setProcessingNode(null);
        setStatusMessage("Graph reset.");
        setGraph(prev => ({
            nodes: prev.nodes.map(n => ({ ...n, status: 'default' })),
            edges: prev.edges.map(e => ({ ...e, status: 'default' }))
        }));
    };

    const handleGenerateNewGraph = () => {
        stopSignal.current = true;
        const count = Math.floor(Math.random() * 3) + 7; // 7-9 nodes
        setGraph(generateWeightedGraph(count));
        setRunStatus('Idle');
        setIsPaused(false);
        setElapsedSeconds(0);
        setProcessingNode(null);
        setStartNodeId(0);
        setStatusMessage("New graph generated.");
    };

    const runAlgorithm = async () => {
        handleReset();
        await new Promise(r => setTimeout(r, 100));
        
        stopSignal.current = false;
        setRunStatus('Running');
        setElapsedSeconds(0);

        const wrapperSetGraph = (data) => {
            const proc = data.nodes.find(n => n.status === 'processing');
            setProcessingNode(proc ? proc.id : null);
            setGraph(data);
        };

        // Note: Modified slightly to pass startNodeId if your prims logic supports it
        const success = await prims(
            [...graph.nodes], 
            [...graph.edges], 
            wrapperSetGraph, 
            speed, 
            stopSignal, 
            pauseSignal, 
            setStatusMessage
        );

        if (success && !stopSignal.current) {
            setRunStatus('Completed');
            setProcessingNode(null);
        }
    };

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(activeCode);
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 1500);
    };

    const handleDownloadCode = () => {
        const blob = new Blob([activeCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prims.${selectedLanguage.toLowerCase() === 'javascript' ? 'js' : selectedLanguage.toLowerCase()}`;
        a.click();
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
                runAlgorithm();
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
            if (runStatus !== "Running") handleGenerateNewGraph();
        }
    });

    return (
        <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            {/* Ambient Background */}
            <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.12),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

            {/* Header / Info Section */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7 mb-6"
            >
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                                Minimum Spanning Tree
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                {formatElapsed(elapsedSeconds)}
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Time: <span className="text-emerald-300 font-mono">O(E log V)</span>
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Space: <span className="text-emerald-300 font-mono">O(V)</span>
                            </span>
                        </div>
                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">Prim's Algorithm</h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base leading-relaxed">
                            A greedy algorithm that finds a minimum spanning tree for a weighted undirected graph. 
                            It operates by building this tree one vertex at a time from an arbitrary starting point.
                        </p>

                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>MST Completion</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Panel */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 shadow-inner">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-emerald-400" /> Current Step Logic
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Status Message</p>
                                <p className="text-sm font-medium text-white italic">
                                    "{statusMessage}"
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                    <p className="text-[11px] text-slate-400 font-bold uppercase">Visiting</p>
                                    <p className="text-lg font-bold text-emerald-400">
                                        {processingNode !== null ? graph.nodes[processingNode]?.label : '---'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                    <p className="text-[11px] text-slate-400 font-bold uppercase">Complexity</p>
                                    <p className="text-lg font-bold text-cyan-200">O(E log V)</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                    <p className="text-[11px] text-slate-400 font-bold uppercase">Visited</p>
                                    <p className="text-lg font-bold text-emerald-200">
                                        {graph.nodes.filter((n) => n.status === "visited").length}/{graph.nodes.length}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                    <p className="text-[11px] text-slate-400 font-bold uppercase">Delay</p>
                                    <p className="text-lg font-bold text-cyan-100">{speed}ms</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
                {/* Control Sidebar */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-6 backdrop-blur">
                    <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                        <Waypoints size={18} className="text-emerald-400" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Visualizer Setup</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                                <span><Target size={13} className="mr-1 inline text-emerald-400" /> Root Node</span>
                                <span className="text-emerald-400 text-sm">{graph.nodes[startNodeId]?.label}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max={graph.nodes.length - 1}
                                value={startNodeId}
                                disabled={runStatus !== 'Idle'}
                                onChange={(e) => setStartNodeId(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-30"
                            />
                        </div>

                        <div>
                            <label className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                                <span><Clock3 size={13} className="mr-1 inline text-cyan-400" /> Step Delay</span>
                                <span className="text-cyan-400 text-sm">{speed}ms</span>
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="1500"
                                step="100"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                style={{ direction: 'rtl' }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                            >
                                <RotateCcw size={16} /> Reset
                            </button>
                            <button
                                onClick={handleGenerateNewGraph}
                                disabled={runStatus === 'Running'}
                                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-500/20 transition-all disabled:opacity-40 active:scale-95"
                            >
                                <Shuffle size={16} /> New Graph
                            </button>
                        </div>

                        {runStatus === 'Idle' || runStatus === 'Completed' ? (
                            <button
                                onClick={runAlgorithm}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 font-bold text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
                            >
                                <Play size={18} fill="currentColor" /> {runStatus === 'Completed' ? 'Run Again' : 'Start Simulation'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-all active:scale-[0.98] ${isPaused ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-amber-500 text-slate-900 shadow-amber-900/40'}`}
                            >
                                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                                {isPaused ? 'Resume' : 'Pause Execution'}
                            </button>
                        )}

                        <HotkeysHint className="mt-1" />
                        
                        <div className="mt-4 rounded-xl bg-slate-900/50 p-4 border border-white/5">
                           <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 mb-2">
                               <Keyboard size={12} /> Algo Tip
                           </p>
                           <p className="text-[11px] text-slate-400 leading-relaxed italic">
                               Prim's is "vertex-centric". It grows the MST from a single node. Use it when your graph is dense (many edges).
                           </p>
                        </div>
                    </div>
                </aside>

                {/* Main Visualizer Canvas */}
                <main className="relative rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950/40 border border-slate-700/30">
                        <svg 
                            width="100%" 
                            height={CANVAS_HEIGHT} 
                            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} 
                            className="w-full h-full"
                        >
                            <defs>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Edge Layer */}
                            {graph.edges.map((edge) => {
                                const source = graph.nodes[edge.source];
                                const target = graph.nodes[edge.target];
                                
                                let strokeColor = '#334155'; // default
                                let strokeWidth = 2;
                                let opacity = 0.3;

                                if (edge.status === 'traversed') {
                                    strokeColor = '#10b981'; // emerald
                                    strokeWidth = 5;
                                    opacity = 1;
                                } else if (edge.status === 'comparing') {
                                    strokeColor = '#f59e0b'; // amber
                                    strokeWidth = 3;
                                    opacity = 0.8;
                                }

                                return (
                                    <g key={edge.id}>
                                        <line
                                            x1={source.x} y1={source.y}
                                            x2={target.x} y2={target.y}
                                            stroke={strokeColor}
                                            strokeWidth={strokeWidth}
                                            strokeOpacity={opacity}
                                            strokeLinecap="round"
                                            className="transition-all duration-500"
                                            filter={edge.status === 'traversed' ? 'url(#glow)' : ''}
                                        />
                                        {/* Weight Labels */}
                                        <g transform={`translate(${(source.x + target.x) / 2}, ${(source.y + target.y) / 2})`}>
                                            <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                            <text dy="0.35em" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
                                                {edge.weight}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}

                            {/* Node Layer */}
                            {graph.nodes.map((node) => {
                                const isStart = node.id === startNodeId;
                                const isProcessing = node.status === 'processing';
                                const isVisited = node.status === 'visited';

                                let fill = '#1e293b'; 
                                let stroke = '#475569'; 

                                if (isProcessing) { fill = '#f59e0b'; stroke = '#fef08a'; }
                                else if (isVisited) { fill = '#059669'; stroke = '#10b981'; }
                                else if (isStart) { fill = '#0369a1'; stroke = '#0ea5e9'; }

                                return (
                                    <g key={node.id} className="cursor-default select-none">
                                        <motion.circle
                                            initial={false}
                                            animate={{ 
                                                r: isProcessing ? 25 : NODE_RADIUS,
                                                fill: fill,
                                                stroke: stroke,
                                                strokeWidth: (isProcessing || isStart) ? 4 : 2
                                            }}
                                            cx={node.x} cy={node.y}
                                            className="drop-shadow-lg"
                                        />
                                        <text
                                            x={node.x} y={node.y}
                                            dy="0.35em"
                                            textAnchor="middle"
                                            className={`text-xs font-black transition-colors duration-300 ${(isProcessing || isVisited || isStart) ? 'fill-white' : 'fill-slate-400'}`}
                                        >
                                            {node.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Visual Legend */}
                        <div className="absolute bottom-6 right-6 flex flex-col gap-2 rounded-xl bg-slate-900/60 p-3 backdrop-blur-md border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">In MST</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Examining</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-sky-600 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Start Node</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Implementation Code Section */}
            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl">
                <div className="flex flex-wrap items-center justify-between border-b border-white/5 bg-slate-900/50 px-6 py-4 gap-4">
                    <div className="flex items-center gap-3">
                        <Code2 size={20} className="text-emerald-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                            Source Code
                        </span>
                        <div className="ml-4 flex rounded-lg bg-white/5 p-1 border border-white/10 overflow-hidden">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCopyCode} className="group flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10">
                            {copyState === "copied" ? (
                                <CheckCheck size={14} className="text-emerald-400" />
                            ) : (
                                <Copy size={14} className="group-hover:text-emerald-400" />
                            )}
                            {copyState === "copied" ? "Copied" : "Copy"}
                        </button>
                        <button onClick={handleDownloadCode} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10">
                            <Download size={14} /> Download
                        </button>
                    </div>
                </div>
                
                <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-mono text-sm leading-relaxed">
                    <pre>
                        <code>
                            {(activeCode || "").split("\n").map((line, i) => (
                                <div key={i} className="group flex hover:bg-white/5 px-2 rounded transition-colors">
                                    <span className="w-10 shrink-0 text-slate-700 select-none text-right pr-4 text-xs group-hover:text-slate-500">
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
