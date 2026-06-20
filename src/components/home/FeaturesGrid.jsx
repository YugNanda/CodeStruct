import TiltCard from './TiltCard';

export default function FeaturesGrid({ features }) {
  return (
    <div className="mt-16 grid gap-6 md:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <TiltCard
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-slate-800/40 p-7 shadow-lg shadow-slate-950/40 backdrop-blur-sm transition-colors duration-200 hover:border-blue-400/40"
          >
            <div className="mb-4 inline-flex rounded-2xl bg-blue-500/10 p-3 text-blue-400 [transform:translateZ(18px)]">
              <Icon size={22} />
            </div>
            <h3 className="text-lg font-bold text-white [transform:translateZ(12px)]">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 [transform:translateZ(8px)]">
              {feature.desc}
            </p>
          </TiltCard>
        );
      })}
    </div>
  );
}
