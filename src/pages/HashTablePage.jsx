import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Code2,
  Copy,
  Download,
  Hash,
  Info,
  Pause,
  PenLine,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Trash2,
  Waypoints,
  X,
  Zap,
} from "lucide-react";
import {
  generateHashTableSteps,
  createChainingTable,
  createOpenTable,
  hashFn,
  hashFn2,
  hashTableCPP,
  hashTableJava,
  hashTablePython,
  hashTableJS,
} from "../algorithms/hashTable";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import {
  shouldSkipHotkeyTarget,
  useStableHotkeys,
} from "../hooks/useStableHotkeys";
import { useDocumentTitle } from "../hooks/useDocumentTitle"; // [NEW]

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_SIZE = 7;
const LANGUAGES = ["C++", "Java", "Python", "JavaScript"];
const OPERATIONS = ["insert", "search", "delete"];
const STRATEGIES = [
  { id: "chaining", label: "Separate Chaining", short: "Chaining" },
  { id: "linear", label: "Linear Probing", short: "Linear" },
  { id: "quadratic", label: "Quadratic Probing", short: "Quadratic" },
  { id: "double", label: "Double Hashing", short: "Double" },
];
const PRIME_SIZES = [5, 7, 11, 13, 17];
const PRESET_OPS = [
  { key: "apple", value: "1", op: "insert" },
  { key: "banana", value: "2", op: "insert" },
  { key: "cat", value: "3", op: "insert" },
  { key: "dog", value: "4", op: "insert" },
  { key: "egg", value: "5", op: "insert" },
  { key: "fox", value: "6", op: "insert" },
];

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const resultColorMap = {
  found: "text-emerald-300",
  "not-found": "text-rose-300",
  inserted: "text-cyan-300",
  deleted: "text-amber-300",
  collision: "text-orange-300",
  probing: "text-violet-300",
};

function isChaining(strategy) {
  return strategy === "chaining";
}

// ─── Bucket/Slot status styles ────────────────────────────────────────────────
const bucketStatusClass = {
  default: "border-slate-700/60 bg-slate-800/60",
  active: "border-cyan-400/70 bg-cyan-500/15 ring-2 ring-cyan-400/30",
  collision: "border-orange-400/70 bg-orange-500/15 ring-2 ring-orange-400/30",
  "not-found": "border-rose-400/60 bg-rose-500/10",
};

const entryStatusClass = {
  default: "bg-slate-700/60 text-slate-200",
  highlight: "bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40",
  inserting: "bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/40 animate-pulse",
  inserted: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30",
  comparing: "bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/40 animate-pulse",
  found: "bg-emerald-500/30 text-emerald-100 ring-2 ring-emerald-400/50",
  "not-found": "bg-rose-500/20 text-rose-200",
  deleting: "bg-rose-500/35 text-rose-100 ring-2 ring-rose-400/50 animate-pulse",
  deleted: "bg-slate-700/40 text-slate-500 line-through",
};

// ─── Theory accordion ─────────────────────────────────────────────────────────
function TheoryPanel({ strategy }) {
  const [open, setOpen] = useState(false);
  const info = {
    chaining: {
      title: "Separate Chaining",
      summary:
        "Each bucket holds a linked list of all key-value pairs that hash to it. Collisions are resolved by appending to the chain.",
      pros: ["Easy to implement", "Never needs rehashing", "Handles high load well"],
      cons: ["Extra memory for pointers", "Cache performance may suffer"],
      best: "O(1)",
      worst: "O(n)",
      space: "O(n)",
    },
    linear: {
      title: "Linear Probing",
      summary:
        "If a slot is occupied, try the next slot sequentially: h(k), h(k)+1, h(k)+2, …",
      pros: ["Excellent cache locality", "Simple to implement"],
      cons: ["Primary clustering", "Degrades quickly at high load"],
      best: "O(1)",
      worst: "O(n)",
      space: "O(n)",
    },
    quadratic: {
      title: "Quadratic Probing",
      summary:
        "Probe sequence: h(k), h(k)+1², h(k)+2², h(k)+3², … Reduces primary clustering.",
      pros: ["Avoids primary clustering", "Better than linear probing"],
      cons: [
        "Secondary clustering still possible",
        "May not find empty slot if table >50% full",
      ],
      best: "O(1)",
      worst: "O(n)",
      space: "O(n)",
    },
    double: {
      title: "Double Hashing",
      summary:
        "Uses two hash functions: h1(k) + i × h2(k). Step size varies per key, minimising clustering.",
      pros: ["Near-uniform distribution", "Least clustering"],
      cons: ["Two hash functions needed", "Slightly slower per probe"],
      best: "O(1)",
      worst: "O(n)",
      space: "O(n)",
    },
  };
  const d = info[strategy] || info.chaining;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/40 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={13} className="text-violet-300" />
          Theory: {d.title}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 text-sm text-slate-300 border-t border-white/10 pt-3">
              <p className="text-xs text-slate-400 leading-relaxed">{d.summary}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Best", d.best, "text-emerald-300"],
                  ["Worst", d.worst, "text-rose-300"],
                  ["Space", d.space, "text-blue-300"],
                ].map(([label, val, cls]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-white/5 py-2"
                  >
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className={`font-mono font-bold mt-0.5 text-xs ${cls}`}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-emerald-400 font-semibold mb-1">
                    ✓ Pros
                  </p>
                  <ul className="space-y-0.5">
                    {d.pros.map((p) => (
                      <li key={p} className="text-[11px] text-slate-300">
                        • {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-rose-400 font-semibold mb-1">
                    ✗ Cons
                  </p>
                  <ul className="space-y-0.5">
                    {d.cons.map((c) => (
                      <li key={c} className="text-[11px] text-slate-300">
                        • {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── [NEW] Probe Sequence Diagram ─────────────────────────────────────────────
function ProbeSequenceDiagram({ probeSequence, currentProbeIdx }) {
  if (!probeSequence || probeSequence.length === 0) return null;
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1">
        <Zap size={10} className="text-yellow-300" /> Probe Sequence
      </p>
      <div className="flex flex-wrap gap-1">
        {probeSequence.map((slotIdx, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold border transition-all ${
              i === currentProbeIdx
                ? "border-cyan-400/70 bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/40"
                : i === 0
                ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                : "border-slate-600/50 bg-slate-700/40 text-slate-300"
            }`}
          >
            {slotIdx}
          </motion.span>
        ))}
      </div>
      <p className="text-[10px] text-slate-500">
        {probeSequence.length} probe{probeSequence.length !== 1 ? "s" : ""} so far
      </p>
    </div>
  );
}

// ─── [NEW] Strategy Comparison Table (OA only) ────────────────────────────────
function StrategyComparisonTable({ currentStrategy }) {
  const [open, setOpen] = useState(false);
  const rows = [
    { name: "Formula", linear: "h(k) + i", quadratic: "h(k) + i²", double: "h1(k) + i×h2(k)" },
    { name: "Clustering", linear: "Primary ✗", quadratic: "Secondary", double: "None ✓" },
    { name: "Cache", linear: "⭐⭐⭐", quadratic: "⭐⭐", double: "⭐" },
    { name: "Max Load", linear: "~70%", quadratic: "~50%", double: "~85%" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/40 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Zap size={13} className="text-cyan-300" />
          OA Strategy Comparison
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 overflow-x-auto">
              <table className="w-full text-[11px] text-slate-300">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2 text-left text-slate-400 font-semibold w-20"></th>
                    {["linear", "quadratic", "double"].map((s) => (
                      <th
                        key={s}
                        className={`px-3 py-2 text-center font-bold capitalize ${
                          currentStrategy === s ? "text-cyan-200" : "text-slate-400"
                        }`}
                      >
                        {s === "linear" ? "Linear" : s === "quadratic" ? "Quadratic" : "Double"}
                        {currentStrategy === s && (
                          <span className="ml-1 text-[9px] text-cyan-400">◀</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.name} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-2 text-slate-400 font-medium">{row.name}</td>
                      <td className={`px-3 py-2 text-center font-mono ${currentStrategy === "linear" ? "text-slate-100" : "text-slate-500"}`}>{row.linear}</td>
                      <td className={`px-3 py-2 text-center font-mono ${currentStrategy === "quadratic" ? "text-slate-100" : "text-slate-500"}`}>{row.quadratic}</td>
                      <td className={`px-3 py-2 text-center font-mono ${currentStrategy === "double" ? "text-slate-100" : "text-slate-500"}`}>{row.double}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Chaining table renderer ──────────────────────────────────────────────────
function ChainingTable({ table, highlightIdx }) {
  return (
    <div className="w-full space-y-1.5">
      {table.map((bucket, i) => {
        const isHighlighted = i === highlightIdx;
        const statusKey = isHighlighted
          ? bucket.status === "default"
            ? "active"
            : bucket.status
          : bucket.status;
        return (
          <motion.div
            key={i}
            layout
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 transition-all duration-200 ${
              bucketStatusClass[statusKey] || bucketStatusClass.default
            }`}
          >
            <span className="w-7 shrink-0 text-center font-mono text-xs font-bold text-slate-400 pt-0.5">
              {i}
            </span>
            <div className="w-px self-stretch bg-slate-600/50 shrink-0" />
            <div className="flex flex-wrap gap-1.5 min-h-[22px]">
              {bucket.entries.length === 0 ? (
                <span className="text-[11px] text-slate-600 italic pt-0.5">
                  empty
                </span>
              ) : (
                bucket.entries.map((entry, j) => (
                  <motion.span
                    key={`${i}-${j}-${entry.key}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-mono transition-all ${
                      entryStatusClass[entry.status] || entryStatusClass.default
                    }`}
                  >
                    <span className="font-semibold">{entry.key}</span>
                    <span className="text-[10px] opacity-60">→</span>
                    <span>{entry.value}</span>
                  </motion.span>
                ))
              )}
            </div>
            {bucket.entries.length > 0 && (
              <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 text-[10px] text-slate-400">
                {bucket.entries.length}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Open addressing table renderer ──────────────────────────────────────────
function OpenAddressTable({ table, highlightIdx, probeIdx, probeSequence }) {
  return (
    <div className="w-full space-y-1.5">
      {table.map((slot, i) => {
        const isActive = i === probeIdx || i === highlightIdx;
        const statusKey = isActive
          ? slot.status === "default"
            ? "active"
            : slot.status
          : slot.status;
        // [NEW] mark previously visited slots with subtle dim ring
        const wasVisited = probeSequence?.includes(i) && i !== probeIdx;
        return (
          <motion.div
            key={i}
            layout
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-200 ${
              bucketStatusClass[statusKey] || bucketStatusClass.default
            } ${wasVisited ? "opacity-75" : ""}`}
          >
            <span className="w-7 shrink-0 text-center font-mono text-xs font-bold text-slate-400">
              {i}
            </span>
            <div className="w-px self-stretch bg-slate-600/50 shrink-0" />
            {slot.entry ? (
              <motion.span
                key={`${i}-${slot.entry.key}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-mono transition-all ${
                  entryStatusClass[slot.entry.status] || entryStatusClass.default
                }`}
              >
                {slot.entry.deleted ? (
                  <span className="text-slate-500">☠ tombstone</span>
                ) : (
                  <>
                    <span className="font-semibold">{slot.entry.key}</span>
                    <span className="text-[10px] opacity-60">→</span>
                    <span>{slot.entry.value}</span>
                  </>
                )}
              </motion.span>
            ) : (
              <span className="text-[11px] text-slate-600 italic">empty</span>
            )}
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {/* [NEW] h1 badge on initial hash slot */}
              {i === highlightIdx && i !== probeIdx && (
                <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-1.5 text-[9px] text-violet-300">
                  h1
                </span>
              )}
              {i === probeIdx && (
                <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-1.5 text-[10px] text-violet-300">
                  probe
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Load factor bar ──────────────────────────────────────────────────────────
// [UPDATED] strategy-specific thresholds + tombstone count
function LoadFactorBar({ stats, strategy }) {
  if (!stats) return null;
  const loadPct = Math.round(parseFloat(stats.load) * 100);

  // [NEW] strategy-specific warning thresholds
  const warnThreshold =
    strategy === "quadratic" ? 50 :
    strategy === "double"    ? 85 :
    75; // linear and chaining

  const color =
    loadPct < 50
      ? "bg-emerald-500"
      : loadPct < warnThreshold
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="rounded-xl bg-white/5 p-3 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Load Factor ({stats.occupied}/{stats.size})
        </span>
        <span
          className={`font-bold font-mono ${
            loadPct >= warnThreshold
              ? "text-rose-300"
              : loadPct >= 50
                ? "text-amber-300"
                : "text-emerald-300"
          }`}
        >
          {stats.load}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/70 overflow-hidden">
        <motion.div
          animate={{ width: `${loadPct}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      {!isChaining(strategy) && loadPct >= warnThreshold && (
        <p className="text-[10px] text-rose-300 flex items-center gap-1">
          <Info size={10} /> High load — consider resizing
        </p>
      )}
      {/* [NEW] tombstone count */}
      {!isChaining(strategy) && stats.tombstones > 0 && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          ☠ {stats.tombstones} tombstone{stats.tombstones !== 1 ? "s" : ""} — consider rebuilding
        </p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HashTablePage() {
  useDocumentTitle("Hash Table Visualizer"); // [NEW]
  const navigate = useNavigate();

  // Strategy & table size
  const [strategy, setStrategy] = useState("chaining");
  const [tableSize, setTableSize] = useState(DEFAULT_SIZE);

  // Operation inputs
  const [operation, setOperation] = useState("insert");
  const [keyInput, setKeyInput] = useState("apple");
  const [valueInput, setValueInput] = useState("1");

  // Persisted hash table (survives across runs)
  const [persistedTable, setPersistedTable] = useState(() =>
    createChainingTable(DEFAULT_SIZE),
  );

  // Animation state
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runStatus, setRunStatus] = useState("Idle");
  const [speed, setSpeed] = useState(600);
  const [isPaused, setIsPaused] = useState(false);

  // Operations log
  const [opsLog, setOpsLog] = useState([]);

  // Code panel
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");

  const timerRef = useRef(null);

  // ── Active code string ────────────────────────────────────────────────────
  const activeCode = useMemo(() => {
    if (selectedLanguage === "Java") return hashTableJava;
    if (selectedLanguage === "Python") return hashTablePython;
    if (selectedLanguage === "JavaScript") return hashTableJS;
    return hashTableCPP;
  }, [selectedLanguage]);

  // ── Current step ──────────────────────────────────────────────────────────
  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length)
      return steps[currentStepIndex];
    return null;
  }, [currentStepIndex, steps]);

  const progress =
    steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  // Table to display: from current animation step, or persisted
  const displayTable = currentStep ? currentStep.table : persistedTable;

  // ── Strategy / size change helpers ────────────────────────────────────────
  const stopAnimation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const handleStrategyChange = (s) => {
    stopAnimation();
    setStrategy(s);
    setPersistedTable(
      isChaining(s) ? createChainingTable(tableSize) : createOpenTable(tableSize),
    );
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setOpsLog([]);
  };

  const handleSizeChange = (newSize) => {
    stopAnimation();
    setTableSize(newSize);
    setPersistedTable(
      isChaining(strategy)
        ? createChainingTable(newSize)
        : createOpenTable(newSize),
    );
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setOpsLog([]);
  };

  // ── Run / reset ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    stopAnimation();
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setIsPaused(false);
  }, [stopAnimation]);

  const runAlgorithm = useCallback(() => {
    if (!keyInput.trim()) return;
    handleReset();
    const generatedSteps = generateHashTableSteps(
      tableSize,
      strategy,
      operation,
      keyInput.trim(),
      valueInput.trim() || "0",
      persistedTable,
    );
    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    setRunStatus("Running");
    setIsPaused(false);
  }, [
    keyInput,
    valueInput,
    tableSize,
    strategy,
    operation,
    persistedTable,
    handleReset,
  ]);

  const handleClearTable = useCallback(() => {
    stopAnimation();
    setPersistedTable(
      isChaining(strategy)
        ? createChainingTable(tableSize)
        : createOpenTable(tableSize),
    );
    setSteps([]);
    setCurrentStepIndex(-1);
    setRunStatus("Idle");
    setOpsLog([]);
  }, [strategy, tableSize, stopAnimation]);

  // ── Step controls ─────────────────────────────────────────────────────────
  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length - 1)
      setCurrentStepIndex((p) => p + 1);
  }, [currentStepIndex, steps.length]);

  const stepBackward = useCallback(() => {
    if (currentStepIndex > 0) setCurrentStepIndex((p) => p - 1);
  }, [currentStepIndex]);

  // ── Timer effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (runStatus === "Running" && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          stopAnimation();
          setRunStatus("Completed");
          return prev;
        });
      }, speed);
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [runStatus, isPaused, steps.length, speed, stopAnimation]);

  // ── Persist final table state after animation completes ───────────────────
  useEffect(() => {
    if (runStatus === "Completed" && steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      setPersistedTable(lastStep.table);
      setOpsLog((prev) => [
        {
          op: operation,
          key: keyInput,
          value: valueInput,
          result: lastStep.result,
          ts: Date.now(),
        },
        ...prev.slice(0, 9),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStatus]);

  // ── Code copy / download ──────────────────────────────────────────────────
  const handleCopyCode = async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("idle");
    }
  };

  const handleDownloadCode = () => {
    const ext =
      selectedLanguage === "C++"
        ? ".cpp"
        : selectedLanguage === "Java"
          ? ".java"
          : selectedLanguage === "Python"
            ? ".py"
            : ".js";
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HashTable${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Hotkeys ───────────────────────────────────────────────────────────────
  // [UPDATED] added ← → arrow key step navigation
  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    if (e.repeat) { e.preventDefault(); return; }

    // [NEW] arrow key stepping
    if (e.code === "ArrowLeft") { e.preventDefault(); stepBackward(); return; }
    if (e.code === "ArrowRight") { e.preventDefault(); stepForward(); return; }

    const isHotkey = e.code === "Space" || key === "r";
    if (!isHotkey) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (runStatus === "Running" || runStatus === "Paused") {
        setIsPaused((prev) => {
          const next = !prev;
          setRunStatus(next ? "Paused" : "Running");
          return next;
        });
        return;
      }
      if (runStatus === "Completed") handleReset();
      setTimeout(runAlgorithm, 50);
      return;
    }
    if (key === "r") { e.preventDefault(); handleReset(); }
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => stopAnimation(), [stopAnimation]);

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      {/* Background */}
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.1),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ── Header Section ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7 mb-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Left */}
          <div>
            <div className="mb-6 flex items-center">
              <button
                onClick={() => navigate("/algorithms")}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-4 pl-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform group-hover:-translate-x-1"
                />
                Back to Algorithms
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
                Hash Table
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                {STRATEGIES.find((s) => s.id === strategy)?.label}
              </span>
            </div>

            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Hash Table Visualizer
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Visualize Insert, Search, and Delete with Separate Chaining,
              Linear Probing, Quadratic Probing, and Double Hashing.
            </p>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Table Size
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {tableSize}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Avg Lookup
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-200">
                  O(1)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Worst Case
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-200">O(n)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Steps
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {steps.length > 0
                    ? `${currentStepIndex + 1} / ${steps.length}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Right — Live Status */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-violet-300" /> Live Status
            </p>
            <div className="mt-4 space-y-3">
              {/* Current action */}
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Action</p>
                <p className="text-sm font-semibold text-white min-h-[40px]">
                  {currentStep
                    ? currentStep.description
                    : "Press Start to begin"}
                </p>
              </div>

              {/* Progress bar */}
              <div className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-violet-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Hash calc live preview */}
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`h1-${keyInput}-${tableSize}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      h1(key)
                    </p>
                    <p className="text-2xl font-black text-violet-300">
                      {keyInput.trim()
                        ? hashFn(keyInput.trim(), tableSize)
                        : "—"}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`result-${currentStep?.result}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      Result
                    </p>
                    <p
                      className={`text-sm font-black capitalize ${
                        currentStep?.result
                          ? (resultColorMap[currentStep.result] ||
                            "text-slate-200")
                          : "text-slate-500"
                      }`}
                    >
                      {currentStep?.result || "—"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Load factor (from current step or computed) */}
              {currentStep?.statsAfter && (
                <LoadFactorBar
                  stats={currentStep.statsAfter}
                  strategy={strategy}
                />
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Main Workspace ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[340px_1fr] xl:items-stretch">
        {/* ── Controls Sidebar ──────────────────────────────────────────────── */}
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur xl:sticky xl:top-24">
          <div className="mb-5 flex items-center gap-2">
            <Waypoints size={18} className="text-violet-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {/* Strategy picker */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                <Hash size={13} className="mr-1" /> Collision Strategy
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-800/50 p-1">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStrategyChange(s.id)}
                    disabled={runStatus === "Running"}
                    className={`flex items-center justify-center rounded-md px-2 py-1.5 text-[10px] font-bold transition-all ${
                      strategy === s.id
                        ? "bg-violet-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    } disabled:opacity-50`}
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Table size */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                <Info size={13} className="mr-1" /> Table Size (prime)
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {PRIME_SIZES.map((n) => (
                  <button
                    key={n}
                    onClick={() => handleSizeChange(n)}
                    disabled={runStatus === "Running"}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-all ${
                      tableSize === n
                        ? "border-violet-400/60 bg-violet-500/20 text-violet-100"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    } disabled:opacity-50`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Operation */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center gap-1 text-xs uppercase text-slate-400">
                Operation
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-800/50 p-1">
                {OPERATIONS.map((op) => (
                  <button
                    key={op}
                    onClick={() => setOperation(op)}
                    disabled={runStatus === "Running"}
                    className={`flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-bold capitalize transition-all ${
                      operation === op
                        ? "bg-cyan-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    } disabled:opacity-50`}
                  >
                    {op === "insert" ? (
                      <Plus size={10} />
                    ) : op === "search" ? (
                      <Search size={10} />
                    ) : (
                      <Trash2 size={10} />
                    )}
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Key / Value input */}
            <div className="rounded-2xl bg-white/5 p-3 space-y-2">
              <label className="mb-1 flex items-center gap-1 text-xs uppercase text-slate-400">
                <PenLine size={13} className="mr-1" /> Input
              </label>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">
                  Key
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="e.g. apple"
                  disabled={runStatus === "Running"}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 font-mono placeholder:text-slate-600 focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 outline-none disabled:opacity-50"
                />
              </div>
              {operation === "insert" && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">
                    Value
                  </label>
                  <input
                    type="text"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder="e.g. 42"
                    disabled={runStatus === "Running"}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 font-mono placeholder:text-slate-600 focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 outline-none disabled:opacity-50"
                  />
                </div>
              )}
              {/* Live hash preview */}
              {keyInput.trim() && (
                <div className="rounded-lg border border-violet-400/20 bg-violet-500/5 px-3 py-2 text-xs font-mono">
                  <span className="text-violet-400">h</span>(
                  <span className="text-amber-300">"{keyInput.trim()}"</span>)
                  &nbsp;=&nbsp;
                  <span className="text-cyan-300 font-bold">
                    {hashFn(keyInput.trim(), tableSize)}
                  </span>
                  {strategy === "double" && (
                    <>
                      &nbsp;·&nbsp;
                      <span className="text-violet-400">h2</span>&nbsp;=&nbsp;
                      <span className="text-cyan-300 font-bold">
                        {hashFn2(keyInput.trim(), tableSize)}
                      </span>
                    </>
                  )}
                </div>
              )}
              {/* Quick fill presets */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Quick Fill
                </p>
                <div className="flex flex-wrap gap-1">
                  {PRESET_OPS.map(({ key, value }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setKeyInput(key);
                        setValueInput(value);
                        setOperation("insert");
                      }}
                      disabled={runStatus === "Running"}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Speed control */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>
                  <Clock3 size={13} className="mr-1 inline" /> Speed
                </span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="1500"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-violet-400"
                style={{ direction: "rtl" }}
              />
            </div>

            {/* Player controls */}
            <div className="mt-auto pt-2 flex flex-col gap-2">
              {runStatus === "Idle" || runStatus === "Completed" ? (
                <button
                  onClick={runAlgorithm}
                  disabled={!keyInput.trim()}
                  className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 flex justify-center items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play size={16} fill="currentColor" /> Start Visualization
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold py-3 flex justify-center items-center gap-2 transition-colors"
                  >
                    {isPaused ? (
                      <><Play size={14} fill="currentColor" /> Resume</>
                    ) : (
                      <><Pause size={14} fill="currentColor" /> Pause</>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200 font-bold py-3 flex justify-center items-center gap-2 transition-colors"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
              )}

              {/* Step controls */}
              <div
                className={`flex items-center gap-2 transition-opacity duration-300 ${
                  isPaused || runStatus === "Completed"
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  onClick={stepBackward}
                  disabled={currentStepIndex <= 0}
                  className="flex-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-xs font-bold"
                >
                  ← Prev
                </button>
                <span className="text-xs font-mono text-slate-400 w-20 text-center shrink-0">
                  {steps.length > 0
                    ? `${currentStepIndex + 1} / ${steps.length}`
                    : "— / —"}
                </span>
                <button
                  onClick={stepForward}
                  disabled={currentStepIndex >= steps.length - 1}
                  className="flex-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-xs font-bold"
                >
                  Next →
                </button>
              </div>

              {/* Clear table */}
              <button
                onClick={handleClearTable}
                className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={13} /> Clear Entire Table
              </button>
            </div>
          </div>
        </aside>

        {/* ── Visualization Panel ────────────────────────────────────────────── */}
        <section className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur min-h-[500px] xl:min-h-[600px]">
          {/* Top toolbar */}
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Visualization
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Hash size={12} />
              <span>
                Size {tableSize} ·{" "}
                {STRATEGIES.find((s) => s.id === strategy)?.label}
              </span>
            </div>
          </div>

          {/* Hash Table */}
          <div className="flex-1 overflow-y-auto">
            {isChaining(strategy) ? (
              <ChainingTable
                table={displayTable}
                highlightIdx={currentStep?.highlightIdx ?? null}
              />
            ) : (
              <OpenAddressTable
                table={displayTable}
                highlightIdx={currentStep?.highlightIdx ?? null}
                probeIdx={currentStep?.probeIdx ?? null}
                probeSequence={currentStep?.probeSequence ?? []}  // [NEW]
              />
            )}
          </div>

          {/* Step description */}
          <AnimatePresence mode="wait">
            {currentStep && (
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-300">
                    {currentStep.action}
                  </span>
                  {currentStep.result && (
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        resultColorMap[currentStep.result] || "text-slate-300"
                      }`}
                    >
                      {currentStep.result}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-200">
                  {currentStep.description}
                </p>
                {currentStep.hashCalc && (
                  <p className="mt-1.5 text-xs font-mono text-violet-300">
                    h1("{currentStep.hashCalc.key}") ={" "}
                    <span className="text-cyan-300 font-bold">
                      {currentStep.hashCalc.h1}
                    </span>
                    {currentStep.hashCalc.h2 != null && (
                      <>
                        {" "}
                        · h2 ={" "}
                        <span className="text-cyan-300 font-bold">
                          {currentStep.hashCalc.h2}
                        </span>
                      </>
                    )}
                  </p>
                )}
                {/* [NEW] probe formula display */}
                {!isChaining(strategy) && currentStep.probeFormula && (
                  <p className="mt-1 text-xs font-mono text-amber-300">
                    {currentStep.probeFormula}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* [NEW] Probe Sequence Diagram — OA only */}
          {!isChaining(strategy) && currentStep?.probeSequence?.length > 0 && (
            <div className="mt-3">
              <ProbeSequenceDiagram
                probeSequence={currentStep.probeSequence}
                currentProbeIdx={currentStep.probeSequence.length - 1}
              />
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 rounded-xl bg-slate-800/80 p-3 border border-slate-700/50">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-cyan-400 bg-cyan-500/15" />
                <span>Active Bucket</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-orange-400 bg-orange-500/15" />
                <span>Collision</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-emerald-400 bg-emerald-500/20" />
                <span>Found / Inserted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-rose-400 bg-rose-500/10" />
                <span>Not Found / Deleted</span>
              </div>
              {!isChaining(strategy) && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border-2 border-violet-400 bg-violet-500/15" />
                  <span>Probe Slot</span>
                </div>
              )}
            </div>
          </div>

          {/* Operations log */}
          {opsLog.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Operations Log
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {opsLog.map((log) => (
                  <div
                    key={log.ts}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-12 font-mono font-bold text-violet-300 uppercase shrink-0">
                      {log.op}
                    </span>
                    <span className="font-mono text-amber-300">
                      "{log.key}"
                    </span>
                    {log.op === "insert" && log.value && (
                      <span className="text-slate-500">→ {log.value}</span>
                    )}
                    <span className="ml-auto shrink-0">
                      {log.result === "found" && (
                        <CheckCheck size={11} className="text-emerald-400" />
                      )}
                      {log.result === "not-found" && (
                        <X size={11} className="text-rose-400" />
                      )}
                      {log.result === "inserted" && (
                        <Plus size={11} className="text-cyan-400" />
                      )}
                      {log.result === "deleted" && (
                        <Trash2 size={11} className="text-amber-400" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Theory panel */}
          <div className="mt-4">
            <TheoryPanel strategy={strategy} />
          </div>

          {/* [NEW] OA Strategy Comparison — shown only for open addressing */}
          {!isChaining(strategy) && (
            <div className="mt-3">
              <StrategyComparisonTable currentStrategy={strategy} />
            </div>
          )}

          {/* Hotkeys */}
          <div className="mt-4">
            <HotkeysHint />
          </div>
        </section>
      </div>

      {/* ── Code Section ─────────────────────────────────────────────────────── */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/algorithms")}
              className="group flex items-center gap-2 rounded-lg bg-white/5 pr-4 pl-3 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white border border-white/10"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back to Algorithms
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <Code2 size={20} className="text-violet-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    selectedLanguage === lang
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              {copyState === "copied" ? (
                <CheckCheck size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}{" "}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>

        {/* Code body — exact same pattern as KadanePage & RabinKarpPage */}
        <div className="ll-scrollbar max-h-125 overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed">
          <pre>
            <code>
              {(activeCode || "").split("\n").map((line, i) => (
                <div key={i} className="flex hover:bg-white/5 px-2 rounded">
                  <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-4 text-xs">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">
                    {renderHighlightedCode(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}