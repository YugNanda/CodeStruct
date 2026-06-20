import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Trophy, Clock, ArrowRightLeft } from 'lucide-react';

const COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981'];

export default function PerformanceBarChart({ algorithmStats, selectedAlgorithms, elapsedTime }) {
  // Prepare data for bar chart
  const chartData = useMemo(() => {
    return selectedAlgorithms.map((algo) => {
      const stats = algorithmStats[algo.id] || {};
      return {
        name: algo.name,
        comparisons: stats.comparisons || 0,
        swaps: stats.swaps || 0,
        time: stats.isComplete ? elapsedTime : 0,
        isComplete: stats.isComplete || false,
        id: algo.id,
      };
    });
  }, [algorithmStats, selectedAlgorithms, elapsedTime]);

  // Find best performer
  const bestPerformer = useMemo(() => {
    const completed = chartData.filter((d) => d.isComplete);
    if (completed.length === 0) return null;
    
    return completed.reduce((best, current) => {
      const bestScore = best.comparisons + best.swaps;
      const currentScore = current.comparisons + current.swaps;
      return currentScore < bestScore ? current : best;
    });
  }, [chartData]);

  const hasData = chartData.some((d) => d.comparisons > 0 || d.swaps > 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Performance Comparison</h3>
        </div>
        {bestPerformer && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-300">
              Best: {bestPerformer.name}
            </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Total Comparisons</span>
          </div>
          <p className="text-xl font-bold text-white">
            {chartData.reduce((sum, d) => sum + d.comparisons, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="w-4 h-4 text-purple-400 rotate-90" />
            <span className="text-xs text-slate-400">Total Swaps</span>
          </div>
          <p className="text-xl font-bold text-white">
            {chartData.reduce((sum, d) => sum + d.swaps, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Execution Time</span>
          </div>
          <p className="text-xl font-bold text-white">{elapsedTime}s</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 min-h-[300px] bg-slate-800/30 rounded-xl border border-white/10 p-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Legend />
              <Bar dataKey="comparisons" name="Comparisons" fill="#22d3ee" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-comp-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="swaps" name="Swaps" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No performance data available</p>
            <p className="text-xs mt-1 opacity-70">Run a comparison to see results</p>
          </div>
        )}
      </div>

      {/* Algorithm Details Table */}
      {hasData && (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Algorithm</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Comparisons</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Swaps</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Time</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {chartData.map((algo, index) => (
                <tr key={algo.id} className="hover:bg-white/5">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-white">{algo.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-cyan-400">
                    {algo.comparisons.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-purple-400">
                    {algo.swaps.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-emerald-400">
                    {algo.time}s
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        algo.isComplete
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {algo.isComplete ? 'Complete' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
