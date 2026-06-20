import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  CheckCheck,
  Code2,
  Copy,
  Download,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Shield,
  Plus,
  Minus,
  BookOpen,
  Lightbulb,
  Zap,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Database,
  Workflow,
  Edit2,
  Save,
  XCircle
} from 'lucide-react';
import {
  generateBankersAlgorithmSteps,
  checkResourceRequest,
  bankerCPP,
  bankerJava,
  bankerPython,
  bankerJS,
} from '../algorithms/bankerAlgorithm';
import { renderHighlightedCode } from '../utils/codeHighlight';
import HotkeysHint from '../components/HotkeysHint';
import { shouldSkipHotkeyTarget, useStableHotkeys } from '../hooks/useStableHotkeys';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const runStatusStyleMap = {
  Idle: 'border-white/15 bg-white/5 text-slate-200',
  Running: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
  Paused: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  Completed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  Unsafe: 'border-red-400/30 bg-red-500/10 text-red-100',
};

const DEFAULT_CONFIG = {
  processes: 5,
  resources: 3,
  maxNeed: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  available: [3, 3, 2],
  allocated: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
};

function generateRandomConfig() {
  const numProcesses = Math.floor(Math.random() * 3) + 4; // 4 to 6 processes
  const numResources = 3;
  const maxResourcesSystem = [10, 5, 7]; // Total resources in system

  // Generate logical random data
  const allocated = Array.from({ length: numProcesses }, () => 
    Array.from({ length: numResources }, () => 0)
  );
  
  const maxNeed = Array.from({ length: numProcesses }, () =>
    Array.from({ length: numResources }, (_, j) => Math.floor(Math.random() * maxResourcesSystem[j]) + 1)
  );

  // Distribute some resources initially
  const available = [...maxResourcesSystem];
  
  for (let i = 0; i < numProcesses; i++) {
    for (let j = 0; j < numResources; j++) {
      if (Math.random() > 0.5 && available[j] > 0) {
        const alloc = Math.floor(Math.random() * Math.min(available[j], maxNeed[i][j]));
        allocated[i][j] = alloc;
        available[j] -= alloc;
      }
    }
  }

  return {
    processes: numProcesses,
    resources: numResources,
    maxNeed,
    available,
    allocated,
  };
}

function formatElapsed(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function KeyConceptCard({ icon: Icon, title, description, color }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-lg border ${color} bg-opacity-5 p-3 backdrop-blur`}
    >
      <div className="flex items-start gap-2">
        <Icon size={16} className={color} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white mb-1 truncate">{title}</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ResourcePressureGauge({ resourceIndex, available, allocatedTotal, maxTotal }) {
  const totalInUse = allocatedTotal;
  const percentage = Math.min(100, (totalInUse / maxTotal) * 100);
  
  let colorClass = "bg-emerald-500";
  if (percentage > 80) colorClass = "bg-red-500";
  else if (percentage > 50) colorClass = "bg-amber-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
        <span className="text-slate-400">R{resourceIndex}</span>
        <span className="text-slate-200">{Math.round(percentage)}% Load</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${colorClass}`}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
        <span>Free: {available}</span>
        <span>Total: {maxTotal}</span>
      </div>
    </div>
  );
}

function StepExplanation({ step }) {
  if (!step) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
        <p className="text-xs text-slate-400">Press "Start" to begin the algorithm</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      key={step.description} // Re-animate on step change
      className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        <Lightbulb size={14} className="text-yellow-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white mb-1">{step.description}</p>
          <p className="text-[10px] text-slate-300 leading-relaxed">{step.details?.explanation || step.action}</p>
        </div>
      </div>

      {step.details?.comparison && (
        <div className={`mt-2 p-2 rounded border text-[10px] font-mono ${
          step.details.comparison.success 
            ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-200' 
            : 'bg-red-500/10 border-red-400/20 text-red-200'
        }`}>
          <div className="flex justify-between mb-1">
            <span>Need: [{step.details.comparison.need.join(', ')}]</span>
            <span>Available: [{step.details.comparison.available.join(', ')}]</span>
          </div>
          <div className="font-bold border-t border-white/10 pt-1 mt-1 text-center">
             {step.details.comparison.success ? "Need ≤ Available (TRUE)" : "Need > Available (FALSE)"}
          </div>
        </div>
      )}

      {step.safeSequence && step.safeSequence.length > 0 && (
        <div className="mt-2 pt-2 border-t border-emerald-400/20 bg-emerald-500/10 rounded p-2">
          <p className="text-[10px] font-bold text-emerald-300 mb-1">✓ Safe Sequence Found:</p>
          <div className="text-xs font-mono text-emerald-200 flex flex-wrap gap-1">
            {step.safeSequence.map((p, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <span className="text-slate-400 mx-1">→</span>}
                <span className="bg-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/30">P{p}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function BankersAlgorithmPage() {
  const navigate = useNavigate();
  useDocumentTitle("Banker's Algorithm Visualizer");

  // Core State
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [tempConfig, setTempConfig] = useState(null); // For edit mode

  // Simulation State
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState('Idle');
  const [speed, setSpeed] = useState(800);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // UI State
  const [copyState, setCopyState] = useState('idle');
  const [selectedLanguage, setSelectedLanguage] = useState('C++');
  const [showResourceRequest, setShowResourceRequest] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [showMatrix, setShowMatrix] = useState(true);
  const [expandedProcess, setExpandedProcess] = useState(null);
  
  // Interactive Request State
  const [requestPid, setRequestPid] = useState(0);
  const [requestResources, setRequestResources] = useState([0, 0, 0]);
  const [requestResult, setRequestResult] = useState(null);

  const timerRef = useRef(null);

  const activeCode =
    selectedLanguage === 'C++' ? bankerCPP
    : selectedLanguage === 'Java' ? bankerJava
    : selectedLanguage === 'Python' ? bankerPython
    : bankerJS;

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  const progress = useMemo(() => {
    if (runStatus === 'Completed' || runStatus === 'Unsafe') return 100;
    if (steps.length <= 1 || currentStepIndex < 0) return 0;
    return Math.min(99, Math.round((currentStepIndex / (steps.length - 1)) * 100));
  }, [runStatus, steps.length, currentStepIndex]);

  // Derived state for resource health
  const resourceHealth = useMemo(() => {
    // Current state (or initial state)
    const currentAlloc = currentStep?.allocated || config.allocated;
    const currentAvail = currentStep?.available || config.available;
    
    // Calculate totals
    const totalAllocated = currentAlloc.reduce((acc, row) => 
      row.map((val, i) => val + (acc[i] || 0)), [0,0,0]
    );

    // Total System Resources = Available + Allocated (at any point in time)
    // Note: In Banker's, total resources usually constant, but available fluctuates.
    const totalSystem = totalAllocated.map((alloc, i) => alloc + currentAvail[i]);

    return totalSystem.map((total, i) => ({
      index: i,
      total,
      allocated: totalAllocated[i],
      available: currentAvail[i]
    }));
  }, [config, currentStep]);


  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus('Idle');
    setIsPaused(false);
    setElapsedSeconds(0);
    setRequestResult(null);
  };

  const handleGenerateNewConfig = () => {
    handleReset();
    setConfig(generateRandomConfig());
  };

  const runAlgorithm = () => {
    handleReset();
    // Safety check for invalid config before running
    if(config.processes === 0) return;

    const generatedSteps = generateBankersAlgorithmSteps(
      Array.from({ length: config.processes }, (_, i) => i),
      config.available,
      config.maxNeed,
      config.allocated.map(row => [...row])
    );
    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    
    // Determine final status based on last step
    const isUnsafe = generatedSteps.length > 0 && 
                     (generatedSteps[generatedSteps.length - 1].description.includes('UNSAFE') || 
                      generatedSteps[generatedSteps.length - 1].description.includes('DEADLOCK'));
    
    setRunStatus(isUnsafe ? 'Unsafe' : 'Running');
  };

  // Timer Effect
  useEffect(() => {
    if (runStatus === 'Running' && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          // If Unsafe is detected earlier in steps (unlikely with this logic but possible)
          const isUnsafeStep = steps[prev]?.description.includes('UNSAFE');
          if (isUnsafeStep) {
              setRunStatus('Unsafe');
              return prev;
          }

          if (prev < steps.length - 1) return prev + 1;
          
          if (timerRef.current) clearInterval(timerRef.current);
          setRunStatus(steps[steps.length-1].description.includes('SAFE') ? 'Completed' : 'Unsafe');
          return prev;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runStatus, isPaused, steps, speed]);

  useEffect(() => {
    if (runStatus !== 'Running' || isPaused) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [runStatus, isPaused]);

  // Edit Mode Handlers
  const toggleEditMode = () => {
    if (isEditing) {
      // Cancel edit
      setIsEditing(false);
      setTempConfig(null);
    } else {
      // Start edit
      setTempConfig(JSON.parse(JSON.stringify(config)));
      setIsEditing(true);
      handleReset();
    }
  };

  const saveEdit = () => {
    setConfig(tempConfig);
    setIsEditing(false);
    setTempConfig(null);
  };

  const updateTempConfig = (type, i, j, value) => {
    const val = parseInt(value) || 0;
    setTempConfig(prev => {
      const next = { ...prev };
      if (type === 'available') {
        next.available[j] = val;
      } else {
        next[type][i][j] = val;
      }
      return next;
    });
  };


  const handleCopyCode = async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1400);
    } catch {
      setCopyState('idle');
    }
  };

  const handleDownloadCode = () => {
    const ext = selectedLanguage === 'C++' ? '.cpp' : selectedLanguage === 'Java' ? '.java' : '.py';
    const blob = new Blob([activeCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BankersAlgorithm${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRequestResource = () => {
    const result = checkResourceRequest(
      requestPid,
      requestResources,
      currentStep?.available || config.available,
      currentStep?.need || config.maxNeed.map((max, i) =>
        max.map((m, j) => m - config.allocated[i][j])
      ),
      currentStep?.allocated || config.allocated,
      config.maxNeed
    );
    setRequestResult(result);
  };

  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    if (e.code === 'Space') {
      e.preventDefault();
      if (runStatus === 'Idle' || runStatus === 'Completed') {
        if (runStatus === 'Completed') handleReset();
        setTimeout(runAlgorithm, 100);
      } else {
        setIsPaused((prev) => !prev);
      }
    } else if (key === 'r') {
      e.preventDefault();
      handleReset();
    } else if (key === 'n') {
      e.preventDefault();
      if (runStatus === 'Idle') handleGenerateNewConfig();
    }
  });

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(167,139,250,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(139,92,246,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/40 p-4 shadow-2xl backdrop-blur sm:p-5 mb-4"
      >
        <div className="flex items-start justify-between mb-3">
          <button
            onClick={() => navigate('/algorithms')}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-3 pl-2.5 py-1 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-end">
            <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-purple-200 whitespace-nowrap">
              🛡️ Deadlock Avoidance
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${runStatusStyleMap[runStatus]} whitespace-nowrap`}>
              {runStatus}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-slate-200 whitespace-nowrap">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-white mb-2">
          Banker's Algorithm
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mb-3 max-w-3xl">
          An operating system resource allocation and deadlock avoidance algorithm. 
          It tests for safety by simulating the allocation for predetermined maximum possible amounts of all resources, 
          checking if the system remains in a "safe state".
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
            <motion.div
              animate={{ width: `${progress}%` }}
              className={`h-full ${runStatus === 'Unsafe' ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-violet-500'}`}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">Processes</p>
            <p className="text-sm sm:text-base font-semibold text-white">{config.processes}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">Resources</p>
            <p className="text-sm sm:text-base font-semibold text-purple-200">{config.resources}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">Safe?</p>
            <p className="text-sm sm:text-base font-semibold text-emerald-200">
              {runStatus === 'Unsafe' ? <span className="text-red-300">NO</span> : runStatus === 'Completed' ? 'YES' : '--'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">Current Step</p>
            <p className="text-sm sm:text-base font-semibold text-blue-200">
              {currentStepIndex >= 0 ? currentStepIndex + 1 : 0}/{steps.length || 0}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT - 2 COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 mb-4">
        {/* LEFT SIDEBAR - CONTROLS */}
        <aside className="flex flex-col rounded-2xl border border-white/10 bg-slate-800/35 p-4 backdrop-blur h-fit lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-purple-300" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Controls</h2>
          </div>

          <div className="space-y-3 flex-1">
            {/* Speed Control */}
            <div className="rounded-lg bg-white/5 p-2.5">
              <label className="mb-1.5 flex items-center justify-between text-[10px] uppercase text-slate-400">
                <span>⚡ Speed</span>
                <span className="font-mono text-purple-300 text-xs">{speed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-purple-400 h-1.5"
                style={{ direction: 'rtl' }}
              />
            </div>

            {/* Button Group */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                disabled={isEditing}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                onClick={handleGenerateNewConfig}
                disabled={runStatus !== 'Idle' || isEditing}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-400/20 bg-purple-500/10 py-2 text-[10px] font-bold text-purple-100 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                <Shuffle size={13} /> New
              </button>
            </div>

            {/* Play/Pause Button */}
            {runStatus === 'Idle' || runStatus === 'Completed' || runStatus === 'Unsafe' ? (
              <button
                onClick={() => {
                  if (runStatus !== 'Idle') handleReset();
                  setTimeout(runAlgorithm, 100);
                }}
                disabled={isEditing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 py-2.5 font-bold text-white text-sm shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:grayscale"
              >
                <Play size={16} fill="currentColor" /> {runStatus === 'Idle' ? 'Start' : 'Restart'}
              </button>
            ) : (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-white text-sm transition-colors ${
                  isPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play size={16} fill="currentColor" /> Resume
                  </>
                ) : (
                  <>
                    <Pause size={16} /> Pause
                  </>
                )}
              </button>
            )}

            {/* Edit Mode Toggle */}
             <button
                onClick={toggleEditMode}
                disabled={runStatus === 'Running' || runStatus === 'Paused'}
                className={`w-full flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors ${
                  isEditing 
                  ? 'border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30'
                }`}
              >
                {isEditing ? <XCircle size={13}/> : <Edit2 size={13} />}
                {isEditing ? 'Cancel Edit' : 'Edit System'}
              </button>

            {/* Test Request Button */}
            <button
              onClick={() => setShowResourceRequest(!showResourceRequest)}
              disabled={isEditing}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20 transition-colors disabled:opacity-30"
            >
              <Zap size={13} /> Test Request
            </button>

            {/* Request Panel */}
            <AnimatePresence>
              {showResourceRequest && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-cyan-500/10 border border-cyan-400/30 p-2.5 space-y-2"
                >
                  <label className="text-[10px] font-bold uppercase text-cyan-200">PID</label>
                  <input
                    type="number"
                    min="0"
                    max={config.processes - 1}
                    value={requestPid}
                    onChange={(e) => setRequestPid(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg bg-slate-900 px-2 py-1 text-xs text-white border border-cyan-400/20 outline-none focus:border-cyan-400/50"
                  />

                  {Array.from({ length: config.resources }).map((_, j) => (
                    <div key={j}>
                      <label className="text-[10px] font-bold uppercase text-cyan-200">R{j}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={requestResources[j]}
                        onChange={(e) => {
                          const newRequest = [...requestResources];
                          newRequest[j] = parseInt(e.target.value) || 0;
                          setRequestResources(newRequest);
                        }}
                        className="w-full rounded-lg bg-slate-900 px-2 py-1 text-xs text-white border border-cyan-400/20 outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleRequestResource}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 py-1.5 text-[10px] font-bold text-white transition-colors"
                  >
                    Check Safety
                  </button>

                  <AnimatePresence>
                    {requestResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-lg p-2 text-[10px] ${
                          requestResult.granted
                            ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300'
                            : 'bg-red-500/20 border border-red-400/30 text-red-300'
                        }`}
                      >
                        <p className="font-bold mb-0.5">{requestResult.granted ? '✓ GRANTED' : '✗ DENIED'}</p>
                        <p className="text-[9px]">{requestResult.reason}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <HotkeysHint className="mt-2 text-[10px]" />
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="space-y-4">
          
          {/* Theory Panel */}
          <AnimatePresence>
            {showTheory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-3 backdrop-blur"
              >
                <button
                  onClick={() => setShowTheory(!showTheory)}
                  className="flex w-full items-center justify-between mb-3"
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-purple-200 flex items-center gap-2">
                    <BookOpen size={14} /> Theory
                  </h3>
                  <ChevronUp size={16} className={`transition-transform ${!showTheory ? 'rotate-180' : ''}`} />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <KeyConceptCard
                    icon={Lock}
                    title="Safe State"
                    description="A state where there exists at least one sequence to execute all processes without deadlock."
                    color="text-emerald-400 border-emerald-400/25"
                  />
                  <KeyConceptCard
                    icon={Unlock}
                    title="Unsafe State"
                    description="No safe sequence exists. Granting a request in this state might lead to deadlock."
                    color="text-red-400 border-red-400/25"
                  />
                  <KeyConceptCard
                    icon={Database}
                    title="Need Matrix"
                    description="Calculated as Max Need - Allocation. Shows pending requirements."
                    color="text-blue-400 border-blue-400/25"
                  />
                  <KeyConceptCard
                    icon={Workflow}
                    title="Banker's Logic"
                    description="Pretend to allocate, check safety. If safe → commit. If unsafe → rollback."
                    color="text-violet-400 border-violet-400/25"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visualization Section */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/35 p-3.5 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-purple-200 flex items-center gap-2">
                <Database size={14} /> System State
              </h3>
              <div className="flex gap-2">
                {isEditing && (
                  <button 
                    onClick={saveEdit}
                    className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/30"
                  >
                    <Save size={12}/> Apply Changes
                  </button>
                )}
                <button
                  onClick={() => setShowTheory(!showTheory)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                  title="Show Theory"
                >
                  {showTheory ? '📖' : '📚'}
                </button>
                <button
                  onClick={() => setShowMatrix(!showMatrix)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                  title="Toggle Matrix"
                >
                  {showMatrix ? '📊' : '📋'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Resource Utilization (Pressure Gauge) */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h4 className="text-[10px] font-bold uppercase text-purple-200 mb-2 flex items-center gap-2">
                  <Activity size={12}/> Resource Pressure
                </h4>
                <div className="space-y-3">
                   {resourceHealth.map((r, i) => (
                     <ResourcePressureGauge 
                       key={i} 
                       resourceIndex={i} 
                       available={r.available}
                       allocatedTotal={r.allocated}
                       maxTotal={r.total}
                     />
                   ))}
                </div>
              </div>

              {/* Available Resources (Classic View) */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col">
                <h4 className="text-[10px] font-bold uppercase text-purple-200 mb-2">
                  {isEditing ? '✏️ Edit Available' : '📊 Available Pool'}
                </h4>
                <div className="space-y-2 my-auto">
                  {(isEditing ? tempConfig.available : (currentStep?.available || config.available)).map((val, j) => (
                     <div key={j} className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-400 w-6">R{j}</span>
                       {isEditing ? (
                         <input 
                            type="number"
                            min="0"
                            className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-center focus:border-purple-500 outline-none"
                            value={val}
                            onChange={(e) => updateTempConfig('available', 0, j, e.target.value)}
                         />
                       ) : (
                         <div className="flex-1 flex items-center gap-2">
                           <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                animate={{ width: `${(val / (resourceHealth[j]?.total || 1)) * 100}%` }}
                                className="h-full bg-purple-500"
                              />
                           </div>
                           <span className="text-xs font-mono font-bold text-purple-200 w-6 text-right">{val}</span>
                         </div>
                       )}
                     </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Allocation Matrix */}
            <AnimatePresence>
              {showMatrix && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 mb-3 overflow-x-auto"
                >
                  <h4 className="text-[10px] font-bold uppercase text-purple-200 mb-2">
                    {isEditing ? '✏️ Edit Allocation & Max Need' : '📑 System Matrices'}
                  </h4>
                  <table className="w-full text-[10px] text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="px-1 py-1 text-left">Process</th>
                        <th className="px-1 py-1 text-center border-l border-white/5" colSpan={config.resources}>Allocated</th>
                        <th className="px-1 py-1 text-center border-l border-white/5" colSpan={config.resources}>Max Need</th>
                        {!isEditing && <th className="px-1 py-1 text-center border-l border-white/5" colSpan={config.resources}>Current Need</th>}
                      </tr>
                      <tr className="border-b border-white/10 text-[9px] text-slate-500">
                        <th></th>
                        {Array.from({ length: config.resources }).map((_, j) => <th key={`a${j}`} className="py-1">R{j}</th>)}
                        {Array.from({ length: config.resources }).map((_, j) => <th key={`m${j}`} className="py-1">R{j}</th>)}
                        {!isEditing && Array.from({ length: config.resources }).map((_, j) => <th key={`n${j}`} className="py-1">R{j}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? tempConfig.allocated : (currentStep?.allocated || config.allocated)).map((row, i) => {
                        const isHighlighted = !isEditing && currentStep?.highlightProcess === i;
                        const isDone = !isEditing && currentStep?.finish?.[i];
                        
                        return (
                          <tr 
                            key={i} 
                            className={`border-b border-white/5 transition-colors ${
                              isHighlighted ? 'bg-purple-500/20' : isDone ? 'bg-emerald-500/10' : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="px-1 py-1 font-bold text-slate-200">P{i}</td>
                            
                            {/* Allocated Inputs/Values */}
                            {row.map((val, j) => (
                              <td key={`a${j}`} className="px-0.5 py-1 text-center">
                                {isEditing ? (
                                  <input 
                                    className="w-8 bg-slate-900 border border-white/10 rounded px-1 text-center focus:border-purple-500 outline-none"
                                    value={val}
                                    onChange={(e) => updateTempConfig('allocated', i, j, e.target.value)}
                                  />
                                ) : (
                                  <span className="font-mono">{val}</span>
                                )}
                              </td>
                            ))}

                            {/* Max Need Inputs/Values */}
                            {(isEditing ? tempConfig.maxNeed[i] : config.maxNeed[i]).map((val, j) => (
                               <td key={`m${j}`} className={`px-0.5 py-1 text-center ${j===0 ? 'border-l border-white/5' : ''}`}>
                                 {isEditing ? (
                                   <input 
                                      className="w-8 bg-slate-900 border border-white/10 rounded px-1 text-center focus:border-blue-500 outline-none"
                                      value={val}
                                      onChange={(e) => updateTempConfig('maxNeed', i, j, e.target.value)}
                                   />
                                 ) : (
                                   <span className="font-mono text-slate-400">{val}</span>
                                 )}
                               </td>
                            ))}

                            {/* Current Need (Calculated) - Read Only */}
                            {!isEditing && (currentStep?.need[i] || config.maxNeed[i].map((m, k) => m - config.allocated[i][k])).map((val, j) => (
                               <td key={`n${j}`} className={`px-0.5 py-1 text-center ${j===0 ? 'border-l border-white/5' : ''}`}>
                                  <span className={`font-mono font-bold ${val > (currentStep?.available[j] || 0) ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {val}
                                  </span>
                               </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {isEditing && (
                    <div className="mt-2 text-center">
                       <button onClick={() => {
                          const newProc = { ...tempConfig, processes: tempConfig.processes + 1 };
                          newProc.allocated.push([0,0,0]);
                          newProc.maxNeed.push([0,0,0]);
                          setTempConfig(newProc);
                       }} className="text-[10px] text-purple-300 hover:text-white flex items-center justify-center gap-1 mx-auto">
                         <Plus size={10} /> Add Process
                       </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Explanation */}
            <StepExplanation step={currentStep} />
          </section>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CODE SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/algorithms')}
              className="group flex items-center gap-1.5 rounded-lg bg-white/5 pr-3 pl-2 py-1.5 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white border border-white/10"
            >
              <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <Code2 size={16} className="text-purple-400" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage}
            </span>
            <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 gap-0.5">
              {['C++', 'Java', 'Python', 'JavaScript'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded transition-all ${
                    selectedLanguage === lang
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
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
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              {copyState === 'copied' ? (
                <CheckCheck size={13} className="text-emerald-400" />
              ) : (
                <Copy size={13} />
              )}
              <span className="hidden sm:inline">{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              <Download size={13} /> <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-auto bg-[#020617] p-3 sm:p-4 font-code text-[11px] sm:text-sm leading-relaxed text-slate-300">
          <pre>
            <code>
              {(activeCode || '').split('\n').map((line, i) => (
                <div key={i} className="flex hover:bg-white/5 px-1 sm:px-2 rounded">
                  <span className="w-6 sm:w-8 shrink-0 text-slate-600 select-none text-right pr-2 sm:pr-3 text-[10px]">
                    {i + 1}
                  </span>
                  <span className="text-slate-300 break-words">{renderHighlightedCode(line)}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}