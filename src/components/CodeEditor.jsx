import { useState, useEffect, useRef } from 'react';
import { Copy, Check, AlertCircle, Play } from 'lucide-react';

const keywords = [
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
  'async', 'await', 'true', 'false', 'null', 'undefined', 'new', 'class'
];

const builtins = [
  'sleep', 'updateStepInfo', 'setArray', 'arr', 'array', 'value', 'status',
  'comparing', 'swapping', 'sorted', 'pivot', 'target', 'default'
];

export default function CodeEditor({ 
  code, 
  onChange, 
  onRun, 
  error, 
  language = 'javascript',
  placeholder = '',
  readOnly = false
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  // Line numbers
  const lines = code.split('\n');
  const lineCount = lines.length;

  // Syntax highlighting
  const highlightCode = (text) => {
    let result = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>');
    
    // Keywords
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      result = result.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
    });
    
    // Builtins
    builtins.forEach(fn => {
      const regex = new RegExp(`\\b(${fn})\\b`, 'g');
      result = result.replace(regex, '<span class="text-cyan-300">$1</span>');
    });
    
    // Strings
    result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="text-amber-300">$&</span>');
    
    // Numbers
    result = result.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>');
    
    // Comments
    result = result.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
    
    return result;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync scroll between textarea and highlight
  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative rounded-xl border border-white/10 bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative min-h-[300px] font-code text-sm">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-white/5 flex flex-col items-end py-3 pr-2 text-slate-600 text-xs select-none">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Code display with syntax highlighting */}
        <div 
          ref={highlightRef}
          className="absolute left-12 top-0 right-0 bottom-0 p-3 overflow-auto ll-scrollbar"
        >
          <pre 
            className="whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ 
              __html: highlightCode(code) + (code.endsWith('\n') ? '\n' : '') 
            }}
          />
        </div>

        {/* Actual textarea (transparent) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          className="absolute left-12 top-0 right-0 bottom-0 w-[calc(100%-3rem)] p-3 bg-transparent text-transparent caret-cyan-400 font-code text-sm resize-none outline-none whitespace-pre-wrap break-all"
          style={{ lineHeight: '1.5rem' }}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/30 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300 font-mono">{error}</p>
        </div>
      )}

      {/* Run button */}
      {onRun && (
        <div className="px-4 py-3 bg-slate-900/80 border-t border-white/10">
          <button
            onClick={onRun}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm rounded-lg transition-all shadow-lg shadow-cyan-500/20"
          >
            <Play size={16} fill="currentColor" />
            Run Custom Algorithm
          </button>
        </div>
      )}
    </div>
  );
}

// Template code for sorting algorithms
export const sortingTemplate = `// Custom Sorting Algorithm
// The array contains objects with { value, status }
// Use status: 'comparing', 'swapping', 'sorted', 'default'

async function customSort(array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) {
  let arr = array.map(item => ({ ...item }));
  const n = arr.length;

  // Initialize step info
  if (updateStepInfo) {
    updateStepInfo({
      totalSteps: n * n,
      currentStep: 0,
      operation: 'Starting Custom Sort',
      explanation: 'Your custom sorting algorithm is running.',
      variables: { n }
    });
  }

  // === WRITE YOUR SORTING ALGORITHM HERE ===
  
  // Example: Simple bubble sort implementation
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Check for stop
      if (stopSignal.current) return;
      
      // Check for pause
      while (pauseSignal.current) {
        if (stopSignal.current) return;
        await sleep(100);
      }

      // Update visualization
      if (updateStepInfo) {
        updateStepInfo({
          currentStep: i * n + j,
          totalSteps: n * n,
          operation: \`Comparing indices \${j} and \${j + 1}\`,
          explanation: \`Comparing \${arr[j].value} with \${arr[j + 1].value}\`,
          variables: { i, j, 'arr[j]': arr[j].value, 'arr[j+1]': arr[j + 1].value }
        });
      }

      // Mark comparing
      arr[j].status = 'comparing';
      arr[j + 1].status = 'comparing';
      setArray([...arr]);
      await sleep(speed);

      // Swap if needed
      if (arr[j].value > arr[j + 1].value) {
        if (updateStepInfo) {
          updateStepInfo({
            currentStep: i * n + j,
            totalSteps: n * n,
            operation: \`Swapping \${arr[j].value} and \${arr[j + 1].value}\`,
            explanation: 'Swapping elements',
            variables: { i, j, 'swapping': \`\${arr[j].value} ↔ \${arr[j + 1].value}\` }
          });
        }

        arr[j].status = 'swapping';
        arr[j + 1].status = 'swapping';
        
        let temp = arr[j].value;
        arr[j].value = arr[j + 1].value;
        arr[j + 1].value = temp;
        
        setArray([...arr]);
        await sleep(speed);
      }

      // Reset status
      arr[j].status = 'default';
      arr[j + 1].status = 'default';
    }
    
    // Mark as sorted
    arr[n - 1 - i].status = 'sorted';
    setArray([...arr]);
  }

  // Mark all as sorted
  arr.forEach(item => item.status = 'sorted');
  setArray([...arr]);

  if (updateStepInfo) {
    updateStepInfo({
      currentStep: n * n,
      totalSteps: n * n,
      operation: 'Sorting Complete',
      explanation: 'All elements have been sorted!',
      variables: {}
    });
  }
}

return customSort;`;

// Template code for searching algorithms
export const searchingTemplate = `// Custom Searching Algorithm
// The array contains objects with { value, status }
// Use status: 'comparing', 'target', 'default'
// You need to set a 'target' value to search for

async function customSearch(array, setArray, speed, stopSignal, pauseSignal, updateStepInfo, target) {
  let arr = array.map(item => ({ ...item }));
  const n = arr.length;
  
  // Target value to search for
  target = target || arr[Math.floor(n / 2)]?.value || 50;

  // Initialize step info
  if (updateStepInfo) {
    updateStepInfo({
      totalSteps: n,
      currentStep: 0,
      operation: 'Starting Custom Search',
      explanation: \`Searching for value: \${target}\`,
      variables: { target, n }
    });
  }

  // === WRITE YOUR SEARCHING ALGORITHM HERE ===
  
  // Example: Linear search implementation
  for (let i = 0; i < n; i++) {
    // Check for stop
    if (stopSignal.current) return;
    
    // Check for pause
    while (pauseSignal.current) {
      if (stopSignal.current) return;
      await sleep(100);
    }

    // Update visualization
    if (updateStepInfo) {
      updateStepInfo({
        currentStep: i,
        totalSteps: n,
        operation: \`Checking index \${i}\`,
        explanation: \`Checking if \${arr[i].value} equals \${target}\`,
        variables: { i, current: arr[i].value, target }
      });
    }

    // Mark as comparing
    arr[i].status = 'comparing';
    setArray([...arr]);
    await sleep(speed);

    // Check if found
    if (arr[i].value === target) {
      arr[i].status = 'target';
      setArray([...arr]);
      
      if (updateStepInfo) {
        updateStepInfo({
          currentStep: i,
          totalSteps: n,
          operation: 'Target Found!',
          explanation: \`Found \${target} at index \${i}\`,
          variables: { index: i, value: target }
        });
      }
      return; // Found, stop searching
    }

    // Reset status
    arr[i].status = 'default';
    setArray([...arr]);
  }

  // Not found
  if (updateStepInfo) {
    updateStepInfo({
      currentStep: n,
      totalSteps: n,
      operation: 'Not Found',
      explanation: \`Target \${target} not found in array\`,
      variables: { target }
    });
  }
}

return customSearch;`;
