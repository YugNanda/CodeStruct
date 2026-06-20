import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Play, RotateCcw, Shuffle, Pause, Target, Waypoints, Activity, Code2, Copy, Download, Zap, Paintbrush, Info
} from 'lucide-react';
import { astar, astarCPP, astarJava, astarPython, astarJS } from '../algorithms/astar';
import { renderHighlightedCode } from '../utils/codeHighlight';
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

const ROWS = 18;
const COLS = 34;

const createInitialGrid = () => {
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            row.push({ row: r, col: c, status: 'default', g: Infinity, h: 0, f: Infinity, previous: null });
        }
        grid.push(row);
    }
    return grid;
};

const runStatusStyleMap = {
    Idle: 'border-white/15 bg-white/5 text-slate-200',
    Running: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
    Paused: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
    Completed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
};

function formatElapsed(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

export default function AStarPage() {
    const [grid, setGrid] = useState(createInitialGrid());
    const [runStatus, setRunStatus] = useState('Idle');
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [speed, setSpeed] = useState(40);
    const [heuristic, setHeuristic] = useState('Manhattan');
    const [allowDiagonal, setAllowDiagonal] = useState(false);
    const [brushMode, setBrushMode] = useState('wall'); // 'wall' | 'weight'
    const [statusMessage, setStatusMessage] = useState("Draw walls/weights or drag the target nodes.");
    const [selectedLanguage, setSelectedLanguage] = useState("C++");
    const [copyState, setCopyState] = useState('idle');

    // Draggable Start and Target Nodes
    const [startPos, setStartPos] = useState({ row: 4, col: 4 });
    const [targetPos, setTargetPos] = useState({ row: 13, col: 29 });
    const [draggingNode, setDraggingNode] = useState(null); // 'start' | 'target' | null
    
    const isMousePressed = useRef(false);
    const stopSignal = useRef(false);
    const pauseSignal = useRef(false);

    const activeCode = useMemo(() => {
        const map = { "C++": astarCPP, "Java": astarJava, "Python": astarPython, "JavaScript": astarJS };
        return map[selectedLanguage];
    }, [selectedLanguage]);

    // Efficiency Calculation (Preserved from previous iteration)
    const stats = useMemo(() => {
        const total = ROWS * COLS;
        const walls = grid.flat().filter(c => c.status === 'wall').length;
        const weights = grid.flat().filter(c => c.status === 'weight').length;
        const explored = grid.flat().filter(c => c.status === 'visited' || c.status === 'processing').length;
        const pathLength = grid.flat().filter(c => c.status === 'path').length;
        const available = total - walls;
        const efficiency = available > 0 ? Math.max(0, 100 - ((explored / available) * 100)).toFixed(1) : 0;
        return { explored, walls, weights, available, pathLength, efficiency };
    }, [grid]);
    const runtimeStatus = runStatus === 'Running' && isPaused ? 'Paused' : runStatus;
    const progress = useMemo(() => {
        if (runtimeStatus === 'Completed') return 100;
        if (stats.available <= 0) return 0;
        return Math.min(Math.round((stats.explored / stats.available) * 100), 100);
    }, [runtimeStatus, stats.explored, stats.available]);

    useEffect(() => { pauseSignal.current = isPaused; }, [isPaused]);

    useEffect(() => {
        if (runStatus !== 'Running' || isPaused) return undefined;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [runStatus, isPaused]);

    // Mouse Interaction Handlers
    const handleMouseDown = (r, c) => {
        if (runStatus !== 'Idle') return;
        
        // Check if grabbing start or target node
        if (r === startPos.row && c === startPos.col) {
            setDraggingNode('start');
            return;
        }
        if (r === targetPos.row && c === targetPos.col) {
            setDraggingNode('target');
            return;
        }

        isMousePressed.current = true;
        applyBrush(r, c);
    };

    const handleMouseEnter = (r, c) => {
        if (runStatus !== 'Idle') return;
        
        // Handle dragging nodes
        if (draggingNode === 'start') {
            if (grid[r][c].status !== 'wall') setStartPos({ row: r, col: c });
            return;
        }
        if (draggingNode === 'target') {
            if (grid[r][c].status !== 'wall') setTargetPos({ row: r, col: c });
            return;
        }

        // Handle painting
        if (isMousePressed.current) applyBrush(r, c);
    };

    const handleMouseUp = () => {
        isMousePressed.current = false;
        setDraggingNode(null);
    };

    const applyBrush = (r, c) => {
        if ((r === startPos.row && c === startPos.col) || (r === targetPos.row && c === targetPos.col)) return;
        const newGrid = [...grid];
        // Toggle behavior
        newGrid[r][c].status = newGrid[r][c].status === brushMode ? 'default' : brushMode;
        setGrid(newGrid);
    };

    const handleRun = async () => {
        stopSignal.current = false;
        setIsPaused(false);
        setElapsedSeconds(0);
        setRunStatus('Running');
        const success = await astar(grid, startPos, targetPos, setGrid, speed, stopSignal, pauseSignal, setStatusMessage, heuristic, allowDiagonal);
        setRunStatus(success ? 'Completed' : 'Idle');
    };

    const resetGrid = (keepWalls = false) => {
        stopSignal.current = true;
        setRunStatus('Idle');
        setIsPaused(false);
        setElapsedSeconds(0);
        const newGrid = createInitialGrid();
        if (keepWalls) {
            grid.forEach((row, r) => row.forEach((cell, c) => {
                if (cell.status === 'wall' || cell.status === 'weight') newGrid[r][c].status = cell.status;
            }));
        }
        setGrid(newGrid);
        setStatusMessage(keepWalls ? "Path cleared, terrain kept." : "Grid fully reset.");
    };

    const generateRandomTerrain = () => {
        stopSignal.current = true;
        setRunStatus('Idle');
        setIsPaused(false);
        setElapsedSeconds(0);

        const newGrid = createInitialGrid();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const isStart = r === startPos.row && c === startPos.col;
                const isTarget = r === targetPos.row && c === targetPos.col;
                if (isStart || isTarget) continue;

                const roll = Math.random();
                if (roll < 0.18) newGrid[r][c].status = 'wall';
                else if (roll < 0.26) newGrid[r][c].status = 'weight';
            }
        }

        setGrid(newGrid);
        setStatusMessage("New random terrain generated.");
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
            if (runStatus === 'Idle' || runStatus === 'Completed') {
                handleRun();
            } else {
                setIsPaused((prev) => !prev);
            }
            return;
        }

        if (key === "r") {
            e.preventDefault();
            resetGrid(true);
            return;
        }

        if (key === "n") {
            e.preventDefault();
            generateRandomTerrain();
        }
    });

    const handleDownloadCode = () => {
        const element = document.createElement("a");
        const file = new Blob([activeCode], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `astar_${selectedLanguage.toLowerCase()}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    return (
        <div className="visualizer-page relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
            <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.15),transparent_32%)]" />

            {/* Header / Efficiency Stat */}
            <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-6 shadow-2xl backdrop-blur">
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300 border border-blue-500/20">Pathfinder</span>
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 border border-emerald-500/20">Search Efficiency: {stats.efficiency}%</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runtimeStatus]}`}>{runtimeStatus}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">{formatElapsed(elapsedSeconds)}</span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">Time: <span className="text-cyan-300 font-mono">O(E)</span></span>
                            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-slate-300">Space: <span className="text-cyan-300 font-mono">O(V)</span></span>
                        </div>
                        <h1 className="text-3xl font-black text-white sm:text-5xl">A* Search Algorithm</h1>
                        <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                            A* is an <strong>informed search</strong>. It combines actual cost (g) and estimated cost (h) to find the shortest path. Unlike Dijkstra, it intelligently navigates complex terrain costs (weights) and heuristics.
                        </p>
                        <div className="mt-6 w-full max-w-md">
                            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <span>Search Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.35 }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Activity size={14} className="text-blue-400" /> Live Diagnostics</p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Status Message</p>
                                <p className="text-sm font-semibold text-white min-h-[36px]">{statusMessage}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Nodes Explored</p>
                                <p className="text-lg font-bold text-white">{stats.explored}</p>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Heuristic Setup</p>
                                <p className="text-lg font-bold text-cyan-400 truncate">{heuristic}</p>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Path Length</p>
                                <p className="text-lg font-bold text-emerald-300">{stats.pathLength || "-"}</p>
                            </div>
                            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Delay</p>
                                <p className="text-lg font-bold text-cyan-200">{speed}ms</p>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                {/* Control Panel */}
                <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-6 backdrop-blur space-y-6">
                    <div>
                        <label className="mb-3 block text-[11px] font-bold uppercase text-slate-400 tracking-wider">Environment Tools</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button onClick={() => setBrushMode('wall')} className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${brushMode === 'wall' ? 'bg-slate-700 border-white/20 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}><Paintbrush size={12}/> Wall</button>
                            <button onClick={() => setBrushMode('weight')} className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${brushMode === 'weight' ? 'bg-amber-900/30 border-amber-500/30 text-amber-200' : 'bg-slate-900 border-white/5 text-slate-500'}`}><Zap size={12}/> Mud (Cost:5)</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2 text-[10px] text-slate-500 font-bold uppercase">
                                    <span>Diagonal Movement</span>
                                    <button 
                                        onClick={() => setAllowDiagonal(!allowDiagonal)} 
                                        disabled={runStatus !== 'Idle'}
                                        className={`w-8 h-4 rounded-full relative transition-colors ${allowDiagonal ? 'bg-blue-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${allowDiagonal ? 'left-4.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-[10px] text-slate-500 font-bold uppercase">Heuristic Function</p>
                                <select 
                                    value={heuristic} 
                                    onChange={(e) => setHeuristic(e.target.value)}
                                    disabled={runStatus !== 'Idle'}
                                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                                >
                                    <option value="Manhattan">Manhattan (4-Directional)</option>
                                    <option value="Euclidean">Euclidean (Straight Line)</option>
                                </select>
                            </div>
                            <div>
                                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-slate-500">
                                    <span>Animation Speed</span>
                                    <span className="text-cyan-400">{speed}ms</span>
                                </div>
                                <input type="range" min="5" max="200" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full h-1.5 rounded-lg bg-slate-700 appearance-none cursor-pointer accent-cyan-500" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                        {runStatus === 'Idle' || runStatus === 'Completed' ? (
                            <button onClick={handleRun} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg hover:bg-blue-500 active:scale-95 transition-all">
                                <Play size={18} fill="currentColor" /> Run Visualizer
                            </button>
                        ) : (
                            <button onClick={() => setIsPaused(!isPaused)} className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-all active:scale-95 ${isPaused ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-900'}`}>
                                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />} {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => resetGrid(false)} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-all"><RotateCcw size={14}/> Full Reset</button>
                            <button onClick={() => resetGrid(true)} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-all"><Shuffle size={14}/> Clear Path</button>
                        </div>
                        <HotkeysHint />
                    </div>

                    <div className="rounded-xl bg-blue-500/5 p-4 border border-blue-500/10 flex gap-3 items-start">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                            <strong>Learner Tip:</strong> Use the "Mud" brush! A* will try to route around the mud if the cost to go through it (Cost: 5) is higher than walking around it.
                        </p>
                    </div>
                </aside>

                {/* Grid Visualizer */}
                <main className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 shadow-2xl relative overflow-hidden" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <div 
                        className="grid select-none bg-white/5 gap-[1px] h-full" 
                        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
                    >
                        {grid.map((row, r) => row.map((cell, c) => {
                            const isStart = r === startPos.row && c === startPos.col;
                            const isTarget = r === targetPos.row && c === targetPos.col;
                            
                            let cellColor = "transparent";
                            if (cell.status === 'wall') cellColor = "#1e293b"; // slate-800
                            else if (cell.status === 'weight') cellColor = "rgba(120, 53, 15, 0.4)"; // amber-900
                            else if (cell.status === 'visited') cellColor = "rgba(59, 130, 246, 0.25)"; // blue
                            else if (cell.status === 'processing') cellColor = "rgba(6, 182, 212, 0.4)"; // cyan
                            else if (cell.status === 'path') cellColor = "#10b981"; // emerald

                            return (
                                <div 
                                    key={`${r}-${c}`} 
                                    className={`aspect-square relative flex items-center justify-center transition-colors duration-200 group border border-white/5 ${isStart || isTarget ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                                    style={{ backgroundColor: cellColor }}
                                    onMouseDown={() => handleMouseDown(r, c)}
                                    onMouseEnter={() => handleMouseEnter(r, c)}
                                >
                                    {isStart && <Target size={14} className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] z-10" />}
                                    {isTarget && <Waypoints size={14} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] z-10" />}
                                    
                                    {/* Detailed Cell Tooltip */}
                                    {cell.status !== 'default' && cell.status !== 'wall' && (
                                        <div className="absolute inset-0 z-50 opacity-0 group-hover:opacity-100 bg-slate-950/95 flex flex-col items-center justify-center text-[7px] font-bold text-white border border-blue-500/50 pointer-events-none transition-opacity">
                                            <span>f: {cell.f === Infinity ? '∞' : cell.f.toFixed(0)}</span>
                                            <span className="text-[6px] text-slate-500">g:{cell.g.toFixed(0)} h:{cell.h.toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }))}
                    </div>

                    {/* Extended Legend */}
                    <div className="absolute bottom-4 right-4 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-3 rounded-xl bg-slate-950/80 px-3 py-2 backdrop-blur border border-white/10">
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" /><span className="text-[9px] font-bold text-slate-400">Start</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[9px] font-bold text-slate-400">Target</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-cyan-400/70" /><span className="text-[9px] font-bold text-slate-400">Processing</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold text-slate-400">Path</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500/40" /><span className="text-[9px] font-bold text-slate-400">Visited</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-700" /><span className="text-[9px] font-bold text-slate-400">Wall</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-900/60" /><span className="text-[9px] font-bold text-slate-400">Mud</span></div>
                    </div>
                </main>
            </div>

            {/* Code Section */}
            <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#020617] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Code2 size={20} className="text-blue-400" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-200">Implementation Details</span>
                        <div className="ml-4 flex rounded-lg bg-white/5 p-1">
                            {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                                <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{lang}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(activeCode); setCopyState('copied'); setTimeout(() => setCopyState('idle'), 1500); }} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 border border-white/10 hover:bg-white/10 transition-all">
                            {copyState === 'copied' ? <Zap size={14} className="text-emerald-400" /> : <Copy size={14} />} {copyState === 'copied' ? 'Copied' : 'Copy'}
                        </button>
                        <button onClick={handleDownloadCode} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 border border-white/10 hover:bg-white/10 transition-all">
                            <Download size={14} /> Download
                        </button>
                    </div>
                </div>
                <div className="ll-scrollbar max-h-[450px] overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-400">
                    <pre><code>{(activeCode || "").split("\n").map((line, i) => (
                        <div key={i} className="flex hover:bg-white/5 px-2 rounded">
                            <span className="w-8 shrink-0 text-slate-700 select-none text-right pr-4">{i + 1}</span>
                            <span className="text-slate-300">{renderHighlightedCode(line)}</span>
                        </div>
                    ))}</code></pre>
                </div>
            </section>
        </div>
    );
}
