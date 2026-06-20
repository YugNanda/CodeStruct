import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useComparison, comparisonAlgorithms } from "../hooks/useComparison";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Check,
  Timer,
  Layers,
  BarChart3,
} from "lucide-react";
import { AnalyticsDashboard } from "../components/analytics";


const colorThemes = {
  ocean: {
    colors: {
      default: "bg-blue-500",
      comparing: "bg-amber-300",
      swapping: "bg-rose-500",
      sorted: "bg-emerald-500",
      pivot: "bg-violet-500",
    },
  },
};

const algorithmColors = [
  { border: "border-cyan-400/40", bg: "bg-cyan-500/10", accent: "text-cyan-200" },
  { border: "border-blue-400/40", bg: "bg-blue-500/10", accent: "text-blue-200" },
  { border: "border-purple-400/40", bg: "bg-purple-500/10", accent: "text-purple-200" },
  { border: "border-emerald-400/40", bg: "bg-emerald-500/10", accent: "text-emerald-200" },
];

function formatElapsed(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function ComparisonPage() {
  useDocumentTitle("Algorithm Comparison - DSA Visualizer");
  const navigate = useNavigate();
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  
  const {
    selectedAlgorithms,
    array,
    isRunning,
    isPaused,
    speed,
    arraySize,
    elapsedTime,
    algorithmStats,
    realTimeData,
    algorithmArrays,
    arrayType,
    setSelectedAlgorithms,
    generateRandomArray,
    runComparison,
    pauseComparison,
    resumeComparison,
    setSpeed,
    resetStats,
    setArrayFromScenario,
    canCompare,
    isMaxSelected,
  } = useComparison();


  const themeConfig = colorThemes.ocean;
  const themeColors = themeConfig.colors;

  useEffect(() => {
    if (array.length === 0) {
      generateRandomArray(arraySize);
    }
  }, []);

  useEffect(() => {
    if (selectedAlgorithms.length > 0) {
      resetStats();
    }
  }, [selectedAlgorithms.length]);

  const maxValue = useMemo(() => {
    if (array.length === 0) return 1;
    return Math.max(...array.map((item) => item.value));
  }, [array]);

  const handleStart = () => {
    if (isPaused) {
      resumeComparison();
    } else {
      runComparison();
    }
  };

  return (
    <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.18),transparent_36%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/algorithms")}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-4 pl-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back
            </button>
            <h1 className="font-display text-2xl font-black text-white sm:text-4xl">
              Algorithm Comparison
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-200 hover:bg-purple-500/20 transition-colors"
            >
              <BarChart3 size={14} />
              Analytics
            </button>
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
              <Timer size={14} />
              {formatElapsed(elapsedTime)}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300">
          Select 2-4 algorithms to compare their performance side-by-side on the same data.
        </p>
      </motion.section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-cyan-300" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                  Select Algorithms
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {selectedAlgorithms.length}/4
              </span>
            </div>
            
            <div className="space-y-2">
              {comparisonAlgorithms.map((algo) => {
                const isSelected = selectedAlgorithms.some(a => a.id === algo.id);
                return (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgorithms(algo)}
                    disabled={!isSelected && isMaxSelected}
                    className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-cyan-400/50 bg-cyan-500/10"
                        : isMaxSelected
                        ? "border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? "text-cyan-100" : "text-slate-300"}`}>
                      {algo.name}
                    </span>
                    {isSelected && (
                      <Check size={16} className="text-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAlgorithms.length < 2 && (
              <p className="mt-3 text-xs text-amber-400">
                Select at least 2 algorithms to compare
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
            <div className="space-y-4">
              {/* Scenario Selector */}
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="text-xs text-slate-400 mb-2 uppercase block">
                  Data Pattern
                </label>
                <select
                  value={arrayType}
                  disabled={isRunning}
                  onChange={(e) => {
                    const scenario = e.target.value;
                    import('../utils/analyticsExport').then((module) => {
                      const newArray = module.generateArrayByPattern(arraySize, scenario);
                      setArrayFromScenario(scenario, newArray);
                    });
                  }}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                >


                  <option value="random">Random Data</option>
                  <option value="sorted">Sorted (Ascending)</option>
                  <option value="reverse">Reverse Sorted</option>
                  <option value="nearly-sorted">Nearly Sorted</option>
                  <option value="few-unique">Few Unique Values</option>
                </select>
              </div>

              <div className="rounded-2xl bg-white/5 p-3">
                <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                  <span>Array Size</span> <span>{arraySize}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={arraySize}
                  disabled={isRunning}
                  onChange={(e) => {
                    const newSize = +e.target.value;
                    generateRandomArray(newSize);
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                  <span>Speed</span> <span>{speed}ms</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                  className="w-full accent-blue-400"
                  disabled={isRunning}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={resetStats}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white border border-white/10 disabled:opacity-50"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  onClick={() => generateRandomArray(arraySize)}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100 border border-cyan-400/20 disabled:opacity-50"
                >
                  <Shuffle size={16} /> New Data
                </button>
              </div>

              <button
                onClick={handleStart}
                disabled={!canCompare || array.length === 0}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg transition-all ${
                  isPaused
                    ? "bg-emerald-600"
                    : isRunning
                    ? "bg-amber-500 text-slate-900"
                    : canCompare
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                    : "bg-slate-700 opacity-50 cursor-not-allowed"
                }`}
              >
                {isPaused ? (
                  <Play size={18} fill="currentColor" />
                ) : isRunning ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                {isPaused ? "Resume" : isRunning ? "Pause" : "Start"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-300">
              Legend
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Default", color: themeColors.default },
                { label: "Comparing", color: themeColors.comparing },
                { label: "Swapping", color: themeColors.swapping },
                { label: "Sorted", color: themeColors.sorted },
              ].map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase"
                >
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {selectedAlgorithms.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                Performance Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                        Algorithm
                      </th>
                      <th className="pb-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        Status
                      </th>
                      <th className="pb-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        Comparisons
                      </th>
                      <th className="pb-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        Swaps
                      </th>
                      <th className="pb-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAlgorithms.map((algo, index) => {
                      const stats = algorithmStats[algo.id] || {};
                      return (
                        <tr
                          key={algo.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-cyan-400" />
                              <span className="text-sm font-semibold text-white">
                                {algo.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                stats.isComplete
                                  ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                                  : stats.isRunning
                                  ? "border border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                                  : "border border-white/10 bg-white/5 text-slate-400"
                              }`}
                            >
                              {stats.isComplete ? "Complete" : stats.isRunning ? "Running" : "Ready"}
                            </span>
                          </td>
                          <td className="py-3 text-center text-sm text-slate-300">
                            {stats.comparisons || 0}
                          </td>
                          <td className="py-3 text-center text-sm text-slate-300">
                            {stats.swaps || 0}
                          </td>
                          <td className="py-3 text-center text-sm text-slate-300">
                            {stats.isComplete ? formatElapsed(stats.finishTime || elapsedTime) : '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedAlgorithms.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-white/10 bg-slate-800/35 p-12 text-center backdrop-blur">
                <Layers size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-lg font-semibold text-slate-300">
                  Select algorithms to compare
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Choose 2-4 algorithms from the sidebar to see them side-by-side
                </p>
              </div>
            ) : (
              selectedAlgorithms.map((algo, index) => {
                const colorScheme = algorithmColors[index % 4];
                const stats = algorithmStats[algo.id] || {};
                
                return (
                  <motion.div
                    key={algo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-3xl border ${colorScheme.border} ${colorScheme.bg} p-4 backdrop-blur`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className={`text-lg font-bold ${colorScheme.accent}`}>
                        {algo.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Time:</span>
                        <span className="font-semibold text-white">
                          {stats.isComplete ? formatElapsed(stats.finishTime || elapsedTime) : '--'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative h-[200px] bg-slate-900/55 rounded-xl border border-slate-700/60 flex items-end justify-center gap-0.5 px-2 pb-2">
                      {(algorithmArrays[algo.id] || array).map((item, i) => (
                        <motion.div
                          key={i}
                          layout
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className={`relative rounded-t-sm flex items-end justify-center pb-0.5 ${
                            item.status === "comparing"
                              ? themeColors.comparing
                              : item.status === "swapping"
                              ? themeColors.swapping
                              : item.status === "sorted"
                              ? themeColors.sorted
                              : themeColors.default
                          }`}
                          style={{
                            height: `${(item.value / maxValue) * 100}%`,
                            width: `${100 / array.length}%`,
                            minWidth: "2px",
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg bg-white/5 p-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Comparisons
                        </p>
                        <p className="text-sm font-bold text-white">
                          {stats.comparisons || 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Swaps
                        </p>
                        <p className="text-sm font-bold text-white">
                          {stats.swaps || 0}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        algorithmStats={algorithmStats}
        selectedAlgorithms={selectedAlgorithms}
        arraySize={arraySize}
        arrayType={arrayType}
        elapsedTime={elapsedTime}
        isRunning={isRunning}
        realTimeData={realTimeData}
      />
    </div>
  );
}
