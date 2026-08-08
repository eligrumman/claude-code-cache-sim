// tape.ts - canvas Tape renderer (blue read / red write lanes, TTL drain bars).
// TO PORT from build/tape-prototype.html draw()/tick()/sweep visuals.
// Consumes engine ledger rows; owns no economics. The DPR + tween helpers it
// will build on are already ported:
import { sizeCanvas, tapeHeight } from "./dpr.js";
import { lerp, easeInOut, progress, reducedMotion } from "./tween.js";

export { sizeCanvas, tapeHeight, lerp, easeInOut, progress, reducedMotion };

// Stub: the actual draw()/sweep loop lands in the next phase.
export function drawTape(): void {
  /* stub - see ARCHITECTURE.md */
}
