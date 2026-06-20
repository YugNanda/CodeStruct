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
    RotateCcw,
    Waypoints,
    Shuffle,
} from "lucide-react";
import {
    generateRatInAMazeSteps,
    ratInAMazeCPP,
    ratInAMazeJava,
    ratInAMazePython,
    ratInAMazeJS,
} from "../algorithms/ratInAMaze";
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

export default function RatInAMazePage() {
    useDocumentTitle("Rat in a Maze Visualizer");
    const navigate = useNavigate();

    // --- State ---
    const [mazeSize, setMazeSize] = useState(5);
    // 1 = open path, 0 = wall
    const [initialMaze, setInitialMaze] = useState(() => 
        Array.from({ length: 5 }, () => Array(5).fill(1))
    );
    
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
            ? ratInAMazeCPP
            : selectedLanguage === "Java"
                ? ratInAMazeJava
                : selectedLanguage === "Python"
                    ? ratInAMazePython
                    : ratInAMazeJS;

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

    // Update maze when size changes
    useEffect(() => {
        if (runStatus === "Idle") {
            setInitialMaze((prev) => {
                const newMaze = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(1));
                // Copy existing walls
                for (let i = 0; i < Math.min(prev.length, mazeSize); i++) {
                    for (let j = 0; j < Math.min(prev[i].length, mazeSize); j++) {
                        newMaze[i][j] = prev[i][j];
                    }
                }
                return newMaze;
            });
        }
    }, [mazeSize, runStatus]);

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
        const { steps: generatedSteps, solutions } = generateRatInAMazeSteps(initialMaze);
        setSteps(generatedSteps);
        setTotalSolutions(solutions);
        setCurrentStepIndex(0);
        setRunStatus("Running");
        setIsPaused(false);
        setElapsedSeconds(0);
    }, [initialMaze]);

    // --- Editing Maze ---
    const toggleCell = (r, c) => {
        if (runStatus !== "Idle") return;
        // Don't toggle start and end unconditionally, they should ideally be open, but we let them do whatever for flexibility
        setInitialMaze((prev) => {
            const newMaze = prev.map(row => [...row]);
            newMaze[r][c] = newMaze[r][c] === 1 ? 0 : 1;
            return newMaze;
        });
    };

    const generateRandomMaze = () => {
        if (runStatus !== "Idle") return;
        handleReset();
        setInitialMaze(() => {
            const newMaze = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(0));
            for(let i=0; i<mazeSize; i++) {
                for(let j=0; j<mazeSize; j++) {
                    newMaze[i][j] = Math.random() > 0.3 ? 1 : 0; // 70% chance of path
                }
            }
            newMaze[0][0] = 1; // Start open
            newMaze[mazeSize-1][mazeSize-1] = 1; // End open
            return newMaze;
        });
    }

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
        link.download = `RatInAMaze${ext}`;
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
        let baseColor = initialMaze[r][c] === 1 ? "bg-slate-700/50" : "bg-slate-900";
        if (r === 0 && c === 0 && initialMaze[r][c] === 1) baseColor = "bg-sky-900/40 border-sky-500/50";
        if (r === mazeSize - 1 && c === mazeSize - 1 && initialMaze[r][c] === 1) baseColor = "bg-indigo-900/40 border-indigo-500/50";
        
        if (runStatus === "Idle") {
            if (initialMaze[r][c] === 0) return "bg-slate-950 border-slate-800 diagonal-lines";
            return `${baseColor} hover:bg-slate-600/50 cursor-pointer`;
        }
        
        // During animation
        if (!currentStep) return initialMaze[r][c] === 0 ? "bg-slate-950 border-slate-800 diagonal-lines" : baseColor;

        if (currentStep.maze[r][c] === 0) return "bg-slate-950 border-slate-800 diagonal-lines";
        
        const isCurrentCell = currentStep.row === r && currentStep.col === c;
        const isVisited = currentStep.visited[r][c] === 1;

        if (isCurrentCell) {
            if (currentStep.phase === "trying") return "bg-yellow-500/50 border-yellow-400 ring-2 ring-yellow-400/50";
            if (currentStep.phase === "conflict") return "bg-red-500/50 border-red-400 ring-2 ring-red-400/50";
            if (currentStep.phase === "placed" || currentStep.phase === "solution-found") return "bg-emerald-500/50 border-emerald-400 ring-2 ring-emerald-400/50";
            if (currentStep.phase === "backtrack") return "bg-orange-500/40 border-orange-400 ring-2 ring-orange-400/50";
        }

        if (isVisited) {
            return "bg-emerald-500/20 border-emerald-500/50";
        }

        return baseColor;
    };

    const n = mazeSize;

    return (
        <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <style>{`
                .diagonal-lines {
                    background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px);
                }
            `}</style>
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.1),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(16,185,129,0.15),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                                Backtracking
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                {formatElapsed(elapsedSeconds)}
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Time: <span className="text-emerald-200 font-mono">O(4^N²)</span>
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Space: <span className="text-emerald-200 font-mono">O(N²)</span>
                            </span>
                        </div>

                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            Rat in a Maze Problem
                        </h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base">
                            Find paths for a rat to travel from the source (top-left) to the destination (bottom-right) in a maze, avoiding the walls. Uses recursive DFS and backtracking.
                        </p>

                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Computation Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.35 }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Maze Size</p>
                                <p className="mt-1 text-sm font-semibold text-white">{mazeSize} × {mazeSize}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Path Length</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">{currentStep?.path?.length ?? 0}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Paths Found</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-400">
                                    {currentStep?.solutionsFound ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Complexity</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">O(4^N²)</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Status Panel */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-emerald-300" /> Live Status
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
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Col</p>
                                    <p className="text-lg font-bold text-purple-300">
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
                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Paths</p>
                                    <p className="text-lg font-bold text-emerald-100">{currentStep?.solutionsFound ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══ MAIN CONTENT: Controls | Maze | Legend ═══ */}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:items-stretch">

                {/* Left Sidebar: Controls */}
                <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
                    <div className="mb-5 flex items-center gap-2">
                        <Waypoints size={18} className="text-emerald-300" />
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
                                className="w-full accent-emerald-400"
                                style={{ direction: "rtl" }}
                            />
                        </div>

                        {/* Maze Size */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span>Maze Size (N)</span>
                                <span className="text-white font-bold">{mazeSize}</span>
                            </label>
                            <input
                                type="range"
                                min="3"
                                max="8"
                                step="1"
                                value={mazeSize}
                                onChange={(e) => setMazeSize(Number(e.target.value))}
                                disabled={runStatus !== "Idle"}
                                className="w-full accent-emerald-400 cursor-pointer disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button
                                onClick={generateRandomMaze}
                                disabled={runStatus !== "Idle"}
                                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                <Shuffle size={16} /> Random Walls
                            </button>
                            <button
                                onClick={handleReset}
                                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30 transition-colors"
                            >
                                <RotateCcw size={16} /> Reset Run
                            </button>
                        </div>

                        {runStatus === "Idle" || runStatus === "Completed" ? (
                            <button
                                onClick={() => {
                                    if (runStatus === "Completed") handleReset();
                                    setTimeout(runAlgorithm, 100);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 font-bold text-white shadow-lg hover:shadow-emerald-500/25 transition-all"
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

                {/* Center: Maze Grid */}
                <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col items-center justify-center">
                    <div className="flex justify-between w-full">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 self-start">
                            Maze Grid ({n}×{n})
                        </h2>
                        {runStatus === "Idle" && (
                            <span className="text-xs text-slate-400 bg-white/5 py-1 px-2 rounded font-medium border border-white/10">Click cells to toggle walls</span>
                        )}
                    </div>

                    <div className="flex-1 flex items-center justify-center w-full">
                        <div
                            className="inline-grid gap-1 border-2 border-slate-700 rounded-xl overflow-hidden p-2 shadow-inner bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                            style={{
                                gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                                width: `min(100%, ${n * 64 + 16}px)`,
                                aspectRatio: "1 / 1",
                            }}
                        >
                            {Array.from({ length: n * n }).map((_, idx) => {
                                const r = Math.floor(idx / n);
                                const c = idx % n;
                                const isCurrentTry = currentStep?.row === r && currentStep?.col === c;

                                return (
                                    <motion.div
                                        key={`${r}-${c}`}
                                        onClick={() => toggleCell(r, c)}
                                        className={`relative flex items-center justify-center rounded-sm transition-colors duration-200 border border-white/5 ${getCellStyle(r, c)}`}
                                        animate={isCurrentTry ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* Status Icon Indicator inside cell during animation */}
                                        {isCurrentTry && currentStep?.phase === "trying" && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.8 }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,1)]"></div>
                                            </motion.div>
                                        )}
                                        {isCurrentTry && currentStep?.phase === "conflict" && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-xl drop-shadow-[0_0_5px_rgba(239,68,68,1)]"
                                            >
                                                ✗
                                            </motion.div>
                                        )}
                                        
                                        {/* Rat Path Trail Indicator */}
                                        {currentStep && currentStep.visited[r][c] === 1 && !isCurrentTry && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] opacity-90 mx-auto my-auto" />
                                        )}

                                        {/* Start/End Labeling Text (only if not covered by a larger icon) */}
                                        {r === 0 && c === 0 && (
                                           <span className="absolute top-0.5 left-1 text-[8px] font-bold text-slate-400 select-none">S</span> 
                                        )}
                                        {r === n - 1 && c === n - 1 && (
                                           <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-slate-400 select-none">E</span> 
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cell Styles</p>
                            <div className="space-y-2 text-[11px] text-slate-300">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-slate-700/50 border border-slate-600" />
                                    <span>Open Path (1)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-slate-950 border border-slate-800 diagonal-lines" />
                                    <span>Wall / Blocked (0)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-yellow-500/50 border border-yellow-400" />
                                    <span>Checking Direction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                                    <span>Visited Path</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-orange-500/40 border border-orange-400" />
                                    <span>Backtracking</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Algorithm Steps</p>
                            <div className="text-[11px] text-slate-300 space-y-1.5">
                                <p>1. Start at (0,0)</p>
                                <p>2. Try exploring recursively in 4 directions (<span className="text-emerald-300 font-semibold">D, L, R, U</span>)</p>
                                <p>3. If a valid, unvisited cell is found, mark as visited and proceed.</p>
                                <p>4. If stuck or returning, <span className="text-orange-300 font-semibold">backtrack</span> and untoggle visited.</p>
                                <p>5. Continue until reaching Destination (N-1, N-1).</p>
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
