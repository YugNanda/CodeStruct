import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Binary,
  CheckCheck,
  Code2,
  Copy,
  Download,
  Minus,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Info,
  Plus,
  Activity,
} from "lucide-react";
import {
  dllInsertAtHeadCPP, dllInsertAtHeadPython, dllInsertAtHeadJava, dllInsertAtHeadJS,
  dllInsertAtTailCPP, dllInsertAtTailPython, dllInsertAtTailJava, dllInsertAtTailJS,
  dllInsertAtPositionCPP, dllInsertAtPositionPython, dllInsertAtPositionJava, dllInsertAtPositionJS,
  dllDeleteFromHeadCPP, dllDeleteFromHeadPython, dllDeleteFromHeadJava, dllDeleteFromHeadJS,
  dllDeleteFromTailCPP, dllDeleteFromTailPython, dllDeleteFromTailJava, dllDeleteFromTailJS,
  dllDeleteByValueCPP, dllDeleteByValuePython, dllDeleteByValueJava, dllDeleteByValueJS,
} from "../algorithms/doublyLinkedList";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

// ─── Constants ──────────────────────────────────────────────

const LANGUAGES = ["C++", "Python", "Java", "JavaScript"];

const EMPTY_MARKERS = {
  head: null, tail: null, current: null, prev: null,
  next: null, newNode: null, target: null,
};

const NODE_STATUS_CLASSES = {
  default:   "border-slate-600/50 bg-slate-700/50 text-slate-100",
  current:   "border-blue-400/60 bg-blue-500/25 text-blue-100 ring-2 ring-blue-400/40",
  highlight: "border-cyan-400/60 bg-cyan-500/25 text-cyan-100 ring-2 ring-cyan-400/40",
  newNode:   "border-emerald-400/60 bg-emerald-500/30 text-emerald-100 ring-2 ring-emerald-400/50",
  target:    "border-rose-400/60 bg-rose-500/25 text-rose-100 ring-2 ring-rose-400/40",
  fadeOut:   "border-rose-400/20 bg-rose-500/5 text-rose-300 opacity-20",
  done:      "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  prev:      "border-violet-400/60 bg-violet-500/25 text-violet-100 ring-2 ring-violet-400/40",
};

const runStatusStyleMap = {
  Idle:      "border-slate-400/30 bg-slate-500/10 text-slate-300",
  Running:   "border-blue-400/30 bg-blue-500/10 text-blue-200",
  Paused:    "border-amber-400/30 bg-amber-500/10 text-amber-200",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const markerLabels = {
  head: "head", tail: "tail", current: "curr", prev: "prev",
  next: "next", newNode: "new", target: "target",
};

// ─── Operation metadata ─────────────────────────────────────

const operationsMeta = {
  insertHead: {
    title: "Insert at Head",
    description: "Create a new node. Set new→next = head, head→prev = new. Update head pointer. Both directions are linked!",
    complexity: "O(1)", space: "O(1)", type: "insertion",
    cppSnippet: dllInsertAtHeadCPP, pythonSnippet: dllInsertAtHeadPython,
    javaSnippet: dllInsertAtHeadJava, jsSnippet: dllInsertAtHeadJS,
    learnerTip: "Unlike SLL, DLL allows traversal in both directions. Inserting at head is O(1) — just update two pointers: new→next and old head→prev.",
  },
  insertTail: {
    title: "Insert at Tail",
    description: "Traverse to the last node. Set tail→next = new, new→prev = tail. The new node becomes the tail.",
    complexity: "O(n)", space: "O(1)", type: "insertion",
    cppSnippet: dllInsertAtTailCPP, pythonSnippet: dllInsertAtTailPython,
    javaSnippet: dllInsertAtTailJava, jsSnippet: dllInsertAtTailJS,
    learnerTip: "With a dedicated tail pointer (common optimization), this becomes O(1). Watch how 2 pointers are linked during the animation!",
  },
  insertPosition: {
    title: "Insert at Position",
    description: "Traverse to pos−1. Wire: prev→next = new, new→prev = prev, new→next = next, next→prev = new. Four pointer updates!",
    complexity: "O(n)", space: "O(1)", type: "insertion",
    cppSnippet: dllInsertAtPositionCPP, pythonSnippet: dllInsertAtPositionPython,
    javaSnippet: dllInsertAtPositionJava, jsSnippet: dllInsertAtPositionJS,
    learnerTip: "DLL insertion at position needs 4 pointer updates (vs 2 in SLL) because of the extra prev link. Watch the arrows change direction!",
  },
  deleteHead: {
    title: "Delete from Head",
    description: "Move head to head→next. Set new head's prev = null. O(1) — no traversal needed.",
    complexity: "O(1)", space: "O(1)", type: "deletion",
    cppSnippet: dllDeleteFromHeadCPP, pythonSnippet: dllDeleteFromHeadPython,
    javaSnippet: dllDeleteFromHeadJava, jsSnippet: dllDeleteFromHeadJS,
    learnerTip: "DLL head deletion is O(1) just like SLL — but remember to also null out the new head's prev pointer to avoid dangling references!",
  },
  deleteTail: {
    title: "Delete from Tail",
    description: "Traverse to the tail. Use tail→prev to reach the second-to-last node, then set its next = null.",
    complexity: "O(n)", space: "O(1)", type: "deletion",
    cppSnippet: dllDeleteFromTailCPP, pythonSnippet: dllDeleteFromTailPython,
    javaSnippet: dllDeleteFromTailJava, jsSnippet: dllDeleteFromTailJS,
    learnerTip: "DLL tail deletion is simpler than SLL! In SLL you need two traversal pointers. In DLL, just use tail→prev directly to find second-to-last.",
  },
  deleteByValue: {
    title: "Delete by Value",
    description: "Search for the target. Bypass: prev→next = curr→next, next→prev = curr→prev. DLL makes bypassing cleaner!",
    complexity: "O(n)", space: "O(1)", type: "deletion",
    cppSnippet: dllDeleteByValueCPP, pythonSnippet: dllDeleteByValuePython,
    javaSnippet: dllDeleteByValueJava, jsSnippet: dllDeleteByValueJS,
    learnerTip: "DLL delete-by-value needs only ONE traversal pointer (vs two in SLL) because we access the previous node directly via curr→prev!",
  },
};

// ─── Helpers ────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomValue() {
  return Math.floor(Math.random() * 90) + 10;
}

function createDLLState(size) {
  const stamp = Date.now();
  const nodes = Array.from({ length: size }, (_, i) => ({
    id: `${stamp}-${i}-${Math.floor(Math.random() * 1e6)}`,
    value: getRandomValue(),
    status: "default",
  }));
  const nextLinks = nodes.map((_, i) => (i < size - 1 ? i + 1 : null));
  const prevLinks = nodes.map((_, i) => (i > 0 ? i - 1 : null));
  return { nodes, nextLinks, prevLinks, headIndex: size > 0 ? 0 : null };
}

// ─── Component ──────────────────────────────────────────────

export default function DoublyLinkedListPage() {
  const navigate = useNavigate();
  const initialGraph = useMemo(() => createDLLState(5), []);

  const [nodes, setNodes]           = useState(initialGraph.nodes);
  const [nextLinks, setNextLinks]   = useState(initialGraph.nextLinks);
  const [prevLinks, setPrevLinks]   = useState(initialGraph.prevLinks);
  const [headIndex, setHeadIndex]   = useState(initialGraph.headIndex);
  const [markers, setMarkers]       = useState({ ...EMPTY_MARKERS, head: initialGraph.headIndex });
  const [listSize, setListSize]     = useState(5);
  const [speed, setSpeed]           = useState(380);
  const [selectedOperation, setSelectedOperation] = useState("insertHead");
  const [runStatus, setRunStatus]   = useState("Idle");
  const [isRunning, setIsRunning]   = useState(false);
  const [isPaused, setIsPaused]     = useState(false);
  const [stepCount, setStepCount]   = useState(0);
  const [statusMessage, setStatusMessage] = useState("Pick an operation and press Start.");
  const [inputValue, setInputValue]       = useState("");
  const [inputPosition, setInputPosition] = useState("");
  const [operationHistory, setOperationHistory] = useState([]);
  const [copyState, setCopyState]   = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");

  const stopSignal  = useRef(false);
  const pauseSignal = useRef(false);
  const nodeViewportRef = useRef(null);

  const MotionSection = motion.section;
  const MotionButton  = motion.button;
  const MotionDiv     = motion.div;

  const activeOp = operationsMeta[selectedOperation];
  useDocumentTitle(`DLL – ${activeOp.title}`);

  // ─── snippet selector ──────────────────────────────────────
  const activeCodeSnippet = useMemo(() => {
    const op = operationsMeta[selectedOperation];
    if (!op) return "";
    if (selectedLanguage === "C++")        return op.cppSnippet;
    if (selectedLanguage === "Python")     return op.pythonSnippet;
    if (selectedLanguage === "Java")       return op.javaSnippet;
    return op.jsSnippet;
  }, [selectedOperation, selectedLanguage]);

  // ─── traversal ─────────────────────────────────────────────
  const listTraversal = useMemo(() => {
    if (headIndex === null) return [];
    const order = [];
    const visited = new Set();
    let cursor = headIndex;
    while (cursor !== null && !visited.has(cursor)) {
      order.push(cursor);
      visited.add(cursor);
      cursor = nextLinks[cursor];
    }
    return order;
  }, [headIndex, nextLinks]);

  // ─── progress ──────────────────────────────────────────────
  const progress = useMemo(() =>
    runStatus === "Completed" ? 100
      : nodes.length === 0 ? 0
      : Math.min(Math.round((stepCount / Math.max(nodes.length, 1)) * 100), 100),
    [runStatus, stepCount, nodes.length],
  );

  // ─── async control ─────────────────────────────────────────
  const waitWithControl = useCallback(async (ms) => {
    const chunk = 40;
    let elapsed = 0;
    while (elapsed < ms) {
      if (stopSignal.current) return false;
      while (pauseSignal.current) {
        if (stopSignal.current) return false;
        await sleep(80);
      }
      await sleep(Math.min(chunk, ms - elapsed));
      elapsed += chunk;
    }
    return !stopSignal.current;
  }, []);

  const hardStopRun = useCallback(() => {
    stopSignal.current = true;
    pauseSignal.current = false;
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  // ─── generate new list ──────────────────────────────────────
  const generateNewList = useCallback((size) => {
    hardStopRun();
    const s = createDLLState(size);
    setNodes(s.nodes);
    setNextLinks(s.nextLinks);
    setPrevLinks(s.prevLinks);
    setHeadIndex(s.headIndex);
    setMarkers({ ...EMPTY_MARKERS, head: s.headIndex });
    setStepCount(0);
    setRunStatus("Idle");
    setOperationHistory([]);
    setStatusMessage("New list generated. Pick an operation and press Start.");
  }, [hardStopRun]);

  // ─── reset ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    hardStopRun();
    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setRunStatus("Idle");
    setStepCount(0);
    setStatusMessage("Reset. Pick an operation and press Start.");
  }, [hardStopRun, headIndex]);

  // ─── INSERT AT HEAD ─────────────────────────────────────────
  const runInsertAtHead = useCallback(async () => {
    const val = inputValue.trim() !== "" ? Number(inputValue) : getRandomValue();
    const stamp = Date.now();
    const newNode = { id: `${stamp}-new-${Math.floor(Math.random() * 1e6)}`, value: val, status: "newNode" };

    setStepCount(1);
    setStatusMessage(`Step 1: Create new node with value ${val}.`);
    setNodes((prev) => [...prev, newNode]);
    const newIdx = nodes.length;
    setNextLinks((prev) => [...prev, null]);
    setPrevLinks((prev) => [...prev, null]);
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, newNode: newIdx });

    if (!(await waitWithControl(speed))) return false;

    setStepCount(2);
    setStatusMessage(`Step 2: new→next = old head (${headIndex !== null ? nodes[headIndex]?.value : "null"}). old head→prev = new.`);
    setNextLinks((prev) => { const c = [...prev]; c[newIdx] = headIndex; return c; });
    if (headIndex !== null) {
      setPrevLinks((prev) => { const c = [...prev]; c[headIndex] = newIdx; return c; });
    }

    if (!(await waitWithControl(speed))) return false;

    setStepCount(3);
    setStatusMessage(`Step 3: Update head pointer to new node (${val}). new→prev = null. Done!`);
    setHeadIndex(newIdx);
    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: newIdx });
    setOperationHistory((prev) => [...prev, { type: "insertHead", value: val }]);
    return true;
  }, [inputValue, nodes, headIndex, speed, waitWithControl]);

  // ─── INSERT AT TAIL ─────────────────────────────────────────
  const runInsertAtTail = useCallback(async () => {
    const val = inputValue.trim() !== "" ? Number(inputValue) : getRandomValue();
    const stamp = Date.now();
    const newNode = { id: `${stamp}-new-${Math.floor(Math.random() * 1e6)}`, value: val, status: "newNode" };

    if (headIndex === null) {
      setNodes([newNode]);
      setNextLinks([null]);
      setPrevLinks([null]);
      setHeadIndex(0);
      setMarkers({ ...EMPTY_MARKERS, head: 0 });
      setStatusMessage(`Empty list. ${val} becomes the only node. Done!`);
      setOperationHistory((prev) => [...prev, { type: "insertTail", value: val }]);
      return true;
    }

    const newIdx = nodes.length;
    setNodes((prev) => [...prev, newNode]);
    setNextLinks((prev) => [...prev, null]);
    setPrevLinks((prev) => [...prev, null]);

    setStepCount(1);
    setStatusMessage(`Created new node (${val}). Traversing to tail...`);

    let current = headIndex;
    let localStep = 1;
    const workingLinks = [...nextLinks, null];

    while (workingLinks[current] !== null) {
      localStep += 1;
      setStepCount(localStep);
      setNodes((prev) =>
        prev.map((n, i) => ({
          ...n,
          status: i === current ? "current" : i === newIdx ? "newNode" : "default",
        }))
      );
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, newNode: newIdx });
      setStatusMessage(`Traversing: at node ${nodes[current]?.value}...`);
      if (!(await waitWithControl(speed))) return false;
      current = workingLinks[current];
    }

    localStep += 1;
    setStepCount(localStep);
    setStatusMessage(`Found tail (${nodes[current]?.value}). Linking: tail→next = new, new→prev = tail.`);
    setNodes((prev) =>
      prev.map((n, i) => ({
        ...n,
        status: i === current ? "highlight" : i === newIdx ? "newNode" : "default",
      }))
    );
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, newNode: newIdx });
    setNextLinks((prev) => { const c = [...prev]; c[current] = newIdx; return c; });
    setPrevLinks((prev) => { const c = [...prev]; c[newIdx] = current; return c; });

    if (!(await waitWithControl(speed))) return false;

    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setStatusMessage(`Inserted ${val} at tail. Done!`);
    setOperationHistory((prev) => [...prev, { type: "insertTail", value: val }]);
    return true;
  }, [inputValue, nodes, headIndex, nextLinks, speed, waitWithControl]);

  // ─── INSERT AT POSITION ─────────────────────────────────────
  const runInsertAtPosition = useCallback(async () => {
    const val = inputValue.trim() !== "" ? Number(inputValue) : getRandomValue();
    const pos = inputPosition.trim() !== "" ? parseInt(inputPosition, 10) : 0;
    const stamp = Date.now();
    const newNode = { id: `${stamp}-new-${Math.floor(Math.random() * 1e6)}`, value: val, status: "newNode" };

    if (pos === 0) {
      // Same as insert at head
      setNodes((prev) => [...prev, newNode]);
      const newIdx = nodes.length;
      setNextLinks((prev) => { const c = [...prev, headIndex]; return c; });
      setPrevLinks((prev) => { const c = [...prev, null]; return c; });
      if (headIndex !== null) {
        setPrevLinks((prev) => { const c = [...prev]; c[headIndex] = newIdx; return c; });
      }
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, newNode: newIdx });
      setStatusMessage(`Inserting ${val} at position 0 (new head)...`);
      if (!(await waitWithControl(speed))) return false;
      setHeadIndex(newIdx);
      setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: newIdx });
      setStatusMessage(`Inserted ${val} at position 0. Done!`);
      setOperationHistory((prev) => [...prev, { type: "insertPos", value: val, position: pos }]);
      return true;
    }

    // Traverse to pos-1
    let current = headIndex;
    let localStep = 0;
    const workingLinks = [...nextLinks];

    for (let i = 0; i < pos - 1 && current !== null; i++) {
      localStep += 1;
      setStepCount(localStep);
      setNodes((prev) => prev.map((n, idx) => ({ ...n, status: idx === current ? "current" : "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current });
      setStatusMessage(`Traversing to position ${pos - 1}: at node ${nodes[current]?.value} (step ${i + 1}).`);
      if (!(await waitWithControl(speed))) return false;
      current = workingLinks[current];
    }

    if (current === null) {
      setStatusMessage(`Position ${pos} is out of bounds. Operation cancelled.`);
      return false;
    }

    const newIdx = nodes.length;
    const nextOfCurrent = workingLinks[current];
    setNodes((prev) => [
      ...prev.map((n, idx) => ({
        ...n,
        status: idx === current ? "highlight" : idx === nextOfCurrent ? "highlight" : "default",
      })),
      newNode,
    ]);
    setNextLinks((prev) => { const c = [...prev, nextOfCurrent]; c[current] = newIdx; return c; });
    setPrevLinks((prev) => {
      const c = [...prev, current];
      if (nextOfCurrent !== null) c[nextOfCurrent] = newIdx;
      return c;
    });
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, newNode: newIdx });
    setStatusMessage(`Wiring 4 pointers: prev→next=new, new→prev=prev, new→next=next, next→prev=new.`);

    if (!(await waitWithControl(speed))) return false;

    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setStatusMessage(`Inserted ${val} at position ${pos}. 4 pointer updates complete! Done!`);
    setOperationHistory((prev) => [...prev, { type: "insertPos", value: val, position: pos }]);
    return true;
  }, [inputValue, inputPosition, nodes, headIndex, nextLinks, speed, waitWithControl]);

  // ─── DELETE FROM HEAD ───────────────────────────────────────
  const runDeleteFromHead = useCallback(async () => {
    if (headIndex === null) {
      setStatusMessage("List is empty. Nothing to delete.");
      return true;
    }

    const deletedValue = nodes[headIndex].value;
    setStepCount(1);
    setStatusMessage(`Step 1: Target head node (${deletedValue}) for deletion.`);
    setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "target" : "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, target: headIndex });

    if (!(await waitWithControl(speed))) return false;

    setStepCount(2);
    const newHead = nextLinks[headIndex];
    setStatusMessage(`Step 2: Move head to next node (${newHead !== null ? nodes[newHead]?.value : "null"}). Clear new head's prev pointer.`);
    setNodes((prev) => prev.map((n, i) => ({
      ...n, status: i === headIndex ? "fadeOut" : i === newHead ? "highlight" : "default",
    })));

    if (!(await waitWithControl(speed))) return false;

    // Rebuild arrays without the removed node
    const removedIdx = headIndex;
    const remapIdx = (idx) => {
      if (idx === null || idx === removedIdx) return null;
      return idx > removedIdx ? idx - 1 : idx;
    };

    const newNodes    = nodes.filter((_, i) => i !== removedIdx).map((n) => ({ ...n, status: "default" }));
    const newNextLinks = nextLinks.filter((_, i) => i !== removedIdx).map(remapIdx);
    const newPrevLinks = prevLinks.filter((_, i) => i !== removedIdx).map(remapIdx);
    const newHeadIdx  = remapIdx(newHead);

    setNodes(newNodes);
    setNextLinks(newNextLinks);
    setPrevLinks(newPrevLinks.map((v, i) => (i === newHeadIdx ? null : v)));
    setHeadIndex(newHeadIdx);
    setMarkers({ ...EMPTY_MARKERS, head: newHeadIdx });
    setStatusMessage(`Deleted head (${deletedValue}). New head→prev = null. Done!`);
    setOperationHistory((prev) => [...prev, { type: "deleteHead", value: deletedValue }]);
    return true;
  }, [headIndex, nodes, nextLinks, prevLinks, speed, waitWithControl]);

  // ─── DELETE FROM TAIL ───────────────────────────────────────
  const runDeleteFromTail = useCallback(async () => {
    if (headIndex === null) {
      setStatusMessage("List is empty. Nothing to delete.");
      return true;
    }

    if (nextLinks[headIndex] === null) {
      const val = nodes[headIndex].value;
      setStepCount(1);
      setStatusMessage(`Only one node (${val}). Marking for deletion...`);
      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "fadeOut" : "default" })));
      if (!(await waitWithControl(speed))) return false;
      setNodes([]); setNextLinks([]); setPrevLinks([]); setHeadIndex(null);
      setMarkers({ ...EMPTY_MARKERS });
      setStatusMessage(`Deleted tail (${val}). List is now empty. Done!`);
      setOperationHistory((prev) => [...prev, { type: "deleteTail", value: val }]);
      return true;
    }

    let current = headIndex;
    let localStep = 0;

    while (nextLinks[nextLinks[current]] !== null) {
      localStep += 1;
      setStepCount(localStep);
      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === current ? "current" : "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current });
      setStatusMessage(`Traversing: at ${nodes[current]?.value}. Looking for second-to-last.`);
      if (!(await waitWithControl(speed))) return false;
      current = nextLinks[current];
    }

    const tailIdx = nextLinks[current];
    const tailVal = nodes[tailIdx].value;
    setStatusMessage(`Found second-to-last: ${nodes[current]?.value}. Removing tail (${tailVal}) using prev pointer.`);
    setNodes((prev) => prev.map((n, i) => ({
      ...n, status: i === tailIdx ? "target" : i === current ? "highlight" : "default",
    })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, target: tailIdx });

    if (!(await waitWithControl(speed))) return false;

    setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === tailIdx ? "fadeOut" : "default" })));
    if (!(await waitWithControl(Math.max(120, Math.floor(speed * 0.6))))) return false;

    const remapIdx = (idx) => {
      if (idx === null || idx === tailIdx) return null;
      return idx > tailIdx ? idx - 1 : idx;
    };
    const newNodes     = nodes.filter((_, i) => i !== tailIdx).map((n) => ({ ...n, status: "default" }));
    const newNextLinks = nextLinks.filter((_, i) => i !== tailIdx).map(remapIdx);
    const newPrevLinks = prevLinks.filter((_, i) => i !== tailIdx).map(remapIdx);
    const newHeadIdx   = remapIdx(headIndex);

    setNodes(newNodes);
    setNextLinks(newNextLinks);
    setPrevLinks(newPrevLinks);
    setHeadIndex(newHeadIdx);
    setMarkers({ ...EMPTY_MARKERS, head: newHeadIdx });
    setStatusMessage(`Deleted tail (${tailVal}). Used prev pointer — no double-pointer trick needed! Done!`);
    setOperationHistory((prev) => [...prev, { type: "deleteTail", value: tailVal }]);
    return true;
  }, [headIndex, nodes, nextLinks, prevLinks, speed, waitWithControl]);

  // ─── DELETE BY VALUE ────────────────────────────────────────
  const runDeleteByValue = useCallback(async () => {
    const target = inputValue.trim() !== "" ? Number(inputValue) : null;
    if (target === null || isNaN(target)) {
      setStatusMessage("Please enter a value to delete.");
      return false;
    }
    if (headIndex === null) {
      setStatusMessage("List is empty. Nothing to delete.");
      return true;
    }

    // Check head
    if (nodes[headIndex].value === target) {
      setStepCount(1);
      setStatusMessage(`Head node matches target ${target}! Removing head...`);
      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "target" : "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, target: headIndex });
      if (!(await waitWithControl(speed))) return false;
      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "fadeOut" : "default" })));
      if (!(await waitWithControl(speed))) return false;

      const newHead = nextLinks[headIndex];
      const removedIdx = headIndex;
      const remapIdx = (idx) => {
        if (idx === null || idx === removedIdx) return null;
        return idx > removedIdx ? idx - 1 : idx;
      };
      const newNodes     = nodes.filter((_, i) => i !== removedIdx).map((n) => ({ ...n, status: "default" }));
      const newNextLinks = nextLinks.filter((_, i) => i !== removedIdx).map(remapIdx);
      const newPrevLinks = prevLinks.filter((_, i) => i !== removedIdx).map(remapIdx);
      const newHeadIdx   = remapIdx(newHead);
      setNodes(newNodes);
      setNextLinks(newNextLinks);
      setPrevLinks(newPrevLinks.map((v, i) => (i === newHeadIdx ? null : v)));
      setHeadIndex(newHeadIdx);
      setMarkers({ ...EMPTY_MARKERS, head: newHeadIdx });
      setStatusMessage(`Deleted ${target} (was head). Done!`);
      setOperationHistory((prev) => [...prev, { type: "deleteByValue", value: target }]);
      return true;
    }

    // Traverse to find target
    let current = headIndex;
    let localStep = 1;
    setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "current" : "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current: headIndex });
    setStatusMessage(`Searching for ${target}. Checking head (${nodes[headIndex]?.value})... not a match.`);
    if (!(await waitWithControl(speed))) return false;
    current = nextLinks[current];

    while (current !== null) {
      localStep += 1;
      setStepCount(localStep);

      if (nodes[current]?.value === target) {
        setStatusMessage(`Found ${target}! Using curr→prev — no second pointer needed.`);
        setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === current ? "target" : "default" })));
        setMarkers({ ...EMPTY_MARKERS, head: headIndex, target: current });
        if (!(await waitWithControl(speed))) return false;

        setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === current ? "fadeOut" : "default" })));
        if (!(await waitWithControl(speed))) return false;

        const targetIdx = current;
        const remapIdx = (idx) => {
          if (idx === null || idx === targetIdx) return null;
          return idx > targetIdx ? idx - 1 : idx;
        };
        const newNodes     = nodes.filter((_, i) => i !== targetIdx).map((n) => ({ ...n, status: "default" }));
        const newNextLinks = nextLinks.filter((_, i) => i !== targetIdx).map(remapIdx);
        const newPrevLinks = prevLinks.filter((_, i) => i !== targetIdx).map(remapIdx);
        const newHeadIdx   = remapIdx(headIndex);
        setNodes(newNodes);
        setNextLinks(newNextLinks);
        setPrevLinks(newPrevLinks);
        setHeadIndex(newHeadIdx);
        setMarkers({ ...EMPTY_MARKERS, head: newHeadIdx });
        setStatusMessage(`Deleted ${target}. Used curr→prev for O(1) bypass — DLL advantage! Done!`);
        setOperationHistory((prev) => [...prev, { type: "deleteByValue", value: target }]);
        return true;
      }

      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === current ? "current" : "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current });
      setStatusMessage(`Checking node ${nodes[current]?.value}... not ${target}. Moving forward.`);
      if (!(await waitWithControl(speed))) return false;
      current = nextLinks[current];
    }

    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setStatusMessage(`Value ${target} not found in the list.`);
    return true;
  }, [inputValue, headIndex, nodes, nextLinks, prevLinks, speed, waitWithControl]);

  // ─── Start / Pause / Resume ─────────────────────────────────
  const handleStart = useCallback(async () => {
    if (isRunning) return;
    stopSignal.current  = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setIsPaused(false);
    setRunStatus("Running");
    setStepCount(0);

    const runners = {
      insertHead:     runInsertAtHead,
      insertTail:     runInsertAtTail,
      insertPosition: runInsertAtPosition,
      deleteHead:     runDeleteFromHead,
      deleteTail:     runDeleteFromTail,
      deleteByValue:  runDeleteByValue,
    };
    const run = runners[selectedOperation];
    const completed = run ? await run() : false;

    if (stopSignal.current) return;
    setIsRunning(false);
    setIsPaused(false);
    setRunStatus(completed ? "Completed" : "Idle");
  }, [
    isRunning, selectedOperation,
    runInsertAtHead, runInsertAtTail, runInsertAtPosition,
    runDeleteFromHead, runDeleteFromTail, runDeleteByValue,
  ]);

  const handlePause = useCallback(() => {
    if (!isRunning || isPaused) return;
    pauseSignal.current = true;
    setIsPaused(true);
    setRunStatus("Paused");
  }, [isRunning, isPaused]);

  const handleResume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    pauseSignal.current = false;
    setIsPaused(false);
    setRunStatus("Running");
  }, [isRunning, isPaused]);

  // ─── Copy / Download ────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCodeSnippet);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch { setCopyState("idle"); }
  }, [activeCodeSnippet]);

  const handleDownload = useCallback(() => {
    const extMap = { "C++": ".cpp", Python: ".py", Java: ".java", JavaScript: ".js" };
    const ext = extMap[selectedLanguage] ?? ".txt";
    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DLL_${activeOp.title.replace(/\s+/g, "")}${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, activeOp.title, selectedLanguage]);

  // ─── Hotkeys — uses the correct single-handler signature ────
  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    const isHotkey = e.code === "Space" || key === "r" || key === "n";
    if (!isHotkey) return;
    if (e.repeat) { e.preventDefault(); return; }

    if (e.code === "Space") {
      e.preventDefault();
      if (!isRunning) handleStart();
      else if (isPaused) handleResume();
      else handlePause();
      return;
    }
    if (key === "r") { e.preventDefault(); handleReset(); return; }
    if (key === "n") { e.preventDefault(); generateNewList(listSize); }
  });

  const needsValue    = ["insertHead","insertTail","insertPosition","deleteByValue"].includes(selectedOperation);
  const needsPosition = selectedOperation === "insertPosition";

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.14),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ── Hero ── */}
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
                Doubly Linked List
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeOp.type === "insertion" ? "border-green-400/25 bg-green-500/10 text-green-200" : "border-rose-400/25 bg-rose-500/10 text-rose-200"}`}>
                {activeOp.type === "insertion" ? "Insertion" : "Deletion"}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>
                {runStatus}
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              {activeOp.title}
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">{activeOp.description}</p>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Progress</span><span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <MotionDiv animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-500" />
              </div>
            </div>

            {/* Learner Tip */}
            <div className="mt-4 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-3">
              <div className="flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0 text-purple-300" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                    💡 DLL vs SLL Insight
                  </p>
                  <p className="text-xs text-purple-100/80">{activeOp.learnerTip}</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { label: "Nodes",  val: listTraversal.length, color: "text-white"    },
                { label: "Time",   val: activeOp.complexity,  color: "text-cyan-200" },
                { label: "Space",  val: activeOp.space,       color: "text-blue-100" },
                { label: "Steps",  val: stepCount,            color: "text-emerald-200" },
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
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-purple-300" /> Runtime Snapshot
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Step</p>
                <p className="text-sm font-semibold text-white">{statusMessage}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Head Value</p>
                <p className="text-lg font-bold text-purple-100">
                  {headIndex === null ? "null" : nodes[headIndex]?.value}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Delay</p>
                <p className="text-lg font-bold text-blue-100">{speed}ms</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Pointer Type</p>
                <p className="text-sm font-bold text-cyan-100">Bidirectional (prev + next)</p>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* ── Controls + Visualization ── */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[370px_minmax(0,1fr)] xl:items-stretch">

        {/* ── Sidebar ── */}
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Binary size={18} className="text-purple-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Controls</h2>
          </div>
          <div className="flex flex-1 flex-col gap-4">

            {/* Operation selector */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">Operation</label>
              <select
                value={selectedOperation}
                disabled={isRunning}
                onChange={(e) => { setSelectedOperation(e.target.value); handleReset(); }}
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none"
              >
                <optgroup label="Insertion">
                  <option value="insertHead">Insert at Head</option>
                  <option value="insertTail">Insert at Tail</option>
                  <option value="insertPosition">Insert at Position</option>
                </optgroup>
                <optgroup label="Deletion">
                  <option value="deleteHead">Delete from Head</option>
                  <option value="deleteTail">Delete from Tail</option>
                  <option value="deleteByValue">Delete by Value</option>
                </optgroup>
              </select>
            </div>

            {/* Value input */}
            {needsValue && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 block text-xs uppercase text-slate-400">
                  {selectedOperation === "deleteByValue" ? "Value to Delete" : "Node Value"}
                  {selectedOperation !== "deleteByValue" && (
                    <span className="ml-2 text-slate-500 normal-case">(random if empty)</span>
                  )}
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedOperation === "deleteByValue" ? "Enter value to delete" : "e.g. 42"}
                  disabled={isRunning}
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>
            )}

            {/* Position input */}
            {needsPosition && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 block text-xs uppercase text-slate-400">
                  Position <span className="normal-case text-slate-500">(0-indexed)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={inputPosition}
                  onChange={(e) => setInputPosition(e.target.value)}
                  placeholder="0 = head"
                  disabled={isRunning}
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>
            )}

            {/* Size slider */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                <span>Initial Size</span><span>{listSize}</span>
              </label>
              <input
                type="range" min="3" max="10" value={listSize}
                disabled={isRunning}
                onChange={(e) => { setListSize(Number(e.target.value)); generateNewList(Number(e.target.value)); }}
                className="w-full accent-purple-400"
              />
            </div>

            {/* Speed slider */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                <span>Delay</span><span>{speed}ms</span>
              </label>
              <input
                type="range" min="80" max="900" value={speed}
                disabled={isRunning}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-blue-400"
              />
            </div>

            {/* Reset / Shuffle */}
            <div className="grid grid-cols-2 gap-2">
              <MotionButton whileTap={{ scale: 0.95 }} onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white">
                <RotateCcw size={16} /> Reset
              </MotionButton>
              <MotionButton whileTap={{ scale: 0.95 }} onClick={() => generateNewList(listSize)}
                className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-500/10 py-2.5 text-sm font-bold text-purple-100">
                <Shuffle size={16} /> Shuffle
              </MotionButton>
            </div>

            {/* Start / Pause / Resume */}
            <MotionButton
              whileHover={{ scale: 1.02 }}
              onClick={isRunning ? (isPaused ? handleResume : handlePause) : handleStart}
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg ${
                isRunning
                  ? isPaused ? "bg-emerald-600" : "bg-amber-500 text-slate-900"
                  : "bg-gradient-to-r from-purple-600 to-blue-500"
              }`}
            >
              {isRunning
                ? isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" />}
              {isRunning ? (isPaused ? "Resume" : "Pause") : "Start"}
            </MotionButton>
            <HotkeysHint className="mt-1" />
          </div>
        </aside>

        {/* ── Visualization ── */}
        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Node Graph — Doubly Linked (⇌)
            </p>
          </div>

          {/* Node display */}
          <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/45">
            <div ref={nodeViewportRef} className="ll-scrollbar overflow-x-auto px-4 pb-4 pt-8">
              <div className="flex items-center gap-1 min-w-max">
                <span className="text-[10px] font-bold text-slate-500">null</span>
                <span className="mx-1 text-slate-600 font-bold">⇌</span>

                {listTraversal.length === 0 && (
                  <span className="ml-2 text-sm italic text-slate-500">
                    List is empty — insert a node to begin
                  </span>
                )}

                {listTraversal.map((nodeIdx, orderIndex) => {
                  const node = nodes[nodeIdx];
                  if (!node) return null;
                  const activeMarkerKeys = Object.entries(markers)
                    .filter(([, v]) => v === nodeIdx)
                    .map(([k]) => k);
                  const statusCls = NODE_STATUS_CLASSES[node.status] ?? NODE_STATUS_CLASSES.default;

                  return (
                    <div key={node.id} className="flex items-center gap-1">
                      <MotionDiv
                        layout
                        initial={{ opacity: 0, scale: 0.7, y: -10 }}
                        animate={{
                          opacity: node.status === "fadeOut" ? 0 : 1,
                          scale: node.status === "newNode" ? 1.08 : node.status === "fadeOut" ? 0.7 : 1,
                          y: 0,
                        }}
                        transition={{ type: "spring", stiffness: 280, damping: 22 }}
                        className={`relative mt-2 flex flex-col items-center rounded-2xl border-2 px-3 py-2 min-w-[88px] text-center shadow-lg transition-colors ${statusCls}`}
                      >
                        {/* Marker labels above node */}
                        {activeMarkerKeys.length > 0 && (
                          <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 gap-1">
                            {activeMarkerKeys.map((k) => (
                              <span key={k} className="rounded-full border border-amber-400/40 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-200 whitespace-nowrap">
                                {markerLabels[k] ?? k}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* prev pointer label */}
                        <p className="text-[8px] font-semibold uppercase text-purple-400/80 mb-1">
                          ← {prevLinks[nodeIdx] !== null ? (nodes[prevLinks[nodeIdx]]?.value ?? "?") : "null"}
                        </p>
                        {/* node index label */}
                        <p className="text-[9px] uppercase tracking-wider text-slate-300/70">
                          Node {orderIndex + 1}
                        </p>
                        {/* node value */}
                        <p className="mt-0.5 text-xl font-bold">{node.value}</p>
                        {/* next pointer label */}
                        <p className="text-[8px] font-semibold uppercase text-cyan-400/80 mt-1">
                          {nextLinks[nodeIdx] !== null ? (nodes[nextLinks[nodeIdx]]?.value ?? "?") : "null"} →
                        </p>
                      </MotionDiv>

                      {orderIndex < listTraversal.length - 1 && (
                        <span className="mx-1 text-sm font-bold text-slate-500 select-none">⇌</span>
                      )}
                    </div>
                  );
                })}

                <span className="mx-1 text-slate-600 font-bold">⇌</span>
                <span className="text-[10px] font-bold text-slate-500">null</span>
              </div>
            </div>
          </div>

          {/* Forward Traversal */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Forward Traversal (head → tail)
            </p>
            <div className="ll-scrollbar mt-3 flex overflow-x-auto gap-2 pb-1 text-sm">
              {listTraversal.length === 0
                ? <span className="text-slate-400">null</span>
                : (
                  <>
                    {listTraversal.map((idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="rounded-lg border border-purple-400/35 bg-purple-500/10 px-2.5 py-1 font-semibold text-purple-100">
                          {nodes[idx]?.value}
                        </span>
                        <span className="text-slate-500">→</span>
                      </div>
                    ))}
                    <span className="text-slate-500">null</span>
                  </>
                )}
            </div>
          </div>

          {/* Backward Traversal — DLL exclusive */}
          <div className="mt-3 rounded-2xl border border-purple-400/15 bg-purple-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Backward Traversal (tail → head)
              <span className="ml-2 text-purple-400">← DLL Exclusive!</span>
            </p>
            <div className="ll-scrollbar mt-3 flex overflow-x-auto gap-2 pb-1 text-sm">
              {listTraversal.length === 0
                ? <span className="text-slate-400">null</span>
                : (
                  <>
                    {[...listTraversal].reverse().map((idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-100">
                          {nodes[idx]?.value}
                        </span>
                        <span className="text-slate-500">←</span>
                      </div>
                    ))}
                    <span className="text-slate-500">null</span>
                  </>
                )}
            </div>
          </div>

          {/* Operation History */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Operation History</p>
            <div className="ll-scrollbar mt-3 max-h-[110px] overflow-y-auto space-y-1.5">
              {operationHistory.length === 0
                ? <p className="text-xs text-slate-500">No operations yet.</p>
                : [...operationHistory].reverse().map((op, idx) => (
                  <div key={idx} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${op.type.startsWith("insert") ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"}`}>
                    {op.type.startsWith("insert") ? <Plus size={12} /> : <Minus size={12} />}
                    <span className="font-semibold capitalize">{op.type.replace(/([A-Z])/g, " $1").trim()}</span>
                    {op.value !== undefined && <span>val: <b>{op.value}</b></span>}
                    {op.position !== undefined && <span className="text-slate-400">@ pos {op.position}</span>}
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Code Panel ── */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/algorithms")}
              className="group flex items-center gap-2 rounded-lg bg-white/5 pr-4 pl-3 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white border border-white/10"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Back to Algorithms
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <Code2 size={20} className="text-purple-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10">
              {copyState === "copied" ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10">
              <Download size={14} /> Download
            </button>
          </div>
        </div>
        <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm">
          <pre>
            <code>
              {activeCodeSnippet.split("\n").map((line, i) => (
                <div key={i} className="flex rounded px-2 hover:bg-white/5">
                  <span className="w-8 shrink-0 select-none pr-4 text-right text-xs text-slate-600">{i + 1}</span>
                  <span className="text-slate-300">{renderHighlightedCode(line)}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}