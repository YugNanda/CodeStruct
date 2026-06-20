import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Binary,
  CheckCheck,
  Clock3,
  Code2,
  Copy,
  Download,
  Pause,
  Play,
  Plus,
  Minus,
  RotateCcw,
  Shuffle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Trash2,
  ListPlus,
  ListMinus,
  Hash,
} from "lucide-react";

import {
  insertAtHeadCPP, insertAtHeadPython, insertAtHeadJava, insertAtHeadJS,
  insertAtTailCPP, insertAtTailPython, insertAtTailJava, insertAtTailJS,
  insertAtPositionCPP, insertAtPositionPython, insertAtPositionJava, insertAtPositionJS,
  deleteFromHeadCPP, deleteFromHeadPython, deleteFromHeadJava, deleteFromHeadJS,
  deleteFromTailCPP, deleteFromTailPython, deleteFromTailJava, deleteFromTailJS,
  deleteByValueCPP, deleteByValuePython, deleteByValueJava, deleteByValueJS,
} from "../algorithms/linkedListInsertDelete";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import { shouldSkipHotkeyTarget, useStableHotkeys } from "../hooks/useStableHotkeys";

// ─── constants ──────────────────────────────────────────────

const EMPTY_MARKERS = {
  head: null,
  current: null,
  prev: null,
  next: null,
  newNode: null,
  target: null,
};

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Paused: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const markerLabels = {
  head: "head",
  current: "curr",
  prev: "prev",
  next: "next",
  newNode: "new",
  target: "target",
};

const operationsMeta = {
  insertHead: {
    title: "Insert at Head",
    description: "Create a new node and make it the head of the list. The new node's next pointer points to the old head.",
    complexity: "O(1)",
    space: "O(1)",
    type: "insertion",
    cppSnippet: insertAtHeadCPP, pythonSnippet: insertAtHeadPython, javaSnippet: insertAtHeadJava, jsSnippet: insertAtHeadJS,
  },
  insertTail: {
    title: "Insert at Tail",
    description: "Traverse to the last node and link its next pointer to the new node.",
    complexity: "O(n)",
    space: "O(1)",
    type: "insertion",
    cppSnippet: insertAtTailCPP, pythonSnippet: insertAtTailPython, javaSnippet: insertAtTailJava, jsSnippet: insertAtTailJS,
  },
  insertPosition: {
    title: "Insert at Position",
    description: "Traverse to the desired position and redirect pointers: prev.next → newNode → current.",
    complexity: "O(n)",
    space: "O(1)",
    type: "insertion",
    cppSnippet: insertAtPositionCPP, pythonSnippet: insertAtPositionPython, javaSnippet: insertAtPositionJava, jsSnippet: insertAtPositionJS,
  },
  deleteHead: {
    title: "Delete from Head",
    description: "Move the head pointer to head.next. The old head is removed and fades out.",
    complexity: "O(1)",
    space: "O(1)",
    type: "deletion",
    cppSnippet: deleteFromHeadCPP, pythonSnippet: deleteFromHeadPython, javaSnippet: deleteFromHeadJava, jsSnippet: deleteFromHeadJS,
  },
  deleteTail: {
    title: "Delete from Tail",
    description: "Traverse to the second-last node, set its next to null. The last node fades out.",
    complexity: "O(n)",
    space: "O(1)",
    type: "deletion",
    cppSnippet: deleteFromTailCPP, pythonSnippet: deleteFromTailPython, javaSnippet: deleteFromTailJava, jsSnippet: deleteFromTailJS,
  },
  deleteByValue: {
    title: "Delete by Value",
    description: "Search for the target value, highlight the match, then redirect prev.next → current.next to remove it.",
    complexity: "O(n)",
    space: "O(1)",
    type: "deletion",
    cppSnippet: deleteByValueCPP, pythonSnippet: deleteByValuePython, javaSnippet: deleteByValueJava, jsSnippet: deleteByValueJS,
  },
};

const nodeStatusClassMap = {
  default: "border-blue-400/30 bg-blue-500/10 text-blue-100",
  current: "border-amber-400/45 bg-amber-500/20 text-amber-100",
  highlight: "border-emerald-400/45 bg-emerald-500/20 text-emerald-100",
  newNode: "border-green-400/45 bg-green-500/20 text-green-100",
  target: "border-rose-400/45 bg-rose-500/20 text-rose-100",
  found: "border-fuchsia-400/45 bg-fuchsia-500/20 text-fuchsia-100",
  fadeOut: "border-red-400/45 bg-red-500/20 text-red-100 opacity-40",
};

// ─── helpers ────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomValue() {
  return Math.floor(Math.random() * 90) + 10;
}

function getNodeStatusClass(status) {
  return nodeStatusClassMap[status] ?? nodeStatusClassMap.default;
}

function createLinkedListState(size) {
  const stamp = Date.now();
  const nodes = Array.from({ length: size }, (_, index) => ({
    id: `${stamp}-${index}-${Math.floor(Math.random() * 1000000)}`,
    value: getRandomValue(),
    status: "default",
  }));
  const nextLinks = Array.from({ length: size }, (_, index) =>
    index + 1 < size ? index + 1 : null,
  );
  return { nodes, nextLinks, headIndex: size > 0 ? 0 : null };
}

function getFocusPointer(markers, nodes) {
  const priority = ["newNode", "target", "current", "head", "prev", "next"];
  for (const key of priority) {
    const idx = markers[key];
    if (idx !== null && idx !== undefined && nodes[idx]) {
      return { key, label: markerLabels[key], index: idx, value: nodes[idx].value };
    }
  }
  return null;
}

// ─── component ──────────────────────────────────────────────

export default function SinglyLinkedListPage() {
  const navigate = useNavigate();
  const initialGraph = useMemo(() => createLinkedListState(6), []);

  const [nodes, setNodes] = useState(initialGraph.nodes);
  const [nextLinks, setNextLinks] = useState(initialGraph.nextLinks);
  const [headIndex, setHeadIndex] = useState(initialGraph.headIndex);
  const [markers, setMarkers] = useState({ ...EMPTY_MARKERS, head: initialGraph.headIndex });
  const [listSize, setListSize] = useState(6);
  const [speed, setSpeed] = useState(350);
  const [selectedOperation, setSelectedOperation] = useState("insertHead");
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Pick an operation and press Start.");
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");

  // Input fields for operations
  const [inputValue, setInputValue] = useState("");
  const [inputPosition, setInputPosition] = useState("");

  // Operation history log
  const [operationHistory, setOperationHistory] = useState([]);

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);
  const nodeViewportRef = useRef(null);
  const nodeItemRefs = useRef({});

  const MotionSection = motion.section;
  const MotionButton = motion.button;
  const MotionDiv = motion.div;

  const activeOp = operationsMeta[selectedOperation];
  useDocumentTitle(`SLL – ${activeOp.title}`);

  const activeCodeSnippet = useMemo(() => {
    if (selectedLanguage === "C++") return activeOp.cppSnippet;
    if (selectedLanguage === "Python") return activeOp.pythonSnippet;
    if (selectedLanguage === "Java") return activeOp.javaSnippet;
    return activeOp.jsSnippet;
  }, [selectedLanguage, activeOp]);

  const progress = useMemo(() =>
    runStatus === "Completed" ? 100
      : nodes.length === 0 ? 0
        : Math.min(Math.round((stepCount / Math.max(nodes.length, 1)) * 100), 100),
    [runStatus, stepCount, nodes.length],
  );

  // ─── async control helpers ────────────────────────────────

  const waitWithControl = useCallback(async (durationMs) => {
    let elapsed = 0;
    while (elapsed < durationMs) {
      if (stopSignal.current) return false;
      while (pauseSignal.current) {
        if (stopSignal.current) return false;
        await sleep(80);
      }
      const chunk = Math.min(40, durationMs - elapsed);
      await sleep(chunk);
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

  const resetNodeHighlights = useCallback(() => {
    setNodes((cur) => cur.map((n) => ({ ...n, status: "default" })));
  }, []);

  const generateNewList = useCallback((size) => {
    hardStopRun();
    const g = createLinkedListState(size);
    setNodes(g.nodes);
    setNextLinks(g.nextLinks);
    setHeadIndex(g.headIndex);
    setMarkers({ ...EMPTY_MARKERS, head: g.headIndex });
    setRunStatus("Idle");
    setStepCount(0);
    setOperationHistory([]);
    setStatusMessage("New linked list generated.");
  }, [hardStopRun]);

  const handleReset = useCallback(() => {
    hardStopRun();
    resetNodeHighlights();
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setRunStatus("Idle");
    setStepCount(0);
    setStatusMessage("Pointers and highlights reset.");
  }, [hardStopRun, headIndex, resetNodeHighlights]);

  // ─── traversal helpers ────────────────────────────────────

  const listTraversal = useMemo(() => {
    if (headIndex === null) return { order: [], hasCycle: false };
    const visited = new Set();
    const order = [];
    let cursor = headIndex;
    while (cursor !== null && !visited.has(cursor)) {
      order.push(cursor);
      visited.add(cursor);
      cursor = nextLinks[cursor];
    }
    return { order, hasCycle: cursor !== null };
  }, [headIndex, nextLinks]);

  const nodeRenderOrder = useMemo(() => {
    if (nodes.length === 0) return [];
    if (headIndex === null) return nodes.map((_, i) => i);
    if (listTraversal.order.length === nodes.length) return listTraversal.order;
    return listTraversal.order;
  }, [headIndex, listTraversal.order, nodes]);

  // ─── INSERTION ALGORITHMS ─────────────────────────────────

  const runInsertAtHead = useCallback(async () => {
    const val = inputValue.trim() !== "" ? Number(inputValue) : getRandomValue();
    const stamp = Date.now();
    const newNode = { id: `${stamp}-new-${Math.floor(Math.random() * 1e6)}`, value: val, status: "newNode" };

    setStepCount(1);
    setStatusMessage(`Creating new node with value ${val}...`);
    setNodes((prev) => [...prev, newNode]);
    const newIdx = nodes.length;
    setNextLinks((prev) => [...prev, null]);
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, newNode: newIdx });

    if (!(await waitWithControl(speed))) return false;

    setStepCount(2);
    setStatusMessage(`Pointing new node's next to old head (${headIndex !== null ? nodes[headIndex]?.value : "null"}).`);
    setNextLinks((prev) => { const c = [...prev]; c[newIdx] = headIndex; return c; });

    if (!(await waitWithControl(speed))) return false;

    setStepCount(3);
    setStatusMessage(`Updating head to the new node (${val}). Insertion complete!`);
    setHeadIndex(newIdx);
    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: newIdx });

    setOperationHistory((prev) => [...prev, { type: "insertHead", value: val }]);
    return true;
  }, [inputValue, nodes, headIndex, speed, waitWithControl]);

  const runInsertAtTail = useCallback(async () => {
    const val = inputValue.trim() !== "" ? Number(inputValue) : getRandomValue();
    const stamp = Date.now();
    const newNode = { id: `${stamp}-new-${Math.floor(Math.random() * 1e6)}`, value: val, status: "newNode" };

    // Append new node to the array
    const newIdx = nodes.length;
    setNodes((prev) => [...prev, newNode]);
    setNextLinks((prev) => [...prev, null]);

    setStepCount(1);
    setStatusMessage(`Created new node with value ${val}. Traversing to tail...`);

    if (headIndex === null) {
      setHeadIndex(newIdx);
      setMarkers({ ...EMPTY_MARKERS, head: newIdx });
      setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
      setStatusMessage(`List was empty. New node (${val}) is now the head.`);
      setOperationHistory((prev) => [...prev, { type: "insertTail", value: val }]);
      return true;
    }

    let current = headIndex;
    let localStep = 1;
    const workingLinks = [...nextLinks, null]; // include new node's link

    while (workingLinks[current] !== null) {
      localStep += 1;
      setStepCount(localStep);
      setNodes((prev) => prev.map((n, i) => ({
        ...n, status: i === current ? "current" : i === newIdx ? "newNode" : "default"
      })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, newNode: newIdx });
      setStatusMessage(`Traversing: visiting node ${nodes[current]?.value}...`);

      if (!(await waitWithControl(speed))) return false;
      current = workingLinks[current];
    }

    localStep += 1;
    setStepCount(localStep);
    setStatusMessage(`Found tail node (${nodes[current]?.value}). Linking to new node (${val}).`);
    setNodes((prev) => prev.map((n, i) => ({
      ...n, status: i === current ? "highlight" : i === newIdx ? "newNode" : "default"
    })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, newNode: newIdx });

    if (!(await waitWithControl(speed))) return false;

    setNextLinks((prev) => { const c = [...prev]; c[current] = newIdx; return c; });
    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setStatusMessage(`Inserted ${val} at tail. Done!`);

    setOperationHistory((prev) => [...prev, { type: "insertTail", value: val }]);
    return true;
  }, [inputValue, nodes, headIndex, nextLinks, speed, waitWithControl]);

  const runInsertAtPosition = useCallback(async () => {
    const val = inputValue.trim() !== "" ? Number(inputValue) : getRandomValue();
    const pos = inputPosition.trim() !== "" ? Number(inputPosition) : 0;

    if (pos < 0 || pos > nodes.length) {
      setStatusMessage(`Position ${pos} is out of bounds (0 - ${nodes.length}).`);
      return true;
    }

    const stamp = Date.now();
    const newNode = { id: `${stamp}-new-${Math.floor(Math.random() * 1e6)}`, value: val, status: "newNode" };
    const newIdx = nodes.length;
    setNodes((prev) => [...prev, newNode]);
    setNextLinks((prev) => [...prev, null]);

    if (pos === 0) {
      setStepCount(1);
      setStatusMessage(`Inserting ${val} at position 0 (new head).`);
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, newNode: newIdx });

      if (!(await waitWithControl(speed))) return false;

      setNextLinks((prev) => { const c = [...prev]; c[newIdx] = headIndex; return c; });
      setHeadIndex(newIdx);
      setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: newIdx });
      setStatusMessage(`Inserted ${val} at position 0. Done!`);
      setOperationHistory((prev) => [...prev, { type: "insertPos", value: val, position: pos }]);
      return true;
    }

    let current = headIndex;
    let localStep = 0;
    const workingLinks = [...nextLinks, null];

    for (let i = 0; i < pos - 1 && current !== null; i++) {
      localStep += 1;
      setStepCount(localStep);
      setNodes((prev) => prev.map((n, idx) => ({
        ...n, status: idx === current ? "current" : idx === newIdx ? "newNode" : "default"
      })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, newNode: newIdx });
      setStatusMessage(`Traversing to position ${pos - 1}: at node ${nodes[current]?.value} (step ${i + 1}).`);

      if (!(await waitWithControl(speed))) return false;
      current = workingLinks[current];
    }

    if (current === null) {
      setStatusMessage(`Could not reach position ${pos}. Out of bounds.`);
      return true;
    }

    localStep += 1;
    setStepCount(localStep);
    setStatusMessage(`Found insertion point after node ${nodes[current]?.value}. Redirecting pointers...`);
    setNodes((prev) => prev.map((n, idx) => ({
      ...n, status: idx === current ? "highlight" : idx === newIdx ? "newNode" : "default"
    })));

    if (!(await waitWithControl(speed))) return false;

    const nextOfCurrent = workingLinks[current];
    setNextLinks((prev) => {
      const c = [...prev];
      c[newIdx] = nextOfCurrent;
      c[current] = newIdx;
      return c;
    });

    setNodes((prev) => prev.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setStatusMessage(`Inserted ${val} at position ${pos}. prev.next → new(${val}) → next. Done!`);
    setOperationHistory((prev) => [...prev, { type: "insertPos", value: val, position: pos }]);
    return true;
  }, [inputValue, inputPosition, nodes, headIndex, nextLinks, speed, waitWithControl]);

  // ─── DELETION ALGORITHMS ──────────────────────────────────

  const runDeleteFromHead = useCallback(async () => {
    if (headIndex === null) {
      setStatusMessage("List is empty. Nothing to delete.");
      return true;
    }

    const deletedValue = nodes[headIndex].value;
    setStepCount(1);
    setStatusMessage(`Highlighting head node (${deletedValue}) for deletion...`);
    setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "target" : "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, target: headIndex });

    if (!(await waitWithControl(speed))) return false;

    setStepCount(2);
    const newHead = nextLinks[headIndex];
    setStatusMessage(`Moving head to next node (${newHead !== null ? nodes[newHead]?.value : "null"}). Old head fades out...`);
    setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "fadeOut" : "default" })));

    if (!(await waitWithControl(speed))) return false;

    // Actually remove the node
    const oldHeadIdx = headIndex;
    const indexMap = {};
    let newI = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (i === oldHeadIdx) continue;
      indexMap[i] = newI;
      newI++;
    }

    const newNodes = nodes.filter((_, i) => i !== oldHeadIdx).map((n) => ({ ...n, status: "default" }));
    const newLinks = [];
    for (let i = 0; i < nodes.length; i++) {
      if (i === oldHeadIdx) continue;
      const oldNext = nextLinks[i];
      newLinks.push(oldNext === null || oldNext === oldHeadIdx ? null : (indexMap[oldNext] ?? null));
    }

    setNodes(newNodes);
    setNextLinks(newLinks);
    setHeadIndex(newHead !== null ? (indexMap[newHead] ?? null) : null);
    setMarkers({ ...EMPTY_MARKERS, head: newHead !== null ? (indexMap[newHead] ?? null) : null });
    setStatusMessage(`Deleted ${deletedValue} from head. Done!`);

    setOperationHistory((prev) => [...prev, { type: "deleteHead", value: deletedValue }]);
    return true;
  }, [headIndex, nodes, nextLinks, speed, waitWithControl]);

  const runDeleteFromTail = useCallback(async () => {
    if (headIndex === null) {
      setStatusMessage("List is empty. Nothing to delete.");
      return true;
    }

    if (nextLinks[headIndex] === null) {
      // Only one node
      const val = nodes[headIndex].value;
      setStepCount(1);
      setStatusMessage(`Only one node (${val}). Marking for deletion...`);
      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "fadeOut" : "default" })));

      if (!(await waitWithControl(speed))) return false;

      setNodes([]);
      setNextLinks([]);
      setHeadIndex(null);
      setMarkers({ ...EMPTY_MARKERS });
      setStatusMessage(`Deleted ${val}. List is now empty.`);
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
      setStatusMessage(`Traversing to second-last: at node ${nodes[current]?.value}...`);

      if (!(await waitWithControl(speed))) return false;
      current = nextLinks[current];
    }

    const tailIdx = nextLinks[current];
    const tailVal = nodes[tailIdx].value;

    localStep += 1;
    setStepCount(localStep);
    setStatusMessage(`Found second-last node (${nodes[current]?.value}). Tail (${tailVal}) will be removed.`);
    setNodes((prev) => prev.map((n, i) => ({
      ...n, status: i === current ? "highlight" : i === tailIdx ? "target" : "default"
    })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, target: tailIdx });

    if (!(await waitWithControl(speed))) return false;

    setNodes((prev) => prev.map((n, i) => ({
      ...n, status: i === tailIdx ? "fadeOut" : "default"
    })));
    setStatusMessage(`Setting second-last.next = null. Tail fades out...`);

    if (!(await waitWithControl(speed))) return false;

    // Remove tail
    const indexMap = {};
    let newI = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (i === tailIdx) continue;
      indexMap[i] = newI;
      newI++;
    }

    const newNodes = nodes.filter((_, i) => i !== tailIdx).map((n) => ({ ...n, status: "default" }));
    const newLinks = [];
    for (let i = 0; i < nodes.length; i++) {
      if (i === tailIdx) continue;
      const oldNext = nextLinks[i];
      newLinks.push(oldNext === null || oldNext === tailIdx ? null : (indexMap[oldNext] ?? null));
    }

    setNodes(newNodes);
    setNextLinks(newLinks);
    setHeadIndex(indexMap[headIndex] ?? null);
    setMarkers({ ...EMPTY_MARKERS, head: indexMap[headIndex] ?? null });
    setStatusMessage(`Deleted ${tailVal} from tail. Done!`);

    setOperationHistory((prev) => [...prev, { type: "deleteTail", value: tailVal }]);
    return true;
  }, [headIndex, nodes, nextLinks, speed, waitWithControl]);

  const runDeleteByValue = useCallback(async () => {
    const target = inputValue.trim() !== "" ? Number(inputValue) : null;
    if (target === null || isNaN(target)) {
      setStatusMessage("Please enter a value to delete.");
      return true;
    }

    if (headIndex === null) {
      setStatusMessage("List is empty. Nothing to delete.");
      return true;
    }

    // Check if head is the target
    if (nodes[headIndex].value === target) {
      setStepCount(1);
      setStatusMessage(`Head node matches target ${target}! Removing...`);
      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "found" : "default" })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, target: headIndex });

      if (!(await waitWithControl(speed))) return false;

      setNodes((prev) => prev.map((n, i) => ({ ...n, status: i === headIndex ? "fadeOut" : "default" })));

      if (!(await waitWithControl(speed))) return false;

      const oldIdx = headIndex;
      const newHead = nextLinks[headIndex];
      const indexMap = {};
      let newI = 0;
      for (let i = 0; i < nodes.length; i++) {
        if (i === oldIdx) continue;
        indexMap[i] = newI; newI++;
      }
      const newNodes = nodes.filter((_, i) => i !== oldIdx).map((n) => ({ ...n, status: "default" }));
      const newLinks = [];
      for (let i = 0; i < nodes.length; i++) {
        if (i === oldIdx) continue;
        const oldNext = nextLinks[i];
        newLinks.push(oldNext === null || oldNext === oldIdx ? null : (indexMap[oldNext] ?? null));
      }
      setNodes(newNodes);
      setNextLinks(newLinks);
      setHeadIndex(newHead !== null ? (indexMap[newHead] ?? null) : null);
      setMarkers({ ...EMPTY_MARKERS, head: newHead !== null ? (indexMap[newHead] ?? null) : null });
      setStatusMessage(`Deleted ${target}. Done!`);
      setOperationHistory((prev) => [...prev, { type: "deleteByValue", value: target }]);
      return true;
    }

    // Traverse to find
    let prev = headIndex;
    let current = nextLinks[headIndex];
    let localStep = 1;

    setNodes((p) => p.map((n, i) => ({ ...n, status: i === headIndex ? "current" : "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, current: headIndex });
    setStatusMessage(`Searching for value ${target}. Checking head (${nodes[headIndex]?.value})... not a match.`);

    if (!(await waitWithControl(speed))) return false;

    while (current !== null) {
      localStep += 1;
      setStepCount(localStep);

      if (nodes[current]?.value === target) {
        setStatusMessage(`Found ${target} at node ${current + 1}! Highlighting match...`);
        setNodes((p) => p.map((n, i) => ({
          ...n, status: i === current ? "found" : i === prev ? "highlight" : "default"
        })));
        setMarkers({ ...EMPTY_MARKERS, head: headIndex, prev, target: current });

        if (!(await waitWithControl(speed))) return false;

        setStatusMessage(`Redirecting prev(${nodes[prev]?.value}).next → current.next. Target fades out...`);
        setNodes((p) => p.map((n, i) => ({ ...n, status: i === current ? "fadeOut" : "default" })));

        if (!(await waitWithControl(speed))) return false;

        const targetIdx = current;
        const indexMap = {};
        let newI = 0;
        for (let i = 0; i < nodes.length; i++) {
          if (i === targetIdx) continue;
          indexMap[i] = newI; newI++;
        }
        const newNodes = nodes.filter((_, i) => i !== targetIdx).map((n) => ({ ...n, status: "default" }));
        const newLinks = [];
        for (let i = 0; i < nodes.length; i++) {
          if (i === targetIdx) continue;
          const oldNext = nextLinks[i];
          if (i === prev) {
            // prev should skip the deleted node
            const skipNext = nextLinks[targetIdx];
            newLinks.push(skipNext !== null ? (indexMap[skipNext] ?? null) : null);
          } else {
            newLinks.push(oldNext === null || oldNext === targetIdx ? null : (indexMap[oldNext] ?? null));
          }
        }
        setNodes(newNodes);
        setNextLinks(newLinks);
        setHeadIndex(indexMap[headIndex] ?? null);
        setMarkers({ ...EMPTY_MARKERS, head: indexMap[headIndex] ?? null });
        setStatusMessage(`Deleted ${target}. Done!`);
        setOperationHistory((p) => [...p, { type: "deleteByValue", value: target }]);
        return true;
      }

      setNodes((p) => p.map((n, i) => ({
        ...n, status: i === current ? "current" : i === prev ? "highlight" : "default"
      })));
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, current, prev });
      setStatusMessage(`Checking node ${nodes[current]?.value}... not a match. Moving forward.`);

      if (!(await waitWithControl(speed))) return false;

      prev = current;
      current = nextLinks[current];
    }

    setNodes((p) => p.map((n) => ({ ...n, status: "default" })));
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setStatusMessage(`Value ${target} not found in the list.`);
    return true;
  }, [inputValue, headIndex, nodes, nextLinks, speed, waitWithControl]);

  // ─── dispatch ─────────────────────────────────────────────

  const algorithmMap = useMemo(() => ({
    insertHead: runInsertAtHead,
    insertTail: runInsertAtTail,
    insertPosition: runInsertAtPosition,
    deleteHead: runDeleteFromHead,
    deleteTail: runDeleteFromTail,
    deleteByValue: runDeleteByValue,
  }), [runInsertAtHead, runInsertAtTail, runInsertAtPosition, runDeleteFromHead, runDeleteFromTail, runDeleteByValue]);

  const handleStart = useCallback(async () => {
    if (isRunning) return;
    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setIsPaused(false);
    setRunStatus("Running");
    setStepCount(0);

    const runner = algorithmMap[selectedOperation];
    const completed = runner ? await runner() : false;

    if (stopSignal.current) return;
    setIsRunning(false);
    setIsPaused(false);
    setRunStatus(completed ? "Completed" : "Idle");
  }, [isRunning, algorithmMap, selectedOperation]);

  const handlePause = useCallback(() => {
    if (!isRunning || isPaused) return;
    pauseSignal.current = true;
    setIsPaused(true);
    setRunStatus("Paused");
  }, [isPaused, isRunning]);

  const handleResume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    pauseSignal.current = false;
    setIsPaused(false);
    setRunStatus("Running");
  }, [isPaused, isRunning]);

  const handleCopyCode = useCallback(async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(activeCodeSnippet);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch { setCopyState("idle"); }
  }, [activeCodeSnippet]);

  const handleDownloadCode = useCallback(() => {
    let ext = ".cpp";
    if (selectedLanguage === "Python") ext = ".py";
    if (selectedLanguage === "Java") ext = ".java";
    if (selectedLanguage === "JavaScript") ext = ".js";
    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeOp.title.replace(/\s+/g, "")}${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, activeOp.title, selectedLanguage]);

  // ─── focus auto-scroll ────────────────────────────────────

  const focusPointer = getFocusPointer(markers, nodes);
  const focusIndex = focusPointer?.index ?? null;

  useEffect(() => {
    if (focusIndex === null) return;
    const viewport = nodeViewportRef.current;
    const focusedNode = nodeItemRefs.current[focusIndex];
    if (!viewport || !focusedNode) return;
    const targetLeft = focusedNode.offsetLeft - viewport.clientWidth / 2 + focusedNode.clientWidth / 2;
    const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTo({ left: Math.min(maxLeft, Math.max(0, targetLeft)), behavior: isRunning ? "smooth" : "auto" });
  }, [focusIndex, isRunning]);

  // ─── hotkeys ──────────────────────────────────────────────

  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;
    const key = e.key?.toLowerCase();
    const isHotkey = e.code === "Space" || key === "r" || key === "n";
    if (!isHotkey) return;
    if (e.repeat) { e.preventDefault(); return; }
    if (e.code === "Space") { e.preventDefault(); if (!isRunning) handleStart(); else if (isPaused) handleResume(); else handlePause(); return; }
    if (key === "r") { e.preventDefault(); handleReset(); return; }
    if (key === "n") { e.preventDefault(); generateNewList(listSize); }
  });

  // ─── does the selected operation need value / position ────

  const needsValue = ["insertHead", "insertTail", "insertPosition", "deleteByValue"].includes(selectedOperation);
  const needsPosition = selectedOperation === "insertPosition";

  // ─── JSX ──────────────────────────────────────────────────

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ── Hero Section ── */}
      <MotionSection initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-6 flex items-center">
              <button onClick={() => navigate("/algorithms")} className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-4 pl-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white">
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Back to Algorithms
              </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">Singly Linked List</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeOp.type === "insertion" ? "border-green-400/25 bg-green-500/10 text-green-200" : "border-rose-400/25 bg-rose-500/10 text-rose-200"}`}>
                {activeOp.type === "insertion" ? "Insertion" : "Deletion"}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}>{runStatus}</span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">{activeOp.title}</h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">{activeOp.description}</p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400"><span>Progress</span><span>{progress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <MotionDiv animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { label: "Nodes", val: nodeRenderOrder.length, color: "text-white" },
                { label: "Time", val: activeOp.complexity, color: "text-cyan-200" },
                { label: "Space", val: activeOp.space, color: "text-blue-100" },
                { label: "Steps", val: stepCount, color: "text-emerald-200" },
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
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300"><Activity size={14} className="text-cyan-300" /> Runtime Snapshot</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Step</p>
                <p className="text-sm font-semibold text-white">{statusMessage}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Head Value</p>
                <p className="text-lg font-bold text-cyan-100">{headIndex === null ? "null" : nodes[headIndex]?.value}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">List Length</p>
                <p className="text-lg font-bold text-blue-100">{nodeRenderOrder.length}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Delay</p>
                <p className="text-lg font-bold text-blue-100">{speed}ms</p>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* ── Controls + Node Graph ── */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-stretch">
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Binary size={18} className="text-cyan-300" />
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
                <label className="mb-2 flex items-center gap-2 text-xs uppercase text-slate-400">
                  <Hash size={12} /> Value {selectedOperation !== "deleteByValue" && <span className="text-slate-500">(random if empty)</span>}
                </label>
                <input
                  type="number"
                  value={inputValue}
                  disabled={isRunning}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedOperation === "deleteByValue" ? "Enter value to delete" : "e.g. 42"}
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
            )}

            {/* Position input */}
            {needsPosition && (
              <div className="rounded-2xl bg-white/5 p-3">
                <label className="mb-2 flex items-center gap-2 text-xs uppercase text-slate-400">
                  <ListPlus size={12} /> Position <span className="text-slate-500">(0-indexed)</span>
                </label>
                <input
                  type="number"
                  value={inputPosition}
                  disabled={isRunning}
                  min="0"
                  max={nodes.length}
                  onChange={(e) => setInputPosition(e.target.value)}
                  placeholder={`0 – ${nodes.length}`}
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
            )}

            {/* Size & Speed */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400"><span>Initial Size</span><span>{listSize}</span></label>
              <input type="range" min="3" max="10" value={listSize} disabled={isRunning} onChange={(e) => { setListSize(Number(e.target.value)); generateNewList(Number(e.target.value)); }} className="w-full accent-cyan-400" />
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400"><span>Delay</span><span>{speed}ms</span></label>
              <input type="range" min="80" max="800" value={speed} disabled={isRunning} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full accent-blue-400" />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <MotionButton whileTap={{ scale: 0.95 }} onClick={handleReset} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white"><RotateCcw size={16} /> Reset</MotionButton>
              <MotionButton whileTap={{ scale: 0.95 }} onClick={() => generateNewList(listSize)} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100"><Shuffle size={16} /> Shuffle</MotionButton>
            </div>

            <MotionButton
              whileHover={{ scale: 1.02 }}
              onClick={isRunning ? (isPaused ? handleResume : handlePause) : handleStart}
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg ${isRunning ? (isPaused ? "bg-emerald-600" : "bg-amber-500 text-slate-900") : "bg-gradient-to-r from-blue-600 to-cyan-500"}`}
            >
              {isRunning ? (isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />) : <Play size={18} fill="currentColor" />}
              {isRunning ? (isPaused ? "Resume" : "Pause") : "Start"}
            </MotionButton>
            <HotkeysHint className="mt-1" />
          </div>
        </aside>

        {/* ── Node Graph + Traversal + History ── */}
        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-300">Node Graph</p></div>
          <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/45">
            <div ref={nodeViewportRef} className="ll-scrollbar h-[170px] w-full overflow-x-auto px-2 pb-3 pt-7">
              <div className="flex h-full min-w-max items-start gap-3 pr-4">
                <AnimatePresence mode="popLayout">
                  {nodeRenderOrder.map((nodeIndex, orderIndex) => {
                    const node = nodes[nodeIndex];
                    if (!node) return null;
                    const labels = Object.entries(markers).filter(([, idx]) => idx === nodeIndex).map(([k]) => markerLabels[k]);
                    return (
                      <motion.div
                        key={node.id}
                        ref={(el) => { if (el) nodeItemRefs.current[nodeIndex] = el; }}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.7, y: -20 }}
                        animate={{ opacity: node.status === "fadeOut" ? 0.3 : 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        transition={{ duration: 0.3 }}
                        layout
                      >
                        <MotionDiv layout className={`relative mt-2 min-w-[112px] rounded-xl border px-3 py-3 text-center shadow-lg ${getNodeStatusClass(node.status)}`}>
                          {focusPointer?.index === nodeIndex && <motion.div layoutId="active-pointer-focus" className="pointer-events-none absolute -inset-1 rounded-xl border-2 border-cyan-300/80 shadow-[0_0_0_6px_rgba(34,211,238,0.16)]" />}
                          {labels.length > 0 && (
                            <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 gap-1">
                              {labels.map((l) => (
                                <span key={l} className="rounded-full border border-slate-700 bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-100">{l}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] uppercase tracking-wider text-slate-200/90">Node {orderIndex + 1}</p>
                          <p className="mt-1 text-xl font-bold">{node.value}</p>
                          <p className="mt-1 text-[10px] font-semibold uppercase text-slate-100/85">
                            next: {nextLinks[nodeIndex] === null ? "null" : (nodes[nextLinks[nodeIndex]]?.value ?? "null")}
                          </p>
                        </MotionDiv>
                        {orderIndex < nodeRenderOrder.length - 1 && <span className="text-sm font-bold text-slate-500">→</span>}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {nodeRenderOrder.length === 0 && (
                  <div className="flex h-full w-full items-center justify-center text-slate-500 text-sm">List is empty — insert a node to begin</div>
                )}
              </div>
            </div>
          </div>

          {/* Traversal view */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Traversal</p>
            <div className="ll-scrollbar mt-3 flex overflow-x-auto gap-2 pb-1 text-sm">
              {listTraversal.order.length === 0 ? <span className="text-slate-400">null</span> : (
                <>
                  {listTraversal.order.map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-100">{nodes[idx]?.value}</span>
                      <span className="text-slate-400">→</span>
                    </div>
                  ))}
                  <span className="text-slate-500">null</span>
                </>
              )}
            </div>
          </div>

          {/* Operation History */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Operation History</p>
            <div className="ll-scrollbar mt-3 max-h-[120px] overflow-y-auto space-y-1.5">
              {operationHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No operations yet</p>
              ) : (
                [...operationHistory].reverse().map((op, idx) => (
                  <div key={idx} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${op.type.startsWith("insert") ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"}`}>
                    {op.type.startsWith("insert") ? <Plus size={12} /> : <Minus size={12} />}
                    <span className="font-semibold capitalize">{op.type.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className="font-bold">{op.value}</span>
                    {op.position !== undefined && <span className="text-slate-400">@ pos {op.position}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Code Section ── */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate("/algorithms")} className="group flex items-center gap-2 rounded-lg bg-white/5 pr-4 pl-3 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white border border-white/10">
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Back to Algorithms
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <Code2 size={20} className="text-blue-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">{selectedLanguage} Source</span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{lang}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopyCode} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10">
              {copyState === "copied" ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />} {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button onClick={handleDownloadCode} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"><Download size={14} /> Download</button>
          </div>
        </div>
        <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm">
          <pre><code>{activeCodeSnippet.split("\n").map((line, i) => (
            <div key={i} className="flex rounded px-2 hover:bg-white/5">
              <span className="w-8 shrink-0 select-none pr-4 text-right text-xs text-slate-600">{i + 1}</span>
              <span className="text-slate-300">{renderHighlightedCode(line)}</span>
            </div>
          ))}</code></pre>
        </div>
      </section>
    </div>
  );
}