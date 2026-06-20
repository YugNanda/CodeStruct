import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion } from "framer-motion";
import {
  Activity,
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
  ArrowLeft,
} from "lucide-react";
import {
  middleNodeCPP,
  reverseLinkedListCPP,
  middleNodePython,
  reverseLinkedListPython,
  middleNodeJava,
  reverseLinkedListJava,
  middleNodeJS,
  reverseLinkedListJS,
  floydCycleDetectionCPP,
  floydCycleDetectionPython,
  floydCycleDetectionJava,
  floydCycleDetectionJS,
} from "../algorithms/linkedList";
import { renderHighlightedCode } from "../utils/codeHighlight";
import HotkeysHint from "../components/HotkeysHint";
import {
  shouldSkipHotkeyTarget,
  useStableHotkeys,
} from "../hooks/useStableHotkeys";

/* ─── Constants ────────────────────────────────────────── */

const EMPTY_MARKERS = {
  head: null,
  current: null,
  prev: null,
  next: null,
  slow: null,
  fast: null,
  middle: null,
  meeting: null,
  cycleStart: null,
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
  slow: "slow",
  fast: "fast",
  middle: "mid",
  meeting: "meet",
  cycleStart: "cycle▸",
};

const linkedListAlgorithms = {
  reverse: {
    title: "Reverse Linked List",
    description:
      "Iteratively reverse each next pointer using prev, current, and next pointers.",
    complexity: "O(n)",
    space: "O(1)",
    cppSnippet: reverseLinkedListCPP,
    pythonSnippet: reverseLinkedListPython,
    javaSnippet: reverseLinkedListJava,
    jsSnippet: reverseLinkedListJS,
  },
  middle: {
    title: "Middle Node (Slow/Fast)",
    description:
      "Move slow by one step and fast by two steps until fast reaches the tail.",
    complexity: "O(n)",
    space: "O(1)",
    cppSnippet: middleNodeCPP,
    pythonSnippet: middleNodePython,
    javaSnippet: middleNodeJava,
    jsSnippet: middleNodeJS,
  },
  floydCycle: {
    title: "Floyd's Cycle Detection",
    description:
      "Detect a cycle using the Tortoise & Hare algorithm. Phase 1 finds the meeting point; Phase 2 locates the cycle start.",
    complexity: "O(n)",
    space: "O(1)",
    cppSnippet: floydCycleDetectionCPP,
    pythonSnippet: floydCycleDetectionPython,
    javaSnippet: floydCycleDetectionJava,
    jsSnippet: floydCycleDetectionJS,
  },
};

const nodeStatusClassMap = {
  default: "border-blue-400/30 bg-blue-500/10 text-blue-100",
  current: "border-amber-400/45 bg-amber-500/20 text-amber-100",
  reversed: "border-emerald-400/45 bg-emerald-500/20 text-emerald-100",
  slow: "border-cyan-400/45 bg-cyan-500/20 text-cyan-100",
  fast: "border-fuchsia-400/45 bg-fuchsia-500/20 text-fuchsia-100",
  middle: "border-violet-400/45 bg-violet-500/20 text-violet-100",
  meeting: "border-rose-400/45 bg-rose-500/20 text-rose-100",
  cycleStart:
    "border-emerald-400/55 bg-emerald-500/25 text-emerald-50 ring-2 ring-emerald-400/40",
  visited: "border-teal-400/35 bg-teal-500/15 text-teal-100",
};

/* ─── Helpers ──────────────────────────────────────────── */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomValue() {
  return Math.floor(Math.random() * 90) + 10;
}

function getNodeStatusClass(status) {
  return nodeStatusClassMap[status] ?? nodeStatusClassMap.default;
}

function createLinkedListState(size, cycleTarget = null) {
  const stamp = Date.now();
  const nodes = Array.from({ length: size }, (_, index) => ({
    id: `${stamp}-${index}-${Math.floor(Math.random() * 1000000)}`,
    value: getRandomValue(),
    status: "default",
  }));
  const nextLinks = Array.from({ length: size }, (_, index) =>
    index + 1 < size ? index + 1 : null,
  );

  // If cycleTarget is a valid index, create a cycle: last node -> cycleTarget
  if (
    cycleTarget !== null &&
    cycleTarget >= 0 &&
    cycleTarget < size &&
    size > 0
  ) {
    nextLinks[size - 1] = cycleTarget;
  }

  return {
    nodes,
    nextLinks,
    headIndex: size > 0 ? 0 : null,
  };
}

function getFocusPointer(markers, nodes) {
  const priority = [
    "cycleStart",
    "meeting",
    "current",
    "head",
    "slow",
    "fast",
    "middle",
    "prev",
    "next",
  ];
  for (const key of priority) {
    const pointerIndex = markers[key];
    if (
      pointerIndex !== null &&
      pointerIndex !== undefined &&
      nodes[pointerIndex]
    ) {
      return {
        key,
        label: markerLabels[key],
        index: pointerIndex,
        value: nodes[pointerIndex].value,
      };
    }
  }
  return null;
}

/* ─── Component ────────────────────────────────────────── */

export default function LinkedListVisualizerPage() {
  const navigate = useNavigate();
  const initialGraph = useMemo(() => createLinkedListState(7), []);
  const [nodes, setNodes] = useState(initialGraph.nodes);
  const [nextLinks, setNextLinks] = useState(initialGraph.nextLinks);
  const [headIndex, setHeadIndex] = useState(initialGraph.headIndex);
  const [markers, setMarkers] = useState({
    ...EMPTY_MARKERS,
    head: initialGraph.headIndex,
  });
  const [listSize, setListSize] = useState(7);
  const [speed, setSpeed] = useState(280);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("reverse");
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Generate data and start an algorithm run.",
  );
  const [copyState, setCopyState] = useState("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");

  // Floyd-specific state
  const [cycleEnabled, setCycleEnabled] = useState(false);
  const [cycleTargetNode, setCycleTargetNode] = useState(2); // index of node to cycle back to
  const [phaseLabel, setPhaseLabel] = useState(""); // "Phase 1: Detection", "Phase 2: Finding Start", etc.
  const [visitedCount, setVisitedCount] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);
  const nodeViewportRef = useRef(null);
  const nodeItemRefs = useRef({});

  const MotionSection = motion.section;
  const MotionButton = motion.button;
  const MotionDiv = motion.div;

  const activeAlgorithm = linkedListAlgorithms[selectedAlgorithm];
  useDocumentTitle(activeAlgorithm.title);

  const activeCodeSnippet = useMemo(() => {
    if (selectedLanguage === "C++") return activeAlgorithm.cppSnippet;
    if (selectedLanguage === "Python") return activeAlgorithm.pythonSnippet;
    if (selectedLanguage === "Java") return activeAlgorithm.javaSnippet;
    return activeAlgorithm.jsSnippet;
  }, [selectedLanguage, activeAlgorithm]);

  const progress = useMemo(
    () =>
      runStatus === "Completed"
        ? 100
        : nodes.length === 0
          ? 0
          : Math.min(Math.round((stepCount / nodes.length) * 100), 100),
    [runStatus, stepCount, nodes.length],
  );

  /* ─── Run control helpers ──────────────────────────────── */

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
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, status: "default" })),
    );
  }, []);

  const generateNewList = useCallback(
    (size) => {
      hardStopRun();
      const target =
        cycleEnabled && selectedAlgorithm === "floydCycle"
          ? Math.min(cycleTargetNode, size - 1)
          : null;
      const nextGraph = createLinkedListState(size, target);
      setNodes(nextGraph.nodes);
      setNextLinks(nextGraph.nextLinks);
      setHeadIndex(nextGraph.headIndex);
      setMarkers({ ...EMPTY_MARKERS, head: nextGraph.headIndex });
      setRunStatus("Idle");
      setStepCount(0);
      setVisitedCount(0);
      setPhaseLabel("");
      setStatusMessage("New linked list generated.");
    },
    [hardStopRun, cycleEnabled, cycleTargetNode, selectedAlgorithm],
  );

  const handleReset = useCallback(() => {
    hardStopRun();
    resetNodeHighlights();
    setMarkers({ ...EMPTY_MARKERS, head: headIndex });
    setRunStatus("Idle");
    setStepCount(0);
    setVisitedCount(0);
    setPhaseLabel("");
    setStatusMessage("Pointers and highlights reset.");
  }, [hardStopRun, headIndex, resetNodeHighlights]);

  /* ─── Algorithm runners ────────────────────────────────── */

  // --- Reverse Linked List (unchanged) ---
  const runReverseLinkedList = useCallback(async () => {
    let workingNodes = nodes.map((node) => ({ ...node, status: "default" }));
    let workingLinks = [...nextLinks];
    let prev = null;
    let current = headIndex;
    let localStep = 0;

    while (current !== null) {
      const nextNode = workingLinks[current];
      localStep += 1;
      setStepCount(localStep);

      workingNodes = workingNodes.map((node, index) => {
        if (index === current) return { ...node, status: "current" };
        if (index === prev) return { ...node, status: "reversed" };
        return node.status === "reversed"
          ? node
          : { ...node, status: "default" };
      });

      setNodes([...workingNodes]);
      setMarkers({
        ...EMPTY_MARKERS,
        head: headIndex,
        current,
        prev,
        next: nextNode,
      });
      setStatusMessage(
        `Step ${localStep}: save next of ${workingNodes[current].value}, then reverse current pointer.`,
      );

      const canContinue = await waitWithControl(speed);
      if (!canContinue) return false;

      workingLinks[current] = prev;
      workingNodes = workingNodes.map((node, index) => {
        if (index === current) return { ...node, status: "reversed" };
        return node;
      });

      setNodes([...workingNodes]);
      setNextLinks([...workingLinks]);

      const canContinueAfterRelink = await waitWithControl(
        Math.max(120, Math.floor(speed * 0.65)),
      );
      if (!canContinueAfterRelink) return false;

      prev = current;
      current = nextNode;
    }

    const completedNodes = workingNodes.map((node) => ({
      ...node,
      status: "reversed",
    }));

    setNodes(completedNodes);
    setHeadIndex(prev);
    setMarkers({ ...EMPTY_MARKERS, head: prev });
    setStatusMessage("Reversal complete. Head now points to the old tail.");
    return true;
  }, [headIndex, nextLinks, nodes, speed, waitWithControl]);

  // --- Middle Node (unchanged) ---
  const runMiddleNode = useCallback(async () => {
    if (headIndex === null) return true;
    const workingLinks = [...nextLinks];
    const workingNodes = nodes.map((node) => ({ ...node, status: "default" }));
    let slow = headIndex;
    let fast = headIndex;
    let localStep = 0;

    while (fast !== null && workingLinks[fast] !== null) {
      localStep += 1;
      setStepCount(localStep);

      workingNodes.forEach((node, index) => {
        if (index === slow) node.status = "slow";
        else if (index === fast) node.status = "fast";
        else node.status = "default";
      });

      setNodes([...workingNodes]);
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, slow, fast });
      setStatusMessage(
        `Step ${localStep}: move slow by 1 and fast by 2 until fast reaches the tail.`,
      );

      const canContinue = await waitWithControl(speed);
      if (!canContinue) return false;

      slow = workingLinks[slow];
      const fastNext = workingLinks[fast];
      fast = fastNext !== null ? workingLinks[fastNext] : null;
    }

    workingNodes.forEach((node, index) => {
      node.status = index === slow ? "middle" : "default";
    });

    setNodes([...workingNodes]);
    setMarkers({ ...EMPTY_MARKERS, head: headIndex, middle: slow });
    setStatusMessage(`Middle node found: ${workingNodes[slow].value}.`);
    return waitWithControl(Math.max(120, Math.floor(speed * 0.6)));
  }, [headIndex, nextLinks, nodes, speed, waitWithControl]);

  // --- Floyd's Cycle Detection (NEW) ---
  const runFloydCycleDetection = useCallback(async () => {
    if (headIndex === null) return true;

    const workingLinks = [...nextLinks];
    const workingNodes = nodes.map((node) => ({ ...node, status: "default" }));

    let slow = headIndex;
    let fast = headIndex;
    let localStep = 0;
    let localVisited = 0;
    let meetingPoint = null;

    // ── Phase 1: Detect cycle ──
    setPhaseLabel("Phase 1: Cycle Detection");
    setStatusMessage("Phase 1 — slow moves 1 step, fast moves 2 steps…");

    while (fast !== null && workingLinks[fast] !== null) {
      localStep += 1;
      localVisited += 1;
      setStepCount(localStep);

      // Advance pointers
      slow = workingLinks[slow];
      const fastNext = workingLinks[fast];
      fast = fastNext !== null ? workingLinks[fastNext] : null;

      // Highlight
      workingNodes.forEach((node, index) => {
        if (index === slow && index === fast) node.status = "meeting";
        else if (index === slow) node.status = "slow";
        else if (index === fast) node.status = "fast";
        else if (node.status !== "visited") node.status = "default";
      });

      // Mark visited trail
      if (workingNodes[slow]) workingNodes[slow].status = slow === fast ? "meeting" : "slow";

      setNodes([...workingNodes]);
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, slow, fast });
      setVisitedCount(localVisited);

      if (slow === fast) {
        // They met!
        meetingPoint = slow;
        workingNodes[meetingPoint].status = "meeting";
        setNodes([...workingNodes]);
        setMarkers({
          ...EMPTY_MARKERS,
          head: headIndex,
          slow,
          fast,
          meeting: meetingPoint,
        });
        setStatusMessage(
          `Phase 1 — 🎯 slow & fast MET at node ${workingNodes[meetingPoint].value}! Cycle detected.`,
        );
        await waitWithControl(speed * 1.5);
        break;
      }

      setStatusMessage(
        `Phase 1 — Step ${localStep}: slow→${workingNodes[slow]?.value ?? "null"}, fast→${fast !== null ? (workingNodes[fast]?.value ?? "null") : "null"}`,
      );

      const canContinue = await waitWithControl(speed);
      if (!canContinue) return false;
    }

    // ── No cycle case ──
    if (meetingPoint === null) {
      setPhaseLabel("No Cycle Detected");
      workingNodes.forEach((node, index) => {
        if (index === slow) node.status = "slow";
        else if (index === fast) node.status = "fast";
        else node.status = "default";
      });
      setNodes([...workingNodes]);
      setMarkers({ ...EMPTY_MARKERS, head: headIndex, slow, fast });
      setStatusMessage(
        "✅ Fast pointer reached null → No cycle in this linked list.",
      );
      setVisitedCount(localVisited);
      return true;
    }

    // ── Phase 2: Find cycle start ──
    setPhaseLabel("Phase 2: Finding Cycle Start");
    setStatusMessage(
      "Phase 2 — Reset slow to head. Both move 1 step until they meet.",
    );

    slow = headIndex;
    // Reset highlights for phase 2
    workingNodes.forEach((node, index) => {
      if (index === meetingPoint) node.status = "meeting";
      else node.status = "default";
    });
    workingNodes[slow].status = "slow";
    setNodes([...workingNodes]);
    setMarkers({
      ...EMPTY_MARKERS,
      head: headIndex,
      slow,
      fast,
      meeting: meetingPoint,
    });

    const canContinue2 = await waitWithControl(speed);
    if (!canContinue2) return false;

    while (slow !== fast) {
      localStep += 1;
      localVisited += 1;
      setStepCount(localStep);

      slow = workingLinks[slow];
      fast = workingLinks[fast];

      workingNodes.forEach((node, index) => {
        if (index === slow && index === fast) node.status = "cycleStart";
        else if (index === slow) node.status = "slow";
        else if (index === fast) node.status = "fast";
        else if (index === meetingPoint) node.status = "meeting";
        else node.status = "default";
      });

      setNodes([...workingNodes]);
      setMarkers({
        ...EMPTY_MARKERS,
        head: headIndex,
        slow,
        fast,
        meeting: meetingPoint,
      });
      setVisitedCount(localVisited);
      setStatusMessage(
        `Phase 2 — Step ${localStep}: slow→${workingNodes[slow]?.value}, fast→${workingNodes[fast]?.value}`,
      );

      const canContinue = await waitWithControl(speed);
      if (!canContinue) return false;
    }

    // Found cycle start
    setPhaseLabel("Cycle Start Found!");
    workingNodes.forEach((node, index) => {
      if (index === slow) node.status = "cycleStart";
      else if (index === meetingPoint && meetingPoint !== slow)
        node.status = "meeting";
      else node.status = "default";
    });

    setNodes([...workingNodes]);
    setMarkers({
      ...EMPTY_MARKERS,
      head: headIndex,
      cycleStart: slow,
      meeting: meetingPoint !== slow ? meetingPoint : null,
    });
    setStatusMessage(
      `🎉 Cycle starts at node with value ${workingNodes[slow].value}. Algorithm complete!`,
    );
    setVisitedCount(localVisited);

    return true;
  }, [headIndex, nextLinks, nodes, speed, waitWithControl]);

  /* ─── Start / Pause / Resume / Reset ───────────────────── */

  const handleStart = useCallback(async () => {
    if (nodes.length === 0 || isRunning) return;
    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setIsPaused(false);
    setRunStatus("Running");
    setStepCount(0);
    setVisitedCount(0);
    setPhaseLabel("");

    let completed = false;
    if (selectedAlgorithm === "reverse") {
      completed = await runReverseLinkedList();
    } else if (selectedAlgorithm === "middle") {
      completed = await runMiddleNode();
    } else if (selectedAlgorithm === "floydCycle") {
      completed = await runFloydCycleDetection();
    }

    if (stopSignal.current) return;
    setIsRunning(false);
    setIsPaused(false);
    setRunStatus(completed ? "Completed" : "Idle");
  }, [
    isRunning,
    nodes.length,
    runMiddleNode,
    runReverseLinkedList,
    runFloydCycleDetection,
    selectedAlgorithm,
  ]);

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
    } catch {
      setCopyState("idle");
    }
  }, [activeCodeSnippet]);

  const handleDownloadCode = useCallback(() => {
    let extension = ".cpp";
    if (selectedLanguage === "Python") extension = ".py";
    if (selectedLanguage === "Java") extension = ".java";
    if (selectedLanguage === "JavaScript") extension = ".js";

    const blob = new Blob([activeCodeSnippet], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeAlgorithm.title.replace(/\s+/g, "")}${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeCodeSnippet, activeAlgorithm.title, selectedLanguage]);

  /* ─── List traversal (cycle-safe) ──────────────────────── */

  const listTraversal = useMemo(() => {
    if (headIndex === null) return { order: [], hasCycle: false, cycleBackTo: null };
    const visited = new Set();
    const order = [];
    let cursor = headIndex;
    while (cursor !== null && !visited.has(cursor)) {
      order.push(cursor);
      visited.add(cursor);
      cursor = nextLinks[cursor];
    }
    return { order, hasCycle: cursor !== null, cycleBackTo: cursor };
  }, [headIndex, nextLinks]);

  const nodeRenderOrder = useMemo(() => {
    if (nodes.length === 0) return [];
    if (headIndex === null) return nodes.map((_, index) => index);
    if (listTraversal.order.length === nodes.length)
      return listTraversal.order;
    // For cycles, the order won't cover all nodes but covers the reachable ones
    if (listTraversal.order.length > 0) return listTraversal.order;
    return nodes.map((_, index) => index);
  }, [headIndex, listTraversal.order, nodes]);

  const focusPointer = getFocusPointer(markers, nodes);
  const focusIndex = focusPointer?.index ?? null;

  useEffect(() => {
    if (focusIndex === null) return;
    const viewport = nodeViewportRef.current;
    const focusedNode = nodeItemRefs.current[focusIndex];
    if (!viewport || !focusedNode) return;
    const targetLeft =
      focusedNode.offsetLeft -
      viewport.clientWidth / 2 +
      focusedNode.clientWidth / 2;
    const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTo({
      left: Math.min(maxLeft, Math.max(0, targetLeft)),
      behavior: isRunning ? "smooth" : "auto",
    });
  }, [focusIndex, isRunning]);

  // Regenerate list when cycle settings change (only for floydCycle)
  useEffect(() => {
    if (selectedAlgorithm === "floydCycle" && !isRunning) {
      const target = cycleEnabled
        ? Math.min(cycleTargetNode, listSize - 1)
        : null;
      const nextGraph = createLinkedListState(listSize, target);
      setNodes(nextGraph.nodes);
      setNextLinks(nextGraph.nextLinks);
      setHeadIndex(nextGraph.headIndex);
      setMarkers({ ...EMPTY_MARKERS, head: nextGraph.headIndex });
      setRunStatus("Idle");
      setStepCount(0);
      setVisitedCount(0);
      setPhaseLabel("");
      setStatusMessage(
        cycleEnabled
          ? `Cycle injected: last node → node ${cycleTargetNode + 1}.`
          : "No cycle. Generate and run to test.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleEnabled, cycleTargetNode, selectedAlgorithm]);

  /* ─── Hotkeys ──────────────────────────────────────────── */

  useStableHotkeys((e) => {
    if (shouldSkipHotkeyTarget(e.target)) return;

    const key = e.key?.toLowerCase();
    const isHotkey = e.code === "Space" || key === "r" || key === "n";
    if (!isHotkey) return;

    if (e.repeat) {
      e.preventDefault();
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (!isRunning) handleStart();
      else if (isPaused) handleResume();
      else handlePause();
      return;
    }

    if (key === "r") {
      e.preventDefault();
      handleReset();
      return;
    }

    if (key === "n") {
      e.preventDefault();
      generateNewList(listSize);
    }
  });

  /* ─── Render ───────────────────────────────────────────── */

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      {/* ── Hero Section ── */}
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
                <ArrowLeft
                  size={14}
                  className="transition-transform group-hover:-translate-x-1"
                />
                Back to Algorithms
              </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
                Linked List
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
              {/* Phase label for Floyd's */}
              {selectedAlgorithm === "floydCycle" && phaseLabel && (
                <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-200">
                  {phaseLabel}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              {activeAlgorithm.title}
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              {activeAlgorithm.description}
            </p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                <MotionDiv
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { label: "Nodes", val: nodes.length, color: "text-white" },
                {
                  label: "Time",
                  val: activeAlgorithm.complexity,
                  color: "text-cyan-200",
                },
                {
                  label: "Space",
                  val: activeAlgorithm.space,
                  color: "text-blue-100",
                },
                {
                  label: "Steps",
                  val: stepCount,
                  color: "text-emerald-200",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${stat.color}`}
                  >
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Runtime Snapshot ── */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-cyan-300" /> Runtime Snapshot
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Current Step</p>
                <p className="text-sm font-semibold text-white">
                  {statusMessage}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Head Value</p>
                <p className="text-lg font-bold text-cyan-100">
                  {headIndex === null ? "null" : nodes[headIndex]?.value}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Delay</p>
                <p className="text-lg font-bold text-blue-100">{speed}ms</p>
              </div>
              {/* Floyd-specific: visited count & cycle info */}
              {selectedAlgorithm === "floydCycle" && (
                <>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] text-slate-400">
                      Nodes Visited
                    </p>
                    <p className="text-lg font-bold text-rose-100">
                      {visitedCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] text-slate-400">Cycle Status</p>
                    <p className="text-sm font-bold text-amber-100">
                      {cycleEnabled
                        ? `Injected → last node → node ${cycleTargetNode + 1}`
                        : "No cycle injected"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </MotionSection>

      {/* ── Controls + Node Graph ── */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-stretch">
        {/* ── Sidebar Controls ── */}
        <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-2">
            <Binary size={18} className="text-cyan-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Controls
            </h2>
          </div>
          <div className="flex flex-1 flex-col gap-4">
            {/* Algorithm select */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 block text-xs uppercase text-slate-400">
                Algorithm
              </label>
              <select
                value={selectedAlgorithm}
                disabled={isRunning}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value);
                  handleReset();
                }}
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none"
              >
                <option value="reverse">Reverse Linked List</option>
                <option value="middle">Middle Node (Slow/Fast)</option>
                <option value="floydCycle">
                  Floyd&apos;s Cycle Detection
                </option>
              </select>
            </div>

            {/* Floyd-specific: Cycle injection controls */}
            {selectedAlgorithm === "floydCycle" && (
              <div className="rounded-2xl border border-rose-400/15 bg-rose-500/5 p-3 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-rose-200">
                  Cycle Settings
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cycleEnabled}
                    disabled={isRunning}
                    onChange={(e) => setCycleEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-800 accent-rose-500"
                  />
                  <span className="text-sm text-slate-200">
                    Inject Cycle
                  </span>
                </label>
                {cycleEnabled && (
                  <div>
                    <label className="mb-1 flex justify-between text-xs uppercase text-slate-400">
                      <span>Cycle Back To Node</span>
                      <span>{cycleTargetNode + 1}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, listSize - 2)}
                      value={cycleTargetNode}
                      disabled={isRunning}
                      onChange={(e) =>
                        setCycleTargetNode(Number(e.target.value))
                      }
                      className="w-full accent-rose-400"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Last node&apos;s next → node {cycleTargetNode + 1} (
                      value:{" "}
                      {nodes[cycleTargetNode]?.value ?? "?"})
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Size */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                <span>Size</span>
                <span>{listSize}</span>
              </label>
              <input
                type="range"
                min="4"
                max="12"
                value={listSize}
                disabled={isRunning}
                onChange={(e) => {
                  setListSize(Number(e.target.value));
                  generateNewList(Number(e.target.value));
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Delay */}
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="mb-2 flex justify-between text-xs uppercase text-slate-400">
                <span>Delay</span>
                <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="80"
                max="600"
                value={speed}
                disabled={isRunning}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-blue-400"
              />
            </div>

            {/* Reset / Shuffle */}
            <div className="grid grid-cols-2 gap-2">
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white"
              >
                <RotateCcw size={16} /> Reset
              </MotionButton>
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={() => generateNewList(listSize)}
                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100"
              >
                <Shuffle size={16} /> Shuffle
              </MotionButton>
            </div>

            {/* Start / Pause / Resume */}
            <MotionButton
              whileHover={{ scale: 1.02 }}
              onClick={
                isRunning
                  ? isPaused
                    ? handleResume
                    : handlePause
                  : handleStart
              }
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg ${isRunning ? (isPaused ? "bg-emerald-600" : "bg-amber-500 text-slate-900") : "bg-gradient-to-r from-blue-600 to-cyan-500"}`}
            >
              {isRunning ? (
                isPaused ? (
                  <Play size={18} fill="currentColor" />
                ) : (
                  <Pause size={18} fill="currentColor" />
                )
              ) : (
                <Play size={18} fill="currentColor" />
              )}
              {isRunning ? (isPaused ? "Resume" : "Pause") : "Start"}
            </MotionButton>
            <HotkeysHint className="mt-1" />

            {/* Info toggle for Floyd */}
            {selectedAlgorithm === "floydCycle" && (
              <button
                onClick={() => setShowInfoPanel((v) => !v)}
                className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 py-2 text-xs font-bold text-violet-200 transition-all hover:bg-violet-500/20"
              >
                <Info size={14} />
                {showInfoPanel ? "Hide" : "Show"} Algorithm Explanation
              </button>
            )}
          </div>
        </aside>

        {/* ── Main visualization area ── */}
        <section className="min-w-0 h-full rounded-3xl border border-white/10 bg-slate-800/35 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Node Graph
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/45">
            <div
              ref={nodeViewportRef}
              className="ll-scrollbar h-[170px] w-full overflow-x-auto px-2 pb-3 pt-7"
            >
              <div className="flex h-full min-w-max items-start gap-3 pr-4">
                {nodeRenderOrder.map((nodeIndex, orderIndex) => {
                  const node = nodes[nodeIndex];
                  if (!node) return null;
                  const labels = Object.entries(markers)
                    .filter(([, idx]) => idx === nodeIndex)
                    .map(([k]) => markerLabels[k]);
                  return (
                    <div
                      key={node.id}
                      ref={(el) => {
                        if (el) nodeItemRefs.current[nodeIndex] = el;
                      }}
                      className="flex items-center gap-2"
                    >
                      <MotionDiv
                        layout
                        className={`relative mt-2 min-w-[112px] rounded-xl border px-3 py-3 text-center shadow-lg ${getNodeStatusClass(node.status)}`}
                      >
                        {focusPointer?.index === nodeIndex && (
                          <motion.div
                            layoutId="active-pointer-focus"
                            className="pointer-events-none absolute -inset-1 rounded-xl border-2 border-cyan-300/80 shadow-[0_0_0_6px_rgba(34,211,238,0.16)]"
                          />
                        )}
                        {labels.length > 0 && (
                          <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 gap-1">
                            {labels.map((l) => (
                              <span
                                key={l}
                                className="rounded-full border border-slate-700 bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-100"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-slate-200/90">
                          Node {nodeIndex + 1}
                        </p>
                        <p className="mt-1 text-xl font-bold">{node.value}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase text-slate-100/85">
                          next:{" "}
                          {nextLinks[nodeIndex] === null
                            ? "null"
                            : (nodes[nextLinks[nodeIndex]]?.value ?? "null")}
                        </p>
                      </MotionDiv>
                      {orderIndex < nodeRenderOrder.length - 1 && (
                        <span className="text-sm font-bold text-slate-500">
                          →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Traversal display */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Traversal
            </p>
            <div className="ll-scrollbar mt-3 flex overflow-x-auto gap-2 pb-1 text-sm">
              {listTraversal.order.length === 0 ? (
                <span className="text-slate-400">null</span>
              ) : (
                <>
                  {listTraversal.order.map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-100">
                        {nodes[idx].value}
                      </span>
                      <span className="text-slate-400">→</span>
                    </div>
                  ))}
                  {listTraversal.hasCycle ? (
                    <span className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-200">
                      ⟲ node {listTraversal.cycleBackTo + 1} (
                      {nodes[listTraversal.cycleBackTo]?.value})
                    </span>
                  ) : (
                    <span className="text-slate-500">null</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Educational Info Panel for Floyd (collapsible) ── */}
          {selectedAlgorithm === "floydCycle" && showInfoPanel && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5 space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-violet-200">
                📖 How Floyd&apos;s Algorithm Works
              </h3>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-semibold text-cyan-200 mb-1">
                    Phase 1 — Cycle Detection (Tortoise & Hare)
                  </p>
                  <p>
                    Two pointers start at head.{" "}
                    <strong className="text-cyan-100">Slow</strong> moves 1 step,{" "}
                    <strong className="text-fuchsia-200">Fast</strong> moves 2
                    steps. If they <strong className="text-rose-200">meet</strong>{" "}
                    → cycle exists. If fast hits null → no cycle.
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-semibold text-emerald-200 mb-1">
                    Phase 2 — Find Cycle Start
                  </p>
                  <p>
                    Reset <strong className="text-cyan-100">slow</strong> to
                    head. Both pointers now move 1 step at a time. The node
                    where they meet again is the{" "}
                    <strong className="text-emerald-200">cycle start</strong>.
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-semibold text-amber-200 mb-1">
                    Why Does It Work?
                  </p>
                  <p>
                    When fast and slow meet inside the cycle, the distance from
                    the head to the cycle start equals the distance from the
                    meeting point to the cycle start (going around the cycle).
                    This mathematical property ensures Phase 2 works.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      Time Complexity
                    </p>
                    <p className="mt-1 font-bold text-cyan-100">O(n)</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      Space Complexity
                    </p>
                    <p className="mt-1 font-bold text-blue-100">O(1)</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-semibold text-slate-200 mb-2">
                    Pointer Color Legend
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-cyan-100">
                      🐢 Slow
                    </span>
                    <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-2.5 py-1 text-fuchsia-100">
                      🐇 Fast
                    </span>
                    <span className="rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-rose-100">
                      ⚡ Meeting
                    </span>
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-emerald-100">
                      🎯 Cycle Start
                    </span>
                  </div>
                </div>
              </div>
            </MotionDiv>
          )}
        </section>
      </div>

      {/* ── Code Viewer Section ── */}
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
            <Code2 size={20} className="text-blue-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedLanguage === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
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
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>
        <div className="ll-scrollbar max-h-[500px] overflow-auto bg-[#020617] p-6 font-code text-sm">
          <pre>
            <code>
              {activeCodeSnippet.split("\n").map((line, i) => (
                <div key={i} className="flex rounded px-2 hover:bg-white/5">
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
      </section>
    </div>
  );
}