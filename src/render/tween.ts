// tween.ts - animation helpers, ported from build/tape-prototype.html.
// Pure math + a single reduced-motion probe. No canvas, no economics.

// Linear interpolation from a to b at t in [0,1].
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Ease-in-out (quadratic), verbatim from the tape prototype's easeInOut.
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Clamp x into [lo, hi].
export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// Progress of an animation started at t0 (ms) with duration dur (ms), at time
// `now` (ms). Returns t in [0,1]. Mirrors the prototype's tick() math.
export function progress(now: number, t0: number, dur: number): number {
  return Math.min(1, (now - t0) / dur);
}

export interface ReducedMotion {
  reduced: boolean;
  subscribe(cb: (reduced: boolean) => void): () => void;
}

// prefers-reduced-motion probe (SSR/test-safe: no matchMedia => false).
// subscribe fires on OS setting change and returns an unsubscribe function.
// Pattern from the prototype's mq handler.
export function reducedMotion(): ReducedMotion {
  if (typeof window === "undefined" || !window.matchMedia) {
    return { reduced: false, subscribe: () => () => {} };
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  return {
    reduced: mq.matches,
    subscribe(cb) {
      const handler = (e: MediaQueryListEvent) => cb(e.matches);
      if (mq.addEventListener) {
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      }
      return () => {};
    },
  };
}
