import { useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

const MotionDiv = motion.div;

export default function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useMotionValue(0);
  const hoverStrength = useMotionValue(0);

  const smoothRotateX = useSpring(rotateX, { stiffness: 220, damping: 24, mass: 0.9 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 220, damping: 24, mass: 0.9 });
  const smoothGlowOpacity = useSpring(glowOpacity, {
    stiffness: 240,
    damping: 26,
    mass: 0.85,
  });
  const smoothHoverStrength = useSpring(hoverStrength, {
    stiffness: 220,
    damping: 24,
    mass: 0.9,
  });

  const shadowX = useTransform(smoothRotateY, [-14, 14], [-18, 18]);
  const shadowY = useTransform(smoothRotateX, [-14, 14], [18, -18]);
  const shadowBlurNear = useTransform(smoothHoverStrength, [0, 1], [0, 34]);
  const shadowBlurFar = useTransform(smoothHoverStrength, [0, 1], [0, 72]);
  const shadowBlueAlpha = useTransform(smoothHoverStrength, [0, 1], [0, 0.4]);
  const shadowCyanAlpha = useTransform(smoothHoverStrength, [0, 1], [0, 0.2]);
  const dynamicShadow = useMotionTemplate`${shadowX}px ${shadowY}px ${shadowBlurNear}px rgba(56, 189, 248, ${shadowBlueAlpha}), ${shadowX}px ${shadowY}px ${shadowBlurFar}px rgba(139, 92, 246, ${shadowCyanAlpha})`;
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(56, 189, 248, 0.3), rgba(139, 92, 246, 0.15) 30%, rgba(15, 23, 42, 0) 60%)`;

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowOpacity.set(0);
    hoverStrength.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    rotateX.set((0.5 - py) * 14);
    rotateY.set((px - 0.5) * 14);
    glowX.set(px * 100);
    glowY.set(py * 100);
    hoverStrength.set(1);
    glowOpacity.set(1);
  };

  return (
    <div className="h-full [perspective:1200px]">
      <MotionDiv
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => {
          hoverStrength.set(1);
          glowOpacity.set(0.7);
        }}
        onPointerLeave={resetTilt}
        onPointerUp={resetTilt}
        whileHover={{ scale: 1.04, y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
        style={{
          rotateX: smoothRotateX,
          rotateY: smoothRotateY,
          boxShadow: dynamicShadow,
          transformStyle: 'preserve-3d',
        }}
        className={`relative h-full overflow-hidden will-change-transform ${className}`}
      >
        <MotionDiv
          aria-hidden
          style={{
            opacity: smoothGlowOpacity,
            background: glareBackground,
          }}
          className="pointer-events-none absolute inset-0 z-[1]"
        />
        <div className="relative z-10 h-full">{children}</div>
      </MotionDiv>
    </div>
  );
}
