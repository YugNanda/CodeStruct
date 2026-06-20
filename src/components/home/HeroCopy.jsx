import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export default function HeroCopy() {
  return (
    <>
      <>
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Interactive DSA Learning
        </p>

        <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
          Master Algorithms by
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500">
            Watching Them Work
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
          DSA Lab turns complex logic into a step-by-step visual flow.
          Track operations in real time, understand sorting mechanics, and
          connect code with actual behavior.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/algorithms"
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-blue-600/90 px-8 py-4 text-sm font-bold tracking-wide text-white transition-all hover:bg-blue-500 hover:scale-105 shadow-lg shadow-blue-900/40"
          >
            <Play size={18} fill="currentColor" />
            Start Visualizing
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold tracking-wide text-slate-200 transition-all hover:bg-white/10 hover:border-white/20"
          >
            Contact Team
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
          <span className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Real-time Animation
          </span>
          <span className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
            Clean C++ & Java
          </span>
          <span className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
            Open Source
          </span>
        </div>
      </>
    </>
  );
}
