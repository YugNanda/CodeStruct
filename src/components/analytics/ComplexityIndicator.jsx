import { useMemo } from 'react';
import { Settings2, Info, AlertCircle } from 'lucide-react';
import { calculateTheoreticalComplexity, formatComplexity } from '../../utils/analyticsExport';

const COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981'];

export default function ComplexityIndicator({ algorithmStats, selectedAlgorithms, arraySize }) {
  // Calculate complexity analysis for each algorithm
  const complexityData = useMemo(() => {
    return selectedAlgorithms.map((algo, index) => {
      const stats = algorithmStats[algo.id] || {};
      const actualOperations = (stats.comparisons || 0) + (stats.swaps || 0);
      
      // Calculate theoretical operations based on complexity notation
      const theoreticalBest = calculateTheoreticalComplexity(algo.best, arraySize);
      const theoreticalAverage = calculateTheoreticalComplexity(algo.average, arraySize);
      const theoreticalWorst = calculateTheoreticalComplexity(algo.worst, arraySize);
      
      // Determine which case matches actual performance
      let matchedCase = 'unknown';
      let efficiency = 0;
      
      if (actualOperations > 0) {
        const diffBest = Math.abs(actualOperations - theoreticalBest);
        const diffAverage = Math.abs(actualOperations - theoreticalAverage);
        const diffWorst = Math.abs(actualOperations - theoreticalWorst);
        
        const minDiff = Math.min(diffBest, diffAverage, diffWorst);
        
        if (minDiff === diffBest) {
          matchedCase = 'best';
          efficiency = theoreticalBest > 0 ? (theoreticalBest / actualOperations) * 100 : 0;
        } else if (minDiff === diffAverage) {
          matchedCase = 'average';
          efficiency = theoreticalAverage > 0 ? (theoreticalAverage / actualOperations) * 100 : 0;
        } else {
          matchedCase = 'worst';
          efficiency = theoreticalWorst > 0 ? (theoreticalWorst / actualOperations) * 100 : 0;
        }
      }
      
      return {
        ...algo,
        color: COLORS[index % COLORS.length],
        actualOperations,
        theoreticalBest,
        theoreticalAverage,
        theoreticalWorst,
        matchedCase,
        efficiency: Math.min(efficiency, 100),
        isComplete: stats.isComplete || false,
      };
    });
  }, [algorithmStats, selectedAlgorithms, arraySize]);

  const hasData = complexityData.some((d) => d.actualOperations > 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Complexity Analysis</h3>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300 leading-relaxed">
          Comparing theoretical time complexity vs actual operations performed. 
          Input size (n) = {arraySize}. Lower operations indicate better performance.
        </p>
      </div>

      {/* Complexity Cards */}
      <div className="space-y-3 mb-4">
        {complexityData.map((algo) => (
          <div
            key={algo.id}
            className="p-4 rounded-xl bg-slate-800/50 border border-white/10"
          >
            {/* Algorithm Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: algo.color }}
                />
                <span className="font-semibold text-white">{algo.name}</span>
              </div>
              {algo.isComplete ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    algo.matchedCase === 'best'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : algo.matchedCase === 'average'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {algo.matchedCase === 'best'
                    ? 'Best Case'
                    : algo.matchedCase === 'average'
                    ? 'Average Case'
                    : 'Worst Case'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                  Pending
                </span>
              )}
            </div>

            {/* Complexity Notations */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div
                className={`p-2 rounded-lg text-center ${
                  algo.matchedCase === 'best' && algo.isComplete
                    ? 'bg-emerald-500/20 border border-emerald-400/30'
                    : 'bg-slate-700/50'
                }`}
              >
                <p className="text-[10px] text-slate-400 mb-1">Best Case</p>
                <p className="text-sm font-bold text-white">{formatComplexity(algo.best)}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  ~{algo.theoreticalBest.toLocaleString()} ops
                </p>
              </div>
              <div
                className={`p-2 rounded-lg text-center ${
                  algo.matchedCase === 'average' && algo.isComplete
                    ? 'bg-amber-500/20 border border-amber-400/30'
                    : 'bg-slate-700/50'
                }`}
              >
                <p className="text-[10px] text-slate-400 mb-1">Average</p>
                <p className="text-sm font-bold text-white">{formatComplexity(algo.average)}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  ~{algo.theoreticalAverage.toLocaleString()} ops
                </p>
              </div>
              <div
                className={`p-2 rounded-lg text-center ${
                  algo.matchedCase === 'worst' && algo.isComplete
                    ? 'bg-rose-500/20 border border-rose-400/30'
                    : 'bg-slate-700/50'
                }`}
              >
                <p className="text-[10px] text-slate-400 mb-1">Worst Case</p>
                <p className="text-sm font-bold text-white">{formatComplexity(algo.worst)}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  ~{algo.theoreticalWorst.toLocaleString()} ops
                </p>
              </div>
            </div>

            {/* Actual Performance */}
            {algo.isComplete && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Actual Operations</span>
                  <span className="text-sm font-bold text-cyan-400">
                    {algo.actualOperations.toLocaleString()}
                  </span>
                </div>
                
                {/* Efficiency Bar */}
                <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${algo.efficiency}%`,
                      backgroundColor: algo.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500">Efficiency</span>
                  <span className="text-[10px] font-medium" style={{ color: algo.color }}>
                    {algo.efficiency.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-auto p-3 rounded-xl bg-slate-800/30 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">Understanding Complexity</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Best case: Optimal input conditions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Average case: Random input</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Worst case: Adverse input conditions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Actual: Measured operations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
