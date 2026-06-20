import { useMemo, useState, useEffect } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpWideNarrow,
  Binary,
  BrainCircuit,
  Cpu,
  Dices,
  Filter,
  Palette,
  Grid3X3,
  Layers,
  Layers2,
  Search,
  Sparkles,
  Network,
  Vote,
  TimerReset,
  X,
  Zap,
  Hash,
  Shield,
  Waypoints,
  TextSearch,
  Bookmark,
  BookmarkCheck,
  Crown,
  Map,
} from "lucide-react";
import toast from "react-hot-toast";

export const algorithmsCatalog = [
  {
    id: "knapsack",
    title: "0/1 Knapsack",
    description:
      "A dynamic programming algorithm to find the maximum value subset with a given capacity.",
    path: "/visualizer/knapsack",
    category: "dynamic-programming",
    type: "Dynamic Programming",
    complexity: "O(n * W)",
    level: "Advanced",
    icon: Sparkles,
    gradient: "from-purple-500/25 via-pink-500/15 to-transparent",
    accent: "text-pink-200",
  },
  {
    id: "bubble-sort",
    title: "Bubble Sort",
    description:
      "A simple sorting algorithm that repeatedly compares adjacent elements and swaps them when needed.",
    path: "/visualizer/bubble-sort",
    category: "1d-array-sorting",
    type: "Comparison",
    complexity: "O(n^2)",
    level: "Beginner",
    icon: ArrowUpWideNarrow,
    gradient: "from-cyan-500/25 via-blue-500/15 to-transparent",
    accent: "text-cyan-200",
  },
  {
    id: "selection-sort",
    title: "Selection Sort",
    description:
      "Selects the minimum value from the unsorted part and places it in its final position each pass.",
    path: "/visualizer/selection-sort",
    category: "1d-array-sorting",
    type: "In-place",
    complexity: "O(n^2)",
    level: "Beginner",
    icon: Sparkles,
    gradient: "from-blue-500/25 via-indigo-500/15 to-transparent",
    accent: "text-blue-200",
  },
  {
    id: "quick-sort",
    title: "Quick Sort",
    description:
      "A fast divide-and-conquer algorithm that partitions around a pivot and recursively sorts subarrays.",
    path: "/visualizer/quick-sort",
    category: "1d-array-sorting",
    type: "Divide & Conquer",
    complexity: "O(n log n)",
    level: "Intermediate",
    icon: Zap,
    gradient: "from-cyan-400/25 via-sky-500/15 to-transparent",
    accent: "text-sky-200",
  },
  {
    id: "boyer-moore",
    title: "Boyer-Moore Voting",
    description:
      "Find the majority element in an array (appears more than n/2 times) using a single pass.",
    path: "/visualizer/boyer-moore",
    category: "1d-array-searching",
    type: "Array Search",
    complexity: "O(n)",
    level: "Beginner",
    icon: Vote,
    gradient: "from-orange-500/25 via-amber-500/15 to-transparent",
    accent: "text-amber-200",
  },
  {
    id: "linear-search",
    title: "Linear Search",
    description:
      "Scans values one-by-one from left to right until the target is found.",
    path: "/visualizer/linear-search",
    category: "1d-array-searching",
    type: "Sequential",
    complexity: "O(n)",
    level: "Beginner",
    icon: Search,
    gradient: "from-blue-400/25 via-cyan-500/15 to-transparent",
    accent: "text-cyan-100",
  },
  {
    id: "interpolation-search",
    title: "Interpolation Search",
    description:
      "Probes the array based on the target value distribution in a sorted list for faster retrieval.",
    path: "/visualizer/interpolation-search",
    category: "1d-array-searching",
    type: "Probing",
    complexity: "O(log log n)",
    level: "Intermediate",
    icon: Search,
    gradient: "from-emerald-400/25 via-teal-500/15 to-transparent",
    accent: "text-emerald-100",
  },
  {
    id: "binary-search",
    title: "Binary Search",
    description:
      "Intakes a sorted array to find mid and halfing the array in two",
    path: "/visualizer/binary-search",
    category: "1d-array-searching",
    type: "Divide & Conquer",
    complexity: "O(log n)",
    level: "Beginner",
    icon: Search,
    gradient: "from-blue-400/25 via-cyan-500/15 to-transparent",
    accent: "text-cyan-100",
  },
  {
    id: "counting-sort",
    title: "Counting Sort",
    description:
      "A non-comparison sort that sorts integers by counting the number of objects that have each distinct key value.",
    path: "/visualizer/counting-sort",
    category: "1d-array-sorting",
    type: "Distribution",
    complexity: "O(n)",
    level: "Intermediate",
    icon: Sparkles,
    gradient: "from-pink-500/25 via-red-500/15 to-transparent",
    accent: "text-pink-200",
  },
  {
    id: "bucket-sort",
    title: "Bucket Sort",
    description:
      "A non-comparison sort that distributes elements into multiple buckets, sorts each bucket, and reconstructs the array.",
    path: "/visualizer/bucket-sort",
    category: "1d-array-sorting",
    type: "Distribution",
    complexity: "O(n+k)",
    level: "Intermediate",
    icon: Filter,
    gradient: "from-blue-500/25 via-sky-500/15 to-transparent",
    accent: "text-blue-200",
  },
  {
    id: "radix-sort",
    title: "Radix Sort",
    description:
      "A non-comparative sorting algorithm that sorts integers by processing individual digits.",
    path: "/visualizer/radix-sort",
    category: "1d-array-sorting",
    type: "Distribution",
    complexity: "O(nk)",
    level: "Advanced",
    icon: Sparkles,
    gradient: "from-fuchsia-500/25 via-purple-500/15 to-transparent",
    accent: "text-fuchsia-200",
  },
  {
    id: "merge-sort",
    title: "Merge Sort",
    description:
      "A divide and conquer algorithm that splits the array into halves, recursively sorts them, and merges them.",
    path: "/visualizer/merge-sort",
    category: "1d-array-sorting",
    type: "Divide & Conquer",
    complexity: "O(n log n)",
    level: "Intermediate",
    icon: Layers,
    gradient: "from-indigo-500/25 via-blue-500/15 to-transparent",
    accent: "text-indigo-200",
  },
  {
    id: "heap-sort",
    title: "Heap Sort",
    description:
      "A comparison-based sorting algorithm that uses a binary heap data structure to sort elements efficiently.",
    path: "/visualizer/heap-sort",
    category: "1d-array-sorting",
    type: "Comparison",
    complexity: "O(n log n)",
    level: "Intermediate",
    icon: Layers,
    gradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    accent: "text-emerald-200",
  },
  {
    id: "insertion-sort",
    title: "Insertion Sort",
    description:
      "Builds a sorted array one item at a time by shifting elements that are greater than the key to the right.",
    path: "/visualizer/insertion-sort",
    category: "1d-array-sorting",
    type: "In-place",
    complexity: "O(n^2)",
    level: "Beginner",
    icon: Layers,
    gradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    accent: "text-emerald-200",
  },
  {
    id: "array-traversal-2d",
    title: "2D Array Traversal",
    description:
      "Visualize Row-wise, Column-wise, Diagonal, Spiral, Zigzag and Reverse traversals on a 2D matrix with step-by-step animation.",
    path: "/visualizer/array-traversal",
    category: "2d-array",
    type: "Traversal",
    complexity: "O(m×n)",
    level: "Beginner",
    icon: Grid3X3,
    gradient: "from-sky-500/25 via-indigo-500/15 to-transparent",
    accent: "text-sky-200",
  },
  {
    id: "linked-list",
    title: "Linked List Algorithms",
    description:
      "Visualize Reverse Linked List, Middle Node (slow/fast pointers), and Floyd's Cycle Detection with step-by-step pointer movement and cycle injection.",
    path: "/visualizer/linked-list",
    category: "linked-list",
    type: "Pointers",
    complexity: "O(n)",
    level: "Intermediate",
    icon: Binary,
    gradient: "from-violet-500/25 via-blue-500/15 to-transparent",
    accent: "text-violet-200",
  },
  {
    id: "singly-linked-list-ops",
    title: "SLL Insert & Delete",
    description:
      "Visualize Singly Linked List Insertion (Head, Tail, Position) and Deletion (Head, Tail, By Value) with animated step-by-step pointer manipulation.",
    path: "/visualizer/singly-linked-list",
    category: "linked-list",
    type: "Pointers",
    complexity: "O(n)",
    level: "Beginner",
    icon: Binary,
    gradient: "from-emerald-500/25 via-cyan-500/15 to-transparent",
    accent: "text-emerald-200",
  },
  {
    id: "doubly-linked-list-ops",
    title: "DLL Insert & Delete",
    description:
      "Visualize Doubly Linked List Insertion (Head, Tail, Position) and Deletion (Head, Tail, By Value) with bidirectional pointer animation. Includes backward traversal and DLL vs SLL comparisons.",
    path: "/visualizer/doubly-linked-list",
    category: "linked-list",
    type: "Pointers",
    complexity: "O(n)",
    level: "Intermediate",
    icon: Binary,
    gradient: "from-purple-500/25 via-blue-500/15 to-transparent",
    accent: "text-purple-200",
  },
  {
    id: "dll-bst-conversion",
    title: "DLL ↔ BST Conversion",
    description:
      "Visualize converting a sorted Doubly Linked List to a height-balanced Binary Search Tree and back, with step-by-step in-order traversal animation and pointer rewiring.",
    path: "/visualizer/dll-to-bst",
    category: "linked-list",
    type: "Conversion",
    complexity: "O(n)",
    level: "Intermediate",
    icon: Binary,
    gradient: "from-purple-500/25 via-indigo-500/15 to-transparent",
    accent: "text-purple-200",
  },
  {
    id: "bankers-algorithm",
    title: "Banker's Algorithm",
    description:
      "A deadlock avoidance algorithm that safely allocates resources to processes by ensuring the system remains in a safe state.",
    path: "/visualizer/bankers-algorithm",
    category: "deadlock-avoidance",
    type: "Deadlock Avoidance",
    complexity: "O(n²×m)",
    level: "Advanced",
    icon: Shield,
    gradient: "from-purple-500/25 via-violet-500/15 to-transparent",
    accent: "text-purple-200",
  },
  {
    id: "prims",
    title: "Prim's Algorithm",
    description:
      "Build a Minimum Spanning Tree by greedily adding the cheapest edge that connects a visited node to an unvisited node.",
    path: "/visualizer/prims",
    category: "mst",
    type: "MST",
    complexity: "O(E log V)",
    level: "Hard",
    icon: Network,
    gradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    accent: "text-emerald-200",
  },
  {
    id: "depth-first-search",
    title: "Depth First Search",
    description:
      "Traverse a tree or graph by exploring as far as possible along each branch before backtracking.",
    path: "/visualizer/dfs",
    category: "graph-searching",
    type: "Traversal",
    complexity: "O(V+E)",
    level: "Intermediate",
    icon: Binary,
    gradient: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
    accent: "text-violet-200",
  },
  {
    id: "breadth-first-search",
    title: "Breadth First Search",
    description:
      "Traverse a graph level by level, visiting all neighbors at the current depth before moving deeper.",
    path: "/visualizer/bfs",
    category: "graph-searching",
    type: "Traversal",
    complexity: "O(V+E)",
    level: "Intermediate",
    icon: Network,
    gradient: "from-blue-500/25 via-cyan-500/15 to-transparent",
    accent: "text-blue-200",
  },
  {
    id: "astar-search",
    title: "A* Pathfinding",
    description:
      "An intelligent pathfinding algorithm that uses heuristics to find the shortest path more efficiently than Dijkstra.",
    path: "/visualizer/astar",
    category: "pathfinding",
    type: "Informed Search",
    complexity: "O(E log V)",
    level: "Intermediate",
    icon: Zap, // Uses the Zap icon to represent speed/efficiency
    gradient: "from-blue-500/25 via-cyan-500/15 to-transparent",
    accent: "text-cyan-200",
  },
  {
    id: "shunting-yard",
    title: "Infix to Postfix (Shunting Yard)",
    description:
      "Convert infix expressions to postfix (RPN) using Dijkstra's Shunting Yard algorithm. Visualize the operator stack, output queue, and precedence rules step-by-step.",
    path: "/visualizer/shunting-yard",
    category: "stack",
    type: "Expression Parsing",
    complexity: "O(n)",
    level: "Intermediate",
    icon: Layers,
    gradient: "from-cyan-500/25 via-amber-500/15 to-transparent",
    accent: "text-amber-200",
  },
  {
    id: "postfix-to-infix",
    title: "Postfix to Infix",
    description:
      "Convert postfix expressions (Reverse Polish Notation) back to infix notation using a stack-based algorithm.",
    path: "/visualizer/postfix-to-infix",
    category: "stack",
    type: "Expression Parsing",
    complexity: "O(n)",
    level: "Beginner",
    icon: Layers2,
    gradient: "from-teal-500/25 via-cyan-500/15 to-transparent",
    accent: "text-teal-200",
  },
  {
    id: "dijkstra",
    title: "Dijkstra's Algorithm",
    description:
      "Finds the shortest paths between nodes in a graph, which may represent road networks.",
    path: "/visualizer/dijkstra",
    category: "pathfinding",
    type: "Greedy",
    complexity: "O(E + V log V)",
    level: "Advanced",
    icon: Waypoints,
    gradient: "from-orange-500/25 via-amber-500/15 to-transparent",
    accent: "text-orange-200",
  },
  {
    id: "kruskal",
    title: "Kruskal's Algorithm",
    description:
      "Finds a Minimum Spanning Tree (MST) for a connected weighted graph using a greedy approach.",
    path: "/visualizer/kruskal",
    category: "mst",
    type: "Greedy",
    complexity: "O(E log E)",
    level: "Intermediate",
    icon: Network,
    gradient: "from-orange-500/25 via-amber-500/15 to-transparent",
    accent: "text-orange-200",
  },
  {
    id: "topological-sort",
    title: "Topological Sort",
    description:
      "Linear ordering of vertices in a Directed Acyclic Graph (DAG) using Kahn's Algorithm.",
    path: "/visualizer/topological-sort",
    category: "graph-sorting",
    type: "Sorting",
    complexity: "O(V+E)",
    level: "Intermediate",
    icon: Network,
    gradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    accent: "text-emerald-200",
  },
  {
    id: "kosaraju",
    title: "Kosaraju's Algorithm",
    description:
      "Finds all Strongly Connected Components (SCCs) in a directed graph using two DFS passes.",
    path: "/visualizer/kosaraju",
    category: "graph-searching",
    type: "DFS / Graph",
    complexity: "O(V+E)",
    level: "Advanced",
    icon: Network,
    gradient: "from-indigo-500/25 via-blue-500/15 to-transparent",
    accent: "text-indigo-200",
  },
  {
    id: "tarjan",
    title: "Tarjan's Algorithm",
    description:
      "Finds all Strongly Connected Components (SCCs) in a directed graph using a single DFS pass and low-link values.",
    path: "/visualizer/tarjan",
    category: "graph-searching",
    type: "DFS / Graph",
    complexity: "O(V+E)",
    level: "Advanced",
    icon: Network,
    gradient: "from-blue-500/25 via-indigo-500/15 to-transparent",
    accent: "text-blue-200",
  },
  {
    id: "bellman-ford",
    title: "Bellman-Ford Algorithm",
    description:
      "Computes the shortest paths from a single source vertex to all other vertices. Handles negative weights.",
    path: "/visualizer/bellman-ford",
    category: "pathfinding",
    type: "Dynamic Programming",
    complexity: "O(V * E)",
    level: "Advanced",
    icon: Waypoints,
    gradient: "from-rose-500/25 via-red-500/15 to-transparent",
    accent: "text-rose-200",
  },
  {
    id: "huffman-coding",
    title: "Huffman Coding",
    description:
      "An optimal prefix code algorithm used for lossless data compression.",
    path: "/visualizer/huffman-coding",
    category: "greedy",
    type: "Greedy",
    complexity: "O(n log n)",
    level: "Intermediate",
    icon: Network,
    gradient: "from-amber-500/25 via-orange-500/15 to-transparent",
    accent: "text-amber-200",
  },
  {
    id: "floyd-warshall",
    title: "Floyd Warshall Algorithm",
    description:
      "Computes the shortest paths between all pairs of nodes using Dynamic Programming.",
    path: "/visualizer/floyd-warshall",
    category: "pathfinding",
    type: "Dynamic Programming",
    complexity: "O(V^3)",
    level: "Advanced",
    icon: Waypoints,
    gradient: "from-rose-500/25 via-red-500/15 to-transparent",
    accent: "text-rose-200",
  },
  {
    id: "stack",
    title: "Stack Push-Pop",
    description:
      "Visualize LIFO (Last In, First Out) stack operations with animated push and pop demonstrations.",
    path: "/visualizer/stack",
    category: "stack",
    type: "LIFO",
    complexity: "O(1)",
    level: "Beginner",
    icon: Layers2,
    gradient: "from-violet-500/25 via-purple-500/15 to-transparent",
    accent: "text-violet-200",
  },
  {
    id: "queue",
    title: "Queue Enqueue-Dequeue",
    description:
      "Visualize FIFO (First In, First Out) queue operations with animated enqueue and dequeue demonstrations.",
    path: "/visualizer/queue",
    category: "queue",
    type: "FIFO",
    complexity: "O(1)",
    level: "Beginner",
    icon: Layers2,
    gradient: "from-teal-500/25 via-cyan-500/15 to-transparent",
    accent: "text-teal-200",
  },
  {
    id: "trie",
    title: "Trie (Prefix Tree)",
    description:
      "A tree data structure used to efficiently store and retrieve keys in a dataset of strings.",
    path: "/visualizer/trie",
    category: "string-matching",
    type: "Tree",
    complexity: "O(m)",
    level: "Intermediate",
    icon: TextSearch,
    gradient: "from-purple-500/25 via-fuchsia-500/15 to-transparent",
    accent: "text-purple-200",
  },
  {
    id: "n-queens",
    title: "N-Queens Problem",
    description:
      "Place N queens on an N×N chessboard so that no two queens attack each other using backtracking.",
    path: "/visualizer/n-queens",
    category: "backtracking",
    type: "Backtracking",
    complexity: "O(N!)",
    level: "Advanced",
    icon: Crown,
    gradient: "from-amber-500/25 via-orange-500/15 to-transparent",
    accent: "text-amber-200",
  },
  {
    id: "sudoku-solver",
    title: "Sudoku Solver",
    description:
      "Fill the 9×9 grid perfectly using recursive backtracking. Exploring possibilities cell by cell until a valid solution forms.",
    path: "/visualizer/sudoku-solver",
    category: "backtracking",
    type: "Backtracking",
    complexity: "O(9^(N×N))",
    level: "Advanced",
    icon: Grid3X3,
    gradient: "from-sky-500/25 via-blue-500/15 to-transparent",
    accent: "text-sky-200",
  },
  {
    id: "rat-in-a-maze",
    title: "Rat in a Maze",
    description:
      "Find paths for a rat from source to destination in a maze using recursive backtracking.",
    path: "/visualizer/rat-in-a-maze",
    category: "backtracking",
    type: "Backtracking",
    complexity: "O(4^(N×N))",
    level: "Advanced",
    icon: Map,
    gradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    accent: "text-emerald-200",
  },
  {
    id: "segment-tree",
    title: "Segment Tree",
    description:
      "A versatile data structure used for storing information about intervals, or segments, allowing fast range queries and updates.",
    path: "/visualizer/segment-tree",
    category: "range-queries",
    type: "Tree",
    complexity: "O(log N)",
    level: "Advanced",
    icon: Network,
    gradient: "from-blue-500/25 via-indigo-500/15 to-transparent",
    accent: "text-blue-200",
  },
  {
    id: "kadane",
    title: "Kadane's Algorithm",
    description:
      "An elegant dynamic programming algorithm to find the maximum contiguous subarray sum in O(n) time.",
    path: "/visualizer/kadane",
    category: "dynamic-programming",
    type: "Dynamic Programming",
    complexity: "O(n)",
    level: "Intermediate",
    icon: Zap,
    gradient: "from-amber-500/25 via-orange-500/15 to-transparent",
    accent: "text-amber-200",
  },
  {
    id: "rabin-karp",
    title: "Rabin-Karp Algorithm",
    description:
      "A string-searching algorithm that uses rolling hashes to efficiently find pattern matches in a text.",
    path: "/visualizer/rabin-karp",
    category: "string-matching",
    type: "Hashing",
    complexity: "O(n+m)",
    level: "Intermediate",
    icon: TextSearch,
    gradient: "from-pink-500/25 via-rose-500/15 to-transparent",
    accent: "text-rose-200",
  },
  {
    id: "hash-table",
    title: "Hash Table",
    description:
      "Visualize Insert, Search, and Delete with Separate Chaining, Linear Probing, Quadratic Probing, and Double Hashing collision strategies.",
    path: "/visualizer/hash-table",
    category: "hash-table",
    type: "Hashing",
    complexity: "O(1) avg",
    level: "Intermediate",
    icon: Hash,
    gradient: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
    accent: "text-violet-200",
  },
  {
    id: "cpu-scheduling",
    title: "CPU Scheduling",
    description:
      "Visualize Preemptive CPU Scheduling Algorithms including Round Robin (RR) and Shortest Remaining Time First (SRTF).",
    path: "/visualizer/cpu-scheduling",
    category: "os-algorithms",
    type: "Scheduling",
    complexity: "O(n log n)",
    level: "Intermediate",
    icon: Cpu,
    gradient: "from-cyan-500/25 via-blue-500/15 to-transparent",
    accent: "text-cyan-200",
  },
  {
    id: "map-coloring",
    title: "Map Coloring",
    description:
      "Color a map or graph such that no two adjacent regions share the same color using backtracking constraints.",
    path: "/visualizer/map-coloring",
    category: "backtracking",
    type: "Backtracking",
    complexity: "O(m^V)",
    level: "Advanced",
    icon: Palette,
    gradient: "from-pink-500/25 via-purple-500/15 to-transparent",
    accent: "text-pink-200",
  },
];

const filterTabs = [
  { id: "all", label: "All" },
  { id: "1d-array-sorting", label: "Sorting (1D Array)" },
  { id: "2d-array", label: "2D Array" },
  { id: "graph-sorting", label: "Graph Sorting" },
  { id: "1d-array-searching", label: "1D Array Searching" },
  { id: "graph-searching", label: "Graph Searching" },
  { id: "linked-list", label: "Linked List" },
  { id: "stack", label: "Stack Operations" },
  { id: "queue", label: "Queue Operations" },
  { id: "pathfinding", label: "Pathfinding" },
  { id: "mst", label: "Minimum Spanning Tree" },
  { id: "greedy", label: "Greedy Algorithms" },
  { id: "string-matching", label: "String Matching" },
  { id: "dynamic-programming", label: "Dynamic Programming" },
  { id: "range-queries", label: "Range Queries" },
  { id: "hash-table", label: "Hash Table" },
  { id: "deadlock-avoidance", label: "Deadlock Avoidance" },
  { id: "os-algorithms", label: "Operating Systems" },
  { id: "backtracking", label: "Backtracking" },
];

const levelTabs = ["All", "Beginner", "Intermediate", "Advanced"];

const levelRank = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

const complexityRank = {
  "O(1)": 1,
  "O(log n)": 2,
  "O(n)": 3,
  "O(n log n)": 4,
  "O(n^2)": 5,
};

export default function Algorithms({ defaultFilter = "all" }) {
  useDocumentTitle("Algorithms");

  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState(defaultFilter);

  // Update activeFilter when defaultFilter prop changes (e.g., navigating between /algorithms and /favorites)
  useEffect(() => {
    setActiveFilter(defaultFilter);
  }, [defaultFilter]);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [activeLevel, setActiveLevel] = useState("All");
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem("algo_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [spotlightId, setSpotlightId] = useState(algorithmsCatalog[0].id);
  const prefersReducedMotion = useReducedMotion();

  const MotionSection = motion.section;
  const MotionArticle = motion.article;
  const MotionDiv = motion.div;

  const filteredAlgorithms = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();

    const result = algorithmsCatalog.filter((algorithm) => {
      const matchesFilter =
        activeFilter === "all" || algorithm.category === activeFilter;
      const matchesLevel =
        activeLevel === "All" || algorithm.level === activeLevel;
      const matchesBookmark =
        activeFilter !== "bookmarked" || bookmarks.includes(algorithm.id);
      const matchesSearch =
        normalizedQuery.length === 0 ||
        algorithm.title.toLowerCase().includes(normalizedQuery) ||
        algorithm.description.toLowerCase().includes(normalizedQuery) ||
        algorithm.type.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesSearch && matchesLevel && matchesBookmark;
    });

    if (sortBy === "name") {
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "complexity") {
      return [...result].sort(
        (a, b) =>
          (complexityRank[a.complexity] ?? 99) -
          (complexityRank[b.complexity] ?? 99),
      );
    }

    if (sortBy === "level") {
      return [...result].sort(
        (a, b) => (levelRank[a.level] ?? 99) - (levelRank[b.level] ?? 99),
      );
    }

    return result;
  }, [activeFilter, activeLevel, searchText, sortBy]);

  const spotlightAlgorithm = useMemo(() => {
    return (
      filteredAlgorithms.find((algorithm) => algorithm.id === spotlightId) ??
      filteredAlgorithms[0] ??
      algorithmsCatalog[0]
    );
  }, [filteredAlgorithms, spotlightId]);

  const sortingCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "1d-array-sorting",
  ).length;
  const arraySearchingCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "1d-array-searching",
  ).length;
  const graphSearchingCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "graph-searching",
  ).length;
  const linkedListCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "linked-list",
  ).length;
  const stackCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "stack",
  ).length;
  const twoDArrayCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "2d-array",
  ).length;
  const stringMatchingCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "string-matching",
  ).length;
  const hashTableCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "hash-table",
  ).length;
   const osCount = algorithmsCatalog.filter(
    (algorithm) => algorithm.category === "os-algorithms" || algorithm.category === "deadlock-avoidance",
  ).length;
  const hasActiveFilters =
    activeFilter !== "all" ||
    activeLevel !== "All" ||
    searchText.trim().length > 0;
  const SpotlightIcon = spotlightAlgorithm.icon;

  const handleResetFilters = () => {
    setActiveFilter("all");
    setActiveLevel("All");
    setSearchText("");
    setSortBy("featured");
  };

  const toggleBookmark = (id) => {
    const isBookmarked = bookmarks.includes(id);
    const newBookmarks = isBookmarked
      ? bookmarks.filter((b) => b !== id)
      : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem("algo_bookmarks", JSON.stringify(newBookmarks));

    const algorithm = algorithmsCatalog.find((a) => a.id === id);
    if (isBookmarked) {
      toast.success(
        `${algorithm?.title || "Algorithm"} removed from favorites`,
      );
    } else {
      toast.success(`${algorithm?.title || "Algorithm"} added to favorites`);
    }
  };

  const handleRandomSpotlight = () => {
    const source =
      filteredAlgorithms.length > 0 ? filteredAlgorithms : algorithmsCatalog;
    const randomAlgorithm = source[Math.floor(Math.random() * source.length)];
    setSpotlightId(randomAlgorithm.id);
  };

  // Logic to determine which Categories to display headers for
  const categoriesToDisplay = filterTabs.filter((tab) => tab.id !== "all");

  return (
    <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_36%),linear-gradient(to_bottom,rgba(15,23,42,0.9),rgba(15,23,42,0.4))]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(125deg,rgba(16,185,129,0.08)_0%,rgba(14,165,233,0.02)_48%,rgba(245,158,11,0.08)_100%)]" />
      <MotionDiv
        className="pointer-events-none absolute -left-12 top-24 -z-10 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, -18, 0], opacity: [0.45, 0.8, 0.45] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { repeat: Infinity, duration: 6.4, ease: "easeInOut" }
        }
      />
      <MotionDiv
        className="pointer-events-none absolute -right-16 top-36 -z-10 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, 20, 0], opacity: [0.35, 0.65, 0.35] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { repeat: Infinity, duration: 7.2, ease: "easeInOut" }
        }
      />

      <MotionSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-6 shadow-2xl shadow-slate-950/45 backdrop-blur sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <BrainCircuit size={14} />
              Algorithm Explorer
            </p>
            <h1 className="font-display mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover, Compare, and Visualize Algorithms
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Find the right algorithm with live filters, better metadata, and
              smooth transitions designed for focused learning on desktop and
              mobile.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate">
                  Algorithms
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {algorithmsCatalog.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate">
                  Sorting
                </p>
                <p className="mt-1 text-2xl font-bold text-cyan-200">
                  {sortingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p
                  className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate"
                  title="1D Array Search"
                >
                  1D Array
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-200">
                  {arraySearchingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p
                  className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate"
                  title="Strings"
                >
                  Strings
                </p>
                <p className="mt-1 text-2xl font-bold text-purple-200">
                  {stringMatchingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p
                  className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate"
                  title="Graph Search"
                >
                  Graph
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-200">
                  {graphSearchingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate">
                  Hash Table
                </p>
                <p className="mt-1 text-2xl font-bold text-violet-200">
                  {hashTableCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate" title="Operating Systems">
                  OS Algos
                </p>
                <p className="mt-1 text-2xl font-bold text-pink-200">
                  {osCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] lg:text-xs uppercase tracking-wider text-slate-400 truncate">
                  Linked List
                </p>
                <p className="mt-1 text-2xl font-bold text-violet-200">
                  {linkedListCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Stack Ops
                </p>
                <p className="mt-1 text-2xl font-bold text-purple-200">
                  {stackCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  2D Array
                </p>
                <p className="mt-1 text-2xl font-bold text-sky-200">
                  {twoDArrayCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Spotlight
            </p>
            <div className="mt-4 flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-200">
                <SpotlightIcon size={20} />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {spotlightAlgorithm.title}
                </h2>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  {spotlightAlgorithm.type}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              {spotlightAlgorithm.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                {spotlightAlgorithm.complexity}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
                {spotlightAlgorithm.level}
              </span>
            </div>
            <Link
              to={spotlightAlgorithm.path}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-linear-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition-all hover:gap-3 hover:brightness-110"
            >
              Launch Visualizer
              <ArrowRight size={16} />
            </Link>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRandomSpotlight}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20"
              >
                <Dices size={13} />
                Shuffle Spotlight
              </button>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 rounded-full border border-purple-400/35 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-100 transition-colors hover:bg-purple-500/20"
              >
                <Layers size={13} />
                Compare Mode
              </Link>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                >
                  <X size={13} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="mt-6 rounded-3xl border border-white/10 bg-slate-800/35 p-4 backdrop-blur sm:p-5"
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name, type, or keyword..."
              aria-label="Search algorithms by name, type, or keyword"
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/70 pl-10 pr-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
            />
          </label>

          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            <Filter size={16} className="text-cyan-300" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort algorithms"
              className="bg-transparent text-sm text-slate-200 outline-none"
            >
              <option value="featured" className="bg-slate-900 text-slate-100">
                Featured
              </option>
              <option value="name" className="bg-slate-900 text-slate-100">
                Name
              </option>
              <option
                value="complexity"
                className="bg-slate-900 text-slate-100"
              >
                Complexity
              </option>
              <option value="level" className="bg-slate-900 text-slate-100">
                Difficulty
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              aria-pressed={activeFilter === tab.id}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${activeFilter === tab.id
                ? "border-blue-400/60 bg-blue-500/20 text-blue-100 shadow-lg shadow-blue-900/30"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {levelTabs.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(level)}
              aria-pressed={activeLevel === level}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${activeLevel === level
                ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-400/40 hover:text-white"
                }`}
            >
              {level}
            </button>
          ))}
          <span className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 sm:ml-auto sm:w-auto">
            Showing {filteredAlgorithms.length} result
            {filteredAlgorithms.length === 1 ? "" : "s"}
          </span>
        </div>
      </MotionSection>

      {/* Grouped Algorithms by Category Headers */}
      <div className="space-y-16 mt-12">
        {categoriesToDisplay.map((cat) => {
          // Filter algorithms that belong to this specific category
          const categoryAlgos = filteredAlgorithms
            .filter((algo) => algo.category === cat.id)
            .sort(
              (a, b) => (levelRank[a.level] ?? 99) - (levelRank[b.level] ?? 99),
            );

          // If no algorithms in this category match current search/filters, don't show the header
          if (categoryAlgos.length === 0) return null;

          return (
            <section key={cat.id} className="space-y-8">
              {/* Categorized Header UI */}
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white tracking-tight whitespace-nowrap capitalize">
                  {cat.label}
                </h2>
                <div className="h-px grow bg-linear-to-r from-white/15 to-transparent" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                  {categoryAlgos.length}{" "}
                  {categoryAlgos.length === 1 ? "Algorithm" : "Algorithms"}
                </span>
              </div>

              {/* Grid of cards for this category */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {categoryAlgos.map((algorithm, index) => {
                  const Icon = algorithm.icon;
                  return (
                    <MotionArticle
                      key={algorithm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                      onMouseEnter={() => setSpotlightId(algorithm.id)}
                      onTouchStart={() => setSpotlightId(algorithm.id)}
                      onFocusCapture={() => setSpotlightId(algorithm.id)}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-800/45 p-6 shadow-xl shadow-slate-950/45 backdrop-blur-sm transition-all hover:border-cyan-300/45"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div
                        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${algorithm.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-blue-200">
                            <Icon size={22} />
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleBookmark(algorithm.id);
                            }}
                            className={`group/bookmark p-2 rounded-xl border transition-all ${bookmarks.includes(algorithm.id)
                              ? "border-pink-400/50 bg-pink-500/20 text-pink-300"
                              : "border-white/10 bg-white/5 text-slate-400 hover:border-pink-400/30 hover:text-pink-300"
                              }`}
                            title={
                              bookmarks.includes(algorithm.id)
                                ? "Remove from bookmarks"
                                : "Add to bookmarks"
                            }
                          >
                            {bookmarks.includes(algorithm.id) ? (
                              <BookmarkCheck
                                size={20}
                                className="fill-current"
                              />
                            ) : (
                              <Bookmark
                                size={20}
                                className="group-hover/bookmark:fill-pink-500/20"
                              />
                            )}
                          </button>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
                            {algorithm.type}
                          </span>
                          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                            {algorithm.complexity}
                          </span>
                        </div>

                        <h2 className="font-display text-2xl font-bold text-white">
                          {algorithm.title}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">
                          {algorithm.description}
                        </p>

                        <div className="mt-6 flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold uppercase tracking-[0.2em] ${algorithm.accent}`}
                          >
                            {algorithm.level}
                          </span>
                          <Link
                            to={algorithm.path}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 transition-all hover:gap-3 hover:bg-blue-500/20"
                          >
                            Visualize
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </MotionArticle>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {filteredAlgorithms.length === 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-white/10 bg-slate-800/45 px-6 py-10 text-center text-slate-300"
        >
          <div className="mx-auto max-w-md">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              <TimerReset size={13} />
              No Match
            </p>
            <p className="mt-3 text-sm sm:text-base">
              No algorithm matched your search. Try another keyword or switch
              filter.
            </p>
          </div>
        </MotionDiv>
      )}
    </div>
  );
}
