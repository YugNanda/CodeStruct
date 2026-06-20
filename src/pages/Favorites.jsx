import { useMemo, useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
    ArrowRight,
    BookmarkCheck,
    Heart,
    BrainCircuit,
    ArrowLeft,
    Search,
} from "lucide-react";
import { algorithmsCatalog } from "./Algorithms";
import toast from "react-hot-toast";

export default function Favorites() {
    useDocumentTitle("My Favorites");
    const prefersReducedMotion = useReducedMotion();

    const [bookmarks, setBookmarks] = useState(() => {
        const saved = localStorage.getItem("algo_bookmarks");
        return saved ? JSON.parse(saved) : [];
    });

    const bookmarkedAlgorithms = useMemo(() => {
        return algorithmsCatalog.filter((algo) => bookmarks.includes(algo.id));
    }, [bookmarks]);

    const toggleBookmark = (id) => {
        const newBookmarks = bookmarks.filter((b) => b !== id);
        setBookmarks(newBookmarks);
        localStorage.setItem("algo_bookmarks", JSON.stringify(newBookmarks));

        const algorithm = algorithmsCatalog.find((a) => a.id === id);
        toast.success(`${algorithm?.title || "Algorithm"} removed from favorites`);
    };

    const MotionSection = motion.section;
    const MotionArticle = motion.article;
    const MotionDiv = motion.div;

    return (
        <div className="font-body relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14 min-h-screen">
            {/* Ambient backgrounds */}
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.1),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.1),transparent_36%)]" />

            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        to="/algorithms"
                        className="group mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-400"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        Back to Algorithms
                    </Link>
                    <div className="flex items-center gap-3">
                        <Heart className="text-pink-500" size={32} fill="currentColor" />
                        <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
                            My Favorites
                        </h1>
                    </div>
                    <p className="mt-3 text-slate-400">
                        Quick access to your most important algorithms and visualizers.
                    </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Saved</p>
                        <p className="text-2xl font-black text-pink-400">{bookmarkedAlgorithms.length}</p>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <BrainCircuit size={24} className="text-pink-400/50" />
                </div>
            </div>

            {bookmarkedAlgorithms.length > 0 ? (
                <MotionSection
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {bookmarkedAlgorithms.map((algorithm, index) => {
                        const Icon = algorithm.icon;
                        return (
                            <MotionArticle
                                key={algorithm.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={prefersReducedMotion ? undefined : { y: -8 }}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-800/40 p-6 shadow-xl shadow-slate-950/45 backdrop-blur-sm transition-all hover:border-pink-500/50"
                            >
                                <div
                                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${algorithm.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                                />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-pink-400">
                                            <Icon size={24} />
                                        </div>
                                        <button
                                            onClick={() => toggleBookmark(algorithm.id)}
                                            className="p-2 rounded-xl border border-pink-500/50 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-all"
                                            title="Remove from favorites"
                                        >
                                            <BookmarkCheck size={20} className="fill-current" />
                                        </button>
                                    </div>

                                    <div className="mb-4 flex flex-wrap gap-2">
                                        <span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-pink-200">
                                            {algorithm.type}
                                        </span>
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                                            {algorithm.complexity}
                                        </span>
                                    </div>

                                    <h2 className="font-display text-2xl font-bold text-white mb-3">
                                        {algorithm.title}
                                    </h2>
                                    <p className="text-sm leading-relaxed text-slate-400 mb-8 line-clamp-3">
                                        {algorithm.description}
                                    </p>

                                    <Link
                                        to={algorithm.path}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-pink-900/30 transition-all hover:brightness-110 active:scale-[0.98]"
                                    >
                                        Launch Visualizer
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </MotionArticle>
                        );
                    })}
                </MotionSection>
            ) : (
                <MotionDiv
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 py-20 text-center"
                >
                    <div className="mb-6 rounded-full bg-white/5 p-6">
                        <Heart size={48} className="text-slate-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Your favorites is empty</h2>
                    <p className="mt-2 max-w-xs text-slate-400">
                        Start exploring algorithms and bookmark the ones you want to save for later.
                    </p>
                    <Link
                        to="/algorithms"
                        className="mt-8 flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-blue-50 hover:shadow-lg active:scale-95"
                    >
                        Explore Algorithms
                        <ArrowRight size={18} />
                    </Link>
                </MotionDiv>
            )}
        </div>
    );
}
