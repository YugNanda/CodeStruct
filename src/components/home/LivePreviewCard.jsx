import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';

const MotionDiv = motion.div;

const PREVIEW_SEED = [22, 58, 36, 82, 47, 68, 30, 74, 52, 90];

const createRandomPreviewBars = (length = 10) =>
  Array.from({ length }, () => Math.floor(Math.random() * 65) + 24);

export default function LivePreviewCard() {
  const previewFrameRef = useRef(null);
  const previewStateRef = useRef({
    arr: [...PREVIEW_SEED],
    i: 0,
    j: 0,
  });

  const [previewBars, setPreviewBars] = useState(PREVIEW_SEED);
  const [previewPair, setPreviewPair] = useState([-1, -1]);
  const [hoveredPreviewBar, setHoveredPreviewBar] = useState(null);
  const [isPreviewRunning, setIsPreviewRunning] = useState(true);

  const previewCount = useMemo(() => previewBars.length, [previewBars.length]);

  const resetPreviewState = (nextBars = PREVIEW_SEED) => {
    const bars = [...nextBars];
    previewStateRef.current = { arr: bars, i: 0, j: 0 };
    setPreviewBars(bars);
    setPreviewPair([-1, -1]);
  };

  const handleShufflePreview = () => {
    resetPreviewState(createRandomPreviewBars(PREVIEW_SEED.length));
  };

  const handlePreviewPointerMove = (event) => {
    const rect = previewFrameRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = event.clientX - rect.left;
    const clamped = Math.max(0, Math.min(relativeX, rect.width - 1));
    const idx = Math.floor((clamped / rect.width) * previewCount);

    setHoveredPreviewBar(Math.max(0, Math.min(idx, previewCount - 1)));
  };

  useEffect(() => {
    if (!isPreviewRunning) return undefined;

    const intervalId = setInterval(() => {
      const state = previewStateRef.current;
      const n = state.arr.length;

      if (state.i >= n - 1) {
        const next = createRandomPreviewBars(n);
        previewStateRef.current = { arr: next, i: 0, j: 0 };
        setPreviewBars(next);
        setPreviewPair([-1, -1]);
        return;
      }

      const nextBars = [...state.arr];
      const left = state.j;
      const right = state.j + 1;

      setPreviewPair([left, right]);

      if (nextBars[left] > nextBars[right]) {
        [nextBars[left], nextBars[right]] = [nextBars[right], nextBars[left]];
      }

      setPreviewBars(nextBars);

      let nextI = state.i;
      let nextJ = state.j + 1;

      if (nextJ >= n - state.i - 1) {
        nextJ = 0;
        nextI += 1;
      }

      previewStateRef.current = {
        arr: nextBars,
        i: nextI,
        j: nextJ,
      };
    }, 420);

    return () => clearInterval(intervalId);
  }, [isPreviewRunning]);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-800/40 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
            Live Preview
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Hover bars + run mini sort simulation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewRunning((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 hover:text-white"
            aria-label={isPreviewRunning ? 'Pause preview' : 'Play preview'}
          >
            {isPreviewRunning ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={handleShufflePreview}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 hover:text-white"
            aria-label="Shuffle preview bars"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div
        ref={previewFrameRef}
        onPointerMove={handlePreviewPointerMove}
        onPointerLeave={() => setHoveredPreviewBar(null)}
        className="flex h-64 items-end justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/50 p-4"
      >
        {previewBars.map((height, idx) => {
          const isComparing = idx === previewPair[0] || idx === previewPair[1];
          const isHovered = idx === hoveredPreviewBar;

          return (
            <MotionDiv
              key={idx}
              animate={{
                height: `${height}%`,
                y: isHovered ? -5 : 0,
                filter: isHovered ? 'brightness(1.18)' : 'brightness(1)',
              }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className={`w-full rounded-t-md ${isHovered
                  ? 'bg-gradient-to-t from-cyan-400 to-blue-300'
                  : isComparing
                    ? 'bg-gradient-to-t from-amber-400 to-orange-300'
                    : 'bg-gradient-to-t from-blue-600 to-indigo-400'
                }`}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold tracking-wide text-slate-300 uppercase">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Normal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-300" />
          Comparing
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          Hovered
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-300">
        Compare values, watch swaps, and follow the sorting progress bar by bar.
      </p>
    </div>
  );
}
