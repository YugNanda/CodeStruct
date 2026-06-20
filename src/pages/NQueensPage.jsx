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
    Crown,
    Download,
    Pause,
    Play,
    RotateCcw,
    Waypoints,
} from "lucide-react";
import {
    generateNQueensSteps,
    nQueensCPP,
    nQueensJava,
    nQueensPython,
    nQueensJS,
} from "../algorithms/nqueens";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
    Idle: "border-white/15 bg-white/5 text-slate-200",
    Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

function formatElapsed(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function NQueensPage() {
    useDocumentTitle("N-Queens Visualizer");
    const navigate = useNavigate();

    // --- State ---
    const [boardSize, setBoardSize] = useState(6);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [runStatus, setRunStatus] = useState("Idle");
    const [speed, setSpeed] = useState(300);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [totalSolutions, setTotalSolutions] = useState(0);

    const [copyState, setCopyState] = useState("idle");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");

    const timerRef = useRef(null);

    const activeCode =
        selectedLanguage === "C++"
            ? nQueensCPP
            : selectedLanguage === "Java"
                ? nQueensJava
                : selectedLanguage === "Python"
                    ? nQueensPython
                    : nQueensJS;

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
        const { steps: generatedSteps, solutions } = generateNQueensSteps(boardSize);
        setSteps(generatedSteps);
        setTotalSolutions(solutions.length);
        setCurrentStepIndex(0);
        setRunStatus("Running");
        setIsPaused(false);
        setElapsedSeconds(0);
    }, [boardSize]);

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
        link.download = `NQueens${ext}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // --- Hotkeys ---
    useStableHotkeys((e) => {
        if (shouldSkipHotkeyTarget(e.target)) return;
        const key = e.key?.toLowerCase();
        const isHotkey = e.code === "Space" || key === "r";
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
    });

    // --- Cell Styling ---
    const getCellStyle = (r, c) => {
        const isDark = (r + c) % 2 === 1;
        const baseColor = isDark ? "bg-amber-900/40" : "bg-amber-100/10";

        if (!currentStep) return baseColor;

        // Current cell being tried
        if (currentStep.row === r && currentStep.col === c) {
            if (currentStep.phase === "trying") return "bg-yellow-500/50 border-yellow-400 ring-2 ring-yellow-400/50";
            if (currentStep.phase === "conflict") return "bg-red-500/50 border-red-400 ring-2 ring-red-400/50";
            if (currentStep.phase === "placed") return "bg-emerald-500/50 border-emerald-400 ring-2 ring-emerald-400/50";
            if (currentStep.phase === "backtrack") return "bg-orange-500/40 border-orange-400 ring-2 ring-orange-400/50";
        }

        // Threatened cells
        if (currentStep.threatened?.some((t) => t.r === r && t.c === c)) {
            return "bg-red-500/25 border-red-400/50";
        }

        // Queen on this cell
        if (currentStep.board?.[r]?.[c] === 1) {
            return "bg-emerald-500/30 border-emerald-400";
        }

        return baseColor;
    };

    const board = currentStep?.board;
    const n = boardSize;

    return (
        <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(234,88,12,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
                            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
                                Backtracking
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                {formatElapsed(elapsedSeconds)}
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Time: <span className="text-amber-200 font-mono">O(N!)</span>
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Space: <span className="text-amber-200 font-mono">O(N²)</span>
                            </span>
                        </div>

                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            N-Queens Problem
                        </h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base">
                            Place N queens on an N×N chessboard so that no two queens threaten each other.
                            Uses recursive backtracking to explore all valid configurations.
                        </p>

                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Computation Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.35 }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Board Size</p>
                                <p className="mt-1 text-sm font-semibold text-white">{boardSize} × {boardSize}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Queens</p>
                                <p className="mt-1 text-sm font-semibold text-amber-200">{currentStep?.queens?.length ?? 0}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Solutions</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">
                                    {currentStep?.solutionCount ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Complexity</p>
                                <p className="mt-1 text-sm font-semibold text-amber-200">O(N!)</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Status Panel */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-amber-300" /> Live Status
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-white/5 p-3">
                                <p className="text-[11px] text-slate-400">Current Action</p>
                                <p className="text-sm font-semibold text-white">
                                    {currentStep ? currentStep.description : "Press Start to begin"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Row</p>
                                    <p className="text-lg font-bold text-sky-300">
                                        {currentStep?.row != null && currentStep.row >= 0 ? currentStep.row : "-"}
                                    </p>
                                </div>
                                <div className="flex-1 rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Column</p>
                                    <p className="text-lg font-bold text-pink-300">
                                        {currentStep?.col != null && currentStep.col >= 0 ? currentStep.col : "-"}
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
                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Step</p>
                                    <p className="text-lg font-bold text-cyan-200">
                                        {steps.length > 0 ? `${Math.min(currentStepIndex + 1, steps.length)}/${steps.length}` : "-"}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Delay</p>
                                    <p className="text-lg font-bold text-cyan-100">{speed}ms</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Solutions</p>
                                    <p className="text-lg font-bold text-amber-100">{currentStep?.solutionCount ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══ MAIN CONTENT: Controls | Chessboard | Legend ═══ */}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:items-stretch">

                {/* Left Sidebar: Controls */}
                <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
                    <div className="mb-5 flex items-center gap-2">
                        <Waypoints size={18} className="text-amber-300" />
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
                                className="w-full accent-amber-400"
                                style={{ direction: "rtl" }}
                            />
                        </div>

                        {/* Board Size */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span>Board Size (N)</span>
                                <span className="text-white font-bold">{boardSize}</span>
                            </label>
                            <input
                                type="range"
                                min="4"
                                max="10"
                                step="1"
                                value={boardSize}
                                onChange={(e) => setBoardSize(Number(e.target.value))}
                                disabled={runStatus !== "Idle"}
                                className="w-full accent-amber-400"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2 mt-auto">
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                            >
                                <RotateCcw size={16} /> Reset
                            </button>
                        </div>

                        {runStatus === "Idle" || runStatus === "Completed" ? (
                            <button
                                onClick={() => {
                                    if (runStatus === "Completed") handleReset();
                                    setTimeout(runAlgorithm, 100);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-600 to-orange-500 py-3.5 font-bold text-white shadow-lg hover:shadow-amber-500/25 transition-all"
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

                {/* Center: Chessboard Visualization */}
                <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col items-center justify-center">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 self-start">
                        Chessboard ({n}×{n})
                    </h2>

                    <div className="flex-1 flex items-center justify-center w-full">
                        <div
                            className="inline-grid border-2 border-amber-700/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                            style={{
                                gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                                width: `min(100%, ${n * 64}px)`,
                                aspectRatio: "1 / 1",
                            }}
                        >
                            {Array.from({ length: n * n }).map((_, idx) => {
                                const r = Math.floor(idx / n);
                                const c = idx % n;
                                const hasQueen = board?.[r]?.[c] === 1;
                                const isCurrentTry = currentStep?.row === r && currentStep?.col === c;

                                return (
                                    <motion.div
                                        key={`${r}-${c}`}
                                        className={`relative flex items-center justify-center border border-amber-900/20 transition-colors duration-200 ${getCellStyle(r, c)}`}
                                        animate={isCurrentTry ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {hasQueen && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0, rotate: 180 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                <Crown
                                                    size={Math.min(40, Math.floor(400 / n))}
                                                    className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                                    fill="currentColor"
                                                />
                                            </motion.div>
                                        )}
                                        {isCurrentTry && !hasQueen && currentStep?.phase === "trying" && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.5 }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <Crown
                                                    size={Math.min(32, Math.floor(320 / n))}
                                                    className="text-yellow-300/50"
                                                />
                                            </motion.div>
                                        )}
                                        {isCurrentTry && currentStep?.phase === "conflict" && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute inset-0 flex items-center justify-center text-red-400 font-bold text-2xl"
                                            >
                                                ✗
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Right Sidebar: Legend & Info */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 shadow-2xl backdrop-blur flex flex-col">
                    <div className="mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Legend & Info</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cell Colors</p>
                            <div className="space-y-2 text-[11px] text-slate-300">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-yellow-500/50 border border-yellow-400" />
                                    <span>Trying Position</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-emerald-500/50 border border-emerald-400" />
                                    <span>Queen Placed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-red-500/50 border border-red-400" />
                                    <span>Conflict Detected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-orange-500/40 border border-orange-400" />
                                    <span>Backtracking</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-red-500/25 border border-red-400/50" />
                                    <span>Threatened Cell</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Algorithm</p>
                            <div className="text-[11px] text-slate-300 space-y-1.5">
                                <p>1. Place queen in first valid column of current row</p>
                                <p>2. Move to the next row</p>
                                <p>3. If no valid column exists, <span className="text-orange-300 font-semibold">backtrack</span></p>
                                <p>4. Repeat until all queens are placed</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Constraints</p>
                            <div className="text-[11px] text-slate-300 space-y-1.5">
                                <p>• No two queens share the same <span className="text-amber-300 font-semibold">row</span></p>
                                <p>• No two queens share the same <span className="text-amber-300 font-semibold">column</span></p>
                                <p>• No two queens share the same <span className="text-amber-300 font-semibold">diagonal</span></p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Known Solutions</p>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                                {[
                                    [4, 2], [5, 10], [6, 4], [7, 40], [8, 92], [9, 352], [10, 724],
                                ].map(([sz, count]) => (
                                    <div key={sz} className={`rounded-md px-2 py-1 ${boardSize === sz ? "bg-amber-500/20 text-amber-200 font-bold" : "bg-white/5"}`}>
                                        {sz}×{sz}: {count}
                                    </div>
                                ))}
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
                        <Code2 size={20} className="text-amber-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                            {selectedLanguage} Source
                        </span>
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
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
