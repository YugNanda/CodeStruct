import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, Check, Copy } from 'lucide-react';
import { exportComparisonResults, exportToCSV, exportToJSON } from '../../utils/analyticsExport';

const COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981'];

export default function ExportPanel({
  algorithmStats,
  selectedAlgorithms,
  arraySize,
  arrayType,
  elapsedTime,
  realTimeData,
}) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Prepare export data
  const exportData = {
    timestamp: new Date().toISOString(),
    algorithms: selectedAlgorithms,
    arraySize,
    arrayType,
    elapsedTime,
    results: algorithmStats,
    historicalData: realTimeData,
  };

  const handleExportJSON = () => {
    setExporting(true);
    exportComparisonResults(exportData, 'json');
    setTimeout(() => setExporting(false), 500);
  };

  const handleExportCSV = () => {
    setExporting(true);
    exportComparisonResults(exportData, 'csv');
    setTimeout(() => setExporting(false), 500);
  };

  const handleCopyJSON = () => {
    const json = exportToJSON(exportData);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasData = selectedAlgorithms.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Export Data</h3>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportJSON}
          disabled={!hasData || exporting}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-cyan-400/30 hover:bg-cyan-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-3 rounded-lg bg-cyan-500/10">
            <FileJson className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Export JSON</p>
            <p className="text-xs text-slate-400 mt-1">Full data with metadata</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportCSV}
          disabled={!hasData || exporting}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-emerald-400/30 hover:bg-emerald-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Export CSV</p>
            <p className="text-xs text-slate-400 mt-1">Spreadsheet format</p>
          </div>
        </motion.button>
      </div>

      {/* Preview Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Data Preview</span>
          <button
            onClick={handleCopyJSON}
            disabled={!hasData}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy JSON
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-auto rounded-xl bg-slate-900/50 border border-white/10 p-3">
          {hasData ? (
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(
                {
                  session: {
                    date: new Date().toLocaleString(),
                    arraySize,
                    arrayType,
                    elapsedTime: `${elapsedTime}s`,
                  },
                  algorithms: selectedAlgorithms.map((algo, index) => {
                    const stats = algorithmStats[algo.id] || {};
                    return {
                      name: algo.name,
                      comparisons: stats.comparisons || 0,
                      swaps: stats.swaps || 0,
                      status: stats.isComplete ? 'complete' : 'incomplete',
                      complexity: {
                        best: algo.best,
                        average: algo.average,
                        worst: algo.worst,
                      },
                    };
                  }),
                },
                null,
                2
              )}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <FileJson className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">No data to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {hasData && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">Algorithms</p>
            <p className="text-lg font-bold text-white">{selectedAlgorithms.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">Data Points</p>
            <p className="text-lg font-bold text-white">
              {Object.values(realTimeData).reduce((sum, data) => sum + (data?.length || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
