import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CONFETTI_COLORS, confettiParticle } from '../../lib/motionVariants';
import styles from './Confetti.module.css';

const PARTICLE_COUNT = 40;

type Particle = {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
};

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    distance: 100 + Math.random() * 200,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    size: 8 + Math.random() * 8,
  }));
}

/**
 * Fire-and-forget celebration burst (Story 3.2).
 *
 * Renders ~40 absolutely-positioned colored particles that animate outward
 * from the origin with rotation, gravity, and fade-out over ~2.5s.
 *
 * Respects prefers-reduced-motion: renders a single accent-color flash
 * instead of moving particles. Both modes are pointer-events: none and
 * aria-hidden so the celebration doesn't block input or leak to AT.
 */
export function Confetti() {
  const reducedMotion = useReducedMotion();
  // Stable per-mount: don't re-randomize positions on re-render.
  const [particles] = useState<Particle[]>(() => generateParticles(PARTICLE_COUNT));

  if (reducedMotion) {
    return (
      <motion.div
        className={styles.flashFallback}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        aria-hidden="true"
        data-confetti-mode="reduced"
      />
    );
  }

  return (
    <div className={styles.container} aria-hidden="true" data-confetti-mode="full">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={styles.particle}
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
          variants={confettiParticle}
          initial="initial"
          animate="burst"
          custom={{ angle: p.angle, distance: p.distance }}
        />
      ))}
    </div>
  );
}
