import TiltCard from './TiltCard';

export default function HowItWorksSection({ steps }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-800/20 p-8 backdrop-blur-sm md:p-10">
      <p className="text-xs font-bold tracking-[0.2em] text-blue-300 uppercase">
        How It Works
      </p>
      <h2 className="mt-3 font-display text-3xl font-black text-white sm:text-4xl">
        Learn DSA with a repeatable flow
      </h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {steps.map((item) => (
          <TiltCard
            key={item.step}
            className="rounded-2xl border border-white/10 bg-slate-800/40 p-6 transition-colors duration-200 hover:border-blue-400/50"
          >
            <p className="text-sm font-black text-blue-400 [transform:translateZ(14px)]">
              {item.step}
            </p>
            <h3 className="mt-2 text-lg font-bold text-white [transform:translateZ(10px)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 [transform:translateZ(6px)]">
              {item.desc}
            </p>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
