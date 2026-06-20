import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { trieCPP, trieJava, triePython, trieJS } from "../algorithms/trie";
import { renderHighlightedCode } from "../utils/codeHighlight";

const runStatusStyleMap = {
  Idle: "border-white/15 bg-white/5 text-slate-200",
  Running: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  Error: "border-rose-400/30 bg-rose-500/10 text-rose-100",
};

// Trie Node representation for visualization
class VizNode {
  constructor(id, char, isEndOfWord = false) {
    this.id = id;
    this.char = char;
    this.isEndOfWord = isEndOfWord;
    this.children = {};
    this.x = 0;
    this.y = 0;
    this.status = "default"; // default, visiting, found, not-found
  }
}

// Layout configuration
const LEVEL_HEIGHT = 80;
const NODE_WIDTH = 50;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TrieVisualizerPage() {
  const navigate = useNavigate();
  useDocumentTitle("Trie (Prefix Tree)");

  const [rootNode, setRootNode] = useState(new VizNode("root", "Root"));
  const [nodesList, setNodesList] = useState([]);
  const [edgesList, setEdgesList] = useState([]);

  const [speed, setSpeed] = useState(400);
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Enter a word to insert.");

  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [copyState, setCopyState] = useState("idle");
  const [stats, setStats] = useState({ words: 0, nodes: 1 });

  const activeCode =
    selectedLanguage === "C++"
      ? trieCPP
      : selectedLanguage === "Java"
        ? trieJava
        : selectedLanguage === "Python"
          ? triePython
          : trieJS;

  // Layout engine: calculate coordinates for all nodes
  const calculateLayout = useCallback((virtualRoot) => {
    const leafCounts = new Map();

    // 1. Calculate leaves per subtree
    const calcLeaves = (node) => {
      const childrenKeys = Object.keys(node.children);
      if (childrenKeys.length === 0) {
        leafCounts.set(node.id, 1);
        return 1;
      }
      let count = 0;
      for (let k of childrenKeys) {
        count += calcLeaves(node.children[k]);
      }
      leafCounts.set(node.id, count);
      return count;
    };

    // 2. Assign coordinates
    const assignCoords = (node, depth, minX, maxX) => {
      node.y = depth * LEVEL_HEIGHT;
      node.x = (minX + maxX) / 2;

      const childrenKeys = Object.keys(node.children).sort();
      let currentX = minX;
      const totalLeaves = leafCounts.get(node.id);

      for (let k of childrenKeys) {
        const child = node.children[k];
        const childLeaves = leafCounts.get(child.id);
        const width = (childLeaves / totalLeaves) * (maxX - minX);
        assignCoords(child, depth + 1, currentX, currentX + width);
        currentX += width;
      }
    };

    calcLeaves(virtualRoot);
    assignCoords(virtualRoot, 0, 0, 800);

    // 3. Flatten structure for rendering
    const newNodes = [];
    const newEdges = [];

    const flatten = (node, parentId = null) => {
      newNodes.push({
        id: node.id,
        char: node.char,
        x: node.x,
        y: node.y + 40,
        isEndOfWord: node.isEndOfWord,
        status: node.status,
      });

      if (parentId) {
        newEdges.push({
          id: `e-${parentId}-${node.id}`,
          sourceId: parentId,
          targetId: node.id,
          status:
            node.status === "visiting" || node.status === "found"
              ? "traversed"
              : "default",
        });
      }

      for (let k in node.children) {
        flatten(node.children[k], node.id);
      }
    };

    flatten(virtualRoot);
    return { nodes: newNodes, edges: newEdges };
  }, []);

  // Update state helper to maintain immutability-like behavior and trigger renders
  const commitGraphState = useCallback(
    (virtualRoot, status = null) => {
      const { nodes, edges } = calculateLayout(virtualRoot);
      setNodesList(nodes);
      setEdgesList(edges);
      setRootNode(virtualRoot);
      if (status) setRunStatus(status);

      let wordCount = 0;
      nodes.forEach((n) => {
        if (n.isEndOfWord) wordCount++;
      });
      setStats({ words: wordCount, nodes: nodes.length });
    },
    [calculateLayout],
  );

  // Initial setup
  useEffect(() => {
    commitGraphState(rootNode);
  }, []);

  // Clear statuses back to default
  const clearStatuses = (node) => {
    node.status = "default";
    for (let k in node.children) {
      clearStatuses(node.children[k]);
    }
  };

  const handleInsert = async () => {
    const word = inputValue.trim().toLowerCase();
    if (!word) {
      setStatusMessage("Please enter a word to insert.");
      return;
    }

    setIsRunning(true);
    setRunStatus("Running");
    setStatusMessage(`Inserting: "${word}"`);

    const vr = rootNode;
    clearStatuses(vr);
    commitGraphState(vr);

    let curr = vr;
    curr.status = "visiting";
    commitGraphState(vr);
    await sleep(speed);

    let isNew = false;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      setStatusMessage(`Checking char: '${char}'`);

      if (!curr.children[char]) {
        const newNode = new VizNode(`${curr.id}-${char}-${Date.now()}`, char);
        curr.children[char] = newNode;
        isNew = true;
      }

      // Remove visiting from previous
      curr.status = "default";
      curr = curr.children[char];
      curr.status = "visiting";

      commitGraphState(vr);
      await sleep(speed);
    }

    setStatusMessage(`Marking End of Word for "${word}"`);
    curr.isEndOfWord = true;
    curr.status = "found"; // highlight final
    commitGraphState(vr, "Completed");

    if (isNew) {
      setStatusMessage(`Inserted: "${word}"`);
    } else {
      setStatusMessage(`Word "${word}" already exists.`);
    }

    await sleep(speed * 2);
    curr.status = "default";
    commitGraphState(vr, "Idle");

    setInputValue("");
    setIsRunning(false);
  };

  const handleSearch = async (isPrefixSearch = false) => {
    const word = inputValue.trim().toLowerCase();
    if (!word) {
      setStatusMessage(
        `Please enter a ${isPrefixSearch ? "prefix" : "word"} to search.`,
      );
      return;
    }

    setIsRunning(true);
    setRunStatus("Running");
    setStatusMessage(
      `${isPrefixSearch ? "Prefix " : ""}Searching for: "${word}"`,
    );

    const vr = rootNode;
    clearStatuses(vr);

    let curr = vr;
    curr.status = "visiting";
    commitGraphState(vr);
    await sleep(speed);

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      setStatusMessage(`Matching char: '${char}'`);

      if (curr.children[char]) {
        curr.status = "found"; // Keep path highlighted
        curr = curr.children[char];
        curr.status = "visiting";

        commitGraphState(vr);
        await sleep(speed);
      } else {
        curr.status = "not-found";
        commitGraphState(vr, "Error");
        setStatusMessage(
          `Failed matching '${char}'. ${isPrefixSearch ? "Prefix" : "Word"} not found.`,
        );
        await sleep(speed * 2);
        clearStatuses(vr);
        commitGraphState(vr, "Idle");
        setIsRunning(false);
        return;
      }
    }

    if (isPrefixSearch) {
      curr.status = "found";
      commitGraphState(vr, "Completed");
      setStatusMessage(`Prefix "${word}" exists in Trie.`);
    } else {
      if (curr.isEndOfWord) {
        curr.status = "found";
        commitGraphState(vr, "Completed");
        setStatusMessage(`Word "${word}" found in Trie!`);
      } else {
        curr.status = "not-found";
        commitGraphState(vr, "Error");
        setStatusMessage(
          `Prefix "${word}" matches, but it is not marked as End of Word.`,
        );
      }
    }

    await sleep(speed * 2);
    clearStatuses(vr);
    commitGraphState(vr, "Idle");
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    const newRoot = new VizNode("root", "Root");
    setRootNode(newRoot);
    commitGraphState(newRoot, "Idle");
    setStatusMessage("Trie reset. Enter a word to insert.");
    setInputValue("");
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
    link.download = `Trie${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // UI colors based on status
  const getNodeStyles = (status, isEnd) => {
    let base = "bg-slate-800 border-slate-600 text-slate-300";
    if (status === "visiting")
      base =
        "bg-amber-500/20 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110 z-20";
    else if (status === "found")
      base =
        "bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.3)]";
    else if (status === "not-found")
      base =
        "bg-rose-500/20 border-rose-400 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.3)] z-20";
    else if (isEnd) base = "bg-purple-500/20 border-purple-400 text-purple-100";

    return base;
  };

  const getEdgeStyles = (status) => {
    if (status === "traversed") return "stroke-emerald-400 stroke-2";
    if (status === "visiting") return "stroke-amber-400 stroke-2";
    return "stroke-slate-700 stroke-1";
  };

  // Calculate dynamic SVG viewbox
  const minX = Math.min(...nodesList.map((n) => n.x)) - 50;
  const maxX = Math.max(...nodesList.map((n) => n.x)) + 50;
  const maxY = Math.max(...nodesList.map((n) => n.y)) + 100;
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
                String Matching
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusStyleMap[runStatus]}`}
              >
                {runStatus}
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Trie (Prefix Tree)
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base max-w-2xl">
              A specialized tree used to efficiently store and retrieve strings,
              commonly used for autocomplete, spell checking, and dictionary
              lookups.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-30">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Total Words
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-200">
                  {stats.words}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-30">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Total Nodes
                </p>
                <p className="mt-1 text-2xl font-bold text-cyan-200">
                  {stats.nodes}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-30">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Ins/Search Time
                </p>
                <p className="mt-1 text-xl font-bold text-purple-200">O(m)</p>
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
                { label: "Root/Normal", color: "bg-slate-700" },
                { label: "End of Word", color: "bg-purple-500" },
                { label: "Visiting", color: "bg-amber-500" },
                { label: "Found", color: "bg-emerald-500" },
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
        {/* Controls */}
        <aside className="rounded-3xl border border-white/10 bg-slate-800/35 p-5 backdrop-blur h-fit">
          <div className="mb-5 flex items-center gap-2">
            <Network size={18} className="text-purple-300" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Trie Operations
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <label className="flex justify-between text-xs text-slate-400 mb-2 uppercase">
                <span>Input Word/Prefix</span>
              </label>
              <div className="relative">
                <TextCursorInput
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  maxLength="12"
                  value={inputValue}
                  onChange={(e) =>
                    setInputValue(e.target.value.replace(/[^a-zA-Z]/g, ""))
                  } // Basic alpha only
                  disabled={isRunning}
                  placeholder="Enter word (a-z)"
                  className="w-full rounded-xl bg-slate-900/70 border border-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInsert();
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInsert}
                disabled={isRunning || !inputValue.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3 text-sm font-bold text-emerald-100 border border-emerald-400/20 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <ArrowDown size={16} /> Insert
              </motion.button>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSearch(false)}
                  disabled={isRunning || !inputValue.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-2.5 text-sm font-bold text-blue-100 border border-blue-400/20 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  <Search size={14} /> Search
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSearch(true)}
                  disabled={isRunning || !inputValue.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-100 border border-cyan-400/20 hover:bg-cyan-500/20 disabled:opacity-50 truncate"
                >
                  <Search size={14} /> Prefix
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
                <RotateCcw size={16} /> Reset Trie
              </motion.button>
            </div>
          </div>
        </aside>

        {/* Visualization Area */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 shadow-2xl relative overflow-hidden min-h-125">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>

          {nodesList.length === 1 && nodesList[0].id === "root" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <p className="text-slate-400 text-sm bg-slate-900/80 px-4 py-2 rounded-full border border-white/5">
                Trie is currently empty. Insert words to build the tree.
              </p>
            </div>
          )}

          <div className="w-full h-full absolute inset-0 overflow-auto ll-scrollbar p-8">
            <div
              className="relative mx-auto"
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
                          ...{
                            x1: source.x,
                            y1: source.y,
                            x2: target.x,
                            y2: target.y,
                          },
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
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      x: node.x - NODE_WIDTH / 2,
                      y: node.y - NODE_WIDTH / 2,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute w-12.5 h-12.5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${getNodeStyles(node.status, node.isEndOfWord)}`}
                  >
                    <span className="font-bold text-lg select-none uppercase">
                      {node.char === "Root" ? "R" : node.char}
                    </span>
                    {node.isEndOfWord && (
                      <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-slate-900 border border-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      {/* Code Section */}
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
              )}{" "}
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
