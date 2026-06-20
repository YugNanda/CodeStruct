import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, ChevronDown, ChevronUp, Calendar, BarChart3 } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

const COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981'];

export default function SessionHistory() {
  const { sessionHistory, deleteSession, clearHistory, getGlobalStats } = useAnalytics();
  const [expandedSession, setExpandedSession] = useState(null);

  const globalStats = getGlobalStats();

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Session History</h3>
        </div>
        {sessionHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Global Stats */}
      {globalStats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
            <p className="text-xs text-cyan-400 mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-white">{globalStats.totalSessions}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/20">
            <p className="text-xs text-purple-400 mb-1">Algorithms Tested</p>
            <p className="text-2xl font-bold text-white">
              {Object.keys(globalStats.algorithmStats).length}
            </p>
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sessionHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <History className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No session history</p>
            <p className="text-xs mt-1 opacity-70">
              Run comparisons to build your history
            </p>
          </div>
        ) : (
          sessionHistory.map((session, index) => {
            const isExpanded = expandedSession === session.id;
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden"
              >
                {/* Session Header */}
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        {formatDate(session.timestamp)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {session.algorithms?.length || 0} algorithms • {session.arraySize} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {session.elapsedTime}s
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-3">
                        {/* Algorithm Results */}
                        {session.algorithms?.map((algo, algoIndex) => {
                          const result = session.results?.[algo.id] || {};
                          return (
                            <div
                              key={algo.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: COLORS[algoIndex % COLORS.length] }}
                                />
                                <span className="text-sm text-slate-300">{algo.name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-cyan-400">
                                  {result.comparisons || 0} comp
                                </span>
                                <span className="text-purple-400">
                                  {result.swaps || 0} swaps
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full ${
                                    result.isComplete
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-500/20 text-slate-400'
                                  }`}
                                >
                                  {result.isComplete ? 'Done' : 'Incomplete'}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Actions */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Algorithm Performance Summary */}
      {globalStats && Object.keys(globalStats.algorithmStats).length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Performance Summary</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(globalStats.algorithmStats).map(([algoId, stats], index) => (
              <div
                key={algoId}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300">{stats.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{stats.totalRuns} runs</span>
                  <span className="text-cyan-400">{stats.avgComparisons.toLocaleString()} avg comp</span>
                  <span className="text-emerald-400">{stats.avgTime}s avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
