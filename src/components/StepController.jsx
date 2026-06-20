import { motion } from "framer-motion";
import { 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause,
  Rewind,
  FastForward,
  Layers,
  Smartphone
} from "lucide-react";

export default function StepController({
  currentStep,
  totalSteps,
  stepMode,
  onToggleStepMode,
  onStepForward,
  onStepBackward,
  onGoToStep,
  isSorting,
  isPaused,
  precomputedSteps
}) {
  const hasSteps = precomputedSteps && precomputedSteps.length > 0;
  const canStepForward = hasSteps && currentStep < totalSteps;
  const canStepBackward = currentStep > 0;

  const handleSliderChange = (e) => {
    const step = parseInt(e.target.value, 10);
    onGoToStep(step);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-violet-300" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              Step Controller
            </h3>
          </div>
          <button
            onClick={onToggleStepMode}
            disabled={isSorting && !isPaused}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              stepMode 
                ? "bg-violet-500/20 border-violet-400/30 text-violet-200" 
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {stepMode ? <SkipForward size={14} /> : <Play size={14} />}
            {stepMode ? "Step Mode" : "Auto Mode"}
          </button>
        </div>
      </div>

      {/* Step Counter Display */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Step Navigation
          </span>
          <span className="text-sm font-bold text-white">
            {currentStep} <span className="text-slate-500">/</span> {totalSteps}
          </span>
        </div>
        
        {/* Step Slider - Touch-friendly with larger hit area */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={totalSteps || 0}
            value={currentStep}
            onChange={handleSliderChange}
            disabled={!hasSteps || totalSteps === 0}
            className="w-full h-3 sm:h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0</span>
            <span>{totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Navigation Controls - Larger touch targets for mobile */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Step Backward */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStepBackward}
            disabled={!canStepBackward}
            className={`flex items-center justify-center min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px] w-12 h-12 sm:w-11 sm:h-11 rounded-xl transition-all touch-manipulation ${
              canStepBackward
                ? "bg-white/5 border border-white/10 text-white hover:bg-white/10 active:bg-white/15"
                : "bg-slate-800/50 border border-white/5 text-slate-600 cursor-not-allowed"
            }`}
            title="Step Backward (Left Arrow)"
          >
            <SkipBack size={20} className="sm:w-5 sm:h-5" />
          </motion.button>

          {/* Previous Step */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStepBackward}
            disabled={!canStepBackward}
            className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 sm:w-9 sm:h-9 rounded-lg transition-all touch-manipulation ${
              canStepBackward
                ? "bg-amber-500/10 border border-amber-400/20 text-amber-200 hover:bg-amber-500/20 active:bg-amber-500/25"
                : "bg-slate-800/50 border border-white/5 text-slate-600 cursor-not-allowed"
            }`}
            title="Previous Step"
          >
            <Rewind size={18} className="sm:w-4 sm:h-4" />
          </motion.button>

          {/* Step Forward (Single Step) - Main action button, largest */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStepForward}
            disabled={!canStepForward && !stepMode}
            className={`flex items-center justify-center min-w-[56px] min-h-[56px] sm:min-w-[52px] sm:min-h-[52px] w-14 h-14 sm:w-12 sm:h-12 rounded-xl transition-all touch-manipulation ${
              (canStepForward || stepMode) && !isSorting
                ? "bg-violet-500/20 border border-violet-400/30 text-violet-200 hover:bg-violet-500/30 active:bg-violet-500/40 shadow-lg shadow-violet-500/20"
                : "bg-slate-800/50 border border-white/5 text-slate-600 cursor-not-allowed"
            }`}
            title={stepMode ? "Execute Step (Right Arrow)" : "Step Forward"}
          >
            <SkipForward size={24} className="sm:w-6 sm:h-6" />
          </motion.button>

          {/* Next Step */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStepForward}
            disabled={!canStepForward && !stepMode}
            className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 sm:w-9 sm:h-9 rounded-lg transition-all touch-manipulation ${
              (canStepForward || stepMode) && !isSorting
                ? "bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 hover:bg-emerald-500/20 active:bg-emerald-500/25"
                : "bg-slate-800/50 border border-white/5 text-slate-600 cursor-not-allowed"
            }`}
            title="Next Step"
          >
            <FastForward size={18} className="sm:w-4 sm:h-4" />
          </motion.button>
        </div>
        
        {/* Mobile hint */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 sm:hidden">
          <Smartphone size={12} />
          <span>Swipe on chart to navigate steps</span>
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="px-4 py-3 bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          {stepMode ? (
            <>
              <Pause size={12} className="text-violet-400" />
              <span>Step-by-Step Mode: Click forward to execute one operation</span>
            </>
          ) : (
            <>
              <Play size={12} className="text-emerald-400" />
              <span>Continuous Mode: Algorithm runs automatically</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
