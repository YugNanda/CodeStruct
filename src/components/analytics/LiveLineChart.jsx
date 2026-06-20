import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

const COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981'];

export default function LiveLineChart({ realTimeData, selectedAlgorithms, isRunning }) {
  // Transform real-time data for the chart
  const chartData = useMemo(() => {
    if (!realTimeData || Object.keys(realTimeData).length === 0) {
      return [];
    }

    // Find the maximum length of data points
    const maxLength = Math.max(
      ...Object.values(realTimeData).map((data) => data?.length || 0)
    );

    // Create data points for each time step
    return Array.from({ length: maxLength }, (_, index) => {
      const point = { step: index };
      
      selectedAlgorithms.forEach((algo) => {
        const algoData = realTimeData[algo.id];
        if (algoData && algoData[index]) {
          point[`${algo.id}_comparisons`] = algoData[index].comparisons || 0;
          point[`${algo.id}_swaps`] = algoData[index].swaps || 0;
        }
      });
      
      return point;
    });
  }, [realTimeData, selectedAlgorithms]);

  const hasData = chartData.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Live Metrics</h3>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">Recording</span>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {selectedAlgorithms.map((algo, index) => {
          const algoData = realTimeData?.[algo.id] || [];
          const latest = algoData[algoData.length - 1] || { comparisons: 0, swaps: 0 };
          
          return (
            <div
              key={algo.id}
              className="p-3 rounded-xl bg-slate-800/50 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-slate-300">{algo.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Comparisons</span>
                  <p className="text-lg font-bold text-white">{latest.comparisons}</p>
                </div>
                <div>
                  <span className="text-slate-500">Swaps</span>
                  <p className="text-lg font-bold text-white">{latest.swaps}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px] bg-slate-800/30 rounded-xl border border-white/10 p-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="step"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Operation Step', position: 'insideBottom', offset: -5, fill: '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              
              {selectedAlgorithms.map((algo, index) => (
                <Line
                  key={`${algo.id}_comparisons`}
                  type="monotone"
                  dataKey={`${algo.id}_comparisons`}
                  name={`${algo.name} (Comparisons)`}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              ))}
              
              {selectedAlgorithms.map((algo, index) => (
                <Line
                  key={`${algo.id}_swaps`}
                  type="monotone"
                  dataKey={`${algo.id}_swaps`}
                  name={`${algo.name} (Swaps)`}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Start a comparison to see live metrics</p>
            <p className="text-xs mt-1 opacity-70">Data will appear here during algorithm execution</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {hasData && (
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-slate-400 border-dashed" style={{ borderTop: '2px dashed' }} />
            <span className="text-slate-400">Comparisons (dashed)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-slate-400" />
            <span className="text-slate-400">Swaps (solid)</span>
          </div>
        </div>
      )}
    </div>
  );
}
