import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TiltCard from './TiltCard';

export default function OutcomesSection({ outcomes }) {
  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-slate-800/20 p-8 backdrop-blur-sm md:p-10">
      <p className="text-xs font-bold tracking-[0.2em] text-blue-300 uppercase">
        Outcomes
      </p>
      <h3 className="mt-3 font-display text-3xl font-black text-white sm:text-4xl">
        What you improve in every practice run
      </h3>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {outcomes.map((item) => {
          const Icon = item.icon;
          return (
            <TiltCard
              key={item.title}
              className="rounded-2xl border border-white/10 bg-slate-800/40 p-6 transition-colors duration-200 hover:border-blue-400/50"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-2.5 text-blue-400 [transform:translateZ(18px)]">
                <Icon size={20} />
              </div>
              <h4 className="text-lg font-bold text-white [transform:translateZ(10px)]">
                {item.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 [transform:translateZ(6px)]">
                {item.desc}
              </p>
              <p className="mt-4 text-xs font-bold tracking-wide text-blue-300 uppercase [transform:translateZ(8px)]">
                {item.tag}
              </p>
            </TiltCard>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-800/40 px-5 py-4">
        <p className="text-sm text-slate-200">
          Ready to practice with a full visual walkthrough?
        </p>
        <Link
          to="/algorithms"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/40"
        >
          Explore Algorithms
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
