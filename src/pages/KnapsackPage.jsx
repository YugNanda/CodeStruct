import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
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
    Plus,
    RotateCcw,
    Shuffle,
    Trash2,
    Waypoints,
} from "lucide-react";
import {
    knapsack,
    knapsackCPP,
    knapsackJava,
    knapsackPython,
    knapsackJS,
} from "../algorithms/knapsack";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
    Idle: "border-white/15 bg-white/5 text-slate-200",
    Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const DEFAULT_ITEMS = [
    { id: "item1", weight: 1, value: 1 },
    { id: "item2", weight: 2, value: 6 },
    { id: "item3", weight: 3, value: 10 },
    { id: "item4", weight: 5, value: 16 },
];
const DEFAULT_CAPACITY = 7;

function formatElapsed(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function KnapsackPage() {
    useDocumentTitle("0/1 Knapsack Visualizer");
    const navigate = useNavigate();

    // --- State ---
    const [items, setItems] = useState(DEFAULT_ITEMS);
    const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);

    const [frames, setFrames] = useState([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(-1);
    const [runStatus, setRunStatus] = useState("Idle");
    const [speed, setSpeed] = useState(500);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [copyState, setCopyState] = useState("idle");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");

    const timerRef = useRef(null);

    // Source code selection
    const activeCode =
        selectedLanguage === "C++"
            ? knapsackCPP
            : selectedLanguage === "Java"
                ? knapsackJava
                : selectedLanguage === "Python"
                    ? knapsackPython
                    : knapsackJS;

    // Computed
    const currentFrame = useMemo(() => {
        if (currentFrameIndex >= 0 && currentFrameIndex < frames.length) {
            return frames[currentFrameIndex];
        }
        return null;
    }, [currentFrameIndex, frames]);

    const progress = useMemo(() => {
        if (runStatus === "Completed") return 100;
        if (frames.length === 0 || currentFrameIndex < 0) return 0;
        return Math.min(Math.round(((currentFrameIndex + 1) / frames.length) * 100), 100);
    }, [runStatus, currentFrameIndex, frames.length]);

    // --- Algorithm Control ---
    const stopAnimation = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const handleReset = () => {
        stopAnimation();
        setFrames([]);
        setCurrentFrameIndex(-1);
        setRunStatus("Idle");
        setIsPaused(false);
        setElapsedSeconds(0);
    };

    const runAlgorithm = useCallback(async () => {
        const animationFrames = await knapsack(capacity, items);
        setFrames(animationFrames);
        setCurrentFrameIndex(0);
        setRunStatus("Running");
        setIsPaused(false);
        setElapsedSeconds(0);
    }, [capacity, items]);

    const handleGenerateNewItems = () => {
        handleReset();
        const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
        const newItems = [];
        for (let i = 0; i < count; i++) {
            newItems.push({
                id: `item${Date.now()}-${i}`,
                weight: Math.floor(Math.random() * 6) + 1,
                value: Math.floor(Math.random() * 20) + 1,
            });
        }
        setItems(newItems);
        setCapacity(Math.floor(Math.random() * 8) + 5);
    };

    // --- Playback ---
    useEffect(() => {
        if (runStatus === "Running" && !isPaused) {
            timerRef.current = setInterval(() => {
                setCurrentFrameIndex((prev) => {
                    if (prev < frames.length - 1) return prev + 1;
                    stopAnimation();
                    setRunStatus("Completed");
                    return prev;
                });
            }, speed);
        } else {
            stopAnimation();
        }
        return () => stopAnimation();
    }, [runStatus, isPaused, frames.length, speed]);

    useEffect(() => {
        if (runStatus !== "Running" || isPaused) return undefined;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [runStatus, isPaused]);

    // --- Item Management ---
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: parseInt(value) || 0 };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: `item${Date.now()}`, weight: 1, value: 1 }]);
    };

    const removeItem = (index) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

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
        link.download = `Knapsack${ext}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // --- Hotkeys ---
    useStableHotkeys((e) => {
        if (shouldSkipHotkeyTarget(e.target)) return;
        const key = e.key?.toLowerCase();
        const isHotkey = e.code === "Space" || key === "r" || key === "n";
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
        if (key === "r") { e.preventDefault(); handleReset(); return; }
        if (key === "n") { e.preventDefault(); if (runStatus === "Idle") handleGenerateNewItems(); }
    });

    // --- Cell Styling ---
    const getCellClasses = (r, c) => {
        if (!currentFrame) return "bg-slate-800/80 text-slate-300 border-slate-700/50";

        if (currentFrame.phase === "done") {
            return "bg-slate-800/80 text-slate-300 border-slate-700/50";
        }

        if (currentFrame.phase.startsWith("backtrack")) {
            if (currentFrame.comparingCells?.some(cell => cell.r === r && cell.c === c)) {
                return "bg-purple-500/50 border-purple-400 text-white animate-pulse";
            }
        }

        if (currentFrame.updatedCell && currentFrame.updatedCell.r === r && currentFrame.updatedCell.c === c) {
            return "bg-green-500/30 border-green-400 text-green-100";
        }

        if (currentFrame.currentItem === r - 1 && currentFrame.currentWeight === c) {
            return "bg-yellow-500/30 border-yellow-400 text-yellow-100";
        }

        if (currentFrame.comparingCells?.find((cell) => cell.r === r && cell.c === c)) {
            return "bg-blue-500/30 border-blue-400 text-blue-100";
        }

        return "bg-slate-800/80 text-slate-300 border-slate-700/50";
    };

    return (
        <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(236,72,153,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
                            <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-200">
                                Dynamic Programming
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                {formatElapsed(elapsedSeconds)}
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Time: <span className="text-purple-200 font-mono">O(N×W)</span>
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Space: <span className="text-purple-200 font-mono">O(N×W)</span>
                            </span>
                        </div>

                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            0/1 Knapsack
                        </h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base">
                            A dynamic programming algorithm to find the maximum value subset of items
                            that fits within a given weight capacity.
                        </p>

                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Computation Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.35 }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Items</p>
                                <p className="mt-1 text-sm font-semibold text-white">{items.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Capacity</p>
                                <p className="mt-1 text-sm font-semibold text-purple-200">{capacity}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Max Value</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">
                                    {currentFrame?.maxValue ?? "-"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Complexity</p>
                                <p className="mt-1 text-sm font-semibold text-purple-200">O(N×W)</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Status Panel */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-purple-300" /> Live Status
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-white/5 p-3">
                                <p className="text-[11px] text-slate-400">Current Action</p>
                                <p className="text-sm font-semibold text-white">
                                    {currentFrame ? currentFrame.message : "Press Start to begin"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Item (i)</p>
                                    <p className="text-lg font-bold text-sky-300">
                                        {currentFrame?.currentItem != null ? currentFrame.currentItem + 1 : "-"}
                                    </p>
                                </div>
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Capacity (w)</p>
                                    <p className="text-lg font-bold text-pink-300">
                                        {currentFrame?.currentWeight != null ? currentFrame.currentWeight : "-"}
                                    </p>
                                </div>
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Phase</p>
                                    <p className="text-lg font-bold text-yellow-300">
                                        {currentFrame?.phase ?? "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Step</p>
                                    <p className="text-lg font-bold text-cyan-200">
                                        {frames.length > 0 ? `${Math.min(currentFrameIndex + 1, frames.length)}/${frames.length}` : "-"}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Delay</p>
                                    <p className="text-lg font-bold text-cyan-100">{speed}ms</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Items</p>
                                    <p className="text-lg font-bold text-purple-100">{items.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══ MAIN CONTENT: Controls | DP Table | Items Config ═══ */}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_350px] xl:items-stretch">

                {/* Left Sidebar: Controls */}
                <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
                    <div className="mb-5 flex items-center gap-2">
                        <Waypoints size={18} className="text-purple-300" />
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
                                className="w-full accent-purple-400"
                                style={{ direction: "rtl" }}
                            />
                        </div>

                        {/* Capacity Control */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span>Max Capacity</span>
                                <span className="text-white font-bold">{capacity}</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                disabled={runStatus !== "Idle"}
                                className="w-full accent-purple-400"
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
                                onClick={handleGenerateNewItems}
                                disabled={runStatus !== "Idle"}
                                className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-500/10 py-2.5 text-sm font-bold text-purple-100 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                            >
                                <Shuffle size={16} /> New Data
                            </button>
                        </div>

                        {runStatus === "Idle" || runStatus === "Completed" ? (
                            <button
                                onClick={() => {
                                    if (runStatus === "Completed") handleReset();
                                    setTimeout(runAlgorithm, 100);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-pink-500 py-3.5 font-bold text-white shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                <Play size={18} fill="currentColor" />{" "}
                                {runStatus === "Completed" ? "Restart" : "Start"}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white ${isPaused ? "bg-emerald-600" : "bg-amber-500 text-slate-900"}`}
                            >
                                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                                {isPaused ? "Resume" : "Pause"}
                            </button>
                        )}
                        <HotkeysHint />
                    </div>
                </aside>

                {/* Center: DP Table Visualization */}
                <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col">
                    {/* Legend */}
                    <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 backdrop-blur">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Legend</p>
                        <div className="space-y-1.5 text-[10px] text-slate-300">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                                <span>Evaluating</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                                <span>Comparing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                <span>Updated</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                                <span>Backtracking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                <span>Selected Item</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4">
                        DP Table
                    </h2>

                    <div className="flex-1 overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
                        {currentFrame?.dp ? (
                            <div
                                className="inline-grid gap-1"
                                style={{ gridTemplateColumns: `auto repeat(${capacity + 1}, minmax(2.5rem, 1fr))` }}
                            >
                                {/* Header Row */}
                                <div className="p-2"></div>
                                {Array.from({ length: capacity + 1 }).map((_, w) => (
                                    <div key={`head-${w}`} className="p-2 rounded-md bg-slate-900/80 font-semibold text-slate-300 flex items-center justify-center text-xs">
                                        w={w}
                                    </div>
                                ))}

                                {/* DP Rows */}
                                {currentFrame.dp.map((row, i) => (
                                    <div key={`row-${i}`} className="contents">
                                        <div className={`p-2 rounded-md bg-slate-900/80 font-semibold flex flex-col items-center justify-center text-xs ${currentFrame.selectedItems?.includes(i - 1) ? "text-emerald-400" : "text-slate-300"}`}>
                                            {i === 0 ? "0" : (
                                                <div className="text-center">
                                                    Item {i}<br />
                                                    <span className="text-slate-400 font-normal text-[10px]">
                                                        ({items[i - 1]?.weight}kg, ${items[i - 1]?.value})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {row.map((cellValue, w) => (
                                            <motion.div
                                                key={`cell-${i}-${w}`}
                                                className={`p-2 rounded-md border flex items-center justify-center font-mono text-sm transition-colors duration-300 ${getCellClasses(i, w)}`}
                                            >
                                                {cellValue}
                                            </motion.div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full min-h-60 items-center justify-center text-xs text-slate-500 text-center p-4">
                                Click Start to compute the optimal knapsack solution
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Sidebar: Items Configuration */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 shadow-2xl backdrop-blur flex flex-col">
                    <div className="mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                            Items Configuration
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Add, edit or remove items before running.
                        </p>
                    </div>

                    <div className="flex-1 overflow-auto space-y-2 max-h-96">
                        {items.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`p-3 rounded-xl border relative group ${currentFrame?.selectedItems?.includes(idx) ? "bg-emerald-500/20 border-emerald-500/40" : "bg-white/5 border-white/10"}`}
                            >
                                <button
                                    onClick={() => removeItem(idx)}
                                    disabled={runStatus !== "Idle"}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white disabled:hidden"
                                >
                                    <Trash2 size={12} />
                                </button>
                                <div className="text-xs font-semibold text-slate-400 mb-2">Item {idx + 1}</div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-500 uppercase">W</span>
                                        <input
                                            type="number"
                                            value={item.weight}
                                            onChange={(e) => handleItemChange(idx, "weight", e.target.value)}
                                            disabled={runStatus !== "Idle"}
                                            className="w-12 px-1.5 py-1 rounded bg-slate-800 border border-white/5 text-white text-xs text-right disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-500 uppercase">V</span>
                                        <input
                                            type="number"
                                            value={item.value}
                                            onChange={(e) => handleItemChange(idx, "value", e.target.value)}
                                            disabled={runStatus !== "Idle"}
                                            className="w-12 px-1.5 py-1 rounded bg-slate-800 border border-white/5 text-white text-xs text-right disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addItem}
                        disabled={runStatus !== "Idle"}
                        className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 hover:border-purple-400/50 hover:bg-purple-500/10 py-2.5 text-sm font-bold text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                    >
                        <Plus size={16} /> Add Item
                    </button>
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
                        <Code2 size={20} className="text-purple-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                            {selectedLanguage} Source
                        </span>
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
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
