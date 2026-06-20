import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    ArrowRight,
    ArrowLeft,
    CheckCheck,
    Code2,
    Copy,
    Download,
    Layers,
    Pause,
    Play,
    RotateCcw,
    Shuffle,
    Trash2,
    Eye,
} from "lucide-react";
import {
    queueEnqueueDequeueCPP,
    queueArrayCPP,
    queueEnqueueDequeueJava,
    queueArrayJava,
    queueEnqueueDequeuePython,
    queueArrayPython,
    queueEnqueueDequeueJS,
    queueArrayJS,
} from "../algorithms/queue";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const runStatusStyleMap = {
    Idle: "border-white/15 bg-white/5 text-slate-200",
    Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const queueOperations = {
    enqueueDequeue: {
        title: "Enqueue-Dequeue Operations",
        description:
            "Visualize the FIFO (First In, First Out) behavior of a queue with animated enqueue and dequeue operations.",
        enqueueTime: "O(1)",
        dequeueTime: "O(1)",
        space: "O(n)",
        cppSnippet: queueEnqueueDequeueCPP,
        javaSnippet: queueEnqueueDequeueJava,
        pythonSnippet: queueEnqueueDequeuePython,
        jsSnippet: queueEnqueueDequeueJS,
    },
    arrayImpl: {
        title: "Array-Based Queue",
        description:
            "Circular queue implementation using a fixed-size array with enqueue, dequeue, peek, and size operations.",
        enqueueTime: "O(1)",
        dequeueTime: "O(1)",
        space: "O(n)",
        cppSnippet: queueArrayCPP,
        javaSnippet: queueArrayJava,
        pythonSnippet: queueArrayPython,
        jsSnippet: queueArrayJS,
    },
};

const elementStatusClassMap = {
    default: "border-teal-400/30 bg-teal-500/20 text-teal-100",
    enqueuing: "border-emerald-400/50 bg-emerald-500/30 text-emerald-100",
    dequeuing: "border-rose-400/50 bg-rose-500/30 text-rose-100",
    front: "border-cyan-400/50 bg-cyan-500/25 text-cyan-100",
    rear: "border-amber-400/50 bg-amber-500/25 text-amber-100",
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomValue() {
    return Math.floor(Math.random() * 90) + 10;
}

function getElementStatusClass(status) {
    return elementStatusClassMap[status] ?? elementStatusClassMap.default;
}

export default function QueueVisualizerPage() {
    useDocumentTitle("Queue Visualizer");

    const [queue, setQueue] = useState([]);
    const [maxSize] = useState(10);
    const [speed, setSpeed] = useState(400);
    const [selectedOperation, setSelectedOperation] = useState("enqueueDequeue");
    const [runStatus, setRunStatus] = useState("Idle");
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [operationCount, setOperationCount] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Ready to enqueue or dequeue elements.");
    const [copyState, setCopyState] = useState("idle");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");
    const [inputValue, setInputValue] = useState("");
    const [operationHistory, setOperationHistory] = useState([]);
    const [totalOperations, setTotalOperations] = useState(0);

    const stopSignal = useRef(false);
    const pauseSignal = useRef(false);

    const MotionSection = motion.section;
    const MotionButton = motion.button;
    const MotionDiv = motion.div;

    const activeOperation = queueOperations[selectedOperation];

    const activeCodeSnippet = useMemo(() => {
        if (selectedLanguage === "C++") return activeOperation.cppSnippet;
        if (selectedLanguage === "Python") return activeOperation.pythonSnippet;
        if (selectedLanguage === "Java") return activeOperation.javaSnippet;
        return activeOperation.jsSnippet;
    }, [selectedLanguage, activeOperation]);

    const progress = useMemo(() => {
        if (totalOperations === 0) return 0;
        return runStatus === "Completed"
            ? 100
            : Math.min(Math.round((operationCount / totalOperations) * 100), 99);
    }, [runStatus, operationCount, totalOperations]);

    const frontElement = useMemo(() => {
        return queue.length > 0 ? queue[0] : null;
    }, [queue]);

    const rearElement = useMemo(() => {
        return queue.length > 0 ? queue[queue.length - 1] : null;
    }, [queue]);

    const waitWithControl = useCallback(async (durationMs) => {
        let elapsed = 0;
        while (elapsed < durationMs) {
            if (stopSignal.current) return false;
            while (pauseSignal.current) {
                if (stopSignal.current) return false;
                await sleep(80);
            }
            const chunk = Math.min(40, durationMs - elapsed);
            await sleep(chunk);
            elapsed += chunk;
        }
        return !stopSignal.current;
    }, []);

    const hardStopRun = useCallback(() => {
        stopSignal.current = true;
        pauseSignal.current = false;
        setIsRunning(false);
        setIsPaused(false);
    }, []);

    const resetQueue = useCallback(() => {
        hardStopRun();
        setQueue([]);
        setRunStatus("Idle");
        setOperationCount(0);
        setTotalOperations(0);
        setOperationHistory([]);
        setStatusMessage("Queue cleared. Ready for new operations.");
    }, [hardStopRun]);

    const generateRandomQueue = useCallback(() => {
        hardStopRun();
        const size = Math.floor(Math.random() * 5) + 3;
        const newQueue = Array.from({ length: size }, () => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            value: getRandomValue(),
            status: "default",
        }));
        setQueue(newQueue);
        setRunStatus("Idle");
        setOperationCount(0);
        setTotalOperations(0);
        setOperationHistory([]);
        setStatusMessage(`Generated queue with ${size} elements.`);
    }, [hardStopRun]);

    const handleEnqueue = useCallback(async (value) => {
        if (queue.length >= maxSize) {
            setStatusMessage("Queue Overflow! Maximum size reached.");
            return;
        }

        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
            setStatusMessage("Please enter a valid number.");
            return;
        }

        stopSignal.current = false;
        pauseSignal.current = false;
        setIsRunning(true);
        setRunStatus("Running");
        setTotalOperations((prev) => prev + 1);

        const newElement = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            value: numValue,
            status: "enqueuing",
        };

        setStatusMessage(`Enqueuing ${numValue} to the rear...`);
        setQueue((prev) => [...prev.map(el => ({ ...el, status: "default" })), newElement]);

        const canContinue = await waitWithControl(speed);
        if (!canContinue) return;

        setQueue((prev) =>
            prev.map((el, idx) => {
                if (idx === 0 && prev.length > 1) return { ...el, status: "front" };
                if (idx === prev.length - 1) return { ...el, status: "rear" };
                return { ...el, status: "default" };
            })
        );

        setOperationCount((prev) => prev + 1);
        setOperationHistory((prev) => [...prev, { type: "enqueue", value: numValue }]);
        setStatusMessage(`Enqueued ${numValue}. Queue size: ${queue.length + 1}`);
        setInputValue("");
        setIsRunning(false);
        setRunStatus("Completed");

        await sleep(500);
        setQueue((prev) =>
            prev.map((el, idx) => {
                if (prev.length === 1) return { ...el, status: "front" };
                if (idx === 0) return { ...el, status: "front" };
                if (idx === prev.length - 1) return { ...el, status: "rear" };
                return { ...el, status: "default" };
            })
        );
    }, [queue.length, maxSize, speed, waitWithControl]);

    const handleDequeue = useCallback(async () => {
        if (queue.length === 0) {
            setStatusMessage("Queue Underflow! Queue is empty.");
            return;
        }

        stopSignal.current = false;
        pauseSignal.current = false;
        setIsRunning(true);
        setRunStatus("Running");
        setTotalOperations((prev) => prev + 1);

        const frontValue = queue[0]?.value;
        setStatusMessage(`Dequeuing ${frontValue} from the front...`);

        setQueue((prev) =>
            prev.map((el, idx) =>
                idx === 0
                    ? { ...el, status: "dequeuing" }
                    : { ...el, status: "default" }
            )
        );

        const canContinue = await waitWithControl(speed);
        if (!canContinue) return;

        setQueue((prev) => {
            const newQueue = prev.slice(1);
            if (newQueue.length > 0) {
                newQueue[0] = { ...newQueue[0], status: "front" };
                if (newQueue.length > 1) {
                    newQueue[newQueue.length - 1] = { ...newQueue[newQueue.length - 1], status: "rear" };
                }
            }
            return newQueue;
        });

        setOperationCount((prev) => prev + 1);
        setOperationHistory((prev) => [...prev, { type: "dequeue", value: frontValue }]);
        setStatusMessage(`Dequeued ${frontValue}. Queue size: ${queue.length - 1}`);
        setIsRunning(false);
        setRunStatus("Completed");
    }, [queue, speed, waitWithControl]);

    const handlePeek = useCallback(() => {
        if (queue.length === 0) {
            setStatusMessage("Queue is empty! Nothing to peek.");
            return;
        }
        const frontValue = queue[0]?.value;
        setStatusMessage(`Peek: Front element is ${frontValue}`);
        setQueue((prev) =>
            prev.map((el, idx) =>
                idx === 0
                    ? { ...el, status: "front" }
                    : { ...el, status: "default" }
            )
        );
    }, [queue]);

    const handleAutoEnqueueDequeue = useCallback(async () => {
        if (isRunning) return;

        stopSignal.current = false;
        pauseSignal.current = false;
        setIsRunning(true);
        setRunStatus("Running");
        setOperationCount(0);
        setTotalOperations(6);
        setOperationHistory([]);
        setQueue([]);

        // Auto enqueue 3 elements
        for (let i = 0; i < 3; i++) {
            if (stopSignal.current) break;

            while (pauseSignal.current) {
                if (stopSignal.current) break;
                await sleep(80);
            }

            const value = getRandomValue();
            const newElement = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                value,
                status: "enqueuing",
            };

            setStatusMessage(`Enqueuing ${value} to the rear...`);
            setQueue((prev) => [...prev.map(el => ({ ...el, status: "default" })), newElement]);

            await waitWithControl(speed);
            if (stopSignal.current) break;

            setQueue((prev) =>
                prev.map((el, idx) => {
                    if (prev.length === 1) return { ...el, status: "front" };
                    if (idx === 0) return { ...el, status: "front" };
                    if (idx === prev.length - 1) return { ...el, status: "rear" };
                    return { ...el, status: "default" };
                })
            );

            setOperationCount((prev) => prev + 1);
            setOperationHistory((prev) => [...prev, { type: "enqueue", value }]);
            setStatusMessage(`Enqueued ${value}`);

            await waitWithControl(speed * 0.5);
        }

        // Auto dequeue 3 elements
        for (let i = 0; i < 3; i++) {
            if (stopSignal.current) break;

            while (pauseSignal.current) {
                if (stopSignal.current) break;
                await sleep(80);
            }

            setQueue((prev) => {
                if (prev.length === 0) return prev;
                const frontValue = prev[0]?.value;
                setStatusMessage(`Dequeuing ${frontValue} from the front...`);
                return prev.map((el, idx) =>
                    idx === 0
                        ? { ...el, status: "dequeuing" }
                        : { ...el, status: "default" }
                );
            });

            await waitWithControl(speed);
            if (stopSignal.current) break;

            let dequeuedValue;
            setQueue((prev) => {
                if (prev.length === 0) return prev;
                dequeuedValue = prev[0]?.value;
                const newQueue = prev.slice(1);
                if (newQueue.length > 0) {
                    newQueue[0] = { ...newQueue[0], status: "front" };
                    if (newQueue.length > 1) {
                        newQueue[newQueue.length - 1] = { ...newQueue[newQueue.length - 1], status: "rear" };
                    }
                }
                return newQueue;
            });

            setOperationCount((prev) => prev + 1);
            if (dequeuedValue !== undefined) {
                setOperationHistory((prev) => [...prev, { type: "dequeue", value: dequeuedValue }]);
                setStatusMessage(`Dequeued ${dequeuedValue}`);
            }

            await waitWithControl(speed * 0.5);
        }

        if (!stopSignal.current) {
            setRunStatus("Completed");
            setStatusMessage("Auto enqueue-dequeue sequence completed!");
        }
        setIsRunning(false);
    }, [isRunning, speed, waitWithControl]);

    const handlePause = useCallback(() => {
        if (!isRunning || isPaused) return;
        pauseSignal.current = true;
        setIsPaused(true);
        setRunStatus("Paused");
    }, [isPaused, isRunning]);

    const handleResume = useCallback(() => {
        if (!isRunning || !isPaused) return;
        pauseSignal.current = false;
        setIsPaused(false);
        setRunStatus("Running");
    }, [isPaused, isRunning]);

    const handleCopyCode = useCallback(async () => {
        if (!navigator?.clipboard) return;
        try {
            await navigator.clipboard.writeText(activeCodeSnippet);
            setCopyState("copied");
            setTimeout(() => setCopyState("idle"), 1400);
        } catch {
            setCopyState("idle");
        }
    }, [activeCodeSnippet]);

    const handleDownloadCode = useCallback(() => {
        let extension = ".cpp";
        if (selectedLanguage === "Python") extension = ".py";
        if (selectedLanguage === "Java") extension = ".java";
        if (selectedLanguage === "JavaScript") extension = ".js";

        const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Queue${extension}`;
        link.click();
        URL.revokeObjectURL(url);
    }, [activeCodeSnippet, selectedLanguage]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === "Enter" && inputValue && !isRunning) {
            handleEnqueue(inputValue);
        }
    }, [inputValue, isRunning, handleEnqueue]);

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
                if (isPaused) handleResume();
                else handlePause();
            } else {
                handleAutoEnqueueDequeue();
            }
            return;
        }

        if (key === "r") {
            e.preventDefault();
            resetQueue();
            return;
        }

        if (key === "n") {
            e.preventDefault();
            if (!isRunning) generateRandomQueue();
        }
    });

    return (
        <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
            <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(6,182,212,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

            <MotionSection
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
            >
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-teal-400/25 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-200">
                                Queue Operations
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                                {runStatus}
                            </span>
                        </div>
                        <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            {activeOperation.title}
                        </h1>
                        <p className="mt-3 text-sm text-slate-300 sm:text-base">{activeOperation.description}</p>
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                                <MotionDiv
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                            {[
                                { label: "Enqueue", val: activeOperation.enqueueTime, color: "text-emerald-200" },
                                { label: "Dequeue", val: activeOperation.dequeueTime, color: "text-rose-200" },
                                { label: "Space", val: activeOperation.space, color: "text-blue-100" },
                                { label: "Operations", val: operationCount, color: "text-cyan-200" },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-slate-400">{stat.label}</p>
                                    <p className={`mt-1 text-sm font-semibold ${stat.color}`}>{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Activity size={14} className="text-cyan-300" /> Live Snapshot
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Queue Size</p>
                                    <p className="text-lg font-bold text-white">{queue.length} / {maxSize}</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Front Element</p>
                                    <p className="text-lg font-bold text-cyan-100">
                                        {frontElement ? frontElement.value : "Empty"}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Rear Element</p>
                                    <p className="text-lg font-bold text-amber-100">
                                        {rearElement ? rearElement.value : "Empty"}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Delay</p>
                                    <p className="text-lg font-bold text-blue-100">{speed}ms</p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3">
                                <p className="text-[11px] text-slate-400">Status</p>
                                <p className="text-sm font-semibold text-white">{statusMessage}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </MotionSection>

            <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-stretch">
                <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
                    <div className="mb-5 flex items-center gap-2">
                        <Layers size={18} className="text-teal-300" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
                    </div>
                    <div className="flex flex-1 flex-col gap-4">
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 block text-xs uppercase text-slate-400">Implementation</label>
                            <select
                                value={selectedOperation}
                                disabled={isRunning}
                                onChange={(e) => setSelectedOperation(e.target.value)}
                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none"
                            >
                                <option value="enqueueDequeue">Enqueue-Dequeue Operations</option>
                                <option value="arrayImpl">Array-Based Queue</option>
                            </select>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                                <span>Delay</span>
                                <span>{speed}ms</span>
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="800"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="w-full accent-teal-400"
                            />
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                            <label className="mb-2 block text-xs uppercase text-slate-400">Enqueue Value</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isRunning}
                                    placeholder="Enter value..."
                                    className="h-10 flex-1 rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                                />
                                <MotionButton
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEnqueue(inputValue)}
                                    disabled={isRunning || !inputValue || queue.length >= maxSize}
                                    className="flex h-10 items-center justify-center gap-1 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 text-sm font-bold text-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowRight size={14} /> Enqueue
                                </MotionButton>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDequeue}
                                disabled={isRunning || queue.length === 0}
                                className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 py-2.5 text-sm font-bold text-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft size={16} /> Dequeue
                            </MotionButton>
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePeek}
                                disabled={isRunning || queue.length === 0}
                                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Eye size={16} /> Peek
                            </MotionButton>
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                onClick={resetQueue}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white"
                            >
                                <Trash2 size={16} /> Clear
                            </MotionButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                onClick={generateRandomQueue}
                                disabled={isRunning}
                                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100 disabled:opacity-50"
                            >
                                <Shuffle size={16} /> Random
                            </MotionButton>
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownloadCode}
                                className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 py-2.5 text-sm font-bold text-blue-100"
                            >
                                <Download size={16} /> Code
                            </MotionButton>
                        </div>
                        <MotionButton
                            whileHover={{ scale: 1.02 }}
                            onClick={
                                isRunning
                                    ? isPaused
                                        ? handleResume
                                        : handlePause
                                    : handleAutoEnqueueDequeue
                            }
                            className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg ${isRunning
                                    ? isPaused
                                        ? "bg-emerald-600"
                                        : "bg-amber-500 text-slate-900"
                                    : "bg-gradient-to-r from-teal-600 to-cyan-500"
                                }`}
                        >
                            {isRunning ? (
                                isPaused ? (
                                    <Play size={18} fill="currentColor" />
                                ) : (
                                    <Pause size={18} fill="currentColor" />
                                )
                            ) : (
                                <Play size={18} fill="currentColor" />
                            )}
                            {isRunning ? (isPaused ? "Resume" : "Pause") : "Auto Demo"}
                        </MotionButton>
                        <HotkeysHint className="mt-1" />
                    </div>
                </aside>

                <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Queue Visualization</p>
                        <div className="flex gap-2">
                            {[
                                { label: "Front", color: "bg-cyan-500/50" },
                                { label: "Rear", color: "bg-amber-500/50" },
                                { label: "Enqueuing", color: "bg-emerald-500/50" },
                                { label: "Dequeuing", color: "bg-rose-500/50" },
                            ].map((item) => (
                                <span key={item.label} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase">
                                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-6">
                        {/* Queue Container — Horizontal */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="relative w-full">
                                <div className="relative min-h-[200px] rounded-2xl border-2 border-dashed border-slate-600/50 bg-slate-900/40 p-4 overflow-hidden">
                                    {queue.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-slate-500 text-sm">Queue is empty</p>
                                        </div>
                                    )}

                                    {/* FIFO direction arrows */}
                                    {queue.length > 0 && (
                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-cyan-300">
                                                <ArrowRight size={12} /> Dequeue (Front)
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-300">
                                                Enqueue (Rear) <ArrowLeft size={12} />
                                            </span>
                                        </div>
                                    )}

                                    {/* Queue elements — horizontal flow */}
                                    <div className="ll-scrollbar flex gap-2 overflow-x-auto pb-2 min-h-[120px] items-center">
                                        <AnimatePresence mode="popLayout">
                                            {queue.map((element, index) => (
                                                <motion.div
                                                    key={element.id}
                                                    layout
                                                    initial={{ opacity: 0, x: 50, scale: 0.8 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, x: -50, scale: 0.8 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 25,
                                                    }}
                                                    className={`relative rounded-xl border-2 px-5 py-4 text-center shadow-lg min-w-[72px] ${getElementStatusClass(element.status)}`}
                                                >
                                                    {index === 0 && (
                                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                                                            FRONT
                                                        </span>
                                                    )}
                                                    {index === queue.length - 1 && queue.length > 1 && (
                                                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                                                            REAR
                                                        </span>
                                                    )}
                                                    {index === 0 && queue.length === 1 && (
                                                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                                                            REAR
                                                        </span>
                                                    )}
                                                    <p className="text-lg font-bold">{element.value}</p>
                                                    <p className="text-[10px] uppercase text-slate-400">
                                                        #{index}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Capacity indicator */}
                                <div className="mt-4 text-center">
                                    <div className="h-2 rounded-full bg-slate-700/70 overflow-hidden">
                                        <motion.div
                                            animate={{ width: `${(queue.length / maxSize) * 100}%` }}
                                            className={`h-full ${queue.length >= maxSize ? "bg-rose-500" : "bg-teal-500"}`}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400">
                                        Capacity: {queue.length} / {maxSize}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Operation History */}
                        <div className="w-48 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-3">
                                History
                            </p>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto ll-scrollbar">
                                {operationHistory.length === 0 ? (
                                    <p className="text-xs text-slate-500">No operations yet</p>
                                ) : (
                                    [...operationHistory].reverse().map((op, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${op.type === "enqueue"
                                                    ? "bg-emerald-500/10 text-emerald-200"
                                                    : "bg-rose-500/10 text-rose-200"
                                                }`}
                                        >
                                            {op.type === "enqueue" ? (
                                                <ArrowRight size={12} />
                                            ) : (
                                                <ArrowLeft size={12} />
                                            )}
                                            <span className="font-semibold capitalize">{op.type}</span>
                                            <span className="font-bold">{op.value}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Code2 size={20} className="text-teal-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                            {selectedLanguage} Source
                        </span>
                        <div className="ml-4 flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang
                                            ? "bg-teal-600 text-white"
                                            : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyCode}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
                        >
                            {copyState === "copied" ? (
                                <CheckCheck size={14} className="text-emerald-400" />
                            ) : (
                                <Copy size={14} />
                            )}{" "}
                            {copyState === "copied" ? "Copied" : "Copy"}
                        </button>
                        <button
                            onClick={handleDownloadCode}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
                        >
                            <Download size={14} /> Download
                        </button>
                    </div>
                </div>
                <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm">
                    <pre>
                        <code>
                            {activeCodeSnippet.split("\n").map((line, i) => (
                                <div key={i} className="flex rounded px-2 hover:bg-white/5">
                                    <span className="w-8 shrink-0 select-none pr-4 text-right text-xs text-slate-600">
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
