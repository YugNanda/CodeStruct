import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, BrainCircuit } from "lucide-react";

export default function NotFoundPage() {
    useDocumentTitle("404 — Page Not Found");

    return (
        <div className="font-body relative mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
            {/* Ambient blobs */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.1),transparent_40%)]" />

            {/* Animated 404 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <h1 className="font-display text-[10rem] font-black leading-none tracking-tighter sm:text-[12rem]">
                    <span className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        4
                    </span>
                    <motion.span
                        className="inline-block bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                        0
                    </motion.span>
                    <span className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        4
                    </span>
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2"
            >
                <p className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                    <Search size={14} />
                    Page Not Found
                </p>
                <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
                    Oops! This node doesn't exist in the graph.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
                    The page you're looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:gap-3 hover:brightness-110"
                >
                    <Home size={16} />
                    Back to Home
                </Link>
                <Link
                    to="/algorithms"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
                >
                    <BrainCircuit size={16} />
                    Explore Algorithms
                </Link>
            </motion.div>

            {/* Fun DSA-themed hint */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs leading-relaxed text-slate-500"
            >
                💡 <span className="text-slate-400 font-semibold">Fun fact:</span> In a graph traversal, hitting a dead-end means it's time to
                backtrack. Let's take you back to a visited node!
            </motion.p>
        </div>
    );
}
