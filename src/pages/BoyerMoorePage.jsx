import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    Shuffle,
    Target,
    Info
} from "lucide-react";
import {
    boyerMooreCPP,
    boyerMooreJava,
    boyerMoorePython,
    boyerMooreJS,
    generateBoyerMooreSteps,
} from "../algorithms/boyerMooreVoting";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
    Idle: "border-white/15 bg-white/5 text-slate-200",
    Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

export default function BoyerMoorePage() {
    const navigate = useNavigate();
    const [array, setArray] = useState([2, 2, 1, 1, 1, 2, 2]);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [runStatus, setRunStatus] = useState("Idle");
    const [speed, setSpeed] = useState(600);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("C++");
    const [copyState, setCopyState] = useState("idle");

    const timerRef = useRef(null);

    const activeCode = useMemo(() => {
        if (selectedLanguage === "Java") return boyerMooreJava;
        if (selectedLanguage === "Python") return boyerMoorePython;
        if (selectedLanguage === "JavaScript") return boyerMooreJS;
        return boyerMooreCPP;
    }, [selectedLanguage]);

    const currentStep = steps[currentStepIndex] || null;

    const handleGenerateNewArray = () => {
        handleReset();
        const size = 10;
        const majorityElement = Math.floor(Math.random() * 10) + 1;
        const otherElement = Math.floor(Math.random() * 10) + 11;

        const newArr = new Array(10).fill(0).map((_, i) =>
            i < 6 ? majorityElement : otherElement
        ).sort(() => Math.random() - 0.5); 

        setArray(newArr);
    };

    const handleReset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSteps([]);
        setCurrentStepIndex(-1);
        setRunStatus("Idle");
        setIsPaused(false);
    };

    const runAlgorithm = () => {
        const generatedSteps = generateBoyerMooreSteps(array);
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setRunStatus("Running");
        setIsPaused(false);
    };

    useEffect(() => {
        if (runStatus === "Running" && !isPaused) {
            timerRef.current = setInterval(() => {
                setCurrentStepIndex((prev) => {
                    if (prev < steps.length - 1) return prev + 1;
                    setRunStatus("Completed");
                    return prev;
                });
            }, speed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [runStatus, isPaused, steps.length, speed]);

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
            if (runStatus === "Running" || runStatus === "Paused") {
                setIsPaused((prev) => {
                    const next = !prev;
                    setRunStatus(next ? "Paused" : "Running");
                    return next;
                });
                return;
            }
            if (runStatus === "Completed") handleReset();
            setTimeout(runAlgorithm, 50);
            return;
        }

        if (key === "r") {
            e.preventDefault();
            handleReset();
            return;
        }

        if (key === "n") {
            e.preventDefault();
            if (runStatus !== "Running") handleGenerateNewArray();
        }
    });

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(activeCode);
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 1400);
    };

    const handleDownloadCode = () => {
        const blob = new Blob([activeCode], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `BoyerMoore${selectedLanguage === "Python" ? ".py" : ".txt"}`;
        link.click();
    };

    return (
        <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
            <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(225,29,72,0.15),transparent_32%)]" />

            {/* Header Section */}
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-6 backdrop-blur shadow-2xl">
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <button onClick={() => navigate("/algorithms")} className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10">
                            <ArrowLeft size={14} /> Back to Algorithms
                        </button>
                        <div className="mb-4 flex gap-2">
                            <span className="rounded-full bg-rose-500/10 border border-rose-400/25 px-3 py-1 text-xs font-bold text-rose-200">ARRAYS</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${runStatusStyleMap[runStatus]}`}>{runStatus}</span>
                        </div>
                        <h1 className="text-3xl font-black text-white sm:text-5xl">Boyer–Moore Voting</h1>
                        <p className="mt-3 text-slate-300">An O(n) time and O(1) space algorithm to find the majority element.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                            <Activity size={14} className="text-rose-300" /> Algorithm Insight
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white/5 p-3 text-center">
                                <p className="text-[10px] text-slate-400 uppercase">Current Phase</p>
                                <p className="text-sm font-bold text-sky-300">{currentStep?.phase === 1 ? "1: Finding Candidate" : currentStep?.phase === 2 ? "2: Verification" : "Complete"}</p>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3 text-center">
                                <p className="text-[10px] text-slate-400 uppercase">Live Count</p>
                                <p className="text-xl font-black text-yellow-300">{currentStep ? currentStep.count : 0}</p>
                            </div>
                        </div>
                        <div className="mt-3 rounded-xl bg-white/5 p-3 min-h-[50px]">
                            <p className="text-[10px] text-slate-400">Current Logic Step</p>
                            <p className="text-sm font-semibold text-white">{currentStep?.description || "Ready to start visualization."}</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                {/* Controls Sidebar */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur flex flex-col gap-6">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Target size={16} className="text-rose-400" /> Controls</h2>
                        <div className="mt-4 rounded-2xl bg-white/5 p-4">
                            <label className="flex justify-between text-xs text-slate-400 uppercase mb-2">
                                <span><Clock3 size={13} className="inline mr-1" /> Speed</span>
                                <span>{speed}ms</span>
                            </label>
                            <input type="range" min="50" max="1500" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full accent-blue-500" style={{ direction: "rtl" }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleReset} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"><RotateCcw size={16} /> Reset</button>
                            <button onClick={handleGenerateNewArray} disabled={runStatus === "Running"} className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 py-3 text-sm font-bold text-rose-100 disabled:opacity-50"><Shuffle size={16} /> New Array</button>
                        </div>
                        <button onClick={() => { if (runStatus === "Completed") handleReset(); setTimeout(runAlgorithm, 50); }} className="w-full rounded-2xl bg-linear-to-r from-rose-600 to-red-500 py-4 font-black text-white shadow-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all">
                            {runStatus === "Running" ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            {runStatus === "Completed" ? "Restart" : runStatus === "Running" ? "Active" : "Start Learning"}
                        </button>
                        <HotkeysHint className="mt-1" />
                    </div>
                </aside>

                {/* Array Visualization */}
                <section className="rounded-3xl border border-white/10 bg-slate-800/35 p-8 backdrop-blur shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
                    <div className="flex flex-wrap justify-center gap-4">
                        {array.map((num, idx) => {
                            const isActive = currentStep?.currentIndex === idx;
                            const isCandidate = currentStep?.candidate === num && currentStep?.candidate !== null;
                            return (
                                <motion.div
                                    key={idx}
                                    layout
                                    className={`relative flex h-20 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all duration-300 
                    ${isActive ? "scale-110 border-sky-400 bg-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.4)]" : "border-white/10 bg-slate-950/50"}
                    ${isCandidate && !isActive ? "border-amber-500/40" : ""}`}
                                >
                                    <span className={isActive ? "text-sky-300" : isCandidate ? "text-amber-300" : "text-slate-400"}>{num}</span>
                                    {isActive && <motion.div layoutId="ptr" className="absolute -top-12 text-sky-400"><Activity size={28} /></motion.div>}
                                    {isCandidate && <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-500 text-[8px] text-slate-900 font-bold">CANDIDATE</div>}
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-16 w-full max-w-md rounded-2xl border border-white/5 bg-slate-900/50 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Info size={14} /> Knowledge Corner</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Majority Threshold:</span>
                                <span className="text-white font-mono">{`> ${Math.floor(array.length / 2)}`}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                                <span className="text-slate-500">Current Candidate:</span>
                                <span className="text-amber-300 font-bold">{currentStep?.candidate ?? "None"}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: steps.length > 0
                                            ? `${((currentStepIndex + 1) / steps.length) * 100}%`
                                            : "0%"
                                    }}
                                    className="h-full bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Code Display Section (Preserving all Floyd-Warshall style features) */}
            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
                <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Code2 size={20} className="text-blue-400" />
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all \${selectedLanguage === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{lang}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCopyCode} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 border border-white/10 hover:bg-white/10">
                            {copyState === "copied" ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />} {copyState === "copied" ? "Copied" : "Copy"}
                        </button>
                        <button onClick={handleDownloadCode} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 border border-white/10 hover:bg-white/10">
                            <Download size={14} /> Download
                        </button>
                    </div>
                </div>
                <div className="max-h-125 overflow-auto p-6 font-code text-sm leading-relaxed text-slate-300 ll-scrollbar">
                    <pre><code>{activeCode.split("\n").map((line, i) => (
                        <div key={i} className="flex hover:bg-white/5 px-2 rounded">
                            <span className="w-8 shrink-0 text-slate-600 text-right pr-4 text-xs select-none">{i + 1}</span>
                            <span>{renderHighlightedCode(line)}</span>
                        </div>
                    ))}</code></pre>
                </div>
            </section>
        </div>
    );
}
