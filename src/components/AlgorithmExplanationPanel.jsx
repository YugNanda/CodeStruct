import { motion, AnimatePresence } from "framer-motion";
import { 
  Footprints, 
  Cpu, 
  Variable, 
  BookOpen, 
  ChevronRight,
  Info
} from "lucide-react";

export default function AlgorithmExplanationPanel({
  currentStep,
  totalSteps,
  explanation,
  operation,
  variables,
  isRunning
}) {
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  
  // Format variables for display
  const formatVariables = () => {
    if (!variables || Object.keys(variables).length === 0) return null;
    
    return Object.entries(variables).map(([key, value]) => (
      <div 
        key={key} 
        className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/10"
      >
        <span className="text-xs font-medium text-cyan-300 uppercase tracking-wider">{key}</span>
        <span className="text-sm font-bold text-white font-mono">
          {Array.isArray(value) ? `[${value.join(', ')}]` : 
           typeof value === 'object' ? JSON.stringify(value) : 
           String(value)}
        </span>
      </div>
    ));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-cyan-300" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Algorithm Details
          </h3>
        </div>
      </div>

      {/* Step Counter */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Footprints size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Step Counter
            </span>
          </div>
          <span className="text-sm font-bold text-white">
            {currentStep} <span className="text-slate-500">/</span> {totalSteps}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
          <motion.div 
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
          />
        </div>
        
        {totalSteps > 0 && (
          <p className="mt-2 text-[10px] text-slate-400 text-right">
            {progress}% Complete
          </p>
        )}
      </div>

      {/* Current Operation */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Current Operation
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={operation}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-sm font-medium text-white min-h-[20px]"
          >
            {operation || (
              <span className="text-slate-500 italic">
                {isRunning ? "Waiting for operation..." : "Ready to start"}
              </span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Explanation */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Info size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Explanation
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={explanation}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-300 leading-relaxed min-h-[60px]"
          >
            {explanation ? (
              <p>{explanation}</p>
            ) : (
              <p className="text-slate-500 italic">
                {isRunning ? "Analyzing step..." : "Start the algorithm to see detailed explanations"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Variables State */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Variable size={14} className="text-violet-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Variables State
          </span>
        </div>
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {formatVariables() || (
            <p className="text-xs text-slate-500 italic text-center py-4">
              No variables to display
            </p>
          )}
        </div>
      </div>

      {/* Empty State Footer */}
      {!isRunning && currentStep === 0 && totalSteps === 0 && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ChevronRight size={12} />
            <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-300 font-mono">Space</kbd> to start</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
