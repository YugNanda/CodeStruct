import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Algorithms from "./pages/Algorithms";
import Favorites from "./pages/Favorites";
import Contact from "./pages/Contact";
import VisualizerPage from "./pages/VisualizerPage";
import LinkedListVisualizerPage from "./pages/LinkedListVisualizerPage";
import GraphVisualizerPage from "./pages/GraphVisualizerPage";
import BFSVisualizerPage from "./pages/BFSVisualizerPage";
import PrimsVisualizerPage from "./pages/PrimsVisualizerPage";
import DijkstraPage from "./pages/DijkstraPage";
import KruskalPage from "./pages/KruskalPage";
import AStarPage from "./pages/AStarPage";
import StackVisualizerPage from "./pages/StackVisualizerPage";
import QueueVisualizerPage from "./pages/QueueVisualizerPage";
import TrieVisualizerPage from "./pages/TrieVisualizerPage";
import SegmentTreeVisualizerPage from "./pages/SegmentTreeVisualizerPage";
import SignIn from "./pages/SignIn";
import TopologicalSortPage from "./pages/TopologicalSortPage";
import KosarajuPage from "./pages/KosarajuPage";
import TarjanPage from "./pages/TarjanPage";
import SignUp from "./pages/SignUp";
import HuffmanCodingPage from "./pages/HuffmanCodingPage";
import ForgotPasswordEmail from "./pages/ForgotPasswordEmail";
import ForgotPasswordOTP from "./pages/ForgotPasswordOTP";
import BoyerMoorePage from "./pages/BoyerMoorePage";
import ArrayTraversalPage from "./pages/ArrayTraversalPage";
import OAuthSuccess from "./pages/OAuthSuccess";
import FloydWarshallPage from "./pages/FloydWarshallPage";
import BellmanFordPage from "./pages/BellmanFordPage";
import ComparisonPage from "./pages/ComparisonPage";
import Profile from "./pages/Profile";
import NQueensPage from "./pages/NQueensPage";
import SudokuSolverPage from "./pages/SudokuSolverPage";
import RatInAMazePage from "./pages/RatInAMazePage";
import NotFoundPage from "./pages/NotFoundPage";
import CheatsheetPage from "./pages/CheatsheetPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SinglyLinkedListPage from "./pages/SinglyLinkedListPage";
import KadanePage from "./pages/KadanePage";
import DoublyLinkedListPage from "./pages/DoublyLinkedListPage";
import KnapsackPage from "./pages/KnapsackPage";
import RabinKarpPage from "./pages/RabinKarpPage";
import PublicRoute from "./components/PublicRoute";
import VisualizerThemeDock from "./components/VisualizerThemeDock";
import BankersAlgorithmPage from "./pages/BankersAlgorithmPage";
import HashTablePage from "./pages/HashTablePage";
import MapColoringPage from "./pages/MapColoringPage";
import CPUSchedulingPage from "./pages/CPUSchedulingVisualizer";
import ProgressDashboard from "./pages/ProgressDashboard";
import {
  VisualizerThemeProvider,
  useVisualizerTheme,
} from "./context/VisualizerThemeContext";
import DLLToBSTPage from "./pages/DLLToBSTPage";
import ShuntingYardPage from "./pages/ShuntingYardPage";
import PostfixToInfixPage from "./pages/PostfixToInfixPage";
import {
  bubbleSortCPP,
  bubbleSortJava,
  bubbleSortPython,
  bubbleSortJS,
} from "./algorithms/bubbleSort";
import {
  selectionSortCPP,
  selectionSortJava,
  selectionSortPython,
  selectionSortJS,
} from "./algorithms/selectionSort";
import {
  quickSortCPP,
  quickSortJava,
  quickSortPython,
  quickSortJS,
} from "./algorithms/quickSort";
import {
  linearSearchCPP,
  linearSearchJava,
  linearSearchPython,
  linearSearchJS,
} from "./algorithms/linearSearch";
import {
  interpolationSearchCPP,
  interpolationSearchJava,
  interpolationSearchPython,
  interpolationSearchJS,
} from "./algorithms/interpolationSearch";
import {
  radixSortCPP,
  radixSortJava,
  radixSortPython,
  radixSortJS,
} from "./algorithms/radixSort";
import {
  heapSortCPP,
  heapSortJava,
  heapSortPython,
  heapSortJS,
} from "./algorithms/heapSort";
import {
  insertionSortCPP,
  insertionSortJava,
  insertionSortPython,
  insertionSortJS,
} from "./algorithms/insertionSort";
import {
  mergeSortCPP,
  mergeSortJava,
  mergeSortPython,
  mergeSortJS,
} from "./algorithms/mergeSort";
import {
  binarySearchCPP,
  binarySearchJava,
  binarySearchPython,
  binarySearchJS,
} from "./algorithms/binarySearch";

import {
  countingSortCPP,
  countingSortJava,
  countingSortPython,
  countingSortJS,
} from "./algorithms/countingSort";

import {
  bucketSortCPP,
  bucketSortJava,
  bucketSortPython,
  bucketSortJS,
} from "./algorithms/bucketSort";

import { dfsCPP, dfsJava } from "./algorithms/dfs";

import { AuthProvider } from "./context/AuthContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { Toaster } from "react-hot-toast";
import GlobalGeminiChatbot from "./components/GlobalGeminiChatbot";

function AppShell() {
  const location = useLocation();
  const { focusMode } = useVisualizerTheme();
  const isVisualizerRoute = location.pathname.startsWith("/visualizer/");
  const hideChrome = isVisualizerRoute && focusMode;

  useEffect(() => {
    document.body.classList.toggle("viz-focus-mode", hideChrome);
    return () => document.body.classList.remove("viz-focus-mode");
  }, [hideChrome]);

  return (
    <div
      className={`flex min-h-screen flex-col bg-slate-950 text-slate-200 selection:bg-blue-500/30 dark:bg-slate-950 dark:text-slate-200 [data-mode="light"]:bg-slate-50 [data-mode="light"]:text-slate-900 ${hideChrome ? "viz-focus-active" : ""
        }`}
    >
      {!hideChrome && <Navbar />}
      <VisualizerThemeDock />

      <main className="block">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/algorithms" element={<Algorithms />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordEmail /></PublicRoute>} />
          <Route path="/forgot-password/otp" element={<PublicRoute><ForgotPasswordOTP /></PublicRoute>} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* Sort visualizers */}
          <Route path="/visualizer/bubble-sort" element={<VisualizerPage name="Bubble Sort" cppSnippet={bubbleSortCPP} javaSnippet={bubbleSortJava} pythonSnippet={bubbleSortPython} jsSnippet={bubbleSortJS} />} />
          <Route path="/visualizer/selection-sort" element={<VisualizerPage name="Selection Sort" cppSnippet={selectionSortCPP} javaSnippet={selectionSortJava} pythonSnippet={selectionSortPython} jsSnippet={selectionSortJS} />} />
          <Route path="/visualizer/quick-sort" element={<VisualizerPage name="Quick Sort" cppSnippet={quickSortCPP} javaSnippet={quickSortJava} pythonSnippet={quickSortPython} jsSnippet={quickSortJS} />} />
          <Route path="/visualizer/radix-sort" element={<VisualizerPage name="Radix Sort" cppSnippet={radixSortCPP} javaSnippet={radixSortJava} pythonSnippet={radixSortPython} jsSnippet={radixSortJS} />} />
          <Route path="/visualizer/heap-sort" element={<VisualizerPage name="Heap Sort" cppSnippet={heapSortCPP} javaSnippet={heapSortJava} pythonSnippet={heapSortPython} jsSnippet={heapSortJS} />} />
          <Route path="/visualizer/insertion-sort" element={<VisualizerPage name="Insertion Sort" cppSnippet={insertionSortCPP} javaSnippet={insertionSortJava} pythonSnippet={insertionSortPython} jsSnippet={insertionSortJS} />} />
          <Route path="/visualizer/merge-sort" element={<VisualizerPage name="Merge Sort" cppSnippet={mergeSortCPP} javaSnippet={mergeSortJava} pythonSnippet={mergeSortPython} jsSnippet={mergeSortJS} />} />
          <Route path="/visualizer/counting-sort" element={<VisualizerPage name="Counting Sort" cppSnippet={countingSortCPP} javaSnippet={countingSortJava} pythonSnippet={countingSortPython} jsSnippet={countingSortJS} />} />
          <Route path="/visualizer/bucket-sort" element={<VisualizerPage name="Bucket Sort" cppSnippet={bucketSortCPP} javaSnippet={bucketSortJava} pythonSnippet={bucketSortPython} jsSnippet={bucketSortJS} />} />

          {/* Search visualizers */}
          <Route path="/visualizer/linear-search" element={<VisualizerPage name="Linear Search" cppSnippet={linearSearchCPP} javaSnippet={linearSearchJava} pythonSnippet={linearSearchPython} jsSnippet={linearSearchJS} />} />
          <Route path="/visualizer/binary-search" element={<VisualizerPage name="Binary Search" cppSnippet={binarySearchCPP} javaSnippet={binarySearchJava} pythonSnippet={binarySearchPython} jsSnippet={binarySearchJS} />} />
          <Route path="/visualizer/interpolation-search" element={<VisualizerPage name="Interpolation Search" cppSnippet={interpolationSearchCPP} javaSnippet={interpolationSearchJava} pythonSnippet={interpolationSearchPython} jsSnippet={interpolationSearchJS} />} />
          <Route path="/visualizer/boyer-moore" element={<BoyerMoorePage />} />
          <Route path="/visualizer/rabin-karp" element={<RabinKarpPage />} />

          {/* Array visualizers */}
          <Route path="/visualizer/array-traversal" element={<ArrayTraversalPage />} />

          {/* Linked list visualizers */}
          <Route path="/visualizer/linked-list" element={<LinkedListVisualizerPage />} />
          <Route path="/visualizer/singly-linked-list" element={<SinglyLinkedListPage />} />
          <Route path="/visualizer/doubly-linked-list" element={<DoublyLinkedListPage />} />
          <Route path="/visualizer/dll-to-bst" element={<DLLToBSTPage />} />
          {/* Hash visualizers*/}
          <Route path="/visualizer/hash-table" element={<HashTablePage />} />
          {/* Graph visualizers */}
          <Route path="/visualizer/dfs" element={<GraphVisualizerPage />} />
          <Route path="/visualizer/bfs" element={<BFSVisualizerPage />} />
          <Route path="/visualizer/prims" element={<PrimsVisualizerPage />} />
          <Route path="/visualizer/dijkstra" element={<DijkstraPage />} />
          <Route path="/visualizer/kruskal" element={<KruskalPage />} />
          <Route path="/visualizer/dfs" element={<GraphVisualizerPage />} />
          <Route path="/visualizer/bfs" element={<BFSVisualizerPage />} />
          <Route
            path="/visualizer/topological-sort"
            element={<TopologicalSortPage />}
          />
          <Route
            path="/visualizer/kosaraju"
            element={<KosarajuPage />}
          />
          <Route
            path="/visualizer/tarjan"
            element={<TarjanPage />}
          />
          <Route
            path="/visualizer/huffman-coding"
            element={<HuffmanCodingPage />}
          />
          <Route
            path="/visualizer/floyd-warshall"
            element={<FloydWarshallPage />}
          />
          <Route
            path="/visualizer/bellman-ford"
            element={<BellmanFordPage />}
          />
          <Route path="/visualizer/bankers-algorithm" element={<BankersAlgorithmPage />} />
          <Route path="/visualizer/astar" element={<AStarPage />} />
          <Route path="/visualizer/n-queens" element={<NQueensPage />} />
          <Route path="/visualizer/sudoku-solver" element={<SudokuSolverPage />} />
          <Route path="/visualizer/rat-in-a-maze" element={<RatInAMazePage />} />
          <Route path="/visualizer/knapsack" element={<KnapsackPage />} />
          <Route path="/visualizer/dfs" element={<GraphVisualizerPage cppSnippet={dfsCPP} javaSnippet={dfsJava} />} />
          <Route path="/visualizer/stack" element={<StackVisualizerPage />} />
          <Route path="/visualizer/queue" element={<QueueVisualizerPage />} />
          <Route path="/visualizer/trie" element={<TrieVisualizerPage />} />
          <Route path="/visualizer/segment-tree" element={<SegmentTreeVisualizerPage />} />
          <Route path="/visualizer/kadane" element={<KadanePage />} />
          <Route path="/visualizer/shunting-yard" element={<ShuntingYardPage />} />
          <Route path="/visualizer/postfix-to-infix" element={<PostfixToInfixPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/cheatsheet" element={<CheatsheetPage />} />
          <Route path="/progress" element={<ProgressDashboard />}/>
          <Route path="/visualizer/cpu-scheduling" element={<CPUSchedulingPage />} />
          <Route path="/visualizer/map-coloring" element={<MapColoringPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <GlobalGeminiChatbot />

      {!hideChrome && <Footer />}
    </div>
  );

}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <VisualizerThemeProvider>
        <Router>
          <ScrollToTop />
          <AnalyticsProvider>
            <AppShell />
          </AnalyticsProvider>
        </Router>
      </VisualizerThemeProvider>
    </AuthProvider>
  );
}
