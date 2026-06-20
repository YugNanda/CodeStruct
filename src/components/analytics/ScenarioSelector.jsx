import { motion } from 'framer-motion';
import { 
  Shuffle, 
  ArrowUp, 
  ArrowDown, 
  GripHorizontal, 
  Palette,
  Check
} from 'lucide-react';
import { generateArrayByPattern } from '../../utils/analyticsExport';

const SCENARIOS = [
  {
    id: 'random',
    name: 'Random Data',
    description: 'Completely random values',
    icon: Shuffle,
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'sorted',
    name: 'Sorted',
    description: 'Already in ascending order',
    icon: ArrowUp,
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'reverse',
    name: 'Reverse Sorted',
    description: 'Descending order (worst case)',
    icon: ArrowDown,
    color: 'rose',
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    id: 'nearly-sorted',
    name: 'Nearly Sorted',
    description: 'Mostly sorted with few swaps',
    icon: GripHorizontal,
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'few-unique',
    name: 'Few Unique',
    description: 'Limited distinct values',
    icon: Palette,
    color: 'purple',
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
];

export default function ScenarioSelector({ onSelect, currentScenario, arraySize }) {
  const handleSelect = (scenarioId) => {
    const array = generateArrayByPattern(arraySize, scenarioId);
    onSelect(scenarioId, array);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shuffle className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Scenario Presets</h3>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4">
        Choose a data pattern to test algorithm performance under different conditions.
      </p>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 gap-3">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isSelected = currentScenario === scenario.id;
          
          return (
            <motion.button
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(scenario.id)}
              className={`relative p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? `border-${scenario.color}-400/50 bg-${scenario.color}-500/10`
                  : 'border-white/10 bg-slate-800/50 hover:border-white/20'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className={`absolute top-3 right-3 p-1 rounded-full bg-${scenario.color}-400/20`}>
                  <Check className={`w-4 h-4 text-${scenario.color}-400`} />
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${scenario.gradient}`}>
                  <Icon className={`w-5 h-5 text-${scenario.color}-400`} />
                </div>

                {/* Content */}
                <div>
                  <h4 className={`font-semibold ${
                    isSelected ? `text-${scenario.color}-100` : 'text-white'
                  }`}>
                    {scenario.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {scenario.description}
                  </p>
                </div>
              </div>

              {/* Preview Bar */}
              <div className="mt-3 flex items-center gap-1">
                {generateArrayByPattern(20, scenario.id).map((item, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${
                      isSelected ? `bg-${scenario.color}-400/40` : 'bg-slate-600/40'
                    }`}
                    style={{ height: `${(item.value / 420) * 24}px` }}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Current Selection Info */}
      {currentScenario && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Current Pattern</span>
            <span className="text-sm font-medium text-cyan-400 capitalize">
              {currentScenario.replace('-', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Array size: {arraySize} elements
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-auto pt-4">
        <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
          <p className="text-xs text-slate-500">
            <span className="text-cyan-400 font-medium">Tip:</span> Different patterns stress-test 
            algorithms differently. Try "Reverse Sorted" to see worst-case performance.
          </p>
        </div>
      </div>
    </div>
  );
}
