import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Binary,
  CheckCheck,
  Clock3,
  Code2,
  Copy,
  Download,
  Info,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Layers2,
  ListOrdered,
} from "lucide-react";
import {
  dllToBSTCPP, dllToBSTPython, dllToBSTJava, dllToBSTJS,
  bstToDLLCPP, bstToDLLPython, bstToDLLJava, bstToDLLJS,
} from "../algorithms/dllToBST";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

// ─── Constants ──────────────────────────────────────────────

const LANGUAGES = ["C++", "Python", "Java", "JavaScript"];

const ALGORITHM_META = {
  dllToBST: {
    title: "DLL → BST Conversion",
    description:
      "Convert a sorted Doubly Linked List into a height-balanced Binary Search Tree using in-order simulation. The DLL pointer advances naturally as the BST is built recursively.",
    complexity: "O(n)",
    space: "O(log n)",
    cppSnippet: dllToBSTCPP,
    pythonSnippet: dllToBSTPython,
    javaSnippet: dllToBSTJava,
    jsSnippet: dllToBSTJS,
  },
  bstToDLL: {
    title: "BST → DLL Conversion",
    description:
      "Convert a Binary Search Tree into a sorted Doubly Linked List via in-order traversal, rewiring left/right pointers to serve as prev/next in-place.",
    complexity: "O(n)",
    space: "O(h)",
    cppSnippet: bstToDLLCPP,
    pythonSnippet: bstToDLLPython,
    javaSnippet: bstToDLLJava,
    jsSnippet: bstToDLLJS,
  },
};

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const NODE_STATUS_CLASSES = {
  default: "border-slate-600/50 bg-slate-700/50 text-slate-100",
  active: "border-cyan-400/70 bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/50 scale-110",
  visited: "border-emerald-400/60 bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-400/30",
  root: "border-amber-400/70 bg-amber-500/30 text-amber-100 ring-2 ring-amber-400/50",
  converting: "border-violet-400/70 bg-violet-500/30 text-violet-100 ring-2 ring-violet-400/50 scale-110",
  done: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  head: "border-cyan-400/70 bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/40",
};

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Build a balanced BST structure from a sorted array
// Returns nodes array with tree topology
function buildBalancedBST(sortedVals) {
  const nodes = [];
  function build(lo, hi, parentId, side) {
    if (lo > hi) return null;
    const mid = Math.floor((lo + hi) / 2);
    const id = nodes.length;
    nodes.push({ id, val: sortedVals[mid], left: null, right: null, parentId, side, status: "default" });
    nodes[id].left = build(lo, mid - 1, id, "left");
    nodes[id].right = build(mid + 1, hi, id, "right");
    return id;
  }
  build(0, sortedVals.length - 1, null, null);
  return nodes;
}

// Assign (x, y) positions to BST nodes for SVG rendering
function assignPositions(nodes) {
  if (!nodes.length) return {};
  const pos = {};
  const X_SPREAD = 52;
  const Y_GAP = 56;
  function dfs(id, depth, lo, hi) {
    if (id === null || id === undefined) return;
    const mx = (lo + hi) / 2;
    pos[id] = { x: mx * X_SPREAD, y: depth * Y_GAP + 30 };
    const node = nodes[id];
    if (node.left !== null) dfs(node.left, depth + 1, lo, mx - 1);
    if (node.right !== null) dfs(node.right, depth + 1, mx + 1, hi);
  }
  const n = nodes.length;
  dfs(0, 0, 0, n - 1);
  return pos;
}

// Parse user input into a sorted integer array
function parseInput(str) {
  return str
    .split(/[\s,]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b)
    .filter((v, i, arr) => arr.indexOf(v) === i); // unique
}

const DEFAULT_VALUES = [1, 2, 3, 4, 5, 6, 7];
const RANDOM_PRESETS = [
  [1, 3, 5, 7, 9],
  [2, 4, 6, 8, 10, 12],
  [1, 2, 3, 4, 5, 6, 7],
  [10, 20, 30, 40, 50],
  [5, 10, 15, 20, 25, 30],
];

// ─── SVG BST Tree Component ──────────────────────────────────

function BSTTreeSVG({ nodes, statusMap, highlight }) {
  if (!nodes.length) return (
    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
      BST will appear here during run...
    </div>
  );
  const pos = assignPositions(nodes);
  const xs = Object.values(pos).map((p) => p.x);
  const ys = Object.values(pos).map((p) => p.y);
  const minX = Math.min(...xs) - 28;
  const maxX = Math.max(...xs) + 28;
  const minY = Math.min(...ys) - 28;
  const maxY = Math.max(...ys) + 28;
  const W = maxX - minX;
  const H = maxY - minY;

  const statusColors = {
    default: { fill: "#1e293b", stroke: "#475569", text: "#cbd5e1" },
    active: { fill: "#0e4966", stroke: "#22d3ee", text: "#cffafe" },
    visited: { fill: "#064e3b", stroke: "#34d399", text: "#a7f3d0" },
    root: { fill: "#78350f", stroke: "#fbbf24", text: "#fef3c7" },
    converting: { fill: "#3b0764", stroke: "#a855f7", text: "#e9d5ff" },
    done: { fill: "#052e16", stroke: "#4ade80", text: "#bbf7d0" },
  };

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`${minX} ${minY} ${W} ${H}`}
        width={Math.max(W, 200)}
        height={Math.max(H, 120)}
        className="mx-auto"
        style={{ minWidth: Math.max(W, 200) }}
      >
        {/* Edges */}
        {nodes.map((node) => {
          const p = pos[node.id];
          return (
            <>
              {node.left !== null && pos[node.left] && (
                <line
                  key={`e-l-${node.id}`}
                  x1={p.x} y1={p.y}
                  x2={pos[node.left].x} y2={pos[node.left].y}
                  stroke="#475569" strokeWidth="1.5" opacity="0.6"
                />
              )}
              {node.right !== null && pos[node.right] && (
                <line
                  key={`e-r-${node.id}`}
                  x1={p.x} y1={p.y}
                  x2={pos[node.right].x} y2={pos[node.right].y}
                  stroke="#475569" strokeWidth="1.5" opacity="0.6"
                />
              )}
            </>
          );
        })}
        {/* Nodes */}
        {nodes.map((node) => {
          const p = pos[node.id];
          const st = statusMap[node.id] || "default";
          const colors = statusColors[st] || statusColors.default;
          const isHighlighted = highlight === node.id;
          return (
            <g key={`n-${node.id}`}>
              <circle
                cx={p.x} cy={p.y} r={isHighlighted ? 20 : 18}
                fill={colors.fill}
                stroke={isHighlighted ? "#f0abfc" : colors.stroke}
                strokeWidth={isHighlighted ? 2.5 : 1.8}
                style={{ transition: "all 0.3s" }}
              />
              {node.parentId === null && (
                <text x={p.x} y={p.y - 23} textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                  root
                </text>
              )}
              <text
                x={p.x} y={p.y + 4}
                textAnchor="middle"
                fill={colors.text}
                fontSize="11"
                fontWeight="bold"
              >
                {node.val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── DLL Node Component ────────────────────────────────────────

function DLLNodeBox({ val, status, isHead, isTail, isActive }) {
  const cls = NODE_STATUS_CLASSES[status] || NODE_STATUS_CLASSES.default;
  return (
    <div className="relative flex items-center">
      {/* prev arrow */}
      {!isHead && (
        <div className="flex flex-col items-center mr-0.5">
          <span className="text-[8px] text-slate-500 leading-none">prev</span>
          <span className="text-slate-500 text-[10px]">◀</span>
        </div>
      )}
      <div
        className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-xl border-2 font-bold text-sm transition-all duration-300 select-none shadow-lg ${cls}`}
      >
        {isHead && (
          <span className="absolute -top-5 text-[9px] font-bold text-cyan-300 uppercase tracking-wide whitespace-nowrap">
            head
          </span>
        )}
        {isTail && (
          <span className="absolute -top-5 text-[9px] font-bold text-violet-300 uppercase tracking-wide whitespace-nowrap">
            tail
          </span>
        )}
        <span>{val}</span>
      </div>
      {/* next arrow */}
      {!isTail && (
        <div className="flex flex-col items-center ml-0.5">
          <span className="text-[8px] text-slate-500 leading-none">next</span>
          <span className="text-slate-500 text-[10px]">▶</span>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Component ─────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    q: "What must be true about the DLL before converting to BST?",
    options: ["It must be circular", "It must be sorted", "It must have odd length", "It must have a tail pointer"],
    answer: 1,
    explanation: "The DLL must be sorted in ascending order so that the middle element correctly becomes the BST root with smaller values on the left and larger on the right.",
  },
  {
    q: "What is the time complexity of converting a DLL of n nodes to a BST?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    answer: 2,
    explanation: "Each node is visited exactly once during the in-order simulation, making the time complexity O(n).",
  },
  {
    q: "During BST → DLL conversion, which traversal order is used?",
    options: ["Pre-order", "Post-order", "Level-order", "In-order"],
    answer: 3,
    explanation: "In-order traversal (left → root → right) of a BST gives nodes in sorted ascending order, which is exactly the order needed for the DLL.",
  },
  {
    q: "In BST → DLL, what does node.left point to after conversion?",
    options: ["The root", "The previous node (prev)", "null always", "The next node"],
    answer: 1,
    explanation: "After conversion, node.left is rewired to point to the previous node in the DLL (acting as the prev pointer), while node.right points to the next node.",
  },
  {
    q: "The DLL → BST algorithm produces which kind of BST?",
    options: ["A skewed BST", "A random BST", "A height-balanced BST", "A complete BST only for even n"],
    answer: 2,
    explanation: "By always picking the middle element as root, the algorithm produces a height-balanced BST with O(log n) height.",
  },
];

function QuizPanel() {
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = QUIZ_QUESTIONS[qi];

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const handleNext = () => {
    if (qi + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
    } else {
      setQi((v) => v + 1);
      setSelected(null);
    }
  };
  const handleRestart = () => {
    setQi(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="rounded-2xl bg-white/5 p-5 text-center">
        <p className="text-2xl font-black text-white mb-1">Quiz Complete!</p>
        <p className="text-slate-400 text-sm mb-4">
          You scored <span className="text-emerald-300 font-bold">{score}</span> / {QUIZ_QUESTIONS.length}
        </p>
        <div className="flex justify-center gap-2 text-4xl mb-4">
          {score === QUIZ_QUESTIONS.length ? "🏆" : score >= 3 ? "👍" : "📚"}
        </div>
        <button
          onClick={handleRestart}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15 transition-all"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
          Question {qi + 1} / {QUIZ_QUESTIONS.length}
        </span>
        <span className="text-[11px] text-emerald-300 font-bold">Score: {score}</span>
      </div>
      <p className="text-sm text-white font-semibold mb-4">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10";
          if (selected !== null) {
            if (i === q.answer) cls = "border-emerald-400/50 bg-emerald-500/15 text-emerald-200";
            else if (i === selected && selected !== q.answer) cls = "border-rose-400/50 bg-rose-500/15 text-rose-200";
            else cls = "border-white/5 bg-white/3 text-slate-500";
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-3 rounded-xl border border-sky-400/20 bg-sky-500/10 p-3">
          <p className="text-xs text-sky-200">{q.explanation}</p>
        </div>
      )}
      {selected !== null && (
        <button
          onClick={handleNext}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/15 transition-all"
        >
          {qi + 1 >= QUIZ_QUESTIONS.length ? "See Results" : "Next Question →"}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function DLLToBSTPage() {
  const navigate = useNavigate();

  // ── Core state ──
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("dllToBST");
  const [inputValues, setInputValues] = useState(DEFAULT_VALUES);
  const [customInputStr, setCustomInputStr] = useState("1, 2, 3, 4, 5, 6, 7");
  const [customInputError, setCustomInputError] = useState("");

  // ── DLL state (for DLL→BST: the input DLL; for BST→DLL: the output DLL) ──
  const [dllNodes, setDllNodes] = useState(() =>
    DEFAULT_VALUES.map((v, i) => ({ id: i, val: v, status: "default" }))
  );
  // ── BST state (for DLL→BST: the output BST; for BST→DLL: the input BST) ──
  const [bstNodes, setBstNodes] = useState(() => buildBalancedBST(DEFAULT_VALUES));
  const [bstStatusMap, setBstStatusMap] = useState({});

  // ── Animation / run state ──
  const [speed, setSpeed] = useState(700);
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Choose a direction and press ▶ Run.");
  const [highlightNode, setHighlightNode] = useState(null);

  // ── Step-by-step mode ──
  const [stepMode, setStepMode] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // ── UI panels ──
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [copyState, setCopyState] = useState("idle");

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);

  const MotionSection = motion.section;
  const MotionDiv = motion.div;
  const MotionButton = motion.button;

  const activeAlgorithm = ALGORITHM_META[selectedAlgorithm];
  useDocumentTitle(activeAlgorithm.title);

  // ── Code snippet ──
  const activeCodeSnippet = useMemo(() => {
    const meta = activeAlgorithm;
    if (selectedLanguage === "C++") return meta.cppSnippet;
    if (selectedLanguage === "Python") return meta.pythonSnippet;
    if (selectedLanguage === "Java") return meta.javaSnippet;
    return meta.jsSnippet;
  }, [activeAlgorithm, selectedLanguage]);

  // ── Pause/Resume ──
  const pauseResumeRun = useCallback(() => {
    if (!isRunning) return;
    if (isPaused) {
      pauseSignal.current = false;
      setIsPaused(false);
      setRunStatus("Running");
    } else {
      pauseSignal.current = true;
      setIsPaused(true);
      setRunStatus("Paused");
    }
  }, [isRunning, isPaused]);

  const hardStop = useCallback(() => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setRunStatus("Idle");
  }, []);

  const waitStep = useCallback(async () => {
    await sleep(speed);
    while (pauseSignal.current) await sleep(80);
  }, [speed]);

  // ── Apply input values ──
  const applyInputValues = useCallback((vals) => {
    const sorted = [...vals].sort((a, b) => a - b);
    setInputValues(sorted);
    setDllNodes(sorted.map((v, i) => ({ id: i, val: v, status: "default" })));
    setBstNodes(buildBalancedBST(sorted));
    setBstStatusMap({});
    setStepCount(0);
    setProgress(0);
    setHighlightNode(null);
    setSteps([]);
    setCurrentStepIdx(0);
    setStatusMessage("Input updated. Press ▶ Run to visualize.");
  }, []);

  // ── Custom input ──
  const handleCustomInput = useCallback(() => {
    const parsed = parseInput(customInputStr);
    if (parsed.length < 2) {
      setCustomInputError("Please enter at least 2 unique numbers.");
      return;
    }
    if (parsed.length > 15) {
      setCustomInputError("Maximum 15 nodes allowed for clear visualization.");
      return;
    }
    setCustomInputError("");
    hardStop();
    applyInputValues(parsed);
  }, [customInputStr, hardStop, applyInputValues]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    hardStop();
    const sorted = [...inputValues].sort((a, b) => a - b);
    setDllNodes(sorted.map((v, i) => ({ id: i, val: v, status: "default" })));
    setBstNodes(buildBalancedBST(sorted));
    setBstStatusMap({});
    setStepCount(0);
    setProgress(0);
    setHighlightNode(null);
    setSteps([]);
    setCurrentStepIdx(0);
    setStatusMessage("Reset. Press ▶ Run to start.");
  }, [hardStop, inputValues]);

  // ── Generate random ──
  const handleGenerate = useCallback(() => {
    hardStop();
    const preset = RANDOM_PRESETS[Math.floor(Math.random() * RANDOM_PRESETS.length)];
    setCustomInputStr(preset.join(", "));
    applyInputValues(preset);
    setStatusMessage("Random data generated.");
  }, [hardStop, applyInputValues]);

  // ── Build steps for step-by-step mode ──
  const buildDLLtoBSTSteps = useCallback((vals) => {
    const n = vals.length;
    const result = [];
    const bstResult = buildBalancedBST(vals);
    const inorderIds = [];
    function inorder(id) {
      if (id === null || id === undefined) return;
      inorder(bstResult[id].left);
      inorderIds.push(id);
      inorder(bstResult[id].right);
    }
    inorder(0);

    for (let i = 0; i < n; i++) {
      const dllState = vals.map((v, idx) => ({
        id: idx, val: v,
        status: idx < i ? "visited" : idx === i ? "active" : "default",
      }));
      const bstMap = {};
      for (let j = 0; j <= i; j++) {
        bstMap[inorderIds[j]] = j === i ? "converting" : "visited";
      }
      result.push({
        dllState,
        bstMap,
        highlight: inorderIds[i],
        message: `Step ${i + 1}: DLL node [${vals[i]}] → assigned to BST node at in-order position ${i + 1}${inorderIds[i] === 0 ? " (this is the ROOT)" : ""}`,
      });
    }
    // Final step
    const finalMap = {};
    inorderIds.forEach((id) => { finalMap[id] = "done"; });
    finalMap[0] = "root";
    result.push({
      dllState: vals.map((v, i) => ({ id: i, val: v, status: "done" })),
      bstMap: finalMap,
      highlight: null,
      message: "✅ Conversion complete! All DLL nodes placed into balanced BST.",
    });
    return { steps: result, bstResult };
  }, []);

  const buildBSTtoDLLSteps = useCallback((vals) => {
    const bst = buildBalancedBST(vals);
    const inorderIds = [];
    function inorder(id) {
      if (id === null || id === undefined) return;
      inorder(bst[id].left);
      inorderIds.push(id);
      inorder(bst[id].right);
    }
    inorder(0);
    const result = [];
    for (let i = 0; i < inorderIds.length; i++) {
      const id = inorderIds[i];
      const bstMap = {};
      inorderIds.forEach((nid, idx) => {
        bstMap[nid] = idx < i ? "visited" : idx === i ? "active" : "default";
      });
      const dll = inorderIds.slice(0, i + 1).map((nid, idx) => ({
        id: idx, val: bst[nid].val,
        status: idx === i ? "active" : "visited",
      }));
      result.push({
        bstMap,
        dllState: dll,
        highlight: id,
        message: `Step ${i + 1}: In-order visit BST node [${bst[id].val}] → appended to DLL. Rewire: left←prev, right→next.`,
      });
    }
    const finalDll = inorderIds.map((nid, idx) => ({
      id: idx, val: bst[nid].val,
      status: idx === 0 ? "head" : "done",
    }));
    const finalMap = {};
    inorderIds.forEach((id) => { finalMap[id] = "done"; });
    result.push({
      bstMap: finalMap,
      dllState: finalDll,
      highlight: null,
      message: "✅ Conversion complete! Sorted DLL built from BST via in-order traversal.",
    });
    return { steps: result, bstResult: bst };
  }, []);

  // ── Step-by-step navigation ──
  const applyStep = useCallback((stepData) => {
    if (!stepData) return;
    setDllNodes(stepData.dllState);
    setBstStatusMap(stepData.bstMap);
    setHighlightNode(stepData.highlight ?? null);
    setStatusMessage(stepData.message);
    setProgress(Math.round((steps.indexOf(stepData) / Math.max(steps.length - 1, 1)) * 100));
  }, [steps]);

  const handleStepForward = useCallback(() => {
    const next = Math.min(currentStepIdx + 1, steps.length - 1);
    setCurrentStepIdx(next);
    applyStep(steps[next]);
    setStepCount((c) => c + 1);
  }, [currentStepIdx, steps, applyStep]);

  const handleStepBack = useCallback(() => {
    const prev = Math.max(currentStepIdx - 1, 0);
    setCurrentStepIdx(prev);
    applyStep(steps[prev]);
  }, [currentStepIdx, steps, applyStep]);

  // ── Enter step mode ──
  const handleEnterStepMode = useCallback(() => {
    hardStop();
    const sorted = [...inputValues];
    let built;
    if (selectedAlgorithm === "dllToBST") {
      built = buildDLLtoBSTSteps(sorted);
    } else {
      built = buildBSTtoDLLSteps(sorted);
    }
    setBstNodes(built.bstResult);
    setSteps(built.steps);
    setCurrentStepIdx(0);
    applyStep(built.steps[0]);
    setStepMode(true);
    setRunStatus("Idle");
  }, [hardStop, inputValues, selectedAlgorithm, buildDLLtoBSTSteps, buildBSTtoDLLSteps, applyStep]);

  // ── Animated run: DLL → BST ──
  const runDLLToBST = useCallback(async (vals) => {
    const sorted = [...vals];
    const n = sorted.length;
    const bstResult = buildBalancedBST(sorted);
    setBstNodes(bstResult);

    const inorderIds = [];
    function collectInorder(id) {
      if (id === null || id === undefined) return;
      collectInorder(bstResult[id].left);
      inorderIds.push(id);
      collectInorder(bstResult[id].right);
    }
    collectInorder(0);

    const bstMap = {};
    for (let i = 0; i < n; i++) {
      if (stopSignal.current) return;
      // Update DLL
      const newDll = sorted.map((v, idx) => ({
        id: idx, val: v,
        status: idx < i ? "visited" : idx === i ? "active" : "default",
      }));
      setDllNodes(newDll);
      // Update BST node
      bstMap[inorderIds[i]] = inorderIds[i] === 0 ? "root" : "converting";
      setBstStatusMap({ ...bstMap });
      setHighlightNode(inorderIds[i]);
      setStepCount(i + 1);
      setProgress(Math.round(((i + 1) / n) * 90));
      setStatusMessage(
        `[${i + 1}/${n}] DLL node [${sorted[i]}] → BST node${inorderIds[i] === 0 ? " (ROOT)" : " (in-order pos " + (i + 1) + ")"}`
      );
      await waitStep();
      bstMap[inorderIds[i]] = inorderIds[i] === 0 ? "root" : "visited";
    }

    // Final state
    const finalMap = {};
    inorderIds.forEach((id) => { finalMap[id] = "done"; });
    finalMap[0] = "root";
    setDllNodes(sorted.map((v, i) => ({ id: i, val: v, status: "done" })));
    setBstStatusMap(finalMap);
    setHighlightNode(null);
    setProgress(100);
    setRunStatus("Completed");
    setStatusMessage("✅ DLL → BST complete! Height-balanced BST constructed in O(n).");
    setIsRunning(false);
  }, [waitStep]);

  // ── Animated run: BST → DLL ──
  const runBSTToDLL = useCallback(async (vals) => {
    const sorted = [...vals];
    const bst = buildBalancedBST(sorted);
    setBstNodes(bst);
    setDllNodes([]);

    const inorderIds = [];
    function collectInorder(id) {
      if (id === null || id === undefined) return;
      collectInorder(bst[id].left);
      inorderIds.push(id);
      collectInorder(bst[id].right);
    }
    collectInorder(0);

    const bstMap = {};
    const dll = [];

    for (let i = 0; i < inorderIds.length; i++) {
      if (stopSignal.current) return;
      const id = inorderIds[i];
      bstMap[id] = "active";
      setBstStatusMap({ ...bstMap });
      setHighlightNode(id);
      dll.push({ id: i, val: bst[id].val, status: "active" });
      // Mark prev dll nodes as visited
      setDllNodes(dll.map((nd, idx) => ({ ...nd, status: idx === i ? "active" : "visited" })));
      setStepCount(i + 1);
      setProgress(Math.round(((i + 1) / inorderIds.length) * 90));
      setStatusMessage(
        `[${i + 1}/${inorderIds.length}] In-order: BST node [${bst[id].val}] → DLL position ${i + 1}. Rewiring left←prev, right→next.`
      );
      await waitStep();
      bstMap[id] = "visited";
    }

    const finalDll = inorderIds.map((nid, idx) => ({
      id: idx, val: bst[nid].val,
      status: idx === 0 ? "head" : "done",
    }));
    const finalMap = {};
    inorderIds.forEach((id) => { finalMap[id] = "done"; });
    setDllNodes(finalDll);
    setBstStatusMap(finalMap);
    setHighlightNode(null);
    setProgress(100);
    setRunStatus("Completed");
    setStatusMessage("✅ BST → DLL complete! Sorted DLL built via in-order traversal in O(n).");
    setIsRunning(false);
  }, [waitStep]);

  // ── Start run ──
  const handleRun = useCallback(async () => {
    if (isRunning || stepMode) return;
    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setRunStatus("Running");
    setBstStatusMap({});
    setHighlightNode(null);
    setStepCount(0);
    setProgress(0);

    const sorted = [...inputValues];
    setDllNodes(sorted.map((v, i) => ({ id: i, val: v, status: "default" })));
    if (selectedAlgorithm === "dllToBST") {
      await runDLLToBST(sorted);
    } else {
      await runBSTToDLL(sorted);
    }
  }, [isRunning, stepMode, inputValues, selectedAlgorithm, runDLLToBST, runBSTToDLL]);

  // ── Exit step mode ──
  const handleExitStepMode = useCallback(() => {
    setStepMode(false);
    handleReset();
  }, [handleReset]);

  // ── Copy ──
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeCodeSnippet).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    });
  }, [activeCodeSnippet]);

  // ── Download ──
  const handleDownload = useCallback(() => {
    const ext = { "C++": "cpp", Python: "py", Java: "java", JavaScript: "js" }[selectedLanguage] || "txt";
    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeAlgorithm.title.replace(/[\s→↔]+/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, activeAlgorithm.title, selectedLanguage]);

  // ── Hotkeys ──
  useStableHotkeys("space", (e) => {
    if (shouldSkipHotkeyTarget(e)) return;
    e.preventDefault();
    if (stepMode) { handleStepForward(); return; }
    if (isRunning) pauseResumeRun();
    else handleRun();
  }, [isRunning, stepMode, pauseResumeRun, handleRun, handleStepForward]);

  useStableHotkeys("r", (e) => {
    if (shouldSkipHotkeyTarget(e)) return;
    if (stepMode) handleExitStepMode();
    else handleReset();
  }, [handleReset, stepMode, handleExitStepMode]);

  useStableHotkeys("g", (e) => {
    if (shouldSkipHotkeyTarget(e)) return;
    handleGenerate();
  }, [handleGenerate]);

  useStableHotkeys("left", (e) => {
    if (!stepMode) return;
    e.preventDefault();
    handleStepBack();
  }, [stepMode, handleStepBack]);

  useStableHotkeys("right", (e) => {
    if (!stepMode) return;
    e.preventDefault();
    handleStepForward();
  }, [stepMode, handleStepForward]);

  // ── Derived: which DLL and BST to show ──
  // dllToBST: input=DLL (dllNodes), output=BST (bstNodes with bstStatusMap)
  // bstToDLL: input=BST (bstNodes with bstStatusMap), output=DLL (dllNodes)
  const inputLabel = selectedAlgorithm === "dllToBST" ? "Input — Sorted Doubly Linked List" : "Input — Binary Search Tree";
  const outputLabel = selectedAlgorithm === "dllToBST" ? "Output — Balanced Binary Search Tree" : "Output — Sorted Doubly Linked List";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <HotkeysHint hints={[
          { key: "Space", label: stepMode ? "Next Step" : isRunning ? (isPaused ? "Resume" : "Pause") : "Run" },
          { key: "R", label: stepMode ? "Exit Step Mode" : "Reset" },
          { key: "G", label: "Generate" },
          ...(stepMode ? [{ key: "← →", label: "Navigate Steps" }] : []),
        ]} />

        {/* ── Header Card ── */}
        <MotionSection
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
        >
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6 flex items-center">
                <button
                  onClick={() => navigate("/algorithms")}
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-4 pl-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                  Back to Algorithms
                </button>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-200">
                  Linked List
                </span>
                <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
                  BST
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                  {stepMode ? "Step Mode" : runStatus}
                </span>
              </div>
              <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                {activeAlgorithm.title}
              </h1>
              <p className="mt-3 text-sm text-slate-300 sm:text-base">
                {activeAlgorithm.description}
              </p>
              {/* Progress bar */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                  <MotionDiv
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500"
                  />
                </div>
              </div>
              {/* Stats */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                {[
                  { label: "Nodes", val: inputValues.length, color: "text-white" },
                  { label: "Time", val: activeAlgorithm.complexity, color: "text-cyan-200" },
                  { label: "Space", val: activeAlgorithm.space, color: "text-blue-100" },
                  { label: "Steps", val: stepMode ? `${currentStepIdx + 1}/${steps.length}` : stepCount, color: "text-emerald-200" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <p className={`mt-1 text-sm font-semibold ${stat.color}`}>{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Runtime Snapshot */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Activity size={13} />
                Runtime Snapshot
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-white/5 p-3 min-h-[56px]">
                <span className="mt-0.5 text-cyan-300 shrink-0">●</span>
                <p className="text-sm text-slate-300">{statusMessage}</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Key Insight</p>
                  {selectedAlgorithm === "dllToBST" ? (
                    <p className="text-xs text-slate-300">
                      The <span className="text-cyan-300 font-semibold">middle node</span> of the sorted DLL becomes the BST root. Left half → left subtree, right half → right subtree — recursively. No extra space for nodes needed.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300">
                      BST <span className="text-cyan-300 font-semibold">in-order traversal</span> gives sorted order. Rewiring <code className="text-violet-300">node.left←prev</code> and <code className="text-violet-300">node.right→next</code> builds a DLL in-place — no new nodes.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Time</p>
                    <p className="text-sm font-bold text-cyan-200">{activeAlgorithm.complexity}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Space</p>
                    <p className="text-sm font-bold text-blue-200">{activeAlgorithm.space}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionSection>

        {/* ── Controls + Visualization ── */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">

          {/* ── Sidebar Controls ── */}
          <aside className="flex flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur gap-4">
            <div className="flex items-center gap-2">
              <Binary size={18} className="text-purple-300" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
            </div>

            {/* Direction select */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">Conversion Direction</label>
              <select
                value={selectedAlgorithm}
                disabled={isRunning || stepMode}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value);
                  hardStop();
                  setStepMode(false);
                  const sorted = [...inputValues];
                  setDllNodes(sorted.map((v, i) => ({ id: i, val: v, status: "default" })));
                  setBstNodes(buildBalancedBST(sorted));
                  setBstStatusMap({});
                  setProgress(0);
                  setStepCount(0);
                  setStatusMessage("Direction changed. Press ▶ Run.");
                }}
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none"
              >
                <option value="dllToBST">DLL → BST (Sorted DLL to Balanced BST)</option>
                <option value="bstToDLL">BST → DLL (BST to Sorted DLL)</option>
              </select>
            </div>

            {/* Custom Input */}
            <div className="rounded-2xl border border-violet-400/15 bg-violet-500/5 p-3">
              <label className="mb-2 block text-xs uppercase text-violet-300 font-bold">
                Custom Input (sorted values)
              </label>
              <input
                type="text"
                value={customInputStr}
                onChange={(e) => setCustomInputStr(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCustomInput(); }}
                placeholder="e.g. 1, 3, 5, 7, 9"
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-400/50 mb-2"
              />
              {customInputError && (
                <p className="text-xs text-rose-400 mb-2">{customInputError}</p>
              )}
              <button
                onClick={handleCustomInput}
                disabled={isRunning || stepMode}
                className="w-full rounded-xl border border-violet-400/30 bg-violet-500/15 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/25 transition-all disabled:opacity-40"
              >
                Apply Custom Input
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Enter 2–15 numbers. Duplicates and unsorted input are handled automatically.
              </p>
            </div>

            {/* Speed */}
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase text-slate-400">Animation Speed</label>
                <span className="text-xs text-slate-300">{speed}ms</span>
              </div>
              <input
                type="range" min={150} max={1500} step={50}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                disabled={stepMode}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>⚡ Fast</span><span>🐢 Slow</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <MotionButton whileTap={{ scale: 0.96 }} onClick={handleGenerate} disabled={isRunning || stepMode}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40 transition-all">
                <Shuffle size={13} /> Generate
              </MotionButton>
              <MotionButton whileTap={{ scale: 0.96 }} onClick={stepMode ? handleExitStepMode : handleReset}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-all">
                <RotateCcw size={13} /> {stepMode ? "Exit Step" : "Reset"}
              </MotionButton>
            </div>

            {/* Step-by-step buttons */}
            {stepMode ? (
              <div className="grid grid-cols-3 gap-2">
                <MotionButton whileTap={{ scale: 0.96 }} onClick={handleStepBack} disabled={currentStepIdx === 0}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-30 transition-all">
                  <ChevronLeft size={14} /> Prev
                </MotionButton>
                <div className="flex items-center justify-center text-xs text-slate-400 font-bold">
                  {currentStepIdx + 1}/{steps.length}
                </div>
                <MotionButton whileTap={{ scale: 0.96 }} onClick={handleStepForward} disabled={currentStepIdx >= steps.length - 1}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-30 transition-all">
                  Next <ChevronRight size={14} />
                </MotionButton>
              </div>
            ) : (
              <MotionButton whileTap={{ scale: 0.96 }}
                onClick={isRunning ? pauseResumeRun : handleRun}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                  isRunning && !isPaused
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                }`}>
                {isRunning && !isPaused ? <><Pause size={15} /> Pause</> : isRunning ? <><Play size={15} /> Resume</> : <><Play size={15} /> Run</>}
              </MotionButton>
            )}

            {/* Step mode toggle */}
            {!isRunning && !stepMode && (
              <MotionButton whileTap={{ scale: 0.96 }} onClick={handleEnterStepMode}
                className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/20 transition-all">
                <ListOrdered size={14} /> Step-by-Step Mode
              </MotionButton>
            )}

            {/* Feature toggles */}
            <div className="grid grid-cols-1 gap-2">
              <MotionButton whileTap={{ scale: 0.96 }} onClick={() => setShowInfoPanel((v) => !v)}
                className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/20 transition-all">
                <Info size={14} /> {showInfoPanel ? "Hide" : "Show"} Explanation
              </MotionButton>
              <MotionButton whileTap={{ scale: 0.96 }} onClick={() => setShowQuiz((v) => !v)}
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20 transition-all">
                <BookOpen size={14} /> {showQuiz ? "Hide" : "Take"} Quiz
              </MotionButton>
              <MotionButton whileTap={{ scale: 0.96 }} onClick={() => setShowCompare((v) => !v)}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 transition-all">
                <Layers2 size={14} /> {showCompare ? "Hide" : "Show"} Comparison
              </MotionButton>
            </div>
          </aside>

          {/* ── Main Visualization ── */}
          <section className="min-w-0 rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Visualization Canvas</p>
              {stepMode && (
                <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  Step Mode — Use ← → or Prev/Next
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 space-y-6">
              {/* INPUT section */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-3 font-semibold">
                  {inputLabel}
                </p>
                {selectedAlgorithm === "dllToBST" ? (
                  /* DLL (input for DLL→BST) */
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-center gap-0.5 min-w-max px-2 pt-7 pb-2">
                      <span className="text-xs text-slate-500 mr-1 select-none">null ◀</span>
                      {dllNodes.map((nd, i) => (
                        <DLLNodeBox
                          key={nd.id}
                          val={nd.val}
                          status={nd.status}
                          isHead={i === 0}
                          isTail={i === dllNodes.length - 1}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1 select-none">▶ null</span>
                    </div>
                  </div>
                ) : (
                  /* BST (input for BST→DLL) */
                  <BSTTreeSVG nodes={bstNodes} statusMap={bstStatusMap} highlight={highlightNode} />
                )}
              </div>

              {/* Arrow */}
              <div className="flex justify-center items-center gap-2">
                <div className="h-px flex-1 bg-slate-700/50" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
                    {selectedAlgorithm === "dllToBST" ? "DLL → BST" : "BST → DLL"}
                  </span>
                  <span className="text-xl text-purple-400">↓</span>
                </div>
                <div className="h-px flex-1 bg-slate-700/50" />
              </div>

              {/* OUTPUT section */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-3 font-semibold">
                  {outputLabel}
                </p>
                {selectedAlgorithm === "dllToBST" ? (
                  /* BST output */
                  <BSTTreeSVG nodes={bstNodes} statusMap={bstStatusMap} highlight={highlightNode} />
                ) : (
                  /* DLL output */
                  dllNodes.length > 0 ? (
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center gap-0.5 min-w-max px-2 pt-7 pb-2">
                        <span className="text-xs text-slate-500 mr-1 select-none">null ◀</span>
                        {dllNodes.map((nd, i) => (
                          <DLLNodeBox
                            key={nd.id}
                            val={nd.val}
                            status={nd.status}
                            isHead={i === 0}
                            isTail={i === dllNodes.length - 1}
                          />
                        ))}
                        <span className="text-xs text-slate-500 ml-1 select-none">▶ null</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-16 text-slate-500 text-sm">
                      DLL will appear here during run...
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Color Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { color: "border-cyan-400/40 bg-cyan-500/15 text-cyan-100", label: "Active" },
                { color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100", label: "Visited / Done" },
                { color: "border-violet-400/40 bg-violet-500/15 text-violet-100", label: "Converting" },
                { color: "border-amber-400/40 bg-amber-500/15 text-amber-100", label: "Root / Head" },
                { color: "border-slate-500/40 bg-slate-700/30 text-slate-300", label: "Idle" },
              ].map((item) => (
                <span key={item.label} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${item.color}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* ── Info Panel ── */}
        <AnimatePresence>
          {showInfoPanel && (
            <motion.section key="info"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-3xl border border-violet-400/15 bg-violet-500/5 p-6 backdrop-blur"
            >
              <h3 className="text-lg font-bold text-white mb-5">📚 Algorithm Explanation</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <h4 className="text-sm font-bold text-cyan-300 mb-3">DLL → BST (Step-by-step)</h4>
                  <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
                    <li>Count total DLL nodes → <code className="text-violet-300">n</code></li>
                    <li>Recursively build left subtree with <code className="text-violet-300">n/2</code> nodes</li>
                    <li>Current DLL pointer becomes the <strong className="text-amber-300">root</strong></li>
                    <li>Advance DLL pointer: <code className="text-violet-300">curr = curr→next</code></li>
                    <li>Recursively build right subtree with remaining nodes</li>
                    <li>Result: Height-balanced BST, <strong className="text-emerald-300">O(n) time, O(log n) space</strong></li>
                  </ol>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <h4 className="text-sm font-bold text-purple-300 mb-3">BST → DLL (Step-by-step)</h4>
                  <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
                    <li>Do <strong className="text-cyan-300">in-order traversal</strong>: left → root → right</li>
                    <li>For each node: set <code className="text-violet-300">node.left = prev</code></li>
                    <li>If prev exists: set <code className="text-violet-300">prev.right = node</code></li>
                    <li>If prev is null: this node is the <strong className="text-amber-300">DLL head</strong></li>
                    <li>Update <code className="text-violet-300">prev = node</code> and continue</li>
                    <li>Result: Sorted DLL, <strong className="text-emerald-300">O(n) time, O(h) space</strong></li>
                  </ol>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <h4 className="text-sm font-bold text-emerald-300 mb-3">🔑 Key Properties</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    <li>BST in-order = sorted ascending = DLL order</li>
                    <li>Both conversions are <strong className="text-cyan-300">lossless</strong></li>
                    <li>DLL→BST requires input to be <strong className="text-amber-300">pre-sorted</strong></li>
                    <li>BST→DLL works in-place (rewires existing pointers)</li>
                    <li>DLL→BST produces a <strong className="text-emerald-300">balanced</strong> tree</li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <h4 className="text-sm font-bold text-rose-300 mb-3">⚠️ Common Pitfalls</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    <li>DLL must be <strong className="text-rose-300">sorted</strong> before DLL→BST</li>
                    <li>Not maintaining <code className="text-violet-300">prev</code> in BST→DLL traversal</li>
                    <li>Off-by-one in midpoint split for DLL→BST</li>
                    <li>In DLL→BST, the DLL pointer must be a <strong className="text-rose-300">mutable reference</strong> across recursive calls</li>
                  </ul>
                </div>
              </div>
              {/* Complexity table */}
              <div className="mt-4 overflow-x-auto rounded-xl bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Complexity Summary</p>
                <table className="w-full text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-6 text-slate-400">Algorithm</th>
                      <th className="text-left py-2 pr-6 text-slate-400">Time</th>
                      <th className="text-left py-2 pr-6 text-slate-400">Space</th>
                      <th className="text-left py-2 text-slate-400">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-6 text-cyan-300 font-medium">DLL → BST</td>
                      <td className="py-2 pr-6">O(n)</td>
                      <td className="py-2 pr-6">O(log n)</td>
                      <td className="py-2 text-slate-400">Recursion depth = BST height</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6 text-purple-300 font-medium">BST → DLL</td>
                      <td className="py-2 pr-6">O(n)</td>
                      <td className="py-2 pr-6">O(h)</td>
                      <td className="py-2 text-slate-400">h = O(log n) for balanced BST</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Quiz Panel ── */}
        <AnimatePresence>
          {showQuiz && (
            <motion.section key="quiz"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-3xl border border-amber-400/15 bg-amber-500/5 p-6 backdrop-blur"
            >
              <h3 className="text-lg font-bold text-white mb-4">🧠 Knowledge Quiz</h3>
              <QuizPanel />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Comparison Panel ── */}
        <AnimatePresence>
          {showCompare && (
            <motion.section key="compare"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-3xl border border-emerald-400/15 bg-emerald-500/5 p-6 backdrop-blur"
            >
              <h3 className="text-lg font-bold text-white mb-4">⚖️ DLL vs BST — Structure Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Property", "Doubly Linked List", "Binary Search Tree"].map((h) => (
                        <th key={h} className="text-left py-2.5 pr-6 text-slate-400 font-bold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ["Structure", "Linear, bidirectional", "Hierarchical, binary"],
                      ["Search", "O(n) linear scan", "O(log n) avg, O(n) worst"],
                      ["Insert", "O(1) with pointer", "O(log n) avg"],
                      ["Delete", "O(1) with pointer", "O(log n) avg"],
                      ["Memory", "2 pointers per node (prev, next)", "2 pointers per node (left, right)"],
                      ["Order", "Maintains insertion / sorted order", "Left < root < right always"],
                      ["Traversal", "O(n) sequential", "O(n) in-order gives sorted"],
                      ["Use case", "Queue, cache, browser history", "Fast search, sorted storage"],
                    ].map(([prop, dll, bst]) => (
                      <tr key={prop}>
                        <td className="py-2.5 pr-6 font-semibold text-slate-200">{prop}</td>
                        <td className="py-2.5 pr-6 text-cyan-200">{dll}</td>
                        <td className="py-2.5 text-purple-200">{bst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Code Panel Toggle ── */}
        <div className="flex justify-center">
          <MotionButton whileTap={{ scale: 0.97 }} onClick={() => setShowCodePanel((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 transition-all">
            <Code2 size={15} />
            {showCodePanel ? "Hide" : "Show"} Code Viewer
          </MotionButton>
        </div>

        {/* ── Code Panel ── */}
        <AnimatePresence>
          {showCodePanel && (
            <motion.section key="code"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
            >
              {/* Header */}
              <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => navigate("/algorithms")}
                    className="group flex items-center gap-2 rounded-lg bg-white/5 pr-4 pl-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white border border-white/10 transition-all">
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                    Back
                  </button>
                  <div className="h-6 w-px bg-slate-700 hidden sm:block" />
                  <Code2 size={20} className="text-purple-400" />
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
                    {selectedLanguage} Source — {activeAlgorithm.title}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button key={lang} onClick={() => setSelectedLanguage(lang)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        selectedLanguage === lang
                          ? "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                          : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                      }`}>
                      {lang}
                    </button>
                  ))}
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all">
                    {copyState === "copied" ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copyState === "copied" ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all">
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>

              {/* ✅ FIX: Use the correct pattern — split by lines, render each with renderHighlightedCode */}
              <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-mono text-sm leading-relaxed">
                <pre>
                  <code>
                    {activeCodeSnippet.split("\n").map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5 px-2 rounded">
                        <span className="w-8 shrink-0 select-none pr-4 text-right text-xs text-slate-600">
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
            </motion.section>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}