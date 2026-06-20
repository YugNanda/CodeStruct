import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Activity, 
  History, 
  Download, 
  Settings2,
  X,
  ChevronRight
} from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import LiveLineChart from './LiveLineChart';
import PerformanceBarChart from './PerformanceBarChart';
import ComplexityIndicator from './ComplexityIndicator';
import OperationTimeline from './OperationTimeline';
import SessionHistory from './SessionHistory';
import ExportPanel from './ExportPanel';
import ScenarioSelector from './ScenarioSelector';

const TABS = [
  { id: 'live', label: 'Live Metrics', icon: Activity },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'complexity', label: 'Complexity', icon: Settings2 },
  { id: 'timeline', label: 'Timeline', icon: ChevronRight },
  { id: 'history', label: 'History', icon: History },
  { id: 'export', label: 'Export', icon: Download },
];

export default function AnalyticsDashboard({ 
  isOpen, 
  onClose, 
  algorithmStats, 
  selectedAlgorithms,
  arraySize,
  arrayType,
  elapsedTime,
  isRunning,
  realTimeData 
}) {
  const [activeTab, setActiveTab] = useState('live');
  const { currentSession, sessionHistory } = useAnalytics();

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'live':
        return (
          <LiveLineChart 
            realTimeData={realTimeData}
            selectedAlgorithms={selectedAlgorithms}
            isRunning={isRunning}
          />
        );
      case 'performance':
        return (
          <PerformanceBarChart 
            algorithmStats={algorithmStats}
            selectedAlgorithms={selectedAlgorithms}
            elapsedTime={elapsedTime}
          />
        );
      case 'complexity':
        return (
          <ComplexityIndicator 
            algorithmStats={algorithmStats}
            selectedAlgorithms={selectedAlgorithms}
            arraySize={arraySize}
          />
        );
      case 'timeline':
        return (
          <OperationTimeline 
            realTimeData={realTimeData}
            selectedAlgorithms={selectedAlgorithms}
            elapsedTime={elapsedTime}
          />
        );
      case 'history':
        return (
          <SessionHistory 
            sessionHistory={sessionHistory}
            currentSession={currentSession}
          />
        );
      case 'export':
        return (
          <ExportPanel 
            algorithmStats={algorithmStats}
            selectedAlgorithms={selectedAlgorithms}
            arraySize={arraySize}
            arrayType={arrayType}
            elapsedTime={elapsedTime}
            realTimeData={realTimeData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-slate-900/95 border-l border-white/10 shadow-2xl backdrop-blur-xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Analytics Dashboard</h2>
              <p className="text-xs text-slate-400">Real-time performance insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-white/10 bg-slate-800/30 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive 
                    ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10' 
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>Algorithms: <span className="text-cyan-400 font-semibold">{selectedAlgorithms.length}</span></span>
              <span>Array Size: <span className="text-cyan-400 font-semibold">{arraySize}</span></span>
              <span>Type: <span className="text-cyan-400 font-semibold capitalize">{arrayType}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isRunning ? 'Running' : 'Idle'}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
