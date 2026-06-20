import { Keyboard } from "lucide-react";

export default function HotkeysHint({ className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300 ${className}`}
    >
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-200">
        <Keyboard size={12} />
        Keyboard Shortcuts
      </p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        <p>
          <span className="font-semibold text-cyan-200">Space</span> -&gt; Start
          / Pause / Resume
        </p>
        <p>
          <span className="font-semibold text-cyan-200">R</span> -&gt; Reset
        </p>
        <p>
          <span className="font-semibold text-cyan-200">N</span> -&gt; Generate
          New Data
        </p>
      </div>
    </div>
  );
}
