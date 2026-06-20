import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Heart,
    Trash2,
    ArrowRight,
    Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const algorithmsCatalog = [
    { id: 'bubble-sort', title: 'Bubble Sort', path: '/visualizer/bubble-sort', category: 'sorting', level: 'Beginner' },
    { id: 'selection-sort', title: 'Selection Sort', path: '/visualizer/selection-sort', category: 'sorting', level: 'Beginner' },
    { id: 'quick-sort', title: 'Quick Sort', path: '/visualizer/quick-sort', category: 'sorting', level: 'Intermediate' },
    { id: 'merge-sort', title: 'Merge Sort', path: '/visualizer/merge-sort', category: 'sorting', level: 'Intermediate' },
    { id: 'heap-sort', title: 'Heap Sort', path: '/visualizer/heap-sort', category: 'sorting', level: 'Intermediate' },
    { id: 'insertion-sort', title: 'Insertion Sort', path: '/visualizer/insertion-sort', category: 'sorting', level: 'Beginner' },
    { id: 'radix-sort', title: 'Radix Sort', path: '/visualizer/radix-sort', category: 'sorting', level: 'Advanced' },
    { id: 'linear-search', title: 'Linear Search', path: '/visualizer/linear-search', category: '1d-array-searching', level: 'Beginner' },
    { id: 'binary-search', title: 'Binary Search', path: '/visualizer/binary-search', category: '1d-array-searching', level: 'Beginner' },
    { id: 'interpolation-search', title: 'Interpolation Search', path: '/visualizer/interpolation-search', category: '1d-array-searching', level: 'Intermediate' },
    { id: 'linked-list', title: 'Reverse Linked List', path: '/visualizer/linked-list', category: 'linked-list', level: 'Intermediate' },
    { id: 'prims', title: "Prim's Algorithm", path: '/visualizer/prims', category: 'mst', level: 'Hard' },
    { id: 'depth-first-search', title: 'Depth First Search', path: '/visualizer/dfs', category: 'graph-searching', level: 'Intermediate' },
    { id: 'astar-search', title: 'A* Pathfinding', path: '/visualizer/astar', category: 'pathfinding', level: 'Intermediate' },
    { id: 'dijkstra', title: "Dijkstra's Algorithm", path: '/visualizer/dijkstra', category: 'pathfinding', level: 'Advanced' },
    { id: 'kruskal', title: "Kruskal's Algorithm", path: '/visualizer/kruskal', category: 'mst', level: 'Intermediate' },
    { id: 'topological-sort', title: 'Topological Sort', path: '/visualizer/topological-sort', category: 'sorting', level: 'Intermediate' },
    { id: 'huffman-coding', title: 'Huffman Coding', path: '/visualizer/huffman-coding', category: 'greedy', level: 'Intermediate' },
    { id: 'floyd-warshall', title: 'Floyd Warshall', path: '/visualizer/floyd-warshall', category: 'pathfinding', level: 'Advanced' },
];

export default function FavoritesPage() {
    useDocumentTitle('Favorites');
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/favorites', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFavorite = async (algorithmId) => {
        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/favorites/${algorithmId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || []);
            }
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        }
    };

    const favoriteAlgorithms = algorithmsCatalog.filter(algo => favorites.includes(algo.id));

    const getLevelColor = (level) => {
        switch (level) {
            case 'Beginner': return 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10';
            case 'Intermediate': return 'text-amber-400 border-amber-400/30 bg-amber-500/10';
            case 'Advanced': return 'text-red-400 border-red-400/30 bg-red-500/10';
            default: return 'text-slate-400 border-slate-400/30 bg-slate-500/10';
        }
    };

    if (!user) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">Please sign in to view your favorites</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_36%),linear-gradient(to_bottom,rgba(15,23,42,0.9),rgba(15,23,42,0.4))]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500">
                            <Heart className="h-8 w-8 text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
                                Favorites
                            </h1>
                            <p className="text-slate-400">
                                Your saved algorithms for quick access
                            </p>
                        </div>
                    </div>
                </div>

                {favoriteAlgorithms.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-800/45 p-12 text-center backdrop-blur">
                        <Heart className="mx-auto h-12 w-12 text-slate-600" />
                        <p className="mt-4 text-lg font-semibold text-white">No favorites yet</p>
                        <p className="mt-2 text-slate-400">
                            Save algorithms to access them quickly
                        </p>
                        <Link
                            to="/algorithms"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                        >
                            Browse Algorithms
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {favoriteAlgorithms.map((algo, index) => (
                            <motion.div
                                key={algo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-800/45 p-5 backdrop-blur transition-all hover:border-pink-300/45"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white">{algo.title}</h3>
                                        <p className="text-sm text-slate-400 capitalize">{algo.category.replace('-', ' ')}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFavorite(algo.id)}
                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getLevelColor(algo.level)}`}>
                                        {algo.level}
                                    </span>
                                </div>

                                <Link
                                    to={algo.path}
                                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-pink-400/35 bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-100 transition-all hover:bg-pink-500/20"
                                >
                                    Visualize
                                    <ArrowRight size={16} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
