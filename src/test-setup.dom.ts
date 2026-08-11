// test-setup.dom.ts - shared jsdom test bootstrap for component/e2e tests.
// jsdom implements <canvas> as an element but ships no 2D rendering backend,
// so TapeRenderer's `canvas.getContext("2d")` returns null and every draw
// call throws. The L1 flow only *uses* the tape for visuals - none of the
// game logic reads canvas state back - so a minimal no-op 2D context is a
// faithful stand-in for these tests: it lets TapeRenderer run its real
// code path (resize/play/draw) without crashing, while asserting on the
// same observable game state (ledger, wallet, campaign) everything else in
// this suite already uses.
import "@testing-library/jest-dom/vitest";

// Every string any canvas 2D context's fillText() has drawn, across every
// <canvas> in the current test - a canvas paints pixels, not DOM nodes, so
// screen.getByText() can never see it. This is how component/e2e tests (in
// app.dom.test.ts) assert on what the tape ACTUALLY rendered - e.g. that a
// reference-cost bar drew "$0.1352" and never drew "$0.0000" - without a
// real browser. Call resetCanvasFillTextCalls() between assertions/tests.
export const canvasFillTextCalls: string[] = [];
export function resetCanvasFillTextCalls(): void {
  canvasFillTextCalls.length = 0;
}

function makeCtx2D() {
  const noop = () => {};
  return {
    setTransform: noop,
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    roundRect: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    setLineDash: noop,
    fillText: (text: unknown) => {
      canvasFillTextCalls.push(String(text));
    },
    measureText: () => ({ width: 0 }),
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "middle",
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

if (typeof HTMLCanvasElement !== "undefined") {
  // One ctx instance per canvas element (not a fresh object per call) so
  // tests and app code observe the exact same context - matches how a real
  // browser's canvas.getContext("2d") is idempotent per canvas.
  const ctxByCanvas = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    let ctx = ctxByCanvas.get(this);
    if (!ctx) {
      ctx = makeCtx2D();
      ctxByCanvas.set(this, ctx);
    }
    return ctx;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

if (typeof (globalThis as any).ResizeObserver === "undefined") {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
