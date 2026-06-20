import { useMemo } from 'react';
import { ChevronRight, Clock, Zap, ArrowRightLeft } from 'lucide-react';

const COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981'];
const OPERATION_ICONS = {
  comparison: ArrowRightLeft,
  swap: Zap,
};

export default function OperationTimeline({ realTimeData, selectedAlgorithms, elapsedTime }) {
  // Process timeline data
  const timelineData = useMemo(() => {
    if (!realTimeData || Object.keys(realTimeData).length === 0) {
      return [];
    }

    const events = [];
    
    selectedAlgorithms.forEach((algo, algoIndex) => {
      const algoData = realTimeData[algo.id] || [];
      
      algoData.forEach((point, index) => {
        // Only add events when there's a change
        if (index === 0 || 
            point.comparisons !== algoData[index - 1].comparisons ||
            point.swaps !== algoData[index - 1].swaps) {
          
          events.push({
            algoId: algo.id,
            algoName: algo.name,
            algoColor: COLORS[algoIndex % COLORS.length],
            step: index,
            comparisons: point.comparisons || 0,
            swaps: point.swaps || 0,
            timestamp: point.timestamp || index * 100, // ms
          });
        }
      });
    });

    // Sort by step
    return events.sort((a, b) => a.step - b.step);
  }, [realTimeData, selectedAlgorithms]);

  // Group events by step for display
  const groupedEvents = useMemo(() => {
    const groups = {};
    timelineData.forEach((event) => {
      if (!groups[event.step]) {
        groups[event.step] = [];
      }
      groups[event.step].push(event);
    });
    return groups;
  }, [timelineData]);

  const hasData = timelineData.length > 0;
  const steps = Object.keys(groupedEvents).map(Number).sort((a, b) => a - b);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Operation Timeline</h3>
        </div>
        {hasData && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{steps.length} steps recorded</span>
          </div>
        )}
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto bg-slate-800/30 rounded-xl border border-white/10 p-4">
        {hasData ? (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

            {/* Events */}
            <div className="space-y-4">
              {steps.map((step, stepIndex) => {
                const events = groupedEvents[step];
                
                return (
                  <div key={step} className="relative flex gap-4">
                    {/* Step Indicator */}
                    <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-400">{step}</span>
                    </div>

                    {/* Events at this step */}
                    <div className="flex-1 space-y-2">
                      {events.map((event, eventIndex) => {
                        const ComparisonIcon = OPERATION_ICONS.comparison;
                        const SwapIcon = OPERATION_ICONS.swap;
                        
                        return (
                          <div
                            key={`${event.algoId}-${eventIndex}`}
                            className="p-3 rounded-lg bg-slate-800/50 border border-white/5"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: event.algoColor }}
                              />
                              <span className="text-sm font-medium text-white">
                                {event.algoName}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                              {event.comparisons > 0 && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <ComparisonIcon className="w-3 h-3 text-cyan-400" />
                                  <span className="text-slate-400">Comparisons:</span>
                                  <span className="font-medium text-cyan-400">
                                    {event.comparisons}
                                  </span>
                                </div>
                              )}
                              {event.swaps > 0 && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <SwapIcon className="w-3 h-3 text-purple-400" />
                                  <span className="text-slate-400">Swaps:</span>
                                  <span className="font-medium text-purple-400">
                                    {event.swaps}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <ChevronRight className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No timeline data available</p>
            <p className="text-xs mt-1 opacity-70">
              Execute algorithms to see operation timeline
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {hasData && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">Total Steps</p>
            <p className="text-xl font-bold text-white">{steps.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">Execution Time</p>
            <p className="text-xl font-bold text-white">{elapsedTime}s</p>
          </div>
        </div>
      )}
    </div>
  );
}
