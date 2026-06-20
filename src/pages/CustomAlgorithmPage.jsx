import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Settings2,
  Save,
  FileCode,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Keyboard,
  Eye,
  EyeOff,
  Code2,
  X,
  ChevronDown,
  HelpCircle,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { useVisualizer } from "../hooks/useVisualizer";
import CodeEditor, { sortingTemplate, searchingTemplate } from "../components/CodeEditor";
import AlgorithmExplanationPanel from "../components/AlgorithmExplanationPanel";
import StepController from "../components/StepController";

const statusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  Error: "border-red-400/30 bg-red-500/10 text-red-100",
};

const colorThemes = {
  ocean: {
    label: "Ocean",
    chip: "from-cyan-500/25 to-blue-500/25",
    colors: {
      default: "bg-blue-500",
      comparing: "bg-amber-300",
      swapping: "bg-rose-500",
      sorted: "bg-emerald-500",
      pivot: "bg-violet-500",
      target: "bg-cyan-300",
    },
  },
  sunrise: {
    label: "Sunrise",
    chip: "from-orange-500/30 to-fuchsia-500/25",
    colors: {
      default: "bg-orange-400",
      comparing: "bg-fuchsia-400",
      swapping: "bg-red-500",
      sorted: "bg-lime-400",
      pivot: "bg-indigo-500",
      target: "bg-yellow-300",
    },
  },
  aurora: {
    label: "Aurora",
    chip: "from-emerald-500/30 to-cyan-500/25",
    colors: {
      default: "bg-cyan-400",
      comparing: "bg-yellow-300",
      swapping: "bg-pink-500",
      sorted: "bg-emerald-400",
      pivot: "bg-purple-500",
      target: "bg-orange-300",
    },
  },
};

function formatElapsed(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function CustomAlgorithmPage() {
  useDocumentTitle("Custom Algorithm Builder");

  const navigate = useNavigate();

  // Visualizer state
  const {
    array,
    setArray,
    generateRandomArray,
    setCustomArray,
    generatePresetArray,
    setArrayFromFile,
    currentStep,
    totalSteps,
    explanation,
    operation,
    variables,
    updateStepInfo,
    resetStepInfo,
    stepMode,
    setStepMode,
    toggleStepMode,
    stepForward,
    stepBackward,
    goToStep,
    precomputedSteps,
  } = useVisualizer();

  // UI State
  const [code, setCode] = useState(sortingTemplate);
  const [algorithmType, setAlgorithmType] = useState("sorting"); // 'sorting' or 'searching'
  const [targetValue, setTargetValue] = useState(50);
  const [runStatus, setRunStatus] = useState("Idle");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [arraySize, setArraySize] = useState(20);
  const [speed, setSpeed] = useState(30);
  const [showValues, setShowValues] = useState(false);
  const [colorTheme, setColorTheme] = useState("ocean");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);
  const customAlgorithmRef = useRef(null);
  const activeAlgorithmRef = useRef(null);

  const themeConfig = colorThemes[colorTheme] ?? colorThemes.ocean;
  const themeColors = themeConfig.colors;

  const sortedCount = array.filter((item) => item.status === "sorted").length;
  const progress = runStatus === "Completed"
    ? 100
    : array.length === 0
      ? 0
      : Math.round((sortedCount / array.length) * 100);

  const valueStats = array.length === 0 
    ? { min: 0, max: 0, avg: 0 }
    : {
        min: Math.min(...array.map((item) => item.value)),
        max: Math.max(...array.map((item) => item.value)),
        avg: Math.round(array.map((item) => item.value).reduce((a, b) => a + b, 0) / array.length),
      };

  const maxValue = valueStats.max || 1;
  const isTooLargeForValues = array.length > 35;
  const canShowValues = showValues && !isTooLargeForValues;

  const legendItems = [
    { label: "Default", color: themeColors.default },
    { label: "Comparing", color: themeColors.comparing },
    { label: algorithmType === "sorting" ? "Swapping" : "Found", color: themeColors.swapping },
    { label: "Sorted", color: themeColors.sorted },
    { label: algorithmType === "sorting" ? "Pivot" : "Target", color: algorithmType === "searching" ? themeColors.target : themeColors.pivot },
  ];

  // Generate initial array
  useEffect(() => {
    handleGenerateNew(arraySize);
  }, []);

  // Timer
  useEffect(() => {
    if (!isSorting || isPaused) return undefined;
    const timer = setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [isSorting, isPaused]);

  // Hotkeys
  useEffect(() => {
    const handleHotkeys = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!isSorting) handleRun();
        else if (isPaused) handleResume();
        else handlePause();
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReset();
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleGenerateNew();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBackward();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepForward();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleStepMode();
      }
    };
    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [isSorting, isPaused, stepForward, stepBackward, toggleStepMode]);

  // Compile and validate custom algorithm
  const compileAlgorithm = useCallback(() => {
    setError(null);
    setSuccessMessage(null);

    try {
      // Create a sandboxed function from the code
      const wrappedCode = `
        ${code}
        return typeof customSort !== 'undefined' ? customSort : 
               typeof customSearch !== 'undefined' ? customSearch : null;
      `;
      
      const fn = new Function('sleep', 'updateStepInfo', wrappedCode);
      
      // Provide mock implementations
      const mockSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const mockUpdateStepInfo = () => {}; // Just validate the function signature
      
      const algorithm = fn(mockSleep, mockUpdateStepInfo);
      
      if (!algorithm) {
        throw new Error("No algorithm function found. Make sure you return your function!");
      }

      if (typeof algorithm !== 'function') {
        throw new Error("The returned value must be an async function.");
      }

      customAlgorithmRef.current = algorithm;
      setSuccessMessage("Algorithm compiled successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [code]);

  // Handle running the custom algorithm
  const handleRun = async () => {
    // First compile the algorithm
    if (!compileAlgorithm()) return;
    
    if (!customAlgorithmRef.current) {
      setError("Please compile your algorithm first.");
      return;
    }

    stopSignal.current = false;
    pauseSignal.current = false;
    setIsSorting(true);
    setRunStatus("Running");
    setElapsedSeconds(0);

    try {
      // For searching, pass the target value
      const extraParams = algorithmType === "searching" ? [targetValue] : [];
      
      await customAlgorithmRef.current(
        array,
        setArray,
        speed,
        stopSignal,
        pauseSignal,
        updateStepInfo,
        ...extraParams
      );

      if (!stopSignal.current) {
        setRunStatus("Completed");
      }
    } catch (err) {
      setError(`Runtime Error: ${err.message}`);
      setRunStatus("Error");
    }

    setIsSorting(false);
  };

  const handlePause = () => {
    pauseSignal.current = true;
    setIsPaused(true);
    setRunStatus("Paused");
  };

  const handleResume = () => {
    pauseSignal.current = false;
    setIsPaused(false);
    setRunStatus("Running");
  };

  const handleReset = () => {
    stopSignal.current = true;
    setRunStatus("Idle");
    setArray((current) => current.map((item) => ({ ...item, status: "default" })));
    resetStepInfo();
  };

  const handleGenerateNew = (nextSize = arraySize) => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsSorting(false);
    setIsPaused(false);
    setRunStatus("Idle");
    setElapsedSeconds(0);
    generateRandomArray(nextSize);
  };

  const handleTypeChange = (type) => {
    setAlgorithmType(type);
    setCode(type === "sorting" ? sortingTemplate : searchingTemplate);
    handleReset();
    handleGenerateNew(arraySize);
  };

  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem('customAlgorithm', JSON.stringify({
        code,
        algorithmType,
        targetValue,
        colorTheme,
        arraySize,
        speed
      }));
      setSuccessMessage("Algorithm saved to browser storage!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to save: " + err.message);
    }
  };

  const handleLoadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('customAlgorithm');
      if (saved) {
        const data = JSON.parse(saved);
        setCode(data.code || sortingTemplate);
        setAlgorithmType(data.algorithmType || 'sorting');
        setTargetValue(data.targetValue || 50);
        setColorTheme(data.colorTheme || 'ocean');
        setArraySize(data.arraySize || 20);
        setSpeed(data.speed || 30);
        setSuccessMessage("Algorithm loaded from storage!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("No saved algorithm found.");
      }
    } catch (err) {
      setError("Failed to load: " + err.message);
    }
  };

  return (
    <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.18),transparent_36%),linear_gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
      >
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate("/algorithms")}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-4 pl-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Back to Algorithms
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${showHelp ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
              >
                <HelpCircle size={14} />
                Help
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
              Custom Algorithm
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyleMap[runStatus]}`}>
              {runStatus}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>

          <h1 className="font-display text-3xl font-black text-white sm:text-5xl">
            Custom Algorithm Builder
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Write your own sorting or searching algorithm and visualize it step-by-step in real-time.
          </p>

          {/* Algorithm Type Selector */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => handleTypeChange('sorting')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${algorithmType === 'sorting' ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
            >
              <Sparkles size={16} />
              Sorting Algorithm
            </button>
            <button
              onClick={() => handleTypeChange('searching')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${algorithmType === 'searching' ? "bg-violet-500/20 border-violet-400/40 text-violet-200" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
            >
              <Search size={16} />
              Searching Algorithm
            </button>
          </div>
        </div>
      </motion.section>

      {/* Help Panel */}
      {showHelp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5"
        >
          <h3 className="flex items-center gap-2 text-lg font-bold text-cyan-200 mb-3">
            <Info size={18} />
            How to Write Custom Algorithms
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Available Functions</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• <code className="text-cyan-300">sleep(ms)</code> - Pause for visualization</li>
                <li>• <code className="text-cyan-300">updateStepInfo(obj)</code> - Update step details</li>
                <li>• <code className="text-cyan-300">setArray(arr)</code> - Update array display</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Array Item Properties</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• <code className="text-amber-300">value</code> - The number value</li>
                <li>• <code className="text-amber-300">status</code> - Visual state</li>
                <li>Status values: <span className="text-slate-300">'default'</span>, <span className="text-amber-300">'comparing'</span>, <span className="text-rose-300">'swapping'</span>, <span className="text-emerald-300">'sorted'</span>, <span className="text-cyan-300">'target'</span></li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Code Editor */}
        <div className="space-y-4">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-sm">
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={compileAlgorithm}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-400/30 text-blue-200 text-sm font-semibold hover:bg-blue-500/20 transition-all"
            >
              <FileCode size={16} />
              Compile
            </button>
            <button
              onClick={handleSaveToLocalStorage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-400/30 text-violet-200 text-sm font-semibold hover:bg-violet-500/20 transition-all"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={handleLoadFromLocalStorage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-sm font-semibold hover:bg-amber-500/20 transition-all"
            >
              <Save size={16} />
              Load Saved
            </button>
          </div>

          <CodeEditor
            code={code}
            onChange={setCode}
            onRun={handleRun}
            error={null}
            language="javascript"
            placeholder="// Write your custom algorithm here..."
          />
        </div>

        {/* Visualization */}
        <div className="space-y-6">
          {/* Controls */}
          <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
            <div className="mb-5 flex items-center gap-2">
              <Settings2 size={18} className="text-cyan-300" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                Controls
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Array Size */}
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                  <span>Size</span> <span>{arraySize}</span>
                </label>
                <input
                  type="range"
                  min="8"
                  max="50"
                  value={arraySize}
                  disabled={isSorting}
                  onChange={(e) => {
                    setArraySize(+e.target.value);
                    handleGenerateNew(+e.target.value);
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Speed */}
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                  <span>Delay</span> <span>{speed}ms</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={speed}
                  disabled={isSorting}
                  onChange={(e) => setSpeed(+e.target.value)}
                  className="w-full accent-blue-400"
                />
              </div>

              {/* Target Value (for searching) */}
              {algorithmType === 'searching' && (
                <div className="rounded-2xl bg-white/5 p-3">
                  <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                    <span>Target Value</span> <span>{targetValue}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    value={targetValue}
                    disabled={isSorting}
                    onChange={(e) => setTargetValue(+e.target.value)}
                    className="w-full accent-violet-400"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white border border-white/10 hover:bg-white/10"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  onClick={() => handleGenerateNew()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100 border border-cyan-400/20"
                >
                  <Shuffle size={16} /> New Data
                </button>
              </div>

              <button
                onClick={() => !isTooLargeForValues && setShowValues(!showValues)}
                disabled={isTooLargeForValues}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border transition-all ${isTooLargeForValues ? "bg-slate-800/50 border-white/5 text-slate-500 cursor-not-allowed" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
              >
                {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                {showValues ? "Hide Values" : "Show Values"}
              </button>

              {/* Run Button */}
              <button
                onClick={isPaused ? handleResume : isSorting ? handlePause : handleRun}
                disabled={!customAlgorithmRef.current && !isSorting}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg transition-all ${isPaused ? "bg-emerald-600" : isSorting ? "bg-amber-500 text-slate-900" : customAlgorithmRef.current ? "bg-gradient-to-r from-blue-600 to-cyan-500" : "bg-slate-700 text-slate-400 cursor-not-allowed"}`}
              >
                {isPaused ? <Play size={18} fill="currentColor" /> : isSorting ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {isPaused ? "Resume" : isSorting ? "Pause" : "Run"}
              </button>
            </div>

            <div className="mt-5 p-3 rounded-2xl border border-white/10 bg-white/5 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-200 uppercase mb-1-1">
                flex items-center gap <Keyboard size={12} /> Shortcuts
              </p>
              <p>Space: Run/Pause | R: Reset | N: New</p>
              <p>←: Prev Step | →: Next Step | S: Step Mode</p>
            </div>
          </aside>

          {/* Algorithm Explanation Panel */}
          <AlgorithmExplanationPanel
            currentStep={currentStep}
            totalSteps={totalSteps}
            explanation={explanation}
            operation={operation}
            variables={variables}
            isRunning={isSorting || isPaused}
          />

          {/* Step Controller */}
          <StepController
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepMode={stepMode}
            onToggleStepMode={toggleStepMode}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onGoToStep={goToStep}
            isSorting={isSorting}
            isPaused={isPaused}
            precomputedSteps={precomputedSteps}
          />
        </div>
      </div>

      {/* Visualization Area */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-800/35 p-4 backdrop-blur sm:p-6 shadow-2xl">
        <div className="mb-4 flex justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-300" /> Stage
          </p>
          <div className="flex gap-2">
            {legendItems.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        
        <div className="relative h-[300px] sm:h-[400px] bg-slate-900/55 rounded-2xl border border-slate-700/60 flex items-end justify-center gap-0.5 px-4 pb-4">
          {array.map((item, i) => (
            <motion.div
              key={i}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative rounded-t-sm flex items-end justify-center pb-1 ${
                item.status === "comparing" ? themeColors.comparing :
                item.status === "swapping" ? themeColors.swapping :
                item.status === "sorted" ? themeColors.sorted :
                item.status === "pivot" ? themeColors.pivot :
                item.status === "target" ? themeColors.target :
                themeColors.default
              }`}
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                width: `${100 / array.length}%`,
              }}
            >
              {canShowValues && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-bold text-white select-none mb-1"
                  style={{
                    writingMode: array.length > 30 ? "vertical-rl" : "horizontal-tb",
                  }}
                >
                  {item.value}
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-[11px] text-slate-400 uppercase">Progress</p>
            <p className="text-lg font-bold text-cyan-200">{progress}%</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-[11px] text-slate-400 uppercase">Sorted</p>
            <p className="text-lg font-bold text-emerald-200">{sortedCount}/{array.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-[11px] text-slate-400 uppercase">Min/Max</p>
            <p className="text-lg font-bold text-blue-200">{valueStats.min}/{valueStats.max}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-[11px] text-slate-400 uppercase">Delay</p>
            <p className="text-lg font-bold text-amber-200">{speed}ms</p>
          </div>
        </div>
      </section>
    </div>
  );
}
