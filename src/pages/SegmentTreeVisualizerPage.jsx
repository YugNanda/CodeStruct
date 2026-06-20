import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDown,
  CheckCheck,
  Code2,
  Copy,
  Download,
  Network,
  RotateCcw,
  Search,
  TextCursorInput,
  ArrowLeft,
  Edit2,
  ListPlus,
} from "lucide-react";
import {
  segmentTreeCPP,
  segmentTreeJava,
  segmentTreePython,
  segmentTreeJS,
} from "../algorithms/segmentTree";
import { renderHighlightedCode } from "../utils/codeHighlight";

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  Error: "border-rose-400/30 bg-rose-500/10 text-rose-100",
};

const LEVEL_HEIGHT = 80;
const NODE_WIDTH = 50;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function SegmentTreeVisualizerPage() {
  const navigate = useNavigate();
  useDocumentTitle("Segment Tree");

  const [dataArray, setDataArray] = useState([1, 3, 5, 7, 9, 11]);
  const [nodesList, setNodesList] = useState([]);
  const [edgesList, setEdgesList] = useState([]);

  const [speed, setSpeed] = useState(400);
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Tree initialized. Ready for operations.",
  );

  const [inputArrayStr, setInputArrayStr] = useState("1,3,5,7,9,11");
  const [queryL, setQueryL] = useState("0");
  const [queryR, setQueryR] = useState("5");
  const [updateIdx, setUpdateIdx] = useState("2");
  const [updateVal, setUpdateVal] = useState("8");

  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");

  const activeCode =
    selectedLanguage === "C++"
      ? segmentTreeCPP
      : selectedLanguage === "Java"
        ? segmentTreeJava
        : selectedLanguage === "Python"
          ? segmentTreePython
          : segmentTreeJS;

  // Tree representation mapping nodeIndex -> NodeData
  const treeMapRef = useRef(new Map());

  const calculateLayout = useCallback((arr) => {
    const n = arr.length;
    if (n === 0) return { nodes: [], edges: [] };

    const newNodes = [];
    const newEdges = [];
    const padding = 60;
    const canvasWidth = Math.max(800, n * 80 + padding * 2);
    const leafSpacing = (canvasWidth - padding * 2) / n;

    const buildTree = (nodeIdx, start, end, depth) => {
      let x, y, val;
      y = depth * LEVEL_HEIGHT + 40;

      if (start === end) {
        x = padding + start * leafSpacing + leafSpacing / 2;
        val = arr[start];
      } else {
        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * nodeIdx + 1;
        const rightChild = 2 * nodeIdx + 2;

        const leftRes = buildTree(leftChild, start, mid, depth + 1);
        const rightRes = buildTree(rightChild, mid + 1, end, depth + 1);

        x = (leftRes.x + rightRes.x) / 2;
        val = leftRes.val + rightRes.val;

        newEdges.push({
          id: `e-${nodeIdx}-${leftChild}`,
          sourceId: nodeIdx,
          targetId: leftChild,
          status: "default",
        });
        newEdges.push({
          id: `e-${nodeIdx}-${rightChild}`,
          sourceId: nodeIdx,
          targetId: rightChild,
          status: "default",
        });
      }

      const nodeData = {
        id: nodeIdx,
        start,
        end,
        val,
        x,
        y,
        status: "default", // default, visiting, found, out-of-bounds, modified
      };
      newNodes.push(nodeData);
      treeMapRef.current.set(nodeIdx, nodeData);
      return nodeData;
    };

    treeMapRef.current.clear();
    buildTree(0, 0, n - 1, 0);
    return { nodes: newNodes, edges: newEdges };
  }, []);

  const commitGraphState = useCallback(
    (status = null) => {
      setNodesList(Array.from(treeMapRef.current.values()));
      const newEdges = [];
      treeMapRef.current.forEach((node, nodeIdx) => {
        const leftChild = 2 * nodeIdx + 1;
        const rightChild = 2 * nodeIdx + 2;

        // Find existing edge statuses, if they exist
        let leftEdgeStatus = "default";
        let rightEdgeStatus = "default";

        edgesList.forEach((e) => {
          if (e.sourceId === nodeIdx) {
            if (e.targetId === leftChild) leftEdgeStatus = e.status;
            if (e.targetId === rightChild) rightEdgeStatus = e.status;
          }
        });

        if (treeMapRef.current.has(leftChild)) {
          newEdges.push({
            id: `e-${nodeIdx}-${leftChild}`,
            sourceId: nodeIdx,
            targetId: leftChild,
            status: leftEdgeStatus,
          });
        }
        if (treeMapRef.current.has(rightChild)) {
          newEdges.push({
            id: `e-${nodeIdx}-${rightChild}`,
            sourceId: nodeIdx,
            targetId: rightChild,
            status: rightEdgeStatus,
          });
        }
      });
      setEdgesList(newEdges);
      if (status) setRunStatus(status);
    },
    [edgesList],
  );

  const setNodeStatus = (nodeIdx, status) => {
    const node = treeMapRef.current.get(nodeIdx);
    if (node) {
      node.status = status;
      treeMapRef.current.set(nodeIdx, { ...node }); // trigger shallow difference
    }
  };

  const setEdgeStatus = (u, v, status) => {
    setEdgesList((prev) =>
      prev.map((e) =>
        e.sourceId === u && e.targetId === v ? { ...e, status } : e,
      ),
    );
  };

  const updateNodeVal = (nodeIdx, val) => {
    const node = treeMapRef.current.get(nodeIdx);
    if (node) {
      node.val = val;
      treeMapRef.current.set(nodeIdx, { ...node });
    }
  };

  const clearStatuses = () => {
    treeMapRef.current.forEach((node) => {
      node.status = "default";
      treeMapRef.current.set(node.id, { ...node });
    });
    setEdgesList((prev) => prev.map((e) => ({ ...e, status: "default" })));
    commitGraphState();
  };

  useEffect(() => {
    const layout = calculateLayout(dataArray);
    setNodesList(layout.nodes);
    setEdgesList(layout.edges);
  }, [dataArray, calculateLayout]);

  const handleBuild = () => {
    const arr = inputArrayStr
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (arr.length === 0) {
      setStatusMessage("Please enter a valid array of numbers.");
      return;
    }
    if (arr.length > 20) {
      setStatusMessage("Array size up to 20 is optimal for visualization.");
      return;
    }
    setDataArray(arr);
    setStatusMessage(`Built Segment Tree for array of size ${arr.length}.`);
    setRunStatus("Completed");
    setQueryL("0");
    setQueryR(String(arr.length - 1));
  };

  const handleQuery = async () => {
    const L = parseInt(queryL);
    const R = parseInt(queryR);
    if (isNaN(L) || isNaN(R) || L > R || L < 0 || R >= dataArray.length) {
      setStatusMessage("Invalid query range.");
      return;
    }

    setIsRunning(true);
    setRunStatus("Running");
    setStatusMessage(`Querying Sum in range [${L}, ${R}]`);
    clearStatuses();

    let sum = 0;

    const queryDFS = async (nodeIdx, start, end) => {
      setNodeStatus(nodeIdx, "visiting");
      commitGraphState();
      await sleep(speed);

      if (R < start || L > end) {
        setNodeStatus(nodeIdx, "out-of-bounds");
        commitGraphState();
        setStatusMessage(
          `Node [${start}-${end}] is completely outside [${L}, ${R}]. Returning 0.`,
        );
        await sleep(speed);
        return 0;
      }

      if (L <= start && end <= R) {
        setNodeStatus(nodeIdx, "found");
        commitGraphState();
        setStatusMessage(
          `Node [${start}-${end}] is entirely inside [${L}, ${R}]. Returning ${treeMapRef.current.get(nodeIdx).val}.`,
        );
        await sleep(speed);
        return treeMapRef.current.get(nodeIdx).val;
      }

      setStatusMessage(
        `Node [${start}-${end}] partially overlaps [${L}, ${R}]. Splitting query.`,
      );
      await sleep(speed);

      const mid = Math.floor((start + end) / 2);
      const leftChild = 2 * nodeIdx + 1;
      const rightChild = 2 * nodeIdx + 2;

      setEdgeStatus(nodeIdx, leftChild, "traversed");
      const p1 = await queryDFS(leftChild, start, mid);

      setEdgeStatus(nodeIdx, rightChild, "traversed");
      const p2 = await queryDFS(rightChild, mid + 1, end);

      setNodeStatus(nodeIdx, "found");
      commitGraphState();
      setStatusMessage(
        `Node [${start}-${end}] returns sum of children: ${p1} + ${p2} = ${p1 + p2}.`,
      );
      await sleep(speed);

      return p1 + p2;
    };

    sum = await queryDFS(0, 0, dataArray.length - 1);

    setRunStatus("Completed");
    setStatusMessage(`Query Range [${L}, ${R}] completed. Final Sum: ${sum}`);
    setIsRunning(false);
  };

  const handleUpdate = async () => {
    const idx = parseInt(updateIdx);
    const val = parseInt(updateVal);
    if (isNaN(idx) || isNaN(val) || idx < 0 || idx >= dataArray.length) {
      setStatusMessage("Invalid update index or value.");
      return;
    }

    setIsRunning(true);
    setRunStatus("Running");
    setStatusMessage(`Updating index ${idx} to value ${val}`);
    clearStatuses();

    const updateDFS = async (nodeIdx, start, end) => {
      setNodeStatus(nodeIdx, "visiting");
      commitGraphState();
      await sleep(speed);

      if (start === end) {
        updateNodeVal(nodeIdx, val);
        setNodeStatus(nodeIdx, "modified");
        commitGraphState();
        setStatusMessage(`Leaf Node [${start}-${end}] updated to ${val}.`);
        await sleep(speed);
        return;
      }

      const mid = Math.floor((start + end) / 2);
      const leftChild = 2 * nodeIdx + 1;
      const rightChild = 2 * nodeIdx + 2;

      if (idx <= mid) {
        setStatusMessage(
          `Target index ${idx} <= mid ${mid}. Going to left child.`,
        );
        setEdgeStatus(nodeIdx, leftChild, "traversed");
        await sleep(speed / 2);
        await updateDFS(leftChild, start, mid);
      } else {
        setStatusMessage(
          `Target index ${idx} > mid ${mid}. Going to right child.`,
        );
        setEdgeStatus(nodeIdx, rightChild, "traversed");
        await sleep(speed / 2);
        await updateDFS(rightChild, mid + 1, end);
      }

      const leftVal = treeMapRef.current.get(leftChild).val;
      const rightVal = treeMapRef.current.get(rightChild).val;
      updateNodeVal(nodeIdx, leftVal + rightVal);
      setNodeStatus(nodeIdx, "modified");
      commitGraphState();
      setStatusMessage(
        `Node [${start}-${end}] updated sum to ${leftVal} + ${rightVal} = ${leftVal + rightVal}.`,
      );
      await sleep(speed);
    };

    await updateDFS(0, 0, dataArray.length - 1);

    // Update the base data array silently
    const newData = [...dataArray];
    newData[idx] = val;
    setDataArray(newData);

    setRunStatus("Completed");
    setStatusMessage(`Update at index ${idx} completed.`);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearStatuses();
    setStatusMessage("Visualizations reset. Ready for operations.");
    setRunStatus("Idle");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch {}
  };

  const handleDownloadCode = () => {
    let extension = ".cpp";
    if (selectedLanguage === "Python") extension = ".py";
    if (selectedLanguage === "Java") extension = ".java";
    if (selectedLanguage === "JavaScript") extension = ".js";

    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SegmentTree${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // UI colors based on status
  const getNodeStyles = (status) => {
    let base = "bg-slate-800 border-slate-600 text-slate-300";
    if (status === "visiting")
      base =
        "bg-amber-500/20 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110 z-20";
    else if (status === "found")
      base =
        "bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.3)]";
    else if (status === "out-of-bounds")
      base = "bg-rose-500/10 border-rose-400/40 text-rose-300 opacity-60";
    else if (status === "modified")
      base =
        "bg-purple-500/20 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.4)] scale-105 z-10";

    return base;
  };

  const getEdgeStyles = (status) => {
    if (status === "traversed")
      return "stroke-amber-400 stroke-2 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]";
    return "stroke-slate-700 stroke-1";
  };

  const minX =
    nodesList.length > 0 ? Math.min(...nodesList.map((n) => n.x)) - 50 : 0;
  const maxX =
    nodesList.length > 0 ? Math.max(...nodesList.map((n) => n.x)) + 50 : 800;
  const maxY =
    nodesList.length > 0 ? Math.max(...nodesList.map((n) => n.y)) + 100 : 500;
  const vbWidth = Math.max(800, maxX - minX);
  const vbHeight = Math.max(500, maxY);

  return (
    <div className="visualizer-page font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="visualizer-ambient-layer pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(56,189,248,0.12),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(15,23,42,0.6))]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl backdrop-blur sm:p-7"
      >
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
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
              <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-200">
                Range Queries
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Segment Tree
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl">
              A versatile data structure used for storing information about
              intervals, or segments. It allows querying which of the stored
              segments contain a given point, and handles updates effectively.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-30">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Total Nodes
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-200">
                  {nodesList.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-30">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Build Time
                </p>
                <p className="mt-1 text-xl font-bold text-cyan-200">O(N)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-30">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Query/Update
                </p>
                <p className="mt-1 text-xl font-bold text-purple-200">
                  O(log N)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 min-w-62.5 w-full md:w-auto">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Activity size={14} className="text-purple-300" /> Live Logs
            </p>
            <p className="mt-3 text-sm font-semibold text-white h-10">
              {statusMessage}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/10">
              {[
                { label: "Visiting/Path", color: "bg-amber-500" },
                { label: "Valid segment", color: "bg-emerald-500" },
                { label: "Out of bounds", color: "bg-rose-500" },
                { label: "Updated Node", color: "bg-purple-500" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase"
                >
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[350px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur h-fit">
          <div className="mb-5 flex items-center gap-2">
            <Network size={18} className="text-purple-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Tree Operations
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Array (comma separated)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ListPlus
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    value={inputArrayStr}
                    onChange={(e) => setInputArrayStr(e.target.value)}
                    disabled={isRunning}
                    placeholder="e.g. 1, 3, 5, 7"
                    className="w-full rounded-xl bg-slate-900/70 border border-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/50"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBuild}
                  disabled={isRunning}
                  className="flex items-center justify-center rounded-xl bg-purple-500/20 px-4 text-sm font-bold text-purple-100 border border-purple-400/30 hover:bg-purple-500/30 disabled:opacity-50"
                >
                  Build
                </motion.button>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Range Sum Query</span>
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400 text-sm">L:</span>
                  <input
                    type="number"
                    value={queryL}
                    onChange={(e) => setQueryL(e.target.value)}
                    disabled={isRunning}
                    className="w-full rounded-xl bg-slate-900/70 border border-white/10 py-2 px-3 text-sm text-white outline-none focus:border-blue-500/50"
                  />
                  <span className="text-slate-400 text-sm">R:</span>
                  <input
                    type="number"
                    value={queryR}
                    onChange={(e) => setQueryR(e.target.value)}
                    disabled={isRunning}
                    className="w-full rounded-xl bg-slate-900/70 border border-white/10 py-2 px-3 text-sm text-white outline-none focus:border-blue-500/50"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleQuery}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-2.5 text-sm font-bold text-blue-100 border border-blue-400/20 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  <Search size={14} /> Run Query
                </motion.button>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Point Update</span>
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400 text-sm">Idx:</span>
                  <input
                    type="number"
                    value={updateIdx}
                    onChange={(e) => setUpdateIdx(e.target.value)}
                    disabled={isRunning}
                    className="w-full rounded-xl bg-slate-900/70 border border-white/10 py-2 px-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-slate-400 text-sm">Val:</span>
                  <input
                    type="number"
                    value={updateVal}
                    onChange={(e) => setUpdateVal(e.target.value)}
                    disabled={isRunning}
                    className="w-full rounded-xl bg-slate-900/70 border border-white/10 py-2 px-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpdate}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-100 border border-emerald-400/20 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <Edit2 size={14} /> Update Node
                </motion.button>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Animation Speed</span> <span>{speed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
                disabled={isRunning}
                className="w-full accent-purple-400"
              />
            </div>

            <div className="pt-2 border-t border-white/10 flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReset}
                disabled={isRunning}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white border border-white/10 hover:bg-white/10 disabled:opacity-50"
              >
                <RotateCcw size={16} /> Reset State
              </motion.button>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 shadow-2xl relative overflow-hidden min-h-125">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>

          {nodesList.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <p className="text-slate-400 text-sm bg-slate-900/80 px-4 py-2 rounded-full border border-white/5">
                Segment Tree is currently empty. Build the tree with an array.
              </p>
            </div>
          )}

          <div className="w-full h-full absolute inset-0 overflow-auto ll-scrollbar p-8">
            <div
              className="relative mx-auto transition-all"
              style={{
                width: Math.max(800, vbWidth),
                height: Math.max(500, vbHeight),
              }}
            >
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: "visible" }}
              >
                <AnimatePresence>
                  {edgesList.map((edge) => {
                    const source = nodesList.find(
                      (n) => n.id === edge.sourceId,
                    );
                    const target = nodesList.find(
                      (n) => n.id === edge.targetId,
                    );
                    if (!source || !target) return null;

                    return (
                      <motion.line
                        key={edge.id}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: 1,
                          opacity: 1,
                          x1: source.x,
                          y1: source.y,
                          x2: target.x,
                          y2: target.y,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`transition-colors duration-300 ${getEdgeStyles(edge.status)}`}
                      />
                    );
                  })}
                </AnimatePresence>
              </svg>

              <AnimatePresence>
                {nodesList.map((node) => (
                  <motion.div
                    key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      x: node.x - NODE_WIDTH / 2,
                      y: node.y - NODE_WIDTH / 2,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute w-15 h-15 rounded-full border-2 flex flex-col items-center justify-center transition-colors duration-300 ${getNodeStyles(node.status)}`}
                  >
                    <span className="font-bold text-lg select-none">
                      {node.val}
                    </span>
                    <span className="text-[9px] text-slate-400 opacity-80 -mt-0.5">
                      [{node.start}-{node.end}]
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Code2 size={20} className="text-purple-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              {selectedLanguage} Source
            </span>
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              {["C++", "Java", "Python", "JavaScript"].map((lang) => (
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            >
              {copyState === "copied" ? (
                <CheckCheck size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="ll-scrollbar max-h-125 overflow-auto bg-[#020617] p-6 font-code text-sm leading-relaxed">
          <pre>
            <code>
              {activeCode.split("\n").map((line, i) => (
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
