import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
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
    SkipBack,
    SkipForward,
    MousePointerClick,
    Trash2,
    Loader2,
    Check,
    X,
    Undo2,
    Star
} from "lucide-react";
import {
    generateMapColoringSteps,
    mapColoringCPP,
    mapColoringJava,
    mapColoringPython,
    mapColoringJS,
} from "../algorithms/mapColoring";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
    Idle: "border-white/15 bg-white/5 text-slate-200",
    Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const COLOR_PALETTE = [
    "transparent", // 0 is uncolored
    "#ef4444", // 1: Red
    "#3b82f6", // 2: Blue
    "#22c55e", // 3: Green
    "#eab308", // 4: Yellow
    "#a855f7", // 5: Purple
];

const PHASE_COLORS = {
    trying: "#facc15", // yellow-400
    placed: "#34d399", // emerald-400
    conflict: "#ef4444", // red-500
    backtrack: "#f97316", // orange-500
    "solution-found": "#60a5fa" // blue-400
};

const PREDEFINED_GRAPHS = {
    simple: {
        nodes: [
            { id: 0, x: 50, y: 50, label: "A" },
            { id: 1, x: 50, y: 15, label: "B" },
            { id: 2, x: 85, y: 50, label: "C" },
            { id: 3, x: 50, y: 85, label: "D" },
            { id: 4, x: 15, y: 50, label: "E" },
        ],
        edges: [
            { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 0, v: 3 }, { u: 0, v: 4 },
            { u: 1, v: 2 }, { u: 2, v: 3 }, { u: 3, v: 4 }, { u: 4, v: 1 }
        ]
    },
    complex: {
        nodes: [
            { id: 0, x: 30, y: 30, label: "0" },
            { id: 1, x: 70, y: 30, label: "1" },
            { id: 2, x: 50, y: 50, label: "2" },
            { id: 3, x: 30, y: 70, label: "3" },
            { id: 4, x: 70, y: 70, label: "4" },
            { id: 5, x: 50, y: 15, label: "5" },
        ],
        edges: [
            { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 0, v: 3 }, { u: 1, v: 2 },
            { u: 1, v: 4 }, { u: 2, v: 3 }, { u: 2, v: 4 }, { u: 3, v: 4 },
            { u: 0, v: 5 }, { u: 1, v: 5 }
        ]
    }
};

function formatElapsed(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function MapColoringPage() {
    useDocumentTitle("Map Coloring Visualizer");
    const navigate = useNavigate();

    // --- State ---
    const [numColors, setNumColors] = useState(3);
    const [graphType, setGraphType] = useState("simple");
    
    // Custom Graph State
    const [customNodes, setCustomNodes] = useState([]);
    const [customEdges, setCustomEdges] = useState([]);
    const [edgeStartNode, setEdgeStartNode] = useState(null);

    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [runStatus, setRunStatus] = useState("Idle");
    const [speed, setSpeed] = useState(400);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [totalSolutions, setTotalSolutions] = useState(0);

    const [copyState, setCopyState] = useState("idle");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");

    const timerRef = useRef(null);
    const canvasRef = useRef(null);

    const activeCode =
        selectedLanguage === "C++"
            ? mapColoringCPP
            : selectedLanguage === "Java"
                ? mapColoringJava
                : selectedLanguage === "Python"
                    ? mapColoringPython
                    : mapColoringJS;

    const currentGraph = useMemo(() => {
        if (graphType === "custom") {
            return { nodes: customNodes, edges: customEdges };
        }
        return PREDEFINED_GRAPHS[graphType];
    }, [graphType, customNodes, customEdges]);

    const currentStep = useMemo(() => {
        if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
            return steps[currentStepIndex];
        }
        return null;
    }, [currentStepIndex, steps]);

    const progress = useMemo(() => {
        if (runStatus === "Completed") return 100;
        if (steps.length === 0 || currentStepIndex < 0) return 0;
        return Math.min(Math.round(((currentStepIndex + 1) / steps.length) * 100), 100);
    }, [runStatus, currentStepIndex, steps.length]);

    // --- Custom Graph Builder Methods ---
    const handleCanvasClick = (e) => {
        if (graphType !== "custom" || runStatus !== "Idle") return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (x < 5 || x > 95 || y < 5 || y > 95) return;

        setCustomNodes(prev => [
            ...prev,
            { id: prev.length, x, y, label: `${prev.length}` }
        ]);
        setEdgeStartNode(null); 
    };

    const handleNodeClick = (e, nodeId) => {
        if (graphType !== "custom" || runStatus !== "Idle") return;
        e.stopPropagation(); 

        if (edgeStartNode === null) {
            setEdgeStartNode(nodeId);
        } else {
            if (edgeStartNode !== nodeId) {
                const exists = customEdges.some(
                    edge => (edge.u === edgeStartNode && edge.v === nodeId) || 
                            (edge.u === nodeId && edge.v === edgeStartNode)
                );
                
                if (!exists) {
                    setCustomEdges(prev => [...prev, { u: edgeStartNode, v: nodeId }]);
                }
            }
            setEdgeStartNode(null);
        }
    };

    const clearCustomGraph = () => {
        setCustomNodes([]);
        setCustomEdges([]);
        setEdgeStartNode(null);
        handleReset();
    };

    // --- Algorithm Control ---
    const stopAnimation = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const handleReset = () => {
        stopAnimation();
        setSteps([]);
        setCurrentStepIndex(-1);
        setRunStatus("Idle");
        setIsPaused(false);
        setElapsedSeconds(0);
        setTotalSolutions(0);
    };

    const runAlgorithm = useCallback(() => {
        if (currentGraph.nodes.length === 0) return;
        
        const { steps: generatedSteps, solutions } = generateMapColoringSteps(currentGraph.nodes, currentGraph.edges, numColors);
        setSteps(generatedSteps);
        setTotalSolutions(solutions);
        setCurrentStepIndex(0);
        setRunStatus("Running");
        setIsPaused(false);
        setElapsedSeconds(0);
    }, [numColors, currentGraph]);

    const stepForward = () => {
        setIsPaused(true);
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
        if (currentStepIndex === steps.length - 2) setRunStatus("Completed");
    };

    const stepBackward = () => {
        setIsPaused(true);
        setCurrentStepIndex(prev => Math.max(prev - 1, 0));
        if (runStatus === "Completed") setRunStatus("Paused");
    };

    // --- Playback ---
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

    useEffect(() => {
        handleReset();
    }, [graphType]);

    // --- Code Actions ---
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
            selectedLanguage === "C++" ? ".cpp"
                : selectedLanguage === "Java" ? ".java"
                    : selectedLanguage === "Python" ? ".py"
                        : ".js";
        const blob = new Blob([activeCode], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `MapColoring${ext}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // --- Hotkeys ---
    useStableHotkeys((e) => {
        if (shouldSkipHotkeyTarget(e.target)) return;
        const key = e.key?.toLowerCase();
        const isHotkey = e.code === "Space" || key === "r" || e.code === "ArrowRight" || e.code === "ArrowLeft";
        if (!isHotkey) return;
        if (e.repeat) { e.preventDefault(); return; }

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
        if (key === "r") { e.preventDefault(); handleReset(); }
        if (e.code === "ArrowRight" && steps.length > 0) { e.preventDefault(); stepForward(); }
        if (e.code === "ArrowLeft" && steps.length > 0) { e.preventDefault(); stepBackward(); }
    });

    const activeColors = currentStep?.colors || Array(currentGraph.nodes.length).fill(0);

    return (
        <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(236,72,153,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

            {/* ═══ HERO HEADER ═══ */}
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
                                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                                Back to Algorithms
                            </button>
                        </div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-pink-400/25 bg-pink-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pink-200">
                                Backtracking
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                {formatElapsed(elapsedSeconds)}
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Time: <span className="text-pink-200 font-mono">O(m^V)</span>
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Space: <span className="text-pink-200 font-mono">O(V)</span>
                            </span>
                        </div>

                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            Map Coloring (m-Coloring Problem)
                        </h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base">
                            Assign colors to nodes of a graph (or regions of a map) such that no two adjacent nodes share the same color, using at most 'm' colors via backtracking.
                        </p>

                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Computation Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.35 }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Nodes (V)</p>
                                <p className="mt-1 text-sm font-semibold text-white">{currentGraph.nodes.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Max Colors</p>
                                <p className="mt-1 text-sm font-semibold text-pink-200">{numColors}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Solutions</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">
                                    {currentStep?.solutionCount ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Complexity</p>
                                <p className="mt-1 text-sm font-semibold text-pink-200">O(m^V)</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Status Panel */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-pink-300" /> Live Status
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-white/5 p-3 border-l-2 border-pink-500">
                                <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">Current Action</p>
                                <p className="text-sm font-semibold text-white">
                                    {currentStep ? currentStep.description : "Press Start to begin execution"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Node</p>
                                    <p className="text-lg font-bold text-sky-300">
                                        {currentStep?.node != null && currentStep.node >= 0 ? currentStep.node : "-"}
                                    </p>
                                </div>
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Color</p>
                                    <p className="text-lg font-bold text-pink-300">
                                        {currentStep?.color != null && currentStep.color > 0 ? currentStep.color : "-"}
                                    </p>
                                </div>
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Phase</p>
                                    <p className={`text-lg font-bold ${currentStep?.phase === "placed" ? "text-emerald-300" :
                                            currentStep?.phase === "conflict" ? "text-red-300" :
                                                currentStep?.phase === "backtrack" ? "text-orange-300" :
                                                    currentStep?.phase === "solution-found" ? "text-emerald-400" :
                                                        "text-yellow-300"
                                        }`}>
                                        {currentStep?.phase ?? "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══ MAIN CONTENT: Controls | Graph Visualizer | Legend ═══ */}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:items-stretch">

                {/* Left Sidebar: Controls */}
                <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
                    <div className="mb-5 flex items-center gap-2">
                        <Waypoints size={18} className="text-pink-300" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                        {/* Speed Slider */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span><Clock3 size={13} className="mr-1 inline" /> Speed</span>
                                <span>{speed}ms</span>
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="1500"
                                step="50"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="w-full accent-pink-400"
                                style={{ direction: "rtl" }}
                            />
                        </div>

                        {/* Allowed Colors (m) */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span>Max Colors (m)</span>
                                <span className="text-white font-bold">{numColors}</span>
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="5"
                                step="1"
                                value={numColors}
                                onChange={(e) => setNumColors(Number(e.target.value))}
                                disabled={runStatus !== "Idle"}
                                className="w-full accent-pink-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        {/* Graph Preset */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span>Map Layout</span>
                            </label>
                            <select
                                value={graphType}
                                onChange={(e) => setGraphType(e.target.value)}
                                disabled={runStatus !== "Idle"}
                                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none disabled:opacity-50"
                            >
                                <option value="simple">Simple Map (5 Nodes)</option>
                                <option value="complex">Complex Map (6 Nodes)</option>
                                <option value="custom">Custom Map (Interactive)</option>
                            </select>
                        </div>

                        {/* Custom Graph Builder Tools */}
                        {graphType === "custom" && (
                            <div className="rounded-2xl border border-pink-500/30 bg-pink-500/5 p-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-2 text-pink-300">
                                    <MousePointerClick size={14} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Builder Tools</span>
                                </div>
                                <ul className="text-[11px] text-slate-300 space-y-1 mb-3 list-disc pl-4">
                                    <li>Click empty space to add Node</li>
                                    <li>Click two nodes to draw Edge</li>
                                </ul>
                                <button
                                    onClick={clearCustomGraph}
                                    disabled={runStatus !== "Idle"}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                                >
                                    <Trash2 size={14} /> Clear Map
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 mt-auto">
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                            >
                                <RotateCcw size={16} /> Reset
                            </button>
                        </div>

                        {/* Interactive Playback Row */}
                        <div className="flex gap-2">
                            <button
                                onClick={stepBackward}
                                disabled={runStatus === "Idle" || steps.length === 0 || currentStepIndex <= 0}
                                className="flex flex-1 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-all text-white"
                                title="Step Backward (Arrow Left)"
                            >
                                <SkipBack size={18} />
                            </button>

                            {runStatus === "Idle" || runStatus === "Completed" ? (
                                <button
                                    onClick={() => {
                                        if (runStatus === "Completed") handleReset();
                                        setTimeout(runAlgorithm, 100);
                                    }}
                                    disabled={currentGraph.nodes.length === 0}
                                    className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-pink-600 to-purple-500 py-3.5 font-bold text-white shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 transition-all"
                                >
                                    <Play size={18} fill="currentColor" />{" "}
                                    {runStatus === "Completed" ? "Restart" : "Start"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    className={`flex flex-[2] items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white transition-all ${isPaused ? "bg-emerald-600 hover:bg-emerald-500" : "bg-pink-500 text-slate-900 hover:bg-pink-400"}`}
                                >
                                    {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                                    {isPaused ? "Resume" : "Pause"}
                                </button>
                            )}

                            <button
                                onClick={stepForward}
                                disabled={runStatus === "Idle" || steps.length === 0 || currentStepIndex >= steps.length - 1}
                                className="flex flex-1 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-all text-white"
                                title="Step Forward (Arrow Right)"
                            >
                                <SkipForward size={18} />
                            </button>
                        </div>
                        <HotkeysHint />
                    </div>
                </aside>

                {/* Center: Graph Visualization */}
                <section className="min-w-0 h-[450px] xl:h-auto rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col items-center justify-center overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:24px_24px]" />

                    <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 self-start absolute top-4 left-4 z-10 flex items-center gap-2">
                        Map Topology
                        {graphType === "custom" && runStatus === "Idle" && (
                            <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full normal-case tracking-normal border border-pink-500/30">
                                Edit Mode Active
                            </span>
                        )}
                    </h2>

                    <div 
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className={`relative w-full max-w-lg aspect-square ${graphType === "custom" && runStatus === "Idle" ? "cursor-crosshair border-2 border-dashed border-white/10 rounded-xl bg-slate-900/40" : ""}`}
                    >
                        {/* Define SVG animations */}
                        <svg className="absolute w-0 h-0">
                            <defs>
                                <style>
                                    {`
                                        @keyframes march {
                                            to { stroke-dashoffset: -12; }
                                        }
                                        .animate-march {
                                            animation: march 0.6s linear infinite;
                                        }
                                    `}
                                </style>
                            </defs>
                        </svg>

                        {/* Edges */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100">
                            {currentGraph.edges.map((edge, i) => {
                                const uNode = currentGraph.nodes.find(n => n.id === edge.u);
                                const vNode = currentGraph.nodes.find(n => n.id === edge.v);
                                
                                if (!uNode || !vNode) return null;

                                // Advanced edge state checking
                                const isCurrentNodeInvolved = currentStep?.node === edge.u || currentStep?.node === edge.v;
                                const isConflictEdge = currentStep?.phase === "conflict" &&
                                    ((currentStep?.node === edge.u && activeColors[edge.v] === currentStep?.color) ||
                                    (currentStep?.node === edge.v && activeColors[edge.u] === currentStep?.color));
                                
                                const isTryingEdge = isCurrentNodeInvolved && currentStep?.phase === "trying";

                                let strokeColor = "rgba(255,255,255,0.15)";
                                let strokeWidth = "0.5";
                                let dashArray = "none";
                                let edgeClass = "transition-all duration-300";

                                if (isConflictEdge) {
                                    strokeColor = PHASE_COLORS.conflict;
                                    strokeWidth = "1.5";
                                    dashArray = "4 4";
                                    edgeClass = "animate-march drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]";
                                } else if (isTryingEdge) {
                                    strokeColor = "rgba(250, 204, 21, 0.5)"; // faded yellow
                                    strokeWidth = "1";
                                } else if (isCurrentNodeInvolved) {
                                    strokeColor = "rgba(255,255,255,0.3)";
                                }

                                return (
                                    <line
                                        key={`e-${i}`}
                                        x1={`${uNode.x}%`} y1={`${uNode.y}%`}
                                        x2={`${vNode.x}%`} y2={`${vNode.y}%`}
                                        stroke={strokeColor}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        strokeDasharray={dashArray}
                                        className={edgeClass}
                                    />
                                );
                            })}
                        </svg>

                        {/* Nodes */}
                        {currentGraph.nodes.map((node) => {
                            const colorIndex = activeColors[node.id];
                            const isCurrent = currentStep?.node === node.id;
                            const statusColor = COLOR_PALETTE[colorIndex];
                            
                            let borderClass = "border-slate-500/50";
                            let ringColor = "transparent";

                            if (isCurrent) {
                                if (currentStep?.phase === "trying") { borderClass = "border-yellow-400"; ringColor = PHASE_COLORS.trying; }
                                else if (currentStep?.phase === "conflict") { borderClass = "border-red-500"; ringColor = PHASE_COLORS.conflict; }
                                else if (currentStep?.phase === "placed") { borderClass = "border-emerald-400"; ringColor = PHASE_COLORS.placed; }
                                else if (currentStep?.phase === "backtrack") { borderClass = "border-orange-500"; ringColor = PHASE_COLORS.backtrack; }
                                else if (currentStep?.phase === "solution-found") { borderClass = "border-blue-400"; ringColor = PHASE_COLORS["solution-found"]; }
                            }

                            const isSelectedForEdge = edgeStartNode === node.id;

                            return (
                                <div
                                    key={node.id}
                                    className="absolute"
                                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                >
                                    {/* Ripple Effect for Current Node */}
                                    {isCurrent && (
                                        <motion.div
                                            className="absolute -inset-6 rounded-full border-2"
                                            style={{ borderColor: ringColor, marginLeft: '-1.5rem', marginTop: '-1.5rem', width: '3rem', height: '3rem' }}
                                            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                                        />
                                    )}

                                    {/* Main Node Body */}
                                    <motion.div
                                        onClick={(e) => handleNodeClick(e, node.id)}
                                        className={`absolute flex items-center justify-center w-12 h-12 -ml-6 -mt-6 rounded-full border-2 ${borderClass} font-bold text-white transition-all duration-300 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] ${graphType === "custom" && runStatus === "Idle" ? "cursor-pointer hover:scale-110 hover:border-pink-400" : ""} ${isSelectedForEdge ? "ring-4 ring-pink-500/50 scale-110" : ""}`}
                                        style={{
                                            backgroundColor: colorIndex > 0 ? statusColor : "rgba(30,41,59,0.95)",
                                            boxShadow: isCurrent ? `0 0 20px ${ringColor}60` : "none"
                                        }}
                                        animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {node.id}

                                        {/* Status Badge (Icon) */}
                                        <AnimatePresence>
                                            {isCurrent && currentStep?.phase && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-white/20 shadow-lg"
                                                >
                                                    {currentStep.phase === "trying" && <Loader2 size={12} className="animate-spin text-yellow-400" />}
                                                    {currentStep.phase === "placed" && <Check size={12} strokeWidth={3} className="text-emerald-400" />}
                                                    {currentStep.phase === "conflict" && <X size={12} strokeWidth={3} className="text-red-500" />}
                                                    {currentStep.phase === "backtrack" && <Undo2 size={12} strokeWidth={3} className="text-orange-500" />}
                                                    {currentStep.phase === "solution-found" && <Star size={12} fill="currentColor" className="text-blue-400" />}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            );
                        })}
                        
                        {/* Empty state hint */}
                        {graphType === "custom" && currentGraph.nodes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-semibold pointer-events-none bg-slate-900/50 rounded-xl backdrop-blur-sm">
                                Click anywhere inside the grid to add your first node
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Sidebar: Legend & Info */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 shadow-2xl backdrop-blur flex flex-col h-full">
                    <div className="mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Legend & Memory</h2>
                    </div>

                    <div className="space-y-3 overflow-y-auto ll-scrollbar flex-1 pr-1">
                        
                        {/* Live State Array Inspector */}
                        <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-3 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-pink-300 mb-2 flex items-center gap-1.5">
                                <Code2 size={12} /> Live color[ ] Array
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {currentGraph.nodes.length === 0 ? (
                                    <span className="text-[10px] text-slate-500 col-span-2">Array Empty</span>
                                ) : (
                                    currentGraph.nodes.map((node) => {
                                        const cIdx = activeColors[node.id] || 0;
                                        const bgHex = COLOR_PALETTE[cIdx];
                                        return (
                                            <div key={node.id} className="flex items-center gap-2 bg-slate-900/80 rounded px-2 py-1.5 border border-white/5 shadow-inner">
                                                <span className="text-[10px] text-slate-400 font-mono w-6">[{node.id}]</span>
                                                <div 
                                                    className="w-3 h-3 rounded-full border border-white/20 transition-colors duration-300" 
                                                    style={{ backgroundColor: cIdx === 0 ? 'transparent' : bgHex }}
                                                />
                                                <span className="text-[10px] font-semibold text-white">
                                                    {cIdx === 0 ? '0' : cIdx}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Node Status Highlights</p>
                            <div className="space-y-2 text-[11px] text-slate-300">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full border-2 border-yellow-400 bg-slate-900">
                                        <Loader2 size={8} className="text-yellow-400" />
                                    </span>
                                    <span>Trying Color</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full border-2 border-emerald-400 bg-slate-900">
                                        <Check size={8} className="text-emerald-400" />
                                    </span>
                                    <span>Valid Placement</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full border-2 border-red-500 bg-slate-900">
                                        <X size={8} className="text-red-500" />
                                    </span>
                                    <span>Conflict Detected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full border-2 border-orange-500 bg-slate-900">
                                        <Undo2 size={8} className="text-orange-500" />
                                    </span>
                                    <span>Backtracking (Reverting)</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Available Colors (m)</p>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PALETTE.slice(1, numColors + 1).map((hex, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 rounded shadow-sm border border-white/10" style={{ backgroundColor: hex }} />
                                        <span className="text-[9px] text-slate-400 font-bold">{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Backtracking Logic</p>
                            <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                                <p><strong className="text-white">1. Base Case:</strong> If all nodes colored, return true.</p>
                                <p><strong className="text-white">2. Recursion:</strong> Pick next node. Loop colors 1 to m.</p>
                                <p><strong className="text-white">3. Safety Check:</strong> If no neighbor uses the color, assign it and recurse.</p>
                                <p><strong className="text-white">4. Backtrack:</strong> If recursion fails, un-assign color (set 0) and try next.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ═══ SOURCE CODE SECTION ═══ */}
            <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
                <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate("/algorithms")}
                            className="group flex items-center gap-2 rounded-lg bg-white/5 pr-4 pl-3 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white border border-white/10"
                        >
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                            Back to Algorithms
                        </button>
                        <div className="h-6 w-px bg-slate-700 hidden sm:block" />
                        <Code2 size={20} className="text-pink-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                            {selectedLanguage} Source
                        </span>
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-pink-600 text-white" : "text-slate-400 hover:text-white"}`}
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