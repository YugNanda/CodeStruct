import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ArrowUpDown,
  ArrowDownUp,
  Equal,
  Shuffle,
  Type
} from 'lucide-react';

const PRESETS = [
  { id: 'sorted', label: 'Sorted', icon: ArrowUpDown, description: 'Ascending order' },
  { id: 'reverse', label: 'Reverse', icon: ArrowDownUp, description: 'Descending order' },
  { id: 'equal', label: 'All Equal', icon: Equal, description: 'Same values' },
  { id: 'duplicates', label: 'Duplicates', icon: Shuffle, description: 'With duplicates' },
];

export default function CustomInputModal({ 
  isOpen, 
  onClose, 
  onCustomInput, 
  onPresetSelect, 
  onFileUpload,
  isSorting 
}) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inputValue.trim()) {
      setError('Please enter some values');
      return;
    }

    const success = onCustomInput(inputValue);
    if (success) {
      setSuccess('Array updated successfully!');
      setInputValue('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
    } else {
      setError('Invalid input. Please enter comma-separated numbers (0-500)');
    }
  };

  const handlePresetClick = (presetId) => {
    setError('');
    setSuccess('');
    onPresetSelect(presetId);
    setSuccess(`${PRESETS.find(p => p.id === presetId)?.label} array generated!`);
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file) => {
    setError('');
    setSuccess('');

    // Validate file type
    const validTypes = ['text/plain', 'text/csv', 'application/json'];
    const validExtensions = ['.txt', '.csv', '.json'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      setError('Invalid file type. Please upload .txt, .csv, or .json file');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError('File too large. Maximum size is 1MB');
      return;
    }

    try {
      const count = await onFileUpload(file);
      setSuccess(`Loaded ${count} values from file!`);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to parse file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-800/95 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30">
                <Type className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Custom Input</h2>
                <p className="text-xs text-slate-400">Enter values or choose a preset</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Manual Input Section */}
          <form onSubmit={handleSubmit} className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Enter Values
            </label>
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., 10, 25, 30, 45, 50, 75, 100"
                disabled={isSorting}
                className="w-full h-24 px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-slate-500">
                Comma-separated (0-500)
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSorting || !inputValue.trim()}
              className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Apply Custom Values
            </motion.button>
          </form>

          {/* Presets Section */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePresetClick(preset.id)}
                    disabled={isSorting}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-700/50 group-hover:bg-cyan-500/20 transition-colors">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-white">{preset.label}</span>
                      <span className="block text-[10px] text-slate-500">{preset.description}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Import from File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={triggerFileInput}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging 
                  ? 'border-cyan-400 bg-cyan-500/10' 
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full mb-2 transition-colors ${
                  isDragging ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                }`}>
                  {isDragging ? (
                    <Upload className="w-6 h-6 text-cyan-400" />
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
                </p>
                <p className="text-xs text-slate-500">
                  Supports .txt, .csv, .json (max 1MB)
                </p>
              </div>
            </motion.div>
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-sm text-rose-200">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-200">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
