import { useState, useMemo } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  Search,
  Network,
  Layers,
  Binary,
  BookOpen,
  Filter,
  Zap,
  Clock,
  HardDrive,
} from "lucide-react";

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const sortingAlgorithms = [
  { name: "Bubble Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true, link: "/visualizer/bubble-sort" },
  { name: "Selection Sort", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: false, link: "/visualizer/selection-sort" },
  { name: "Insertion Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true, link: "/visualizer/insertion-sort" },
  { name: "Merge Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: true, link: "/visualizer/merge-sort" },
  { name: "Quick Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", stable: false, link: "/visualizer/quick-sort" },
  { name: "Counting Sort", best: "O(n + k)", avg: "O(n + k)", worst: "O(n + k)", space: "O(k)", stable: true, link: "/visualizer/counting-sort" },
  { name: "Radix Sort", best: "O(nk)", avg: "O(nk)", worst: "O(nk)", space: "O(n + k)", stable: true, link: "/visualizer/radix-sort" },
  { name: "Heap Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)", stable: false },
  { name: "Tim Sort", best: "O(n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: true },
  { name: "Shell Sort", best: "O(n log n)", avg: "O(n^(4/3))", worst: "O(n^(3/2))", space: "O(1)", stable: false },
];

const searchAlgorithms = [
  { name: "Linear Search", best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)", link: "/visualizer/linear-search" },
  { name: "Binary Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", link: "/visualizer/binary-search" },
  { name: "Jump Search", best: "O(1)", avg: "O(√n)", worst: "O(√n)", space: "O(1)" },
  { name: "Interpolation Search", best: "O(1)", avg: "O(log log n)", worst: "O(n)", space: "O(1)" },
  { name: "Exponential Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" },
];

const graphAlgorithms = [
  { name: "DFS (Depth-First)", time: "O(V + E)", space: "O(V)", type: "Traversal", link: "/visualizer/dfs" },
  { name: "BFS (Breadth-First)", time: "O(V + E)", space: "O(V)", type: "Traversal", link: "/visualizer/bfs" },
  { name: "Dijkstra's", time: "O((V + E) log V)", space: "O(V)", type: "Shortest Path", link: "/visualizer/dijkstra" },
  { name: "A* Search", time: "O(E)", space: "O(V)", type: "Shortest Path", link: "/visualizer/astar" },
  { name: "Bellman-Ford", time: "O(V × E)", space: "O(V)", type: "Shortest Path" },
  { name: "Floyd-Warshall", time: "O(V³)", space: "O(V²)", type: "All Pairs SP", link: "/visualizer/floyd-warshall" },
  { name: "Prim's Algorithm", time: "O((V + E) log V)", space: "O(V)", type: "MST", link: "/visualizer/prims" },
  { name: "Kruskal's Algorithm", time: "O(E log E)", space: "O(V)", type: "MST", link: "/visualizer/kruskal" },
  { name: "Topological Sort", time: "O(V + E)", space: "O(V)", type: "Ordering", link: "/visualizer/topological-sort" },
];

const dataStructures = [
  { name: "Array", access: "O(1)", search: "O(n)", insert: "O(n)", remove: "O(n)", space: "O(n)" },
  { name: "Linked List", access: "O(n)", search: "O(n)", insert: "O(1)", remove: "O(1)", space: "O(n)" },
  { name: "Stack", access: "O(n)", search: "O(n)", insert: "O(1)", remove: "O(1)", space: "O(n)", link: "/visualizer/stack" },
  { name: "Queue", access: "O(n)", search: "O(n)", insert: "O(1)", remove: "O(1)", space: "O(n)", link: "/visualizer/queue" },
  { name: "Hash Table", access: "N/A", search: "O(1)*", insert: "O(1)*", remove: "O(1)*", space: "O(n)" },
  { name: "Binary Search Tree", access: "O(log n)", search: "O(log n)", insert: "O(log n)", remove: "O(log n)", space: "O(n)" },
  { name: "AVL Tree", access: "O(log n)", search: "O(log n)", insert: "O(log n)", remove: "O(log n)", space: "O(n)" },
  { name: "Red-Black Tree", access: "O(log n)", search: "O(log n)", insert: "O(log n)", remove: "O(log n)", space: "O(n)" },
  { name: "Heap (Min/Max)", access: "O(1)", search: "O(n)", insert: "O(log n)", remove: "O(log n)", space: "O(n)" },
  { name: "Trie", access: "O(m)", search: "O(m)", insert: "O(m)", remove: "O(m)", space: "O(n × m)", link: "/visualizer/trie" },
];

const complexityScale = [
  { notation: "O(1)", label: "Constant", color: "bg-emerald-500", textColor: "text-emerald-400", rating: "Excellent" },
  { notation: "O(log n)", label: "Logarithmic", color: "bg-green-500", textColor: "text-green-400", rating: "Great" },
  { notation: "O(n)", label: "Linear", color: "bg-lime-500", textColor: "text-lime-400", rating: "Good" },
  { notation: "O(n log n)", label: "Linearithmic", color: "bg-yellow-500", textColor: "text-yellow-400", rating: "Fair" },
  { notation: "O(n²)", label: "Quadratic", color: "bg-orange-500", textColor: "text-orange-400", rating: "Poor" },
  { notation: "O(n³)", label: "Cubic", color: "bg-red-500", textColor: "text-red-400", rating: "Bad" },
  { notation: "O(2ⁿ)", label: "Exponential", color: "bg-rose-600", textColor: "text-rose-400", rating: "Terrible" },
  { notation: "O(n!)", label: "Factorial", color: "bg-rose-800", textColor: "text-rose-300", rating: "Worst" },
];

const filterTabs = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "sorting", label: "Sorting", icon: ArrowUpDown },
  { id: "searching", label: "Searching", icon: Search },
  { id: "graph", label: "Graph", icon: Network },
  { id: "data-structures", label: "Data Structures", icon: Layers },
];

/* ──────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────── */

function getComplexityColor(complexity) {
  if (!complexity) return "text-slate-400";
  const c = complexity.toLowerCase().replace(/\s/g, "");
  if (c === "o(1)" || c === "n/a") return "text-emerald-400 font-bold";
  if (c.includes("loglog")) return "text-green-300 font-bold";
  if (c.includes("logn)") || c === "o(logn)") return "text-green-400 font-bold";
  if (c.includes("√n") || c.includes("sqrtn")) return "text-green-400";
  if (c === "o(n)" || c === "o(m)" || c === "o(k)") return "text-lime-400";
  if (c.includes("nlogn") || c.includes("n+k")) return "text-yellow-400";
  if (c.includes("n²") || c.includes("n^2") || c.includes("nk")) return "text-orange-400";
  if (c.includes("n³") || c.includes("v³") || c.includes("n^(")) return "text-red-400";
  if (c.includes("2^") || c.includes("n!")) return "text-rose-400";
  if (c.includes("v+e") || c.includes("e)")) return "text-lime-400";
  if (c.includes("vlog") || c.includes("elog")) return "text-yellow-400";
  if (c.includes("v×e") || c.includes("v*e")) return "text-orange-400";
  return "text-blue-300";
}

function ComplexityBadge({ value }) {
  return (
    <span className={`font-code text-xs ${getComplexityColor(value)}`}>
      {value}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, iconColor = "text-cyan-400" }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={20} className={iconColor} />
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-400 ml-7">{subtitle}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────
   PAGE COMPONENT
   ────────────────────────────────────────────── */

export default function CheatsheetPage() {
  useDocumentTitle("Algorithm Complexity Cheatsheet");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const show = (section) => activeFilter === "all" || activeFilter === section;

  const filteredSorting = useMemo(() =>
    sortingAlgorithms.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filteredSearching = useMemo(() =>
    searchAlgorithms.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filteredGraph = useMemo(() =>
    graphAlgorithms.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filteredDS = useMemo(() =>
    dataStructures.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const MotionSection = motion.section;

  return (
    <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.15),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.12),transparent_34%)]" />

      {/* ── Header ── */}
      <MotionSection initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/algorithms"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Algorithms
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
                Reference Guide
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Complexity Cheatsheet
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
              Quick reference for time &amp; space complexities of common algorithms and data structures.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search algorithms..."
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </MotionSection>

      {/* ── Complexity Scale Legend ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Complexity Scale</h3>
          <span className="text-[10px] text-slate-400 ml-auto">Best → Worst</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {complexityScale.map((item) => (
            <div
              key={item.notation}
              className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-center transition-all hover:bg-white/10"
            >
              <div className={`mx-auto mb-1.5 h-2 w-full rounded-full ${item.color}`} />
              <p className={`font-code text-sm font-bold ${item.textColor}`}>{item.notation}</p>
              <p className="text-[10px] text-slate-400">{item.label}</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase">{item.rating}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Sorting Algorithms ── */}
      {show("sorting") && filteredSorting.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <SectionTitle icon={ArrowUpDown} title="Sorting Algorithms" subtitle="Comparison of common sorting algorithms" iconColor="text-violet-400" />
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Algorithm</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <div className="flex items-center justify-center gap-1"><Clock size={12} /> Best</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-yellow-400">
                      <div className="flex items-center justify-center gap-1"><Clock size={12} /> Average</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-rose-400">
                      <div className="flex items-center justify-center gap-1"><Clock size={12} /> Worst</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-400">
                      <div className="flex items-center justify-center gap-1"><HardDrive size={12} /> Space</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Stable</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorting.map((algo, idx) => (
                    <tr key={algo.name} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}>
                      <td className="px-4 py-3 font-semibold text-white">
                        {algo.link ? (
                          <Link to={algo.link} className="text-blue-300 hover:text-blue-200 hover:underline">{algo.name}</Link>
                        ) : algo.name}
                      </td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.best} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.avg} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.worst} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.space} /></td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${algo.stable ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                          {algo.stable ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Searching Algorithms ── */}
      {show("searching") && filteredSearching.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <SectionTitle icon={Search} title="Searching Algorithms" subtitle="Time complexity for finding elements" iconColor="text-cyan-400" />
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Algorithm</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-emerald-400">Best</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-yellow-400">Average</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-rose-400">Worst</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-400">Space</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSearching.map((algo, idx) => (
                    <tr key={algo.name} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}>
                      <td className="px-4 py-3 font-semibold text-white">
                        {algo.link ? (
                          <Link to={algo.link} className="text-blue-300 hover:text-blue-200 hover:underline">{algo.name}</Link>
                        ) : algo.name}
                      </td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.best} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.avg} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.worst} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.space} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Graph Algorithms ── */}
      {show("graph") && filteredGraph.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
          <SectionTitle icon={Network} title="Graph Algorithms" subtitle="Traversal, shortest path, and MST algorithms" iconColor="text-emerald-400" />
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Algorithm</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-yellow-400">Time</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-400">Space</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGraph.map((algo, idx) => (
                    <tr key={algo.name} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}>
                      <td className="px-4 py-3 font-semibold text-white">
                        {algo.link ? (
                          <Link to={algo.link} className="text-blue-300 hover:text-blue-200 hover:underline">{algo.name}</Link>
                        ) : algo.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">{algo.type}</span>
                      </td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.time} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={algo.space} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Data Structures ── */}
      {show("data-structures") && filteredDS.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <SectionTitle icon={Layers} title="Data Structures" subtitle="Average-case operation complexities (* = amortized)" iconColor="text-amber-400" />
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Structure</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-emerald-400">Access</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-cyan-400">Search</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-yellow-400">Insert</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-rose-400">Delete</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-400">Space</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDS.map((ds, idx) => (
                    <tr key={ds.name} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}>
                      <td className="px-4 py-3 font-semibold text-white">
                        {ds.link ? (
                          <Link to={ds.link} className="text-blue-300 hover:text-blue-200 hover:underline">{ds.name}</Link>
                        ) : ds.name}
                      </td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={ds.access} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={ds.search} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={ds.insert} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={ds.remove} /></td>
                      <td className="px-4 py-3 text-center"><ComplexityBadge value={ds.space} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Quick Tips ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[
          {
            icon: Binary,
            color: "text-emerald-400",
            title: "Big-O Notation",
            desc: "Describes the upper bound of an algorithm's growth rate. It tells you the worst-case scenario.",
          },
          {
            icon: Clock,
            color: "text-cyan-400",
            title: "Time vs Space",
            desc: "Faster algorithms often use more memory. This tradeoff is fundamental in algorithm design.",
          },
          {
            icon: Zap,
            color: "text-amber-400",
            title: "Practical Tips",
            desc: "O(n log n) sorts are optimal for comparison-based sorting. Use hash tables for O(1) lookups.",
          },
        ].map((tip) => (
          <div
            key={tip.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10"
          >
            <tip.icon size={24} className={`mb-3 ${tip.color}`} />
            <h3 className="font-display text-sm font-bold text-white">{tip.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{tip.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-slate-500">
        n = input size • V = vertices • E = edges • k = range of input • m = string/key length • * = amortized
      </p>
    </div>
  );
}
