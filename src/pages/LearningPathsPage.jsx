import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    Check,
    Lock,
    Play,
    Star,
    Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearningPathsPage() {
    useDocumentTitle('Learning Paths');
    const { user } = useAuth();
    const [paths, setPaths] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const token = user?.token || localStorage.getItem('token');
            const [pathsRes, recsRes] = await Promise.all([
                fetch('http://localhost:5000/api/learning-paths', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/learning-paths/recommendations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (pathsRes.ok) {
                const pathsData = await pathsRes.json();
                setPaths(pathsData.paths || []);
            }
            if (recsRes.ok) {
                const recsData = await recsRes.json();
                setRecommendations(recsData.recommendations || []);
            }
        } catch (err) {
            console.error('Failed to fetch learning paths:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
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
                    <p className="text-slate-400">Please sign in to view learning paths</p>
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
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500">
                            <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
                                Learning Paths
                            </h1>
                            <p className="text-slate-400">
                                Follow curated sequences to master algorithms
                            </p>
                        </div>
                    </div>
                </div>

                {recommendations.length > 0 && (
                    <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6 backdrop-blur">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-cyan-400" />
                            <h2 className="text-lg font-bold text-white">Recommended for You</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {recommendations.map((path) => (
                                <Link
                                    key={path.id}
                                    to={`/visualizer/${path.nextStep}`}
                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                                >
                                    <div>
                                        <p className="font-semibold text-white">{path.name}</p>
                                        <p className="text-xs text-slate-400">{path.progressPercent}% complete</p>
                                    </div>
                                    <Play className="h-5 w-5 text-cyan-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {['Beginner', 'Intermediate', 'Advanced'].map((difficulty) => {
                        const filteredPaths = paths.filter(p => p.difficulty === difficulty);
                        if (filteredPaths.length === 0) return null;

                        return (
                            <div key={difficulty}>
                                <h2 className="mb-4 text-2xl font-bold text-white">{difficulty}</h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredPaths.map((path, index) => (
                                        <motion.div
                                            key={path.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-800/45 p-5 backdrop-blur transition-all hover:border-cyan-300/45"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-300">
                                                        <span className="text-2xl">{path.icon}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">{path.name}</h3>
                                                        <p className="text-xs text-slate-400">{path.steps.length} algorithms</p>
                                                    </div>
                                                </div>
                                                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getDifficultyColor(path.difficulty)}`}>
                                                    {path.difficulty}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-sm text-slate-400">
                                                {path.description}
                                            </p>

                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                    <span>{path.completedSteps} / {path.totalSteps} completed</span>
                                                    <span>{path.progressPercent}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                                        style={{ width: `${path.progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {path.steps.slice(0, 4).map((step, i) => (
                                                    <span
                                                        key={i}
                                                        className={`rounded-full border px-2 py-1 text-xs ${
                                                            step.completed
                                                                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                                                : 'border-white/10 bg-white/5 text-slate-400'
                                                        }`}
                                                    >
                                                        {step.completed ? <Check size={10} className="inline mr-1" /> : null}
                                                        {step.title}
                                                    </span>
                                                ))}
                                                {path.steps.length > 4 && (
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
                                                        +{path.steps.length - 4} more
                                                    </span>
                                                )}
                                            </div>

                                            {path.isCompleted && (
                                                <div className="absolute right-2 top-2">
                                                    <Check className="h-6 w-6 text-emerald-400" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
