// dpr.js - devicePixelRatio-aware canvas sizing, ported from the resize() helper
// in build/tape-prototype.html. No economics, no animation.

// Clamp the device pixel ratio to [1, 3], matching the prototype (avoids the
// huge backing stores that very high-DPR displays would otherwise allocate).
export function getDpr() {
  const raw = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
  return Math.max(1, Math.min(3, raw));
}

// Size a canvas to `cssW` x `cssH` CSS pixels with a DPR-scaled backing store,
// and set the 2D transform so all drawing is in CSS-pixel coordinates.
// Returns { dpr, cssW, cssH }. Mirrors tape-prototype resize().
export function sizeCanvas(canvas, ctx, cssW, cssH) {
  const dpr = getDpr();
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = cssH + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { dpr, cssW, cssH };
}

// The prototype's tape height rule: h = clamp(round(w * 0.42), 150, 230).
// Kept here so the Tape renderer and callers share one aspect rule.
export function tapeHeight(cssW) {
  return Math.max(150, Math.min(230, Math.round(cssW * 0.42)));
}
