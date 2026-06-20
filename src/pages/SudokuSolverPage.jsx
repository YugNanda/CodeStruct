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
    Grid3X3,
} from "lucide-react";
import {
    generateSudokuSteps,
    sudokuCPP,
    sudokuJava,
    sudokuPython,
    sudokuJS,
} from "../algorithms/sudoku";
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

// A standard hard Sudoku puzzle to display
const INITIAL_BOARD = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
];

export default function SudokuSolverPage() {
    useDocumentTitle("Sudoku Solver Visualizer");
    const navigate = useNavigate();

    // --- State ---
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [runStatus, setRunStatus] = useState("Idle");
    const [speed, setSpeed] = useState(10); // Sudoku needs to be fast
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [copyState, setCopyState] = useState("idle");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");

    const timerRef = useRef(null);

    const activeCode =
        selectedLanguage === "C++"
            ? sudokuCPP
            : selectedLanguage === "Java"
                ? sudokuJava
                : selectedLanguage === "Python"
                    ? sudokuPython
                    : sudokuJS;

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
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleReset = () => {
        stopAnimation();
        setSteps([]);
        setCurrentStepIndex(-1);
        setRunStatus("Idle");
        setIsPaused(false);
        setElapsedSeconds(0);
    };

    const runAlgorithm = useCallback(() => {
        const { steps: generatedSteps } = generateSudokuSteps(INITIAL_BOARD);
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setRunStatus("Running");
        setIsPaused(false);
        setElapsedSeconds(0);
    }, []);

    // --- Playback ---
    useEffect(() => {
        if (runStatus === "Running" && !isPaused) {
            timerRef.current = setInterval(() => {
                setCurrentStepIndex((prev) => {
                    const next = prev + 1;
                    if (next >= steps.length - 1) {
                        stopAnimation();
                        setRunStatus("Completed");
                        return steps.length - 1;
                    }
                    return next;
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
        link.download = `SudokuSolver${ext}`;
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
        // Base alternating background for 3x3 blocks
        const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const isDarkBox = boxIndex % 2 === 1;
        const baseColor = isDarkBox ? "bg-slate-700/30" : "bg-slate-800/40";
        
        // Borders to delineate 3x3 blocks
        const borderRight = c % 3 === 2 && c !== 8 ? "border-r-2 border-r-slate-400" : "border-r border-r-slate-600/50";
        const borderBottom = r % 3 === 2 && r !== 8 ? "border-b-2 border-b-slate-400" : "border-b border-b-slate-600/50";
        const borderTop = r === 0 ? "border-t border-t-slate-600/50" : "";
        const borderLeft = c === 0 ? "border-l border-l-slate-600/50" : "";
        
        const borderStyles = `${borderRight} ${borderBottom} ${borderTop} ${borderLeft}`;

        if (!currentStep) return `${baseColor} ${borderStyles}`;

        // Current cell being tried
        if (currentStep.row === r && currentStep.col === c) {
            if (currentStep.phase === "trying") return `bg-yellow-500/40 ring-inset ring-2 ring-yellow-400 z-10 ${borderStyles}`;
            if (currentStep.phase === "conflict") return `bg-red-500/40 ring-inset ring-2 ring-red-400 z-10 ${borderStyles}`;
            if (currentStep.phase === "placed") return `bg-emerald-500/40 ring-inset ring-2 ring-emerald-400 z-10 ${borderStyles}`;
            if (currentStep.phase === "backtrack") return `bg-orange-500/40 ring-inset ring-2 ring-orange-400 z-10 ${borderStyles}`;
        }

        // Highlight row, col, and box for the currently trying cell
        if (currentStep.row !== -1 && currentStep.col !== -1) {
            const currentBoxIndex = Math.floor(currentStep.row / 3) * 3 + Math.floor(currentStep.col / 3);
            if (r === currentStep.row || c === currentStep.col || boxIndex === currentBoxIndex) {
                 return `bg-slate-600/40 ${borderStyles}`;
            }
        }

        return `${baseColor} ${borderStyles}`;
    };

    const getCellTextColor = (r, c, val) => {
        // Initial fixed numbers
        if (INITIAL_BOARD[r][c] !== 0) return "text-white font-bold";
        
        // Filled by algorithm
        if (val !== 0) {
            if (currentStep?.row === r && currentStep?.col === c) {
                 if (currentStep.phase === "conflict") return "text-red-300 font-bold";
                 if (currentStep.phase === "backtrack") return "text-orange-300 font-bold";
                 if (currentStep.phase === "placed") return "text-emerald-300 font-bold";
                 return "text-yellow-300 font-bold";
            }
            // Recently placed but not current
            return "text-sky-300 font-semibold";
        }
        return "text-transparent";
    };

    const board = currentStep?.board || INITIAL_BOARD;

    return (
        <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

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
                            <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-200">
                                Backtracking
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                {formatElapsed(elapsedSeconds)}
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Time: <span className="text-sky-200 font-mono">O(9^(N×N))</span>
                            </span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">
                                Space: <span className="text-sky-200 font-mono">O(N×N)</span>
                            </span>
                        </div>

                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            Sudoku Solver
                        </h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base">
                            Fill the 9×9 grid perfectly using recursive backtracking. Exploring possibilities
                            cell by cell until a valid solution forms.
                        </p>

                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Computation Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-sky-500 to-blue-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Board Size</p>
                                <p className="mt-1 text-sm font-semibold text-white">9 × 9</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Filled</p>
                                <p className="mt-1 text-sm font-semibold text-sky-200">
                                     {board.flat().filter(x => x !== 0).length} / 81
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Step</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-200">
                                    {Math.max(0, currentStepIndex)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Complexity</p>
                                <p className="mt-1 text-sm font-semibold text-sky-200">O(9^81)</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Status Panel */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-sky-300" /> Live Status
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
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══ MAIN CONTENT: Controls | Grid | Legend ═══ */}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:items-stretch">

                {/* Left Sidebar: Controls */}
                <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
                    <div className="mb-5 flex items-center gap-2">
                        <Waypoints size={18} className="text-sky-300" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                        {/* Speed Slider */}
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                                <span><Clock3 size={13} className="mr-1 inline" /> Delay</span>
                                <span>{speed}ms</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="500"
                                step="1"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="w-full accent-sky-400"
                                style={{ direction: "rtl" }}
                            />
                            <p className="text-[10px] text-slate-500 mt-1 text-center">
                                Sudoku solves can have many steps. Keep delay low.
                            </p>
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
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-sky-600 to-blue-500 py-3.5 font-bold text-white shadow-lg hover:shadow-sky-500/25 transition-all"
                            >
                                <Play size={18} fill="currentColor" />{" "}
                                {runStatus === "Completed" ? "Restart" : "Start"}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white ${isPaused ? "bg-emerald-600" : "bg-sky-500 text-slate-900"}`}
                            >
                                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                                {isPaused ? "Resume" : "Pause"}
                            </button>
                        )}
                        <HotkeysHint />
                    </div>
                </aside>

                {/* Center: Sudoku Grid Visualization */}
                <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur relative flex flex-col items-center justify-center">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 self-start flex items-center gap-2">
                        <Grid3X3 size={18} className="text-sky-300" />
                        Sudoku Grid
                    </h2>

                    <div className="flex-1 flex items-center justify-center w-full">
                        <div
                            className="inline-grid border-4 border-slate-400 rounded-sm overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.15)] bg-slate-400 gap-px"
                            style={{
                                gridTemplateColumns: `repeat(9, minmax(0, 1fr))`,
                                width: `min(100%, ${9 * 48}px)`,
                                aspectRatio: "1 / 1",
                            }}
                        >
                            {Array.from({ length: 81 }).map((_, idx) => {
                                const r = Math.floor(idx / 9);
                                const c = idx % 9;
                                const val = board[r][c];
                                
                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        className={`relative flex items-center justify-center text-xl md:text-2xl transition-colors duration-75 ${getCellStyle(r, c)}`}
                                    >
                                        <span className={getCellTextColor(r, c, val)}>
                                            {val !== 0 ? val : ""}
                                        </span>
                                    </div>
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
                                    <span className="h-3 w-3 rounded bg-slate-600/40 border border-slate-500" />
                                    <span>Same Row/Col/Box</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-yellow-500/40 border border-yellow-400" />
                                    <span>Trying Number</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-emerald-500/40 border border-emerald-400" />
                                    <span>Temporarily Placed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-red-500/40 border border-red-400" />
                                    <span>Conflict Detected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded bg-orange-500/40 border border-orange-400" />
                                    <span>Backtracking & Clearing</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Algorithm</p>
                            <div className="text-[11px] text-slate-300 space-y-1.5">
                                <p>1. Find an empty cell</p>
                                <p>2. Try placing digits 1-9</p>
                                <p>3. If a digit is valid, recursively solve</p>
                                <p>4. If a dead end is reached, <span className="text-orange-300 font-semibold">backtrack</span> and try next digit</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Rules</p>
                            <div className="text-[11px] text-slate-300 space-y-1.5">
                                <p>• Digits 1-9 without repetition in each <span className="text-sky-300 font-semibold">row</span></p>
                                <p>• Digits 1-9 without repetition in each <span className="text-sky-300 font-semibold">column</span></p>
                                <p>• Digits 1-9 without repetition in each <span className="text-sky-300 font-semibold">3×3 subgrid</span></p>
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
                        <Code2 size={20} className="text-sky-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                            {selectedLanguage} Source
                        </span>
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}
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
