import { BarChart3, Code2, Gauge } from 'lucide-react';

export const features = [
  {
    title: 'Visual Learning',
    desc: 'See every comparison, swap, and final placement with clear color states.',
    icon: BarChart3,
  },
  {
    title: 'Speed Control',
    desc: 'Start, pause, resume, and reset to study each step at your own pace.',
    icon: Gauge,
  },
  {
    title: 'Code + Animation',
    desc: 'Read the C++ implementation side-by-side while the logic runs on screen.',
    icon: Code2,
  },
];

export const howItWorksSteps = [
  {
    step: '01',
    title: 'Pick an Algorithm',
    desc: 'Choose from sorting, searching, and linked-list visualizers and open one in a click.',
  },
  {
    step: '02',
    title: 'Run and Observe',
    desc: 'Start the animation and follow comparisons, swaps, and sorted states.',
  },
  {
    step: '03',
    title: 'Control and Repeat',
    desc: 'Pause, resume, or reset any time until the pattern is fully clear.',
  },
];

export const outcomes = [
  {
    title: 'Pattern Recognition',
    desc: 'Spot why swaps happen and how local comparisons shape the final order.',
    tag: 'Compare Faster',
    icon: BarChart3,
  },
  {
    title: 'Control the Pace',
    desc: 'Pause on critical moments, replay transitions, and inspect each step.',
    tag: 'Pause Anytime',
    icon: Gauge,
  },
  {
    title: 'Code Confidence',
    desc: 'Translate animation behavior directly into cleaner implementation logic.',
    tag: 'Implement Better',
    icon: Code2,
  },
];

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
