import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  Play, Pause, RotateCcw, Cpu, Clock, Settings, 
  Server, Activity, Code2, Copy, CheckCheck, Download,
  Plus, Trash2, SlidersHorizontal
} from "lucide-react";
import toast from "react-hot-toast";
import { renderHighlightedCode } from "../utils/codeHighlight";
import { 
  cpuSchedulingCPP, cpuSchedulingJava, 
  cpuSchedulingPython, cpuSchedulingJS 
} from "../algorithms/cpuScheduling";

const COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", 
  "bg-pink-500", "bg-amber-500", "bg-cyan-500",
];

const BORDER_COLORS = [
  "border-blue-500", "border-purple-500", "border-emerald-500", 
  "border-pink-500", "border-amber-500", "border-cyan-500",
];

const TEXT_COLORS = [
  "text-blue-400", "text-purple-400", "text-emerald-400", 
  "text-pink-400", "text-amber-400", "text-cyan-400",
];

// Default configuration
const DEFAULT_PROCESSES = [
  { id: "P1", arrivalTime: 0, burstTime: 5, colorIdx: 0 },
  { id: "P2", arrivalTime: 1, burstTime: 4, colorIdx: 1 },
  { id: "P3", arrivalTime: 2, burstTime: 2, colorIdx: 2 },
  { id: "P4", arrivalTime: 4, burstTime: 1, colorIdx: 3 },
];

export default function CPUSchedulingPage() {
  useDocumentTitle("CPU Scheduling Visualizer");

  // Scheduling State
  const [processes, setProcesses] = useState(DEFAULT_PROCESSES);
  const [algorithm, setAlgorithm] = useState("RR");
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1000);
  
  // Custom Input State
  const [newAT, setNewAT] = useState(0);
  const [newBT, setNewBT] = useState(1);

  // Code Snippet UI State
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");

  const timerRef = useRef(null);

  // Active Code Snippet Selection
  const activeCode = useMemo(() => {
    switch(selectedLanguage) {
      case 'C++': return cpuSchedulingCPP;
      case 'Java': return cpuSchedulingJava;
      case 'Python': return cpuSchedulingPython;
      case 'JavaScript': return cpuSchedulingJS;
      default: return cpuSchedulingCPP;
    }
  }, [selectedLanguage]);

  // Handle Code Copy
  const handleCopyCode = async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("idle");
    }
  };

  // Handle Code Download
  const handleDownloadCode = () => {
    const ext = selectedLanguage === "C++" ? ".cpp" 
              : selectedLanguage === "Java" ? ".java" 
              : selectedLanguage === "Python" ? ".py" 
              : ".js";
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CPUScheduling${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Custom Input Handlers
  const handleAddProcess = () => {
    if (newBT <= 0 || newAT < 0) {
      toast.error("Burst Time must be > 0 and Arrival Time >= 0");
      return;
    }
    if (processes.length >= 8) {
      toast.error("Maximum 8 processes allowed for clear visualization");
      return;
    }
    
    // Find next available process ID
    const maxP = processes.reduce((max, p) => {
      const num = parseInt(p.id.replace('P', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextId = `P${maxP + 1}`;
    
    const newProcess = {
      id: nextId,
      arrivalTime: newAT,
      burstTime: newBT,
      colorIdx: (maxP) % COLORS.length
    };
    
    // Keep sorted by arrival time for visual neatness
    const updated = [...processes, newProcess].sort((a, b) => a.arrivalTime - b.arrivalTime);
    setProcesses(updated);
    setNewAT(newAT + 1); // Auto-increment AT for convenience
    handleReset();
  };

  const handleRemoveProcess = (id) => {
    if (processes.length <= 1) {
      toast.error("At least one process is required");
      return;
    }
    setProcesses(processes.filter(p => p.id !== id));
    handleReset();
  };

  const handleLoadDefault = () => {
    setProcesses(DEFAULT_PROCESSES);
    handleReset();
  };

  // Simulation Logic Engine
  const simulation = useMemo(() => {
    let t = 0;
    let completed = 0;
    let n = processes.length;
    let readyQueue = [];
    let gantt = [];
    let procs = processes.map((p) => ({
      ...p,
      rt: p.burstTime,
      isCompleted: false,
      inQueue: false,
    }));

    let history = [];
    let activeProcess = null;
    let timeInQuantum = 0;

    // Failsafe max iterations to prevent infinite loop (150 time units)
    while (completed !== n && t < 150) {
      // 1. Arrivals
      procs.forEach((p) => {
        if (p.arrivalTime === t && !p.isCompleted && activeProcess?.id !== p.id) {
          readyQueue.push(p);
          p.inQueue = true;
        }
      });

      // SRTF preemption logic
      if (algorithm === "SRTF" && activeProcess) {
        readyQueue.sort((a, b) => a.rt - b.rt);
        if (readyQueue.length > 0 && readyQueue[0].rt < activeProcess.rt) {
          readyQueue.push(activeProcess);
          activeProcess.inQueue = true;
          activeProcess = null;
        }
      }

      // 2. Context Switch / Quantum Expiry (RR) or Completion
      if (activeProcess) {
        if (activeProcess.rt === 0) {
          activeProcess.isCompleted = true;
          activeProcess.ct = t;
          activeProcess.tat = activeProcess.ct - activeProcess.arrivalTime;
          activeProcess.wt = activeProcess.tat - activeProcess.burstTime;
          completed++;
          activeProcess = null;
        } else if (algorithm === "RR" && timeInQuantum === timeQuantum) {
          readyQueue.push(activeProcess);
          activeProcess.inQueue = true;
          activeProcess = null;
        }
      }

      // 3. Schedule Next Process
      if (!activeProcess && readyQueue.length > 0) {
        if (algorithm === "SRTF") {
          readyQueue.sort((a, b) =>
            a.rt === b.rt ? a.arrivalTime - b.arrivalTime : a.rt - b.rt
          );
        }
        activeProcess = readyQueue.shift();
        activeProcess.inQueue = false;
        timeInQuantum = 0;
      }

      // 4. Execution step
      if (activeProcess) {
        if (gantt.length === 0 || gantt[gantt.length - 1].id !== activeProcess.id) {
          gantt.push({ id: activeProcess.id, start: t, end: t + 1, colorIdx: activeProcess.colorIdx });
        } else {
          gantt[gantt.length - 1].end = t + 1;
        }
        activeProcess.rt -= 1;
        timeInQuantum++;
      }

      history.push({
        time: t,
        activeProcess: activeProcess ? { ...activeProcess } : null,
        readyQueue: readyQueue.map((p) => ({ ...p })),
        metrics: procs.map((p) => ({ ...p })),
      });
      t++;
    }

    if (activeProcess && activeProcess.rt === 0) {
      activeProcess.isCompleted = true;
      activeProcess.ct = t;
      activeProcess.tat = activeProcess.ct - activeProcess.arrivalTime;
      activeProcess.wt = activeProcess.tat - activeProcess.burstTime;
      history.push({
        time: t,
        activeProcess: null,
        readyQueue: [],
        metrics: procs.map((p) => ({ ...p })),
      });
    }

    return { gantt, history, maxTime: t };
  }, [processes, algorithm, timeQuantum]);

  const maxTime = simulation.history.length - 1;
  const currentState = simulation.history[Math.min(currentTime, maxTime)] || simulation.history[0];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= maxTime) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, maxTime, speed]);

  const togglePlay = () => {
    if (currentTime >= maxTime) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e) => {
    setCurrentTime(Number(e.target.value));
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-200 font-body">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Cpu className="text-cyan-400" size={32} />
              Preemptive CPU Scheduling
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Visualize Round Robin (RR) and Shortest Remaining Time First (SRTF)
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/5">
            <Settings size={18} className="text-slate-400 ml-2" />
            <select
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value);
                handleReset();
              }}
              className="bg-slate-800 text-sm font-semibold text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="RR">Round Robin (RR)</option>
              <option value="SRTF">Shortest Remaining Time (SRTF)</option>
            </select>
            {algorithm === "RR" && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Quantum:
                </span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={timeQuantum}
                  onChange={(e) => {
                    setTimeQuantum(Number(e.target.value));
                    handleReset();
                  }}
                  className="w-16 bg-slate-800 text-center text-sm font-bold text-cyan-300 px-2 py-1 rounded-lg outline-none"
                />
              </div>
            )}
          </div>
        </header>

        {/* Process Configuration Section */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-3">
                <SlidersHorizontal size={16} className="text-emerald-400" />
                Process Configuration
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <AnimatePresence>
                  {processes.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/80`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${COLORS[p.colorIdx]}`} />
                      <span className="font-bold text-sm text-white">{p.id}</span>
                      <span className="text-xs text-slate-400">
                        AT:{p.arrivalTime} BT:{p.burstTime}
                      </span>
                      <button
                        onClick={() => handleRemoveProcess(p.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors ml-1"
                        title={`Remove ${p.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-end gap-3 bg-slate-800/50 p-3 rounded-xl border border-white/5 w-full lg:w-auto">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 tracking-wider">Arrival Time</label>
                <input 
                  type="number" 
                  min="0" 
                  value={newAT} 
                  onChange={(e) => setNewAT(Number(e.target.value))} 
                  className="w-20 bg-slate-900 text-center text-sm font-bold text-slate-200 px-2 py-2 rounded-lg outline-none border border-slate-700 focus:border-cyan-500 transition-colors" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 tracking-wider">Burst Time</label>
                <input 
                  type="number" 
                  min="1" 
                  value={newBT} 
                  onChange={(e) => setNewBT(Number(e.target.value))} 
                  className="w-20 bg-slate-900 text-center text-sm font-bold text-slate-200 px-2 py-2 rounded-lg outline-none border border-slate-700 focus:border-cyan-500 transition-colors" 
                />
              </div>
              <button 
                onClick={handleAddProcess} 
                className="flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg px-4 py-2 font-semibold text-sm transition-all"
              >
                <Plus size={16} />
                Add
              </button>
              <button
                onClick={handleLoadDefault}
                className="flex items-center justify-center p-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 transition-colors ml-1"
                title="Load Default Processes"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Visualizer Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* OS Environment - CPU and Ready Queue */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* CPU Component */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-500 opacity-50" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-300">
                  <Activity size={16} className="text-emerald-400" />
                  Central Processing Unit
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">
                    CLK_TICK:
                  </span>
                  <div className="font-mono text-xl font-bold text-cyan-300 bg-slate-950 px-3 py-1 rounded-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                    {currentTime}s
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center py-8">
                <div
                  className={`relative flex flex-col items-center justify-center w-48 h-48 rounded-3xl border-2 transition-all duration-300 ${
                    currentState?.activeProcess
                      ? `${BORDER_COLORS[currentState.activeProcess.colorIdx]} shadow-[0_0_30px_rgba(0,0,0,0.5)]`
                      : "border-slate-700 bg-slate-800/50"
                  }`}
                  style={{
                    boxShadow: currentState?.activeProcess
                      ? `0 0 30px var(--tw-shadow-color)`
                      : "none",
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {currentState?.activeProcess ? (
                      <motion.div
                        key={currentState.activeProcess.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-20 h-20 rounded-2xl ${
                            COLORS[currentState.activeProcess.colorIdx]
                          } flex items-center justify-center text-3xl font-black text-white shadow-lg`}
                        >
                          {currentState.activeProcess.id}
                        </div>
                        <div className="mt-4 font-mono text-sm font-semibold bg-slate-950/80 px-3 py-1 rounded border border-white/10">
                          Remaining: {currentState.activeProcess.rt}s
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-slate-500 flex flex-col items-center gap-2"
                      >
                        <Clock size={32} />
                        <span className="font-mono text-sm tracking-widest uppercase">
                          IDLE
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Ready Queue */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-300 mb-4">
                <Server size={16} className="text-purple-400" />
                Ready Queue
              </h2>
              <div className="h-24 bg-slate-950 rounded-xl border border-slate-800 p-3 flex items-center gap-3 overflow-x-auto">
                <AnimatePresence>
                  {currentState?.readyQueue.length === 0 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-slate-600 font-mono text-sm m-auto"
                    >
                      Queue Empty
                    </motion.span>
                  )}
                  {currentState?.readyQueue.map((p, index) => (
                    <motion.div
                      key={`${p.id}-${index}`}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`min-w-[64px] h-16 rounded-xl ${
                        COLORS[p.colorIdx]
                      } flex flex-col items-center justify-center text-white shadow-lg relative border border-white/20`}
                    >
                      <span className="font-bold">{p.id}</span>
                      <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded mt-1">
                        rt:{p.rt}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Process Metrics Table */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 overflow-x-auto">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-4">
              Process Table
            </h2>
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="pb-3 pr-2">ID</th>
                  <th className="pb-3 px-2">AT</th>
                  <th className="pb-3 px-2">BT</th>
                  <th className="pb-3 px-2">CT</th>
                  <th className="pb-3 px-2">TAT</th>
                  <th className="pb-3 pl-2">WT</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono">
                {currentState?.metrics.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-slate-800/50 transition-colors ${
                      p.isCompleted ? "text-slate-400" : "text-slate-200"
                    } ${
                      currentState.activeProcess?.id === p.id
                        ? "bg-slate-800/50"
                        : ""
                    }`}
                  >
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${COLORS[p.colorIdx]}`} />
                        <span className={currentState.activeProcess?.id === p.id ? TEXT_COLORS[p.colorIdx] : ""}>
                          {p.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">{p.arrivalTime}</td>
                    <td className="py-3 px-2">{p.burstTime}</td>
                    <td className="py-3 px-2 text-emerald-400">
                      {p.ct !== undefined ? p.ct : "-"}
                    </td>
                    <td className="py-3 px-2 text-cyan-400">
                      {p.tat !== undefined ? p.tat : "-"}
                    </td>
                    <td className="py-3 pl-2 text-purple-400">
                      {p.wt !== undefined ? p.wt : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Averages */}
            {currentTime === maxTime && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 text-sm">
                <p className="font-semibold mb-1">Simulation Complete</p>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
                  <div>
                    Avg TAT:{" "}
                    {(
                      currentState.metrics.reduce((acc, p) => acc + p.tat, 0) /
                      processes.length
                    ).toFixed(2)}s
                  </div>
                  <div>
                    Avg WT:{" "}
                    {(
                      currentState.metrics.reduce((acc, p) => acc + p.wt, 0) /
                      processes.length
                    ).toFixed(2)}s
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gantt Chart Section */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-6">
            Real-Time Gantt Chart
          </h2>
          <div className="relative h-16 w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex">
            {simulation.gantt.map((block, i) => {
              if (block.start >= currentTime) return null;
              const displayEnd = Math.min(block.end, currentTime);
              const duration = displayEnd - block.start;
              const widthPerc = (duration / Math.max(maxTime, 20)) * 100;

              return (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPerc}%` }}
                  key={i}
                  className={`h-full ${
                    COLORS[block.colorIdx]
                  } border-r border-black/20 flex flex-col justify-center items-center overflow-hidden`}
                >
                  <span className="text-white font-bold text-sm drop-shadow-md">
                    {block.id}
                  </span>
                </motion.div>
              );
            })}
          </div>
          {/* Timeline markers */}
          <div className="relative h-6 w-full mt-2 text-[10px] font-mono text-slate-500">
            {[...Array(Math.max(maxTime + 1, 21)).keys()].map((t) => {
              if (t % 5 !== 0 && t !== maxTime) return null;
              const leftPerc = (t / Math.max(maxTime, 20)) * 100;
              return (
                <div
                  key={`timeline-${t}`}
                  className="absolute transform -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${leftPerc}%` }}
                >
                  <div className="h-1.5 w-[1px] bg-slate-700 mb-0.5" />
                  {t}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Snippets Section */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 shadow-2xl">
          <div className="flex flex-col border-b border-white/10 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Code2 className="text-blue-400" size={20} />
              Algorithm Implementations
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
              {['C++', 'Java', 'Python', 'JavaScript'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                    selectedLanguage === lang
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative group p-6">
            <div className="absolute right-8 top-8 z-10 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                onClick={handleCopyCode}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                title="Copy code"
              >
                {copyState === 'copied' ? <CheckCheck size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
              <button
                onClick={handleDownloadCode}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                title="Download code"
              >
                <Download size={16} />
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl bg-slate-950/80 p-4 text-sm shadow-inner ring-1 ring-white/5">
              <pre className="font-mono text-slate-300">
                <code>{renderHighlightedCode(activeCode, selectedLanguage)}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="sticky bottom-4 z-10 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md mt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-400 w-6">0</span>
              <input
                type="range"
                min="0"
                max={maxTime}
                value={currentTime}
                onChange={handleTimeChange}
                className="h-2 w-full appearance-none rounded-full bg-slate-800 accent-cyan-400"
              />
              <span className="font-mono text-xs text-slate-400 w-6">
                {maxTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={togglePlay}
                className={`flex w-32 items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-bold shadow-lg transition-all ${
                  isPlaying
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                }`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                {isPlaying ? "Pause" : currentTime >= maxTime ? "Replay" : "Play"}
              </button>

              <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Speed</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                  <option value={1500}>0.5x</option>
                  <option value={800}>1.0x</option>
                  <option value={400}>1.5x</option>
                  <option value={200}>2.0x</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}